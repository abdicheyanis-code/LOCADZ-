// services/notificationService.ts

import { supabase } from './supabaseClient';
import { Notification, NotificationType } from '../types';

// ✅ Type pour créer une nouvelle notification
type NewNotificationData = {
  recipientId: string;        // L'utilisateur qui reçoit la notif
  actorId?: string | null;    // Celui qui a déclenché l'action (peut être null)
  type: NotificationType;     // 'booking_created', 'booking_accepted', etc.
  title: string;              // Ex: "Nouvelle réservation !"
  body?: string | null;       // Description détaillée
  data?: Record<string, any>; // Données supplémentaires (booking_id, property_id, etc.)
};

export const notificationService = {
  /**
   * 🔢 Récupère le NOMBRE de notifications NON LUES
   * Utilisé pour afficher le badge rouge (ex: "3")
   */
  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true }) // Compte sans récupérer les données
      .eq('recipient_id', userId)                  // Filtre par destinataire
      .is('read_at', null);                        // Seulement les non lues

    if (error) {
      console.error('❌ Erreur compteur notifications:', error);
      return 0;
    }

    return count || 0;
  },

  /**
   * 📋 Récupère la LISTE des notifications d'un utilisateur
   * Utilisé pour afficher le dropdown de la cloche
   */
  async getUserNotifications(userId: string, limit = 50): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false }) // Les plus récentes d'abord
      .limit(limit);

    if (error) {
      console.error('❌ Erreur récupération notifications:', error);
      return [];
    }

    return data || [];
  },

  /**
   * ✅ Marque UNE notification comme lue
   * Appelé quand l'utilisateur clique sur une notification
   */
  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) console.error('❌ Erreur marquage notification:', error);
  },

  /**
   * ✅ Marque TOUTES les notifications comme lues
   * Appelé quand l'utilisateur clique sur "Tout marquer comme lu"
   */
  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('recipient_id', userId)
      .is('read_at', null); // Seulement celles qui sont non lues

    if (error) console.error('❌ Erreur marquage tout:', error);
  },

  /**
   * ➕ Crée une nouvelle notification
   * Tu l'utiliseras dans tes services (bookingService, etc.)
   * 
   * Exemple d'utilisation :
   * await notificationService.createNotification({
   *   recipientId: hostId,
   *   actorId: travelerId,
   *   type: 'booking_created',
   *   title: 'Nouvelle réservation !',
   *   body: 'Quelqu\'un veut réserver votre villa',
   *   data: { booking_id: '123', property_id: '456' }
   * });
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
   * 🔴 TEMPS RÉEL : Écoute les NOUVELLES notifications
   * Utilisé dans App.tsx pour mettre à jour le badge instantanément
   * 
   * Retourne une fonction de désabonnement (à appeler au démontage du composant)
   */
  subscribeToNewNotifications(userId: string, callback: () => void) {
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',                      // Écoute les NOUVELLES notifications
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`  // Seulement celles pour cet utilisateur
        },
        () => callback()                       // Appelle la fonction callback
      )
      .subscribe();

    // Retourne la fonction de désabonnement
    return () => supabase.removeChannel(channel);
  }
};
