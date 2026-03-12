// services/notificationService.ts
import { supabase } from '../supabaseClient'; // ✅ CORRIGÉ
import { Notification, NotificationType } from '../types';

type NewNotificationData = {
  recipientId: string;
  actorId?: string | null;
  type: NotificationType;
  title: string;
  body?: string | null;
  data?: Record<string, any>;
};

export const notificationService = {
  /**
   * Récupère le nombre de notifications non lues
   */
  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .is('read_at', null);

    if (error) {
      console.error('❌ Erreur compteur notifications:', error);
      return 0;
    }

    return count || 0;
  },

  /**
   * Récupère les notifications d'un utilisateur
   */
  async getUserNotifications(userId: string, limit = 50): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Erreur récupération notifications:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Marque une notification comme lue
   */
  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) console.error('❌ Erreur marquage notification:', error);
  },

  /**
   * Marque TOUTES les notifications comme lues
   */
  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('recipient_id', userId)
      .is('read_at', null);

    if (error) console.error('❌ Erreur marquage tout:', error);
  },

  /**
   * Crée une nouvelle notification
   * (À utiliser dans tes services de bookings, messages, etc.)
   */
  async createNotification({
    recipientId,
    actorId,
    type,
    title,
    body,
    data = {}
  }: NewNotificationData): Promise<void> {
    const { error } = await supabase.from('notifications').insert({
      recipient_id: recipientId,
      actor_id: actorId,
      type,
      title,
      body,
      data
    });

    if (error) console.error('❌ Erreur création notification:', error);
  },

  /**
   * Écoute les nouvelles notifications en TEMPS RÉEL
   * (Supabase Realtime)
   */
  subscribeToNewNotifications(userId: string, callback: () => void) {
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`
        },
        () => callback()
      )
      .subscribe();

    // Retourne la fonction de désabonnement
    return () => supabase.removeChannel(channel);
  }
};
