import React from 'react';
import { CATEGORIES, CATEGORY_COLORS } from '../constants';

interface CategoriesProps {
  selectedCategory: string;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  accentColor?: string;
}

// 🎨 Icônes SVG personnalisées par catégorie
const CategoryIcon: React.FC<{ categoryId: string; isActive: boolean }> = ({ categoryId, isActive }) => {
  const baseClass = `w-8 h-8 transition-all duration-500 ${isActive ? 'scale-110' : 'scale-100'}`;
  
  switch (categoryId) {
    case 'trending':
      return (
        <div className={`relative ${baseClass}`}>
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
              fill="url(#trending-gradient)"
            />
            <defs>
              <linearGradient id="trending-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
            </defs>
          </svg>
          {/* Flamme animée */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-2xl ${isActive ? 'animate-bounce' : ''}`}>🔥</span>
          </div>
        </div>
      );

    case 'beachfront':
      return (
        <div className={`relative ${baseClass}`}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <span className={`text-2xl ${isActive ? 'animate-pulse' : ''}`}>🌊</span>
              {isActive && (
                <div className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-pulse" />
              )}
            </div>
          </div>
        </div>
      );

    case 'cabins':
      return (
        <div className={`relative ${baseClass}`}>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-2xl transition-transform duration-500 ${isActive ? 'scale-110' : ''}`}>🏔️</span>
          </div>
          {isActive && (
            <div className="absolute -top-1 left-1/2 -translate-x-1/2">
              <span className="text-xs animate-bounce">❄️</span>
            </div>
          )}
        </div>
      );

    case 'sahara':
      return (
        <div className={`relative ${baseClass}`}>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-2xl ${isActive ? '' : ''}`}>🏜️</span>
          </div>
          {isActive && (
            <div className="absolute -top-1 right-0">
              <span className="text-xs animate-pulse">☀️</span>
            </div>
          )}
        </div>
      );

    case 'city':
      return (
        <div className={`relative ${baseClass}`}>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-2xl ${isActive ? 'animate-pulse' : ''}`}>🌃</span>
          </div>
          {isActive && (
            <>
              <div className="absolute -top-1 -left-1">
                <span className="text-[8px] animate-ping">✨</span>
              </div>
              <div className="absolute -bottom-1 -right-1">
                <span className="text-[8px] animate-ping" style={{ animationDelay: '0.5s' }}>✨</span>
              </div>
            </>
          )}
        </div>
      );

    default:
      return <span className="text-2xl">📍</span>;
  }
};

export const Categories: React.FC<CategoriesProps> = ({
  selectedCategory,
  onSelect,
  onHover,
  accentColor = '#6366f1',
}) => {
  return (
    <div className="relative">
      {/* Container avec scroll horizontal sur mobile */}
      <div
        className="
          flex items-center gap-3
          overflow-x-auto no-scrollbar scroll-smooth
          justify-start md:justify-center
          px-2 py-2
        "
      >
        {CATEGORIES.map((category, index) => {
          const isActive = selectedCategory === category.id;
          const colors = CATEGORY_COLORS[category.id] || CATEGORY_COLORS.trending;

          return (
            <button
              key={category.id}
              onClick={() => onSelect(category.id)}
              onMouseEnter={() => onHover(category.id)}
              onMouseLeave={() => onHover(null)}
              className={`
                relative flex-none
                flex flex-col items-center justify-center
                gap-2.5
                py-4 px-5
                rounded-[2rem]
                min-w-[110px]
                transition-all duration-500 ease-out
                group
                ${
                  isActive
                    ? 'bg-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] scale-105 z-10'
                    : 'bg-white/5 hover:bg-white/10 backdrop-blur-sm'
                }
              `}
              style={{
                animationDelay: `${index * 50}ms`,
              }}
            >
              {/* Bordure gradient pour l'élément actif */}
              {isActive && (
                <div
                  className="absolute inset-0 rounded-[2rem] p-[2px] -z-10"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                  }}
                >
                  <div className="w-full h-full bg-white rounded-[1.9rem]" />
                </div>
              )}

              {/* Icône */}
              <div
                className={`
                  relative w-12 h-12 rounded-2xl flex items-center justify-center
                  transition-all duration-500
                  ${
                    isActive
                      ? ''
                      : 'bg-white/10 group-hover:bg-white/20'
                  }
                `}
                style={{
                  background: isActive
                    ? `linear-gradient(135deg, ${colors.primary}20, ${colors.secondary}20)`
                    : undefined,
                }}
              >
                <CategoryIcon categoryId={category.id} isActive={isActive} />
                
                {/* Glow effect */}
                {isActive && (
                  <div
                    className="absolute inset-0 rounded-2xl blur-xl opacity-50 -z-10"
                    style={{
                      background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                    }}
                  />
                )}
              </div>

              {/* Label */}
              <span
                className={`
                  text-[10px] font-black uppercase tracking-[0.15em]
                  transition-all duration-500
                  ${
                    isActive
                      ? 'text-gray-900'
                      : 'text-white/50 group-hover:text-white/80'
                  }
                `}
              >
                {category.label}
              </span>

              {/* Indicateur actif - point lumineux */}
              {isActive && (
                <div
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full animate-pulse"
                  style={{
                    backgroundColor: colors.primary,
                    boxShadow: `0 0 20px ${colors.primary}, 0 0 40px ${colors.primary}`,
                  }}
                />
              )}

              {/* Effet de survol pour les non-actifs */}
              {!isActive && (
                <div 
                  className="absolute inset-0 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"
                  style={{
                    background: `radial-gradient(circle at center, ${colors.primary}10, transparent 70%)`,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Gradient fade sur les bords (mobile) */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/50 to-transparent pointer-events-none md:hidden" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/50 to-transparent pointer-events-none md:hidden" />
    </div>
  );
};

export default Categories;
