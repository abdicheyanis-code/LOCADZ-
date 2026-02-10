import React from 'react';
import { CATEGORIES } from '../constants';

interface CategoriesProps {
  selectedCategory: string;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  accentColor?: string;
}

export const Categories: React.FC<CategoriesProps> = ({
  selectedCategory,
  onSelect,
  onHover,
  accentColor = '#6366f1',
}) => {
  return (
    <div className="flex items-center justify-center gap-3 overflow-x-auto no-scrollbar scroll-smooth px-2">
      {CATEGORIES.map(category => {
        const isActive = selectedCategory === category.id;

        return (
          <button
            key={category.id}
            onClick={() => onSelect(category.id)}
            onMouseEnter={() => onHover(category.id)}
            onMouseLeave={() => onHover(null)}
            className={`
              relative flex-shrink-0 flex flex-col items-center justify-center
              gap-2 py-5 px-6 rounded-[3.5rem]
              transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]
              min-w-[130px] group
              ${
                isActive
                  ? 'bg-white text-indigo-950 shadow-[0_20px_60px_rgba(255,255,255,0.2)] scale-[1.05] z-10'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }
            `}
          >
            <span
              className={`text-4xl transition-all duration-700 ${
                isActive
                  ? 'scale-110 rotate-3'
                  : 'group-hover:scale-125 opacity-60 group-hover:opacity-100'
              }`}
            >
              {category.icon}
            </span>
            <span
              className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                isActive
                  ? 'opacity-100'
                  : 'opacity-40 group-hover:opacity-100'
              }`}
            >
              {category.label}
            </span>

            {/* Barre lumineuse active */}
            {isActive && (
              <div
                className="absolute -bottom-1 w-10 h-1.5 rounded-full animate-pulse transition-all duration-1000"
                style={{
                  backgroundColor: accentColor,
                  boxShadow: `0 0 25px ${accentColor}`,
                }}
              />
            )}

            {/* Overlay léger au survol pour les non-actives */}
            {!isActive && (
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[3.5rem]" />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Categories;
