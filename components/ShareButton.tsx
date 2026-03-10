import React, { useState } from 'react';
import { Property } from '../types';
import { formatCurrency } from '../services/stripeService';

interface ShareButtonProps {
  property: Property;
  className?: string;
  variant?: 'icon' | 'full';
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  property,
  className = '',
  variant = 'icon',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Générer l'URL de la propriété
  const propertyUrl = `${window.location.origin}/property/${property.id}`;
  
  // Texte de partage
  const shareTitle = `${property.title} - LOCADZ`;
  const shareText = `🏠 Découvre ce logement incroyable sur LOCADZ !\n\n📍 ${property.location}\n💰 ${formatCurrency(property.price)}/nuit\n⭐ ${property.rating}/5\n\n${property.description?.slice(0, 100)}...`;

  const shareOptions = [
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: '💬',
      color: 'from-green-500 to-emerald-600',
      hoverColor: 'hover:bg-green-500/20',
      action: () => {
        const url = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n👉 ${propertyUrl}`)}`;
        window.open(url, '_blank');
      },
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: '📘',
      color: 'from-blue-600 to-blue-700',
      hoverColor: 'hover:bg-blue-500/20',
      action: () => {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(propertyUrl)}&quote=${encodeURIComponent(shareText)}`;
        window.open(url, '_blank', 'width=600,height=400');
      },
    },
    {
      id: 'twitter',
      name: 'X (Twitter)',
      icon: '🐦',
      color: 'from-gray-800 to-black',
      hoverColor: 'hover:bg-gray-500/20',
      action: () => {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${shareTitle}\n\n📍 ${property.location}\n💰 ${formatCurrency(property.price)}/nuit`)}&url=${encodeURIComponent(propertyUrl)}`;
        window.open(url, '_blank', 'width=600,height=400');
      },
    },
    {
      id: 'telegram',
      name: 'Telegram',
      icon: '✈️',
      color: 'from-sky-500 to-blue-500',
      hoverColor: 'hover:bg-sky-500/20',
      action: () => {
        const url = `https://t.me/share/url?url=${encodeURIComponent(propertyUrl)}&text=${encodeURIComponent(shareText)}`;
        window.open(url, '_blank');
      },
    },
    {
      id: 'email',
      name: 'Email',
      icon: '📧',
      color: 'from-purple-500 to-indigo-600',
      hoverColor: 'hover:bg-purple-500/20',
      action: () => {
        const subject = encodeURIComponent(shareTitle);
        const body = encodeURIComponent(`${shareText}\n\n👉 Voir le logement : ${propertyUrl}`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
      },
    },
    {
      id: 'copy',
      name: copied ? 'Copié !' : 'Copier le lien',
      icon: copied ? '✅' : '🔗',
      color: 'from-indigo-500 to-purple-600',
      hoverColor: 'hover:bg-indigo-500/20',
      action: async () => {
        try {
          await navigator.clipboard.writeText(propertyUrl);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (err) {
          console.error('Failed to copy:', err);
        }
      },
    },
  ];

  // Partage natif si disponible (mobile)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: propertyUrl,
        });
      } catch (err) {
        // L'utilisateur a annulé ou erreur
        setIsOpen(true);
      }
    } else {
      setIsOpen(true);
    }
  };

  return (
    <>
      {/* Bouton de partage */}
      <button
        onClick={handleNativeShare}
        className={`group relative flex items-center justify-center gap-2 transition-all active:scale-95 ${className} ${
          variant === 'full'
            ? 'px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/20 rounded-xl text-white text-sm font-bold'
            : 'w-10 h-10 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-white'
        }`}
      >
        <svg
          className="w-5 h-5 group-hover:scale-110 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
        {variant === 'full' && <span>Partager</span>}
      </button>

      {/* Modal de partage */}
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-end md:items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-md bg-[#0a0a0f] border border-white/10 rounded-3xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300 shadow-2xl">
            {/* Background effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-gradient-to-bl from-indigo-600/10 via-purple-600/5 to-transparent rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-gradient-to-tr from-pink-600/10 via-transparent to-transparent rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <div className="relative p-6 pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-black text-white">Partager</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white/60 hover:text-white transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Property preview */}
              <div className="flex gap-3 p-3 bg-white/5 border border-white/10 rounded-2xl">
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                  <img
                    src={property.images[0]?.image_url || '/placeholder.jpg'}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm truncate">{property.title}</p>
                  <p className="text-white/50 text-xs truncate">📍 {property.location}</p>
                  <p className="text-indigo-400 font-bold text-sm mt-1">
                    {formatCurrency(property.price)}/nuit
                  </p>
                </div>
              </div>
            </div>

            {/* Share options */}
            <div className="relative px-6 pb-6">
              <div className="grid grid-cols-3 gap-3">
                {shareOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      option.action();
                      if (option.id !== 'copy') {
                        setIsOpen(false);
                      }
                    }}
                    className={`group flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/10 ${option.hoverColor} transition-all active:scale-95`}
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${option.color} flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform`}>
                      {option.icon}
                    </div>
                    <span className="text-white/70 text-[10px] font-bold text-center leading-tight">
                      {option.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="relative px-6 pb-6">
              <div className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex-1 text-white/40 text-xs truncate font-mono">
                  {propertyUrl}
                </div>
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(propertyUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    copied
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  {copied ? '✓ Copié' : 'Copier'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
