import { supabase } from '../supabaseClient';
import { Booking, CancellationReason } from '../types';
import { createNotification } from './notifications';

// Raisons d'annulation pour le VOYAGEUR
export const TRAVELER_CANCELLATION_REASONS: { id: CancellationReason; label: string; icon: string }[] = [
  { id: 'CHANGE_OF_PLANS', label: 'Changement de programme', icon: '📅' },
  { id: 'FOUND_BETTER_OPTION', label: 'J\'ai trouvé une meilleure option', icon: '🏠' },
  { id: 'PERSONAL_EMERGENCY', label: 'Urgence personnelle', icon: '🚨' },
  { id: 'HEALTH_ISSUES', label: 'Problème de santé', icon: '🏥' },
  { id: 'TRAVEL_RESTRICTIONS', label: 'Restrictions de voyage', icon: '✈️' },
  { id: 'HOST_UNRESPONSIVE', label: 'Hôte ne répond pas', icon: '📵' },
  { id: 'OTHER', label: 'Autre raison', icon: '💭' },
];

// Raisons d'annulation pour l'HÔTE
export const HOST_CANCELLATION_REASONS: { id: CancellationReason; label: string; icon: string }[] = [
  { id: 'PROPERTY_ISSUES', label: 'Problème avec le logement', icon: '🏚️' },
  { id: 'PERSONAL_EMERGENCY', label: 'Urgence personnelle', icon: '🚨' },
  { id: 'DOUBLE_BOOKING', label: 'Double réservation', icon: '📅' },
  { id: 'GUEST_UNRESPONSIVE', label: 'Voyageur ne répond pas', icon: '📵' },
  { id: 'PRICING_ERROR', label: 'Erreur de tarification', icon: '💰' },
  { id: 'OTHER', label: 'Autre raison', icon: '💭' },
];

export const cancellationService = {
  /**
   * Annuler une réservation
   */
  cancelBooking: async (params: {
    bookingId: string;
    userId: string;
    userRole: 'TRAVELER' | 'HOST';
    reason: CancellationReason;
    details?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const { bookingId, userId, userRole, reason, details } = params;

    try {
      // 1. Récupérer la réservation
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select(`
          *,
          properties!inner(host_id, title)
        `)
        .eq('id', bookingId)
        .single();

      if (fetchError || !booking) {
        return { success: false, error: 'Réservation introuvable' };
      }

      // 2. Vérifier que l'utilisateur a le droit d'annuler
      const isOwner = userRole === 'TRAVELER' && booking.traveler_id === userId;
      const isHost = userRole === 'HOST' && booking.properties.host_id === userId;

      if (!isOwner && !isHost) {
        return { success: false, error: 'Vous n\'êtes pas autorisé à annuler cette réservation' };
      }

      // 3. Vérifier que la réservation peut être annulée
      const cancellableStatuses = ['PENDING_APPROVAL', 'APPROVED', 'PAID'];
      if (!cancellableStatuses.includes(booking.status)) {
        return { success: false, error: 'Cette réservation ne peut plus être annulée' };
      }

      // 4. Mettre à jour la réservation
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'CANCELLED',
          cancelled_at: new Date().toISOString(),
          cancelled_by: userId,
          cancellation_reason: reason,
          cancellation_details: details || null,
        })
        .eq('id', bookingId);

      if (updateError) {
        console.error('Update booking error:', updateError);
        return { success: false, error: 'Erreur lors de l\'annulation' };
      }

      // 5. Créer l'historique d'annulation
      await supabase.from('booking_cancellations').insert({
        booking_id: bookingId,
        cancelled_by: userId,
        cancelled_by_role: userRole,
        reason,
        details: details || null,
        refund_status: booking.status === 'PAID' ? 'PENDING' : 'NOT_APPLICABLE',
      });

      // 6. Envoyer les notifications
      const reasonLabel = userRole === 'TRAVELER'
        ? TRAVELER_CANCELLATION_REASONS.find(r => r.id === reason)?.label
        : HOST_CANCELLATION_REASONS.find(r => r.id === reason)?.label;

      if (userRole === 'TRAVELER') {
        // Notifier l'hôte
        await createNotification({
          recipientId: booking.properties.host_id,
          type: 'booking_rejected', // On réutilise ce type pour l'annulation
          title: '❌ Réservation annulée par le voyageur',
          body: `La réservation pour "${booking.properties.title}" a été annulée.\n\n` +
                `📅 Du ${booking.start_date} au ${booking.end_date}\n` +
                `💰 Montant : ${booking.total_price} DA\n` +
                `📝 Raison : ${reasonLabel}\n` +
                (details ? `💬 Détails : ${details}\n` : '') +
                (booking.status === 'PAID' ? '\n✅ Le remboursement sera traité sous 48h.' : ''),
          data: {
            booking_id: bookingId,
            cancellation_reason: reason,
            cancelled_by: 'TRAVELER',
          },
        });
      } else {
        // Notifier le voyageur
        await createNotification({
          recipientId: booking.traveler_id,
          type: 'booking_rejected',
          title: '❌ Réservation annulée par l\'hôte',
          body: `Votre réservation pour "${booking.properties.title}" a été annulée par l'hôte.\n\n` +
                `📅 Du ${booking.start_date} au ${booking.end_date}\n` +
                `💰 Montant : ${booking.total_price} DA\n` +
                `📝 Raison : ${reasonLabel}\n` +
                (details ? `💬 Détails : ${details}\n` : '') +
                '\n✅ Si vous aviez payé, le remboursement intégral sera effectué sous 48h.\n' +
                '🔒 Votre argent est toujours en sécurité avec LOCADZ.',
          data: {
            booking_id: bookingId,
            cancellation_reason: reason,
            cancelled_by: 'HOST',
          },
        });
      }

      return { success: true };
    } catch (e) {
      console.error('cancelBooking error:', e);
      return { success: false, error: 'Erreur inattendue' };
    }
  },

  /**
   * Récupérer l'historique des annulations d'un utilisateur
   */
  getUserCancellations: async (userId: string): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('booking_cancellations')
        .select(`
          *,
          bookings(
            id,
            start_date,
            end_date,
            total_price,
            property_title
          )
        `)
        .eq('cancelled_by', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('getUserCancellations error:', e);
      return [];
    }
  },
};
