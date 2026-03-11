import { supabase } from '../supabaseClient';

export interface BlockedDate {
  id: string;
  property_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  created_at: string;
}

export interface DateRange {
  start: Date;
  end: Date;
  type: 'BLOCKED' | 'BOOKED';
  reason?: string;
}

export const availabilityService = {
  /**
   * Récupérer toutes les dates bloquées d'une propriété
   */
  getBlockedDates: async (propertyId: string): Promise<BlockedDate[]> => {
    try {
      const { data, error } = await supabase
        .from('blocked_dates')
        .select('*')
        .eq('property_id', propertyId)
        .order('start_date', { ascending: true });

      if (error) throw error;
      return (data as BlockedDate[]) || [];
    } catch (e) {
      console.error('getBlockedDates error:', e);
      return [];
    }
  },

  /**
   * Bloquer une plage de dates
   */
  blockDates: async (params: {
    propertyId: string;
    startDate: string;
    endDate: string;
    reason?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const { propertyId, startDate, endDate, reason } = params;

    try {
      // Vérifier qu'il n'y a pas de réservation existante
      const { data: existingBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('property_id', propertyId)
        .in('status', ['APPROVED', 'PAID'])
        .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`);

      if (existingBookings && existingBookings.length > 0) {
        return { 
          success: false, 
          error: 'Des réservations existent déjà sur ces dates. Annulez-les d\'abord.' 
        };
      }

      const { error } = await supabase
        .from('blocked_dates')
        .insert({
          property_id: propertyId,
          start_date: startDate,
          end_date: endDate,
          reason: reason || null,
        });

      if (error) throw error;
      return { success: true };
    } catch (e) {
      console.error('blockDates error:', e);
      return { success: false, error: 'Erreur lors du blocage des dates' };
    }
  },

  /**
   * Débloquer une plage de dates
   */
  unblockDates: async (blockedDateId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('blocked_dates')
        .delete()
        .eq('id', blockedDateId);

      if (error) throw error;
      return true;
    } catch (e) {
      console.error('unblockDates error:', e);
      return false;
    }
  },

  /**
   * Vérifier si une plage de dates est disponible
   */
  isRangeAvailable: async (
    propertyId: string,
    startDate: string,
    endDate: string
  ): Promise<boolean> => {
    try {
      // Vérifier les dates bloquées
      const { data: blockedDates } = await supabase
        .from('blocked_dates')
        .select('id')
        .eq('property_id', propertyId)
        .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`);

      if (blockedDates && blockedDates.length > 0) {
        return false;
      }

      // Vérifier les réservations existantes
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('property_id', propertyId)
        .in('status', ['APPROVED', 'PAID'])
        .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`);

      if (bookings && bookings.length > 0) {
        return false;
      }

      return true;
    } catch (e) {
      console.error('isRangeAvailable error:', e);
      return true; // En cas d'erreur, on permet la réservation
    }
  },

  /**
   * Récupérer toutes les indisponibilités (bloquées + réservées)
   */
  getAllUnavailableDates: async (propertyId: string): Promise<DateRange[]> => {
    try {
      const ranges: DateRange[] = [];

      // Dates bloquées
      const { data: blocked } = await supabase
        .from('blocked_dates')
        .select('*')
        .eq('property_id', propertyId);

      if (blocked) {
        blocked.forEach((b: BlockedDate) => {
          ranges.push({
            start: new Date(b.start_date),
            end: new Date(b.end_date),
            type: 'BLOCKED',
            reason: b.reason || 'Bloqué par l\'hôte',
          });
        });
      }

      // Réservations confirmées
      const { data: bookings } = await supabase
        .from('bookings')
        .select('start_date, end_date')
        .eq('property_id', propertyId)
        .in('status', ['APPROVED', 'PAID']);

      if (bookings) {
        bookings.forEach((b: any) => {
          ranges.push({
            start: new Date(b.start_date),
            end: new Date(b.end_date),
            type: 'BOOKED',
            reason: 'Réservé',
          });
        });
      }

      return ranges;
    } catch (e) {
      console.error('getAllUnavailableDates error:', e);
      return [];
    }
  },
};
