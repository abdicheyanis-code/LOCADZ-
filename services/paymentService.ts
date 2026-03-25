// services/paymentService.ts

import { supabase } from '../supabaseClient';
import { PaymentMethod, PaymentProof } from '../types';
import { authService } from './authService';
import { notificationService } from './notificationService'; // ✅ AJOUTÉ

interface UploadPaymentProofOptions {
  userId: string;
  bookingId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  file: File;
}

export const paymentService = {
  /**
   * Upload une preuve de paiement (image / PDF) et crée une ligne dans payment_proofs.
   */
  uploadPaymentProof: async (
    options: UploadPaymentProofOptions
  ): Promise<{ proofId: string | null; error: string | null }> => {
    const { userId, bookingId, amount, paymentMethod, file } = options;

    try {
      const fileExt = file.name.split('.').pop();
      const safeExt = fileExt ? fileExt.toLowerCase() : 'dat';
      const fileName = `${bookingId}-${Date.now()}.${safeExt}`;
      const filePath = `proofs/${bookingId}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, file);

      if (uploadError || !uploadData) {
        console.error('Upload payment proof error:', uploadError);
        return { proofId: null, error: 'UPLOAD_FAILED' };
      }

      const { data: publicUrlData } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(uploadData.path);

      const proofUrl = publicUrlData.publicUrl;

      const { data: proofRows, error: insertError } = await supabase
        .from('payment_proofs')
        .insert([
          {
            booking_id: bookingId,
            user_id: userId,
            amount,
            payment_method: paymentMethod,
            proof_url: proofUrl,
          },
        ])
        .select('id')
        .single();

      if (insertError || !proofRows) {
        console.error('Insert payment_proofs error:', insertError);
        return { proofId: null, error: 'INSERT_FAILED' };
      }

      return { proofId: proofRows.id as string, error: null };
    } catch (e) {
      console.error('Unexpected payment proof error:', e);
      return { proofId: null, error: 'UNKNOWN_ERROR' };
    }
  },

  /**
   * ADMIN : liste des preuves de paiement en attente de validation
   */
  getPendingProofsForAdmin: async (): Promise<PaymentProof[]> => {
    const admin = authService.getSession();
    if (!admin || admin.role !== 'ADMIN') {
      return [];
    }

    const { data, error } = await supabase
      .from('payment_proofs')
      .select('*')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getPendingProofsForAdmin error:', error);
      return [];
    }

    return (data as PaymentProof[]) || [];
  },

  /**
   * ADMIN : valider ou rejeter une preuve de paiement
   * ✅ MODIFIÉ : Crée des notifications in-app
   */
  reviewPaymentProof: async (params: {
    proofId: string;
    approve: boolean;
    rejectionReason?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const { proofId, approve, rejectionReason } = params;

    const admin = authService.getSession();
    if (!admin || admin.role !== 'ADMIN') {
      return { success: false, error: 'UNAUTHORIZED' };
    }

    try {
      // 1) Récupérer la preuve + booking + property + host
      const { data: proof, error: proofError } = await supabase
        .from('payment_proofs')
        .select('booking_id, user_id, amount')
        .eq('id', proofId)
        .maybeSingle();

      if (proofError || !proof) {
        console.error('reviewPaymentProof: proof not found', proofError);
        return { success: false, error: 'PROOF_NOT_FOUND' };
      }

      // Récupérer le booking pour avoir le host_id et property_id
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('traveler_id, property_id')
        .eq('id', proof.booking_id)
        .maybeSingle();

      if (bookingError || !booking) {
        console.error('reviewPaymentProof: booking not found', bookingError);
        return { success: false, error: 'BOOKING_NOT_FOUND' };
      }

      // Récupérer la property pour avoir le host_id et le titre
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .select('host_id, title')
        .eq('id', booking.property_id)
        .maybeSingle();

      if (propertyError || !property) {
        console.error('reviewPaymentProof: property not found', propertyError);
        return { success: false, error: 'PROPERTY_NOT_FOUND' };
      }

      const now = new Date().toISOString();
      const newStatus = approve ? 'APPROVED' : 'REJECTED';

      // 2) Mettre à jour la preuve
      const { error: updateProofError } = await supabase
        .from('payment_proofs')
        .update({
          status: newStatus,
          reviewed_by: admin.id,
          reviewed_at: now,
          rejection_reason: approve ? null : rejectionReason || null,
        })
        .eq('id', proofId);

      if (updateProofError) {
        console.error('reviewPaymentProof: update proof error', updateProofError);
        return { success: false, error: 'UPDATE_FAILED' };
      }

      // 3) Si approuvé, marquer la réservation comme PAYÉE
      if (approve) {
        const { error: bookingUpdateError } = await supabase
          .from('bookings')
          .update({ status: 'PAID' })
          .eq('id', proof.booking_id);

        if (bookingUpdateError) {
          console.error('reviewPaymentProof: update booking error', bookingUpdateError);
          return { success: false, error: 'BOOKING_UPDATE_FAILED' };
        }

        // ✅ 4) CRÉER LES NOTIFICATIONS IN-APP

        // Notification pour le VOYAGEUR
        await notificationService.createNotification({
          recipientId: booking.traveler_id,
          actorId: admin.id,
          type: 'booking_accepted',
          title: 'Paiement confirmé ✅',
          body: `Votre paiement de ${proof.amount.toFixed(2)} DA pour "${property.title}" a été validé. Votre réservation est confirmée !`,
          data: {
            booking_id: proof.booking_id,
            property_id: booking.property_id,
            amount: proof.amount
          }
        });

        // Notification pour le HOST
        await notificationService.createNotification({
          recipientId: property.host_id,
          actorId: admin.id,
          type: 'booking_accepted',
          title: 'Paiement reçu 💰',
          body: `Le paiement de ${proof.amount.toFixed(2)} DA pour votre villa "${property.title}" a été validé. Le voyageur recevra son paiement après commission.`,
          data: {
            booking_id: proof.booking_id,
            property_id: booking.property_id,
            amount: proof.amount
          }
        });

        console.log('✅ Notifications créées pour le voyageur et le host');
      } else {
        // ✅ NOTIFICATION DE REJET POUR LE VOYAGEUR
        await notificationService.createNotification({
          recipientId: booking.traveler_id,
          actorId: admin.id,
          type: 'booking_rejected',
          title: 'Paiement refusé ❌',
          body: rejectionReason 
            ? `Votre preuve de paiement a été refusée : ${rejectionReason}`
            : 'Votre preuve de paiement a été refusée. Veuillez renvoyer une preuve valide.',
          data: {
            booking_id: proof.booking_id,
            property_id: booking.property_id,
            rejection_reason: rejectionReason
          }
        });

        console.log('✅ Notification de rejet envoyée au voyageur');
      }

      return { success: true };
    } catch (e) {
      console.error('Unexpected reviewPaymentProof error:', e);
      return { success: false, error: 'UNKNOWN_ERROR' };
    }
  },
};
