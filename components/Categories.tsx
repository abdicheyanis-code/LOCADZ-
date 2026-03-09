import React from 'react';
import { CATEGORIES, CATEGORY_COLORS } from '../constants';

interface CategoriesProps {
  selectedCategory: string;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  accentColor?: string;
}

// 🎨 Icônes par catégorie - OPTIMISÉES
const CategoryIcon: React.FC<{ categoryId: string; isActive: boolean }> = ({ categoryId, isActive }) => {
  const icons: Record<string, string> = {
    trending: '🔥',
    beachfront: '🌊',
    cabins: '🏔️',
    sahara: '🏜️',
    city: '🌃',
  };

  return (
    <span 
      className={`text-2xl md:text-3xl transition-transform duration-300 ${
        isActive ? 'scale-110' : 'group-hover:scale-110'
      }`}
    >
      {icons[categoryId] || '📍'}
    </span>
  );
};

export const Categories: React.FC<CategoriesProps> = ({
  selectedCategory,
  onSelect,
  onHover,
  accentColor = '#6366f1',
}) => {
  return (
    <div className="relative">
      {/* Container avec scroll horizontal */}
      <div
        className="
          flex items-center gap-1.5 md:gap-3
          overflow-x-auto no-scrollbar scroll-smooth
          justify-start md:justify-center
          px-1 py-1
        "
      >
        {CATEGORIES.map((category) => {
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
                gap-1.5 md:gap-2.5
                py-3 md:py-4 px-4 md:px-5
                rounded-xl md:rounded-2xl
                min-w-[85px] md:min-w-[100px]
                transition-all duration-300 ease-out
                group
                ${
                  isActive
                    ? 'bg-white shadow-lg md:shadow-xl scale-[1.02] md:scale-105 z-10'
                    : 'bg-white/5 hover:bg-white/10 active:bg-white/15'
                }
              `}
            >
              {/* Bordure gradient pour l'élément actif - DESKTOP ONLY */}
              {isActive && (
                <div
                  className="hidden md:block absolute inset-0 rounded-2xl p-[2px] -z-10"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                  }}
                >
                  <div className="w-full h-full bg-white rounded-[14px]" />
                </div>
              )}

              {/* Icône */}
              <div
                className={`
                  relative w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl 
                  flex items-center justify-center
                  transition-all duration-300
                  ${isActive ? '' : 'bg-white/5 group-hover:bg-white/10'}
                `}
                style={{
                  background: isActive
                    ? `linear-gradient(135deg, ${colors.primary}15, ${colors.secondary}15)`
                    : undefined,
                }}
              >
                <CategoryIcon categoryId={category.id} isActive={isActive} />
                
                {/* Glow effect - DESKTOP ONLY */}
                {isActive && (
                  <div
                    className="hidden md:block absolute inset-0 rounded-2xl blur-lg opacity-40 -z-10"
                    style={{
                      background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                    }}
                  />
                )}
              </div>

              {/* Label */}
              <span
                className={`
                  text-[9px] md:text-[10px] font-bold md:font-black uppercase tracking-wider md:tracking-[0.15em]
                  transition-all duration-300
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
                  className="absolute -bottom-0.5 md:-bottom-1 left-1/2 -translate-x-1/2 w-1.5 md:w-2 h-1.5 md:h-2 rounded-full"
                  style={{
                    backgroundColor: colors.primary,
                    boxShadow: `0 0 10px ${colors.primary}`,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Gradient fade sur les bords (mobile) */}
      <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-black/30 to-transparent pointer-events-none md:hidden" />
      <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-black/30 to-transparent pointer-events-none md:hidden" />
    </div>
  );
};

export default Categories;
