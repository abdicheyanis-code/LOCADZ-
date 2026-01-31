import { supabase } from '../supabaseClient';
import type { Notification, NotificationType } from '../types';

/**
 * Crée une notification pour un utilisateur.
 *
 * La fonction récupère automatiquement l'utilisateur connecté
 * pour remplir actor_id (celui qui déclenche l'action).
 */
export async function createNotification(params: {
  recipientId: string;
  type: NotificationType;
  title: string;
  body?: string;
  data?: Record<string, any>;
}): Promise<{ error: Error | null }> {
  const { recipientId, type, title, body, data = {} } = params;

  // Récupérer l'utilisateur connecté (sera actor_id)
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('createNotification: user not authenticated', userError);
    return { error: new Error('NOT_AUTHENTICATED') };
  }

  const { error } = await supabase.from('notifications').insert({
    recipient_id: recipientId,
    actor_id: user.id,
    type,
    title,
    body: body ?? null,
    data,
  });

  if (error) {
    console.error('createNotification insert error:', error);
    return { error: new Error(error.message) };
  }

  return { error: null };
}

/**
 * Récupère les notifications de l'utilisateur connecté.
 */
export async function fetchMyNotifications(): Promise<{
  data: Notification[] | null;
  error: Error | null;
}> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('fetchMyNotifications error:', error);
    return { data: null, error: new Error(error.message) };
  }

  return { data: data as Notification[], error: null };
}

/**
 * Marque une notification comme lue.
 */
export async function markNotificationAsRead(
  id: string
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('markNotificationAsRead error:', error);
    return { error: new Error(error.message) };
  }

  return { error: null };
}

/**
 * Marque toutes les notifications non lues comme lues.
 */
export async function markAllNotificationsAsRead(): Promise<{
  error: Error | null;
}> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .is('read_at', null);

  if (error) {
    console.error('markAllNotificationsAsRead error:', error);
    return { error: new Error(error.message) };
  }

  return { error: null };
}
