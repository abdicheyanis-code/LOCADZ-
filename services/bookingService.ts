import { supabase } from '../supabaseClient';
import { Booking, BookingStatus } from '../types';
import { createNotification } from './notifications';

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
        // On bloque uniquement APPROVED et PAID
        .in('status', ['APPROVED', 'PAID']);

      if (error) {
        console.error('isRangeAvailable error', error);
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
   * - total_price = montant payé par le client
   * - base_price = base (nuits × prix_nuit)
   * - service_fee_client = % client
   * - host_commission = % hôte
   * - payout_host = ce qui reste à l’hôte
   * - commission_fee = revenu plateforme total (client + hôte)
   */
  createBooking: async (
    bookingData: Omit<Booking, 'id' | 'status' | 'created_at' | 'commission_fee'>
  ): Promise<Booking | null> => {
    const platformRevenue =
      Number(bookingData.service_fee_client ?? 0) +
      Number(bookingData.host_commission ?? 0);

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

      const created = data as Booking;

      // 🔔 NOTIF 1 : nouvelle demande de réservation (vers l’hôte)
      try {
        const { data: property, error: propError } = await supabase
          .from('properties')
          .select('host_id, title')
          .eq('id', created.property_id)
          .single();

        if (!propError && property?.host_id) {
          const guests = created.guests_count ?? 1;

          await createNotification({
            recipientId: property.host_id,
            type: 'booking_created',
            title: 'Nouvelle demande de réservation',
            body:
              (property.title
                ? `Un voyageur souhaite réserver "${property.title}".\n`
                : 'Un voyageur souhaite réserver votre logement.\n') +
              `Séjour de ${guests} personne(s)\n` +
              `Du ${created.start_date} au ${created.end_date}\n` +
              `Montant total : ${created.total_price} DA.\n` +
              "Connectez-vous à LOCA DZ pour accepter ou refuser.",
            data: {
              booking_id: created.id,
              property_id: created.property_id,
              status: created.status,
              guests_count: guests,
              total_price: created.total_price,
              start_date: created.start_date,
              end_date: created.end_date,
            },
          });
        }
      } catch (notifError) {
        console.error('createBooking notification error', notifError);
      }

      return created;
    } catch (e) {
      console.error('createBooking error', e);
      return null;
    }
  },

  updateBookingStatus: async (
    bookingId: string,
    status: BookingStatus
  ): Promise<boolean> => {
    try {
      // On récupère la réservation avant de la modifier
      const { data: bookingRow, error: fetchError } = await supabase
        .from('bookings')
        .select('id, traveler_id, property_id, status, guests_count, total_price, start_date, end_date')
        .eq('id', bookingId)
        .single();

      if (fetchError || !bookingRow) {
        console.error('updateBookingStatus: booking not found', fetchError);
        return false;
      }

      const previousStatus = bookingRow.status as BookingStatus;

      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;

      // 🔔 NOTIF 2 : réponse de l’hôte au voyageur
      if (
        previousStatus === 'PENDING_APPROVAL' &&
        (status === 'APPROVED' || status === 'REJECTED')
      ) {
        try {
          const { data: property, error: propError } = await supabase
            .from('properties')
            .select('title')
            .eq('id', bookingRow.property_id)
            .single();

          const accepted = status === 'APPROVED';

          if (!propError && bookingRow.traveler_id) {
            const guests = bookingRow.guests_count ?? 1;
            await createNotification({
              recipientId: bookingRow.traveler_id,
              type: accepted ? 'booking_accepted' : 'booking_rejected',
              title: accepted
                ? 'Votre réservation a été acceptée'
                : 'Votre réservation a été refusée',
              body:
                (property?.title
                  ? `Logement : "${property.title}"\n`
                  : '') +
                `Séjour de ${guests} personne(s)\n` +
                `Du ${bookingRow.start_date} au ${bookingRow.end_date}\n` +
                (accepted
                  ? `Montant : ${bookingRow.total_price} DA.`
                  : ''),
              data: {
                booking_id: bookingRow.id,
                property_id: bookingRow.property_id,
                status,
                guests_count: guests,
                total_price: bookingRow.total_price,
                start_date: bookingRow.start_date,
                end_date: bookingRow.end_date,
              },
            });
          }
        } catch (notifError) {
          console.error('updateBookingStatus notification error', notifError);
        }
      }

      return true;
    } catch (e) {
      console.error('updateBookingStatus error', e);
      return false;
    }
  },

  getHostBookings: async (hostId: string): Promise<Booking[]> => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('host_id', hostId);

      if (error) throw error;
      return (data as Booking[]) || [];
    } catch (e) {
      console.error('getHostBookings error', e);
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
        return sum + (Number(b.total_price) - Number(b.commission_fee || 0));
      }, 0);
    } catch (e) {
      console.error('getHostRevenue error', e);
      return 0;
    }
  },
};
