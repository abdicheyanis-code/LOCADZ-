import { supabase } from '../supabaseClient';
import { Favorite } from '../types';

export const favoriteService = {
  // Récupère tous les favoris d'un utilisateur
  getFavorites: async (travelerId: string): Promise<Favorite[]> => {
    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('traveler_id', travelerId);

    return error ? [] : (data as Favorite[]);
  },

  // Toggle favori : si existe -> supprime, sinon -> ajoute
  toggleFavorite: async (travelerId: string, propertyId: string): Promise<void> => {
    console.log('[favorites] toggle for user', travelerId, 'property', propertyId);

    // On essaie d'abord de supprimer un éventuel favori existant
    const { data: deleted, error: deleteError } = await supabase
      .from('favorites')
      .delete()
      .eq('traveler_id', travelerId)
      .eq('property_id', propertyId)
      .select('id');

    console.log('[favorites] deleted', deleted, 'error', deleteError);

    if (deleteError) {
      console.error('Error deleting favorite:', deleteError);
      throw deleteError;
    }

    // Si on a supprimé au moins une ligne, c’était déjà un favori -> toggle OFF terminé
    if (deleted && deleted.length > 0) {
      console.log('[favorites] existed, now removed');
      return;
    }

    // Sinon, il n'existait pas -> on l'ajoute
    const { error: insertError } = await supabase
      .from('favorites')
      .insert([{ traveler_id: travelerId, property_id: propertyId }]);

    console.log('[favorites] insert error', insertError);

    // Si jamais il y a un conflit unique (favori déjà là), on peut l’ignorer
    if (insertError) {
      if ((insertError as any).code === '23505') {
        console.warn('Favorite already exists (23505), ignoring.');
        return;
      }
      console.error('Error inserting favorite:', insertError);
      throw insertError;
    }
  },

  // Vérifie si une propriété est en favori pour un utilisateur
  isFavorite: async (travelerId: string, propertyId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('traveler_id', travelerId)
      .eq('property_id', propertyId)
      .maybeSingle();

    if (error && (error as any).code !== 'PGRST116') {
      // PGRST116 = "No rows found" → pas grave
      console.error('Error checking favorite:', error);
    }

    return !!data;
  },

  // Renvoie la liste des property_id en favori pour un utilisateur
  getUserFavoritePropertyIds: async (travelerId: string): Promise<string[]> => {
    const { data, error } = await supabase
      .from('favorites')
      .select('property_id')
      .eq('traveler_id', travelerId);

    if (error) {
      console.error('Error loading favorites:', error);
      return [];
    }

    return (data as { property_id: string }[]).map(f => f.property_id);
  },
};
