import { supabase } from '../supabaseClient';
import { Booking, BookingStatus } from '../types';

const LOCAL_BOOKINGS_KEY = 'locadz_local_bookings';

export const bookingService = {
  _getLocal: (): Booking[] => {
    const saved = localStorage.getItem(LOCAL_BOOKINGS_KEY);
    return saved ? JSON.parse(saved) : [];
  },

  _saveLocal: (bookings: Booking[]) => {
    localStorage.setItem(LOCAL_BOOKINGS_KEY, JSON.stringify(bookings));
  },

  isRangeAvailable: async (propertyId: string, start: Date, end: Date): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('start_date, end_date, status')
        .eq('property_id', propertyId)
        .in('status', ['PENDING_APPROVAL', 'APPROVED', 'PAID']);

      let bookings = (data as any[]) || [];
      if (error) {
        bookings = bookingService._getLocal().filter(b => b.property_id === propertyId);
      }

      return !bookings.some(booking => {
        const bStart = new Date(booking.start_date);
        const bEnd = new Date(booking.end_date);
        return start <= bEnd && end >= bStart;
      });
    } catch (e) {
      return true;
    }
  },

  // Réservations d'un logement (hôte)
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
      // Fallback pour la simulation locale
      return bookingService._getLocal().filter(
        b => b.property_id === propertyId && ['APPROVED', 'PAID'].includes(b.status)
      );
    }
  },

  /**
   * createBooking maintenant travaille avec le modèle LOCADZ :
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
    // Revenu plateforme = 8 % côté client + 10 % pris sur l’hôte
    const platformRevenue =
      Number(bookingData.service_fee_client ?? 0) +
      Number(bookingData.host_commission ?? 0);

    const newBooking: Booking = {
      id: crypto.randomUUID(),
      ...bookingData,
      commission_fee: platformRevenue,
      status: 'PENDING_APPROVAL',
      created_at: new Date().toISOString()
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
      // Fallback localStorage
      const local = bookingService._getLocal();
      local.push(newBooking);
      bookingService._saveLocal(local);
      return newBooking;
    }
  },

  updateBookingStatus: async (bookingId: string, status: BookingStatus): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);
      
      if (error) throw error;
      return true;
    } catch (e) {
      const local = bookingService._getLocal();
      const index = local.findIndex(b => b.id === bookingId);
      if (index !== -1) {
        local[index].status = status;
        bookingService._saveLocal(local);
        return true;
      }
      return false;
    }
  },

  // Pour l’instant toujours très simplifié pour l’hôte
  getHostBookings: async (hostId: string): Promise<Booking[]> => {
    try {
      // En mode réel on ferait une requête join properties -> bookings
      const localBookings = bookingService._getLocal();
      return localBookings;
    } catch (e) {
      return bookingService._getLocal();
    }
  },

  getUserBookings: async (userId: string): Promise<Booking[]> => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('traveler_id', userId);
      
      if (error) throw error;
      return data as Booking[];
    } catch (e) {
      return bookingService._getLocal().filter(b => b.traveler_id === userId);
    }
  },

  /**
   * Revenu HÔTE = somme des payout_host sur ses propriétés
   * Fallback ancien modèle : total_price - commission_fee
   */
  getHostRevenue: async (properties: string[]): Promise<number> => {
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
      // Fallback local
      const bookings = bookingService._getLocal().filter(
        b =>
          properties.includes(b.property_id) &&
          ['APPROVED', 'PAID'].includes(b.status)
      );

      return bookings.reduce((sum, b) => {
        if (b.payout_host != null) {
          return sum + Number(b.payout_host);
        }
        return sum + (Number(b.total_price) - Number(b.commission_fee || 0));
      }, 0);
    }
  }
};
