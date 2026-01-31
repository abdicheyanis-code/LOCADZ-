import { supabase } from '../supabaseClient';
import { Booking, UserProfile } from '../types';
import { createNotification } from './notifications';

export const adminService = {
  getAllUsers: async (): Promise<UserProfile[]> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as UserProfile[];
    } catch (e) {
      return [];
    }
  },

  updateUserRole: async (userId: string, role: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role })
        .eq('id', userId);
      return !error;
    } catch (e) {
      return false;
    }
  },

  getPlatformStats: async () => {
    try {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*')
        .in('status', ['PAID', 'APPROVED']);

      if (error) throw error;

      const totalVolume =
        bookings?.reduce(
          (sum, b: any) => sum + Number(b.total_price),
          0
        ) || 0;
      const totalCommission =
        bookings?.reduce(
          (sum, b: any) => sum + Number(b.commission_fee),
          0
        ) || 0;

      return {
        totalVolume,
        totalCommission,
        count: bookings?.length || 0,
        bookings: (bookings as Booking[]) || [],
      };
    } catch (e: any) {
      return {
        totalVolume: 0,
        totalCommission: 0,
        count: 0,
        bookings: [],
        error: e.message,
      };
    }
  },

  getPendingVerifications: async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id_verification_status', 'PENDING');
      if (error) throw error;
      return data as UserProfile[];
    } catch (e) {
      return [];
    }
  },

  approveHost: async (userId: string) => {
    try {
      // 1️⃣ On valide la vérification en DB
      const { error } = await supabase
        .from('users')
        .update({ id_verification_status: 'VERIFIED', is_verified: true })
        .eq('id', userId);

      if (error) throw error;

      // 2️⃣ On récupère quelques infos sur l'utilisateur (optionnel)
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('id', userId)
        .single();

      // 3️⃣ 🔔 Notification pour l'hôte : identité vérifiée
      if (!userError && user) {
        try {
          await createNotification({
            recipientId: user.id,
            type: 'verification_approved',
            title: 'Votre identité a été vérifiée',
            body:
              'Votre compte hôte LOCA DZ est maintenant vérifié. ' +
              'Vous pouvez profiter de toutes les fonctionnalités.',
            data: {},
          });
        } catch (notifError) {
          console.error('approveHost notification error', notifError);
          // On ne bloque pas l’approve si la notif échoue
        }
      }

      return true;
    } catch (e) {
      console.error('approveHost error', e);
      return false;
    }
  },
};
