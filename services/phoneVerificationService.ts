import { supabase } from '../supabaseClient';
import { UserProfile } from '../types';

/**
 * Génère un code à 6 chiffres
 */
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

/**
 * Durée de validité du code (en minutes)
 */
const CODE_TTL_MINUTES = 10;

export const phoneVerificationService = {
  /**
   * Demande de vérification :
   * - met à jour le numéro de téléphone
   * - génère un code
   * - enregistre code + expiration
   * - pour l'instant, renvoie le code (pour test)
   */
  requestVerification: async (user: UserProfile, newPhone: string) => {
    const code = generateCode();
    const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('users')
      .update({
        phone_number: newPhone,
        phone_verification_code: code,
        phone_verification_expires_at: expiresAt,
        is_phone_verified: false,
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;

    // Ici, dans un vrai projet, tu appellerais un provider SMS (Twilio, etc.)
    // Pour l’instant, on renvoie le code pour l’afficher en UI (test uniquement).
    return {
      code,
      expiresAt,
      profile: data as any as UserProfile,
    };
  },

  /**
   * Vérifie le code saisi par l'utilisateur
   */
  verifyCode: async (user: UserProfile, code: string) => {
    const { data, error } = await supabase
      .from('users')
      .select(
        'id, phone_verification_code, phone_verification_expires_at, is_phone_verified'
      )
      .eq('id', user.id)
      .maybeSingle();

    if (error || !data) {
      throw new Error('USER_NOT_FOUND');
    }

    if (!data.phone_verification_code || !data.phone_verification_expires_at) {
      throw new Error('NO_CODE');
    }

    const now = new Date();
    const expires = new Date(data.phone_verification_expires_at);
    if (now > expires) {
      throw new Error('CODE_EXPIRED');
    }

    if (code !== data.phone_verification_code) {
      throw new Error('CODE_INVALID');
    }

    // Code OK → on marque le téléphone comme vérifié et on nettoie le code
    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update({
        is_phone_verified: true,
        phone_verification_code: null,
        phone_verification_expires_at: null,
      })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) throw updateError;

    return updated as any as UserProfile;
  },
};
