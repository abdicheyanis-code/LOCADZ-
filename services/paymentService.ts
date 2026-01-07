import { supabase } from '../supabaseClient';
import { PaymentMethod } from '../types';

interface UploadPaymentProofOptions {
  userId: string;
  bookingId: string;
  amount: number;
  paymentMethod: PaymentMethod; // 'ON_ARRIVAL' | 'BARIDIMOB' | 'RIB'
  file: File;
}

export const paymentService = {
  /**
   * Upload une preuve de paiement (image / PDF) et crée une ligne dans payment_proofs.
   * Retourne l'id de la preuve créée ou une erreur.
   */
  uploadPaymentProof: async (
    options: UploadPaymentProofOptions
  ): Promise<{ proofId: string | null; error: string | null }> => {
    const { userId, bookingId, amount, paymentMethod, file } = options;

    try {
      // 1) Préparer le chemin dans le bucket storage
      const fileExt = file.name.split('.').pop();
      const safeExt = fileExt ? fileExt.toLowerCase() : 'dat';
      const fileName = `${bookingId}-${Date.now()}.${safeExt}`;
      const filePath = `proofs/${bookingId}/${fileName}`;

      // 2) Uploader le fichier dans le bucket "payment-proofs"
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, file);

      if (uploadError || !uploadData) {
        console.error('Upload payment proof error:', uploadError);
        return { proofId: null, error: 'UPLOAD_FAILED' };
      }

      // 3) Récupérer une URL publique (pour que host/admin puissent la voir)
      const { data: publicUrlData } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(uploadData.path);

      const proofUrl = publicUrlData.publicUrl;

      // 4) Créer la ligne dans payment_proofs
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
};
