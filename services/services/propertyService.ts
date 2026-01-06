import { supabase } from '../supabaseClient';
import { Property, PropertyImage } from '../types';
import { INITIAL_PROPERTIES } from '../constants';

const LOCAL_PROPERTIES_KEY = 'locadz_local_properties';

// true en dev, false en prod (Vercel)
const USE_LOCAL_FALLBACK = import.meta.env.DEV;

export const propertyService = {
  _getLocal: (): Property[] => {
    const saved = localStorage.getItem(LOCAL_PROPERTIES_KEY);
    return saved ? JSON.parse(saved) : INITIAL_PROPERTIES;
  },

  _saveLocal: (props: Property[]) => {
    localStorage.setItem(LOCAL_PROPERTIES_KEY, JSON.stringify(props));
  },

  uploadImage: async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `properties/${fileName}`;

      const { error: uploadError } = await supabase
        .storage
        .from('property-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase
        .storage
        .from('property-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (err) {
      console.error('Upload error:', err);
      // Fallback: simulation d’URL locale pour test
      return URL.createObjectURL(file);
    }
  },

  getAll: async (): Promise<Property[]> => {
    try {
      const { data: properties, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !properties) {
        return USE_LOCAL_FALLBACK ? propertyService._getLocal() : [];
      }

      const propertyIds = properties.map(p => p.id);
      const { data: images } = await supabase
        .from('property_images')
        .select('*')
        .in('property_id', propertyIds);

      const imagesData = (images as PropertyImage[]) || [];
      return properties.map(p => ({
        ...p,
        images: imagesData.filter(img => img.property_id === p.id),
      }));
    } catch (err) {
      return USE_LOCAL_FALLBACK ? propertyService._getLocal() : [];
    }
  },

  add: async (propertyData: any): Promise<Property | null> => {
    const newProperty: Property = {
      id: crypto.randomUUID(),
      host_id: propertyData.host_id,
      title: propertyData.title,
      description: propertyData.description,
      location: propertyData.location,
      price: propertyData.price,
      category: propertyData.category,
      rating: 5.0,
      reviews_count: 0,
      latitude: propertyData.latitude || 36.7,
      longitude: propertyData.longitude || 3.0,
      created_at: new Date().toISOString(),
      images: (propertyData.imageUrls || []).map((url: string) => ({
        id: crypto.randomUUID(),
        property_id: '',
        image_url: url,
        created_at: new Date().toISOString(),
      })),
      hostName: propertyData.hostName || 'Hôte Locadz',
      isHostVerified: true,
    };

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
            latitude: newProperty.latitude,
            longitude: newProperty.longitude,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      if (propertyData.imageUrls) {
        await supabase
          .from('property_images')
          .insert(
            propertyData.imageUrls.map((url: string) => ({
              property_id: data.id,
              image_url: url,
            })),
          );
      }

      return await propertyService.getById(data.id);
    } catch (err) {
      if (!USE_LOCAL_FALLBACK) return null;
      const local = propertyService._getLocal();
      const updated = [newProperty, ...local];
      propertyService._saveLocal(updated);
      return newProperty;
    }
  },

  getById: async (id: string): Promise<Property | null> => {
    try {
      const { data: property, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      const { data: images } = await supabase
        .from('property_images')
        .select('*')
        .eq('property_id', id);

      return { ...(property as any), images: images || [] } as Property;
    } catch {
      if (!USE_LOCAL_FALLBACK) return null;
      return propertyService._getLocal().find(p => p.id === id) || null;
    }
  },

  getByHost: async (hostId: string): Promise<Property[]> => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('host_id', hostId);

      if (error) throw error;
      return data as Property[];
    } catch {
      if (!USE_LOCAL_FALLBACK) return [];
      return propertyService._getLocal().filter(p => p.host_id === hostId);
    }
  },

  update: async (id: string, updates: Partial<Property>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('properties')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch {
      if (!USE_LOCAL_FALLBACK) return false;
      const local = propertyService._getLocal();
      const index = local.findIndex(p => p.id === id);
      if (index !== -1) {
        local[index] = { ...local[index], ...updates };
        propertyService._saveLocal(local);
        return true;
      }
      return false;
    }
  },
};
