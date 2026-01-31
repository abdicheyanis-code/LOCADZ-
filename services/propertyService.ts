import { supabase } from '../supabaseClient';
import { Property, PropertyImage } from '../types';

export const propertyService = {
  uploadImage: async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt || 'jpg'}`;
      const filePath = `properties/${fileName}`;

      const { error: uploadError } = await supabase
        .storage
        .from('property-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data, error: urlError } = supabase
        .storage
        .from('property-images')
        .getPublicUrl(filePath);

      if (urlError) throw urlError;

      return data.publicUrl;
    } catch (err) {
      console.error('Upload image error:', err);
      // Pas d’URL fake : si l’upload échoue, on renvoie null
      return null;
    }
  },

  // Toutes les propriétés (vue Explore)
  getAll: async (): Promise<Property[]> => {
    try {
      const { data: properties, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !properties) {
        console.error('getAll properties error:', error);
        return [];
      }

      const propertyIds = properties.map(p => p.id);
      if (propertyIds.length === 0) return [];

      const { data: images, error: imgError } = await supabase
        .from('property_images')
        .select('*')
        .in('property_id', propertyIds);

      if (imgError) {
        console.error('getAll property_images error:', imgError);
      }

      const imagesData = (images as PropertyImage[]) || [];

      return properties.map(p => ({
        ...p,
        images: imagesData.filter(img => img.property_id === p.id),
      })) as Property[];
    } catch (err) {
      console.error('getAll unexpected error:', err);
      return [];
    }
  },

  // Ajouter un bien
  add: async (propertyData: any): Promise<Property | null> => {
    const latitude = propertyData.latitude ?? 36.7;
    const longitude = propertyData.longitude ?? 3.0;

    try {
      const { data, error } = await supabase
        .from('properties')
        .insert([
          {
            host_id: propertyData.host_id,
            title: propertyData.title,
            description: propertyData.description,
            location: propertyData.location,
            price: propertyData.price,
            category: propertyData.category,
            latitude,
            longitude,
          },
        ])
        .select()
        .single();

      if (error || !data) throw error;

      if (propertyData.imageUrls && propertyData.imageUrls.length > 0) {
        const { error: imgError } = await supabase
          .from('property_images')
          .insert(
            propertyData.imageUrls.map((url: string) => ({
              property_id: data.id,
              image_url: url,
            })),
          );

        if (imgError) {
          console.error('add property_images error:', imgError);
        }
      }

      return await propertyService.getById(data.id);
    } catch (err) {
      console.error('add property error:', err);
      return null;
    }
  },

  // Détail d'un bien
  getById: async (id: string): Promise<Property | null> => {
    try {
      const { data: property, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !property) {
        console.error('getById property error:', error);
        return null;
      }

      const { data: images, error: imgError } = await supabase
        .from('property_images')
        .select('*')
        .eq('property_id', id);

      if (imgError) {
        console.error('getById images error:', imgError);
      }

      return {
        ...(property as any),
        images: (images as PropertyImage[]) || [],
      } as Property;
    } catch (err) {
      console.error('getById unexpected error:', err);
      return null;
    }
  },

  // Propriétés d'un hôte (HostDashboard)
  getByHost: async (hostId: string): Promise<Property[]> => {
    try {
      const { data: properties, error } = await supabase
        .from('properties')
        .select('*')
        .eq('host_id', hostId)
        .order('created_at', { ascending: false });

      if (error || !properties) {
        console.error('getByHost error:', error);
        return [];
      }

      const propertyIds = properties.map(p => p.id);
      if (propertyIds.length === 0) return [];

      const { data: images, error: imgError } = await supabase
        .from('property_images')
        .select('*')
        .in('property_id', propertyIds);

      if (imgError) {
        console.error('getByHost images error:', imgError);
      }

      const imagesData = (images as PropertyImage[]) || [];

      return properties.map(p => ({
        ...p,
        images: imagesData.filter(img => img.property_id === p.id),
      })) as Property[];
    } catch (err) {
      console.error('getByHost unexpected error:', err);
      return [];
    }
  },

  // Mise à jour d'un bien (prix, etc.)
  update: async (
    id: string,
    updates: Partial<Property>
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('properties')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('update property error:', err);
      return false;
    }
  },
};
