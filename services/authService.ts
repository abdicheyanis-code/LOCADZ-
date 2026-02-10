import { supabase } from '../supabaseClient';
import { UserProfile, UserRole, PayoutDetails } from '../types';

const SESSION_KEY = 'locadz_session';

/**
 * Construit un avatar par défaut (DiceBear) à partir de l'email ou de l'id
 */
const buildAvatarUrl = (email: string | null, id: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
    email || id
  )}`;

/**
 * Mappe une ligne de la table public.users vers ton type UserProfile
 */
const mapRowToUserProfile = (row: any): UserProfile => {
  const avatar_url =
    row.avatar_url && row.avatar_url.trim().length > 0
      ? row.avatar_url
      : buildAvatarUrl(row.email, row.id);

  return {
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    phone_number: row.phone_number ?? '',
    avatar_url,
    role: row.role as UserRole,
    is_verified: row.is_verified ?? false,
    is_phone_verified: row.is_phone_verified ?? false,
    id_verification_status: row.id_verification_status ?? 'NONE',
    id_document_url: row.id_document_url ?? undefined,
    payout_details:
      row.payout_details ?? {
        method: 'NONE',
        accountName: '',
        accountNumber: '',
      },
    created_at: row.created_at,
    // ✅ nouveaux champs (facultatifs dans UserProfile)
    has_accepted_terms: row.has_accepted_terms ?? false,
    accepted_terms_at: row.accepted_terms_at ?? undefined,
  };
};

/**
 * Récupère (ou crée) le profil pour l'utilisateur actuellement connecté (Supabase Auth)
 */
const fetchOrCreateCurrentUserProfile = async (): Promise<UserProfile | null> => {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    // Pas de session Supabase
    localStorage.removeItem(SESSION_KEY);
    return null;
  }

  const authUser = userData.user;

  // Sécurité : si l'email n'est pas confirmé, on refuse la session
  if (!authUser.email_confirmed_at) {
    await supabase.auth.signOut();
    localStorage.removeItem(SESSION_KEY);
    throw new Error('EMAIL_NOT_CONFIRMED');
  }

  // Essaye de lire le profil dans public.users
  const { data: profileRow, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle();

  if (profileError && profileError.code !== 'PGRST116') {
    // Autre erreur que "no rows"
    throw profileError;
  }

  let row = profileRow;

  if (!row) {
    // Pas encore de profil -> on le crée à partir des metadata
    const meta = (authUser.user_metadata || {}) as any;

    const full_name =
      meta.full_name || authUser.email || 'LOCADZ Member';
    const phone_number = meta.phone_number || null;
    const role = (meta.role as UserRole) || 'TRAVELER';
    const avatar_url = buildAvatarUrl(authUser.email, authUser.id);

    const hasAcceptedTerms = !!meta.has_accepted_terms;
    const acceptedTermsAt = meta.accepted_terms_at || null;

    const { data: inserted, error: insertError } = await supabase
      .from('users')
      .insert({
        id: authUser.id,
        full_name,
        email: authUser.email,
        phone_number,
        role,
        avatar_url,
        has_accepted_terms: hasAcceptedTerms,
        accepted_terms_at: acceptedTermsAt,
      })
      .select()
      .single();

    if (insertError) throw insertError;
    row = inserted;
  }

  const profile = mapRowToUserProfile(row);
  localStorage.setItem(SESSION_KEY, JSON.stringify(profile));
  return profile;
};

export const authService = {
  /**
   * Inscription : email + mot de passe + nom + téléphone + rôle
   * (appelée UNIQUEMENT si la case "j'accepte les conditions" est cochée dans l'UI)
   */
  register: async (
    fullName: string,
    email: string,
    phone: string,
    role: UserRole,
    password: string
  ): Promise<{ error: string | null }> => {
    const cleanEmail = email.toLowerCase().trim();
    const cleanPhone = phone.replace(/\s/g, '');

    // 1) Vérifie si le téléphone est déjà utilisé dans la table users
    if (cleanPhone) {
      const { data: existingPhone, error: phoneError } = await supabase
        .from('users')
        .select('id')
        .eq('phone_number', cleanPhone)
        .maybeSingle();

      if (!phoneError && existingPhone) {
        // Numéro déjà utilisé → on annule l'inscription AVANT le signUp
        return { error: 'PHONE_EXISTS' };
      }
    }

    // 2) Tentative d'inscription Supabase Auth
    const nowIso = new Date().toISOString();

    const { error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: fullName,
          phone_number: cleanPhone,
          role,
          // ✅ On stocke l'acceptation dans les metadata Auth
          has_accepted_terms: true,
          accepted_terms_at: nowIso,
        },
      },
    });

    if (error) {
      const msg = (error.message || '').toLowerCase();
      if (
        msg.includes('user already registered') ||
        msg.includes('already exists')
      ) {
        return { error: 'EMAIL_EXISTS' };
      }
      return { error: error.message || 'UNKNOWN_ERROR' };
    }

    return { error: null };
  },

  /**
   * Connexion :
   * - avec email + password -> vrai login
   * - sans password -> rafraîchir la session à partir de Supabase
   */
  login: async (email: string, password?: string): Promise<UserProfile | null> => {
    if (password) {
      const cleanEmail = email.toLowerCase().trim();
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        const msg = (error.message || '').toLowerCase();
        if (msg.includes('email not confirmed')) {
          throw new Error('EMAIL_NOT_CONFIRMED');
        }
        if (
          msg.includes('invalid login credentials') ||
          error.status === 400
        ) {
          throw new Error('INVALID_CREDENTIALS');
        }
        throw error;
      }
    }

    const profile = await fetchOrCreateCurrentUserProfile();
    return profile;
  },

  /**
   * Retourne la dernière session UserProfile stockée localement (si présente)
   */
  getSession: (): UserProfile | null => {
    const data = localStorage.getItem(SESSION_KEY);
    return data ? (JSON.parse(data) as UserProfile) : null;
  },

  /**
   * Utilisé si besoin pour forcer la resynchro depuis Supabase
   */
  refreshSession: async (): Promise<UserProfile | null> => {
    return await fetchOrCreateCurrentUserProfile();
  },

  /**
   * Déconnecte côté Supabase + nettoie le localStorage
   */
  logout: async () => {
    await supabase.auth.signOut();
    localStorage.removeItem(SESSION_KEY);
  },

  /**
   * Mise à jour du profil dans public.users
   */
  updateProfile: async (id: string, updates: Partial<UserProfile>) => {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (data) {
      const profile = mapRowToUserProfile(data);
      localStorage.setItem(SESSION_KEY, JSON.stringify(profile));
      return profile;
    }
    return null;
  },

  /**
   * Mise à jour des coordonnées de paiement de l'hôte (payout_details)
   */
  updatePayoutDetails: async (
    id: string,
    payout: PayoutDetails
  ): Promise<UserProfile | null> => {
    const { data, error } = await supabase
      .from('users')
      .update({ payout_details: payout })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (data) {
      const profile = mapRowToUserProfile(data);
      localStorage.setItem(SESSION_KEY, JSON.stringify(profile));
      return profile;
    }
    return null;
  },

  /**
   * Envoie un email de réinitialisation de mot de passe
   */
  forgotPassword: async (email: string): Promise<void> => {
    const cleanEmail = email.toLowerCase().trim();

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: 'https://locadz-app.vercel.app/reset-password',
    });

    if (error) {
      console.error('resetPasswordForEmail error:', error);

      const msg = (error.message || '').toLowerCase();

      if (msg.includes('rate limit')) {
        // Trop de demandes en peu de temps
        throw new Error('EMAIL_RATE_LIMIT');
      }

      if (msg.includes('email not confirmed')) {
        throw new Error('EMAIL_NOT_CONFIRMED');
      }

      throw error;
    }
  },
};

export default authService;
