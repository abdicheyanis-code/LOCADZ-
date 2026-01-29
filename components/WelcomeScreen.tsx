import React, { useEffect, useState } from 'react';
import { LocadzLogo } from './Navbar';
import { UserProfile, AppLanguage } from '../types';

interface WelcomeScreenProps {
  currentUser: UserProfile | null;
  onNavigate: (view: 'EXPLORE' | 'PROFILE' | 'ABOUT') => void;
  currentRole: 'TRAVELER' | 'HOST';
  onSelectRole: (role: 'TRAVELER' | 'HOST') => void;
  language: AppLanguage;
  translations: any;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  currentUser,
  onNavigate,
  currentRole,
  onSelectRole,
  language,
  translations: t,
}) => {
  const [showContent, setShowContent] = useState(false);
  const isRTL = language === 'ar';

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const menuItems = [
    {
      id: 'EXPLORE' as const,
      label:
        language === 'ar'
          ? 'استكشاف الشبكة'
          : 'EXPLORER LE RÉSEAU',
      icon: '🌍',
      desc:
        language === 'ar'
          ? 'اكتشف أفضل العقارات في الجزائر'
          : "Découvrez l'élite de l'immobilier DZ",
      color: 'bg-indigo-600',
    },
    {
      id: 'PROFILE' as const,
      label:
        language === 'ar'
          ? 'إعدادات الحساب'
          : 'PARAMÈTRES PROFIL',
      icon: '⚙️',
      desc:
        language === 'ar'
          ? 'إدارة هويتك وتفضيلاتك'
          : 'Gérez votre identité et vos accès',
      color: 'bg-violet-600',
    },
    {
      id: 'ABOUT' as const,
      label:
        language === 'ar'
          ? 'قصة لوكادز'
          : 'NOTRE ODYSSÉE',
      icon: '🚀',
      desc:
        language === 'ar'
          ? 'تعرف على رؤيتنا للمستقبل'
          : 'Plongez dans notre vision du futur',
      color: 'bg-zinc-900',
    },
  ];

  const travelerLabel =
    language === 'ar'
      ? 'وضع مسافر'
      : language === 'en'
      ? 'Traveler mode'
      : 'Mode Voyageur';

  const hostLabel =
    language === 'ar'
      ? 'وضع مضيف'
      : language === 'en'
      ? 'Host mode'
      : 'Mode Hôte';

  const travelerDesc =
    language === 'ar'
      ? 'اكتشف و احجز تجارب في جميع أنحاء الجزائر'
      : language === 'en'
      ? 'Discover and book stays across Algeria'
      : 'Découvrez et réservez des séjours partout en Algérie';

  const hostDesc =
    language === 'ar'
      ? 'أضف عقارك وابدأ في استقبال المسافرين'
      : language === 'en'
      ? 'List your property and host travelers'
      : 'Ajoutez vos logements et commencez à accueillir';

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 relative z-10 text-center py-20 overflow-hidden"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Background Ambient Effects - Soft Zen */}
      <div className="absolute inset-0 z-[-1] overflow-hidden bg-[#050505]">
        <div className="absolute top-[10%] left-[10%] w-[60%] h-[60%] bg-indigo-600/5 rounded-full blur-[150px] animate-drift" />
        <div
          className="absolute bottom-[10%] right-[10%] w-[50%] h-[50%] bg-violet-600/5 rounded-full blur-[150px] animate-drift"
          style={{ animationDelay: '-5s' }}
        />
        <div className="absolute inset-0 bg-grain opacity-5" />
      </div>

      <div
        className={`transition-all duration-[1500ms] transform ${
          showContent
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-20'
        } w-full max-w-4xl`}
      >
        {/* Header Section */}
        <div className="mb-16">
          <div className="inline-block p-1 bg-white/5 rounded-[2.5rem] mb-8 shadow-2xl border border-white/10 animate-slow-zoom">
            <LocadzLogo className="w-16 h-16" />
          </div>
          <h2 className="text-[10px] font-black text-indigo-400/60 uppercase tracking-[0.6em] mb-4">
            {language === 'ar'
              ? 'مرحباً بك في عالم لوكادز'
              : "BIENVENUE DANS L'UNIVERS"}
          </h2>
          <h1 className="text-5xl md:text-8xl font-black text-white italic tracking-tighter mb-4 leading-none">
            {currentUser?.full_name.split(' ')[0]},{' '}
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-white to-transparent">
              Où commence
            </span>{' '}
            l&apos;exceptionnel ?
          </h1>
        </div>

        {/* ROLE SWITCHER */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          {/* Voyageur */}
          <button
            type="button"
            onClick={() => onSelectRole('TRAVELER')}
            className={`group relative px-6 py-5 rounded-[2.5rem] border transition-all text-left flex items-center gap-4 ${
              currentRole === 'TRAVELER'
                ? 'bg-white text-indigo-950 border-white shadow-2xl'
                : 'bg-white/5 text-white border-white/10 hover:bg-white/10 hover:-translate-y-1'
            }`}
          >
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg ${
                currentRole === 'TRAVELER'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/10'
              }`}
            >
              🎒
            </div>
            <div>
              <p
                className={`text-[10px] font-black uppercase tracking-[0.3em] mb-1 ${
                  currentRole === 'TRAVELER'
                    ? 'text-indigo-500'
                    : 'text-white/60'
                }`}
              >
                {travelerLabel}
              </p>
              <p
                className={`text-xs font-medium ${
                  currentRole === 'TRAVELER'
                    ? 'text-indigo-900'
                    : 'text-white/60'
                }`}
              >
                {travelerDesc}
              </p>
            </div>
          </button>

          {/* Hôte */}
          <button
            type="button"
            onClick={() => onSelectRole('HOST')}
            className={`group relative px-6 py-5 rounded-[2.5rem] border transition-all text-left flex items-center gap-4 ${
              currentRole === 'HOST'
                ? 'bg-white text-indigo-950 border-white shadow-2xl'
                : 'bg-white/5 text-white border-white/10 hover:bg-white/10 hover:-translate-y-1'
            }`}
          >
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg ${
                currentRole === 'HOST'
                  ? 'bg-amber-500 text-white'
                  : 'bg-white/10'
              }`}
            >
              🏠
            </div>
            <div>
              <p
                className={`text-[10px] font-black uppercase tracking-[0.3em] mb-1 ${
                  currentRole === 'HOST'
                    ? 'text-amber-500'
                    : 'text-white/60'
                }`}
              >
                {hostLabel}
              </p>
              <p
                className={`text-xs font-medium ${
                  currentRole === 'HOST'
                    ? 'text-indigo-900'
                    : 'text-white/60'
                }`}
              >
                {hostDesc}
              </p>
            </div>
          </button>
        </div>

        {/* Navigation Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {menuItems.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="group relative bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-8 rounded-[3rem] text-left transition-all duration-700 hover:bg-white/10 hover:-translate-y-3 hover:shadow-2xl overflow-hidden"
              style={{ transitionDelay: `${idx * 150}ms` }}
            >
              <div
                className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-xl group-hover:scale-110 transition-transform duration-700`}
              >
                {item.icon}
              </div>
              <h3 className="text-white font-black text-lg tracking-tight mb-2 uppercase italic group-hover:text-indigo-300 transition-colors">
                {item.label}
              </h3>
              <p className="text-white/30 text-xs font-medium leading-relaxed">
                {item.desc}
              </p>

              <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white/5 opacity-0 group-hover:opacity-100 group-hover:animate-shine" />
            </button>
          ))}
        </div>

        {/* Smart Search Shortcut */}
        <div className="mt-20 pt-10 border-t border-white/5 max-w-lg mx-auto">
          <p className="text-white/20 text-[9px] font-black uppercase tracking-[0.4em] mb-6">
            Accès Rapide Conciergerie
          </p>
          <div className="flex justify-center gap-12 opacity-30 hover:opacity-100 transition-all duration-700">
            <div
              className="text-center group cursor-pointer"
              onClick={() => onNavigate('EXPLORE')}
            >
              <p className="text-2xl mb-1 group-hover:scale-125 transition-transform">
                🏖️
              </p>
              <p className="text-[8px] font-black text-white uppercase tracking-widest">
                Mer
              </p>
            </div>
            <div
              className="text-center group cursor-pointer"
              onClick={() => onNavigate('EXPLORE')}
            >
              <p className="text-2xl mb-1 group-hover:scale-125 transition-transform">
                🏜️
              </p>
              <p className="text-[8px] font-black text-white uppercase tracking-widest">
                Sahara
              </p>
            </div>
            <div
              className="text-center group cursor-pointer"
              onClick={() => onNavigate('EXPLORE')}
            >
              <p className="text-2xl mb-1 group-hover:scale-125 transition-transform">
                🏔️
              </p>
              <p className="text-[8px] font-black text-white uppercase tracking-widest">
                Montagne
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
