import React, { useState, useEffect, useRef } from 'react';
import { CATEGORIES } from '../constants';
import { propertyService } from '../services/propertyService';
import { authService } from '../services/authService';
import { UserProfile } from '../types';

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  hostId: string;
  hostName: string;
  onSuccess: () => void;
}

const extractLatLngFromGoogleMapsUrl = (
  url: string
): { lat: number; lng: number } | null => {
  try {
    const u = new URL(url);

    // Cas 1 : ?q=36.1234,3.1234
    const q = u.searchParams.get('q');
    if (q && q.match(/^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/)) {
      const [latStr, lngStr] = q.split(',');
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }

    // Cas 2 : ...@36.1234,3.1234,zoomz
    const match = url.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }

    return null;
  } catch {
    return null;
  }
};

export const AddPropertyModal: React.FC<AddPropertyModalProps> = ({
  isOpen,
  onClose,
  hostId,
  hostName,
  onSuccess,
}) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    location: '',
    price: 15000,
    category: 'trending',
    description: '',
    mapsUrl: '',
  });

  useEffect(() => {
    if (isOpen) {
      setCurrentUser(authService.getSession());
    }
  }, [isOpen]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  const isVerified = currentUser?.id_verification_status === 'VERIFIED';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Upload des images
      const uploadedUrls: string[] = [];
      for (const file of selectedFiles) {
        const url = await propertyService.uploadImage(file);
        if (url) uploadedUrls.push(url);
      }

      // Essayer d'extraire les coords à partir du lien Google Maps
      let latitude: number | undefined;
      let longitude: number | undefined;
      const trimmedUrl = formData.mapsUrl.trim();
      if (trimmedUrl) {
        const coords = extractLatLngFromGoogleMapsUrl(trimmedUrl);
        if (coords) {
          latitude = coords.lat;
          longitude = coords.lng;
        }
      }

      const result = await propertyService.add({
        ...formData,
        maps_url: trimmedUrl || null,
        latitude,
        longitude,
        imageUrls:
          uploadedUrls.length > 0
            ? uploadedUrls
            : [
                'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1200',
              ],
        host_id: hostId,
        hostName,
      });

      if (result) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error adding property:', error);
      alert("Erreur lors de l'ajout du logement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses =
    'w-full px-5 py-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl font-bold text-indigo-900 placeholder:text-indigo-200 focus:border-indigo-500 focus:bg-white transition-all outline-none shadow-inner';
  const labelClasses =
    'text-[10px] font-black uppercase text-indigo-600 ml-2 mb-1 block tracking-widest';

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-indigo-950/60 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white/95 backdrop-blur-3xl w-full max-w-2xl rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.5)] border border-white/50 overflow-hidden">
        <div className="p-10 overflow-y-auto max-h-[85vh] no-scrollbar">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-100">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <h2 className="text-3xl font-black text-indigo-950 italic tracking-tight">
                Nouvelle Annonce
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-rose-500 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {!isVerified ? (
            <div className="text-center py-10 space-y-6">
              <div className="text-6xl">🔒</div>
              <h3 className="text-xl font-black text-indigo-900">
                Vérification Requise
              </h3>
              <p className="text-sm text-gray-500">
                Validez votre profil pour publier.
              </p>
              <button
                onClick={onClose}
                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest"
              >
                RETOUR
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelClasses}>Titre</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={e =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className={inputClasses}
                    placeholder="Ex: Villa Vue Mer"
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelClasses}>Localisation</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={e =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className={inputClasses}
                    placeholder="Alger, Algérie"
                  />
                </div>
              </div>

              {/* Nouveau champ : lien Google Maps */}
              <div className="space-y-1">
                <label className={labelClasses}>
                  Lien Google Maps (optionnel)
                </label>
                <input
                  type="text"
                  value={formData.mapsUrl}
                  onChange={e =>
                    setFormData({ ...formData, mapsUrl: e.target.value })
                  }
                  className={inputClasses}
                  placeholder="Colle ici le lien Google Maps du logement"
                />
                <p className="text-[10px] text-indigo-300 mt-1 ml-2">
                  Utilise le bouton &quot;Partager&quot; dans Google Maps &gt;
                  &quot;Copier le lien&quot;. Nous essaierons de récupérer
                  automatiquement les coordonnées pour la carte.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelClasses}>
                    Prix / nuit (DA)
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        price: parseInt(e.target.value || '0', 10),
                      })
                    }
                    className={inputClasses}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelClasses}>Catégorie</label>
                  <select
                    value={formData.category}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        category: e.target.value,
                      })
                    }
                    className={inputClasses}
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className={labelClasses}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      description: e.target.value,
                    })
                  }
                  className={`${inputClasses} h-24 resize-none`}
                  placeholder="Détails du logement..."
                />
              </div>

              <div className="space-y-1">
                <label className={labelClasses}>Photos du logement</label>
                <div className="grid grid-cols-3 gap-3">
                  {previews.map((src, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square rounded-2xl overflow-hidden group"
                    >
                      <img
                        src={src}
                        className="w-full h-full object-cover"
                        alt=""
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square border-2 border-dashed border-indigo-100 rounded-2xl flex flex-col items-center justify-center text-indigo-300 hover:border-indigo-400 hover:bg-indigo-50 transition-all"
                  >
                    <span className="text-2xl">+</span>
                    <span className="text-[8px] font-black uppercase">
                      Ajouter
                    </span>
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || selectedFiles.length === 0}
                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all disabled:opacity-50"
              >
                {isSubmitting
                  ? 'PUBLICATION EN COURS...'
                  : "PUBLIER L'ANNONCE"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
