import { supabase } from '../supabaseClient';
import { Booking, BookingStatus } from '../types';

export const bookingService = {
  // Vérifie si un créneau est dispo pour un bien
  isRangeAvailable: async (
    propertyId: string,
    start: Date,
    end: Date
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('start_date, end_date, status')
        .eq('property_id', propertyId)
        .in('status', ['PENDING_APPROVAL', 'APPROVED', 'PAID']);

      if (error) {
        console.error('isRangeAvailable error', error);
        // En cas d’erreur backend, on ne bloque pas la réservation
        return true;
      }

      const bookings = (data as any[]) || [];

      return !bookings.some(booking => {
        const bStart = new Date(booking.start_date);
        const bEnd = new Date(booking.end_date);
        return start <= bEnd && end >= bStart;
      });
    } catch (e) {
      console.error('isRangeAvailable exception', e);
      return true;
    }
  },

  // Réservations d'un logement (pour l’hôte)
  getBookingsForProperty: async (propertyId: string): Promise<Booking[]> => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('property_id', propertyId)
        .in('status', ['APPROVED', 'PAID']);

      if (error) throw error;
      return (data as Booking[]) || [];
    } catch (e) {
      console.error('getBookingsForProperty error', e);
      return [];
    }
  },

  /**
   * createBooking travaille avec le modèle LOCADZ :
   * - total_price = montant payé par le client (base + 8 %)
   * - base_price = base (nuits × prix_nuit)
   * - service_fee_client = 8 % client
   * - host_commission = 10 % hôte
   * - payout_host = base - 10 %
   * - commission_fee = revenu plateforme total (8 % + 10 %)
   */
  createBooking: async (
    bookingData: Omit<Booking, 'id' | 'status' | 'created_at' | 'commission_fee'>
  ): Promise<Booking | null> => {
    const platformRevenue =
      Number(bookingData.service_fee_client ?? 0) +
      Number(bookingData.host_commission ?? 0);

    // On laisse Supabase générer l'id si ta table a un default,
    // mais on garde crypto.randomUUID si ton schéma attend un id fourni.
    const newBooking: Booking = {
      id: crypto.randomUUID(),
      ...bookingData,
      commission_fee: platformRevenue,
      status: 'PENDING_APPROVAL',
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert([newBooking])
        .select()
        .single();

      if (error) throw error;
      return data as Booking;
    } catch (e) {
      console.error('createBooking error', e);
      // Pas de fallback local : si l’insert échoue, on considère la résa non créée
      return null;
    }
  },

  updateBookingStatus: async (
    bookingId: string,
    status: BookingStatus
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;
      return true;
    } catch (e) {
      console.error('updateBookingStatus error', e);
      return false;
    }
  },

  // Pour l’instant : hostBookings réels ou rien (pas de simulation locale)
  getHostBookings: async (hostId: string): Promise<Booking[]> => {
    try {
      // Si ta table "bookings" a une colonne host_id :
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('host_id', hostId);

      if (error) throw error;
      return (data as Booking[]) || [];
    } catch (e) {
      console.error('getHostBookings error', e);
      // Si tu n’as pas host_id côté DB, ça retournera [] (pas de faux bookings)
      return [];
    }
  },

  getUserBookings: async (userId: string): Promise<Booking[]> => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('traveler_id', userId);

      if (error) throw error;
      return (data as Booking[]) || [];
    } catch (e) {
      console.error('getUserBookings error', e);
      return [];
    }
  },

  /**
   * Revenu HÔTE = somme des payout_host sur ses propriétés
   * Fallback ancien modèle : total_price - commission_fee
   */
  getHostRevenue: async (properties: string[]): Promise<number> => {
    if (!properties || properties.length === 0) return 0;

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('property_id, status, payout_host, total_price, commission_fee')
        .in('property_id', properties)
        .in('status', ['APPROVED', 'PAID']);

      if (error) throw error;

      const bookings = (data as Booking[]) || [];

      return bookings.reduce((sum, b) => {
        if (b.payout_host != null) {
          return sum + Number(b.payout_host);
        }
        // Fallback pour les anciennes lignes sans payout_host
        return sum + (Number(b.total_price) - Number(b.commission_fee || 0));
      }, 0);
    } catch (e) {
      console.error('getHostRevenue error', e);
      // Pas de fallback local : en cas de souci backend, revenu = 0 (mais pas de chiffres fake)
      return 0;
    }
  },
};
