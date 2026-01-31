import React, { useEffect, useState } from 'react';
import { Property } from '../types';
import { CATEGORIES } from '../constants';
import { propertyService } from '../services/propertyService';

interface EditPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property | null;
  onSuccess: () => void;
}

export const EditPropertyModal: React.FC<EditPropertyModalProps> = ({
  isOpen,
  onClose,
  property,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    price: 0,
    category: 'trending',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && property) {
      setFormData({
        title: property.title || '',
        location: property.location || '',
        price: property.price || 0,
        category: property.category || 'trending',
        description: property.description || '',
      });
    }
  }, [isOpen, property]);

  if (!isOpen || !property) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const ok = await propertyService.update(property.id, {
        title: formData.title,
        location: formData.location,
        price: formData.price,
        category: formData.category,
        description: formData.description,
      });
      if (ok) {
        onSuccess();
        onClose();
      } else {
        alert("Impossible de mettre à jour ce logement pour l'instant.");
      }
    } catch (err) {
      console.error('EditPropertyModal handleSubmit error:', err);
      alert("Erreur lors de la mise à jour du logement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses =
    'w-full px-5 py-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl font-bold text-indigo-900 placeholder:text-indigo-200 focus:border-indigo-500 focus:bg-white transition-all outline-none shadow-inner';
  const labelClasses =
    'text-[10px] font-black uppercase text-indigo-600 ml-2 mb-1 block tracking-widest';

  return (
    <div className="fixed inset-0 z-[170] flex items-center justify-center p-4 bg-indigo-950/60 backdrop-blur-xl animate-in fade-in duration-300">
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
                    d="M15.232 5.232l3.536 3.536M7 17h3l7.232-7.232a2.5 2.5 0 00-3.536-3.536L7 13v4z"
                  />
                </svg>
              </div>
              <h2 className="text-3xl font-black text-indigo-950 italic tracking-tight">
                Modifier l&apos;annonce
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={labelClasses}>Prix / nuit (DA)</label>
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
                    setFormData({ ...formData, category: e.target.value })
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
                  setFormData({ ...formData, description: e.target.value })
                }
                className={`${inputClasses} h-28 resize-none`}
                placeholder="Détails du logement..."
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all disabled:opacity-50 hover:bg-indigo-700 active:scale-95"
            >
              {isSubmitting ? 'MISE À JOUR...' : 'ENREGISTRER LES MODIFICATIONS'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
