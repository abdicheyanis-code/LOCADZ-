import React, { useState, useEffect, useRef } from 'react';
import { UserRole, UserProfile, AppLanguage } from '../types';

interface NavbarProps {
  selectedCategory?: string;
  userRole: UserRole;
  currentUser: UserProfile | null;
  language: AppLanguage;
  onSwitchRole: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onGoHome: () => void;
  onNavigate: (view: string) => void;
  onSearch?: (query: string) => void;
  onLanguageChange: (lang: AppLanguage) => void;
  accentColor?: string;
  dbStatus?: 'CONNECTING' | 'CONNECTED' | 'ERROR';
}

const NAVBAR_TRANSLATIONS: Record<AppLanguage, any> = {
  fr: {
    traveler: 'Voyageur',
    host: 'Hôte',
    login: 'Connexion',
    searchPlaceholder: 'Où voulez-vous aller ?',
    hostDashboard: 'Tableau de bord Hôte',
    travelerAccount: 'Compte Voyageur',
    mySpace: '🏠 Mon Espace', // ✅ AJOUTÉ
    myTrips: '🎒 Mes Voyages',
    myFavorites: '❤️ Mes Favoris',
    dashboard: '📊 Dashboard',
    myProperties: '🏠 Mes Propriétés',
    revenue: '💰 Revenus',
    viewProfile: '👤 Voir Profil',
    switchMode: '🔄 Mode ',
    settings: '⚙️ Paramètres',
    logout: '🚪 Déconnexion',
    languageLabel: 'Langue / اللغة',
    admin: '⚡ ADMIN PROFIT',
    about: '🚀 À Propos',
    explore: '🌍 Explorer',
  },
  en: {
    traveler: 'Traveler',
    host: 'Host',
    login: 'Login',
    searchPlaceholder: 'Where do you want to go?',
    hostDashboard: 'Host Dashboard',
    travelerAccount: 'Traveler Account',
    mySpace: '🏠 My Space', // ✅ AJOUTÉ
    myTrips: '🎒 My Trips',
    myFavorites: '❤️ My Favorites',
    dashboard: '📊 Dashboard',
    myProperties: '🏠 My Properties',
    revenue: '💰 Revenue',
    viewProfile: '👤 View Profile',
    switchMode: '🔄 Switch to ',
    settings: '⚙️ Settings',
    logout: '🚪 Logout',
    languageLabel: 'Language',
    admin: '⚡ ADMIN PROFIT',
    about: '🚀 About Us',
    explore: '🌍 Explore',
  },
  ar: {
    traveler: 'مسافر',
    host: 'مضيف',
    login: 'تسجيل الدخول',
    searchPlaceholder: 'إلى أين تريد الذهاب ؟',
    hostDashboard: 'لوحة المضيف',
    travelerAccount: 'حساب المسافر',
    mySpace: '🏠 مساحتي', // ✅ AJOUTÉ
    myTrips: '🎒 رحلاتي',
    myFavorites: '❤️ مفضلاتي',
    dashboard: '📊 لوحة التحكم',
    myProperties: '🏠 عقاراتي',
    revenue: '💰 الأرباح',
    viewProfile: '👤 الملف الشخصي',
    switchMode: '🔄 التبديل إلى ',
    settings: '⚙️ الإعدادات',
    logout: '🚪 تسجيل الخروج',
    languageLabel: 'اللغة',
    admin: '⚡ إدارة الأرباح',
    about: '🚀 حول لوكادز',
    explore: '🌍 استكشاف',
  },
};

export const LocadzLogo: React.FC<{
  className?: string;
  isScrolled?: boolean;
  accentColor?: string;
}> = ({ className = 'w-8 h-8', isScrolled = false, accentColor = '#3B82F6' }) => (
  <svg
    className={`${className} transition-all duration-700 ease-in-out`}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{
      filter: isScrolled ? `drop-shadow(0 0 15px ${accentColor}66)` : 'none',
    }}
  >
    <rect
      x="10"
      y="10"
      width="80"
      height="80"
      rx="20"
      fill={isScrolled ? accentColor : '#A5C9FF'}
      className="transition-all duration-700"
    />
    <path
      d="M40 25C45 22 55 22 65 25C75 28 85 35 85 45C85 55 75 65 65 75C55 85 45 85 35 85C25 85 15 75 15 65C15 55 25 45 35 45C40 45 40 35 40 25Z"
      fill={isScrolled ? 'white' : '#3B82F6'}
      fillOpacity={isScrolled ? '0.2' : '0.8'}
      className="transition-all duration-700"
    />
    <path
      d="M38 30V70H62V60H48V30H38Z"
      fill={isScrolled ? 'white' : 'black'}
      className="transition-all duration-700"
    />
    <rect
      x="15"
      y="15"
      width="70"
      height="70"
      rx="15"
      stroke="white"
      strokeOpacity={isScrolled ? '0.6' : '0.2'}
      strokeWidth="2"
      className="transition-all duration-700"
    />
  </svg>
);

export const Navbar: React.FC<NavbarProps> = ({
  selectedCategory,
  userRole,
  currentUser,
  language,
  onSwitchRole,
  onOpenAuth,
  onLogout,
  onGoHome,
  onNavigate,
  onSearch,
  onLanguageChange,
  accentColor = '#6366f1',
  dbStatus = 'CONNECTING',
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const t = NAVBAR_TRANSLATIONS[language];

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) onSearch(searchQuery);
  };

  const handleMenuItemClick = (view: string) => {
    onNavigate(view);
    setIsMenuOpen(false);
  };

  const isRTL = language === 'ar';

  return (
    <header
      className="fixed top-0 left-0 right-0 z-[110] flex justify-center p-2 md:p-4 pointer-events-none safe-area-inset-top"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <nav
        className={`pointer-events-auto flex items-center gap-2 md:gap-4 px-3 md:px-4 py-2 rounded-full transition-all duration-700 ease-in-out ${
          isScrolled
            ? 'bg-black/60 backdrop-blur-3xl shadow-2xl border border-white/20 w-full max-w-5xl'
            : 'bg-white shadow-2xl border border-gray-100 w-full max-w-7xl mt-1 md:mt-2'
        }`}
      >
        {/* Logo */}
        <button
          onClick={() => onGoHome()}
          className="flex items-center gap-2 cursor-pointer group px-2 hover:opacity-80 transition-all active:scale-95 shrink-0"
        >
          <div
            className={`relative group-hover:rotate-[360deg] transition-all duration-700 drop-shadow-lg ${
              isScrolled ? 'scale-90' : 'scale-100'
            }`}
          >
            <LocadzLogo
              className="w-9 h-9 md:w-10 md:h-10"
              isScrolled={isScrolled}
              accentColor={accentColor}
            />
          </div>
          <span
            className={`font-black text-xl tracking-tighter hidden lg:block uppercase transition-all duration-700 ${
              isScrolled
                ? 'text-white'
                : 'bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-700'
            }`}
          >
            LOCADZ
          </span>
        </button>

        {/* Barre de recherche */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-lg hidden md:block px-4">
          <div className="relative group">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className={`w-full py-2.5 pl-12 pr-4 border rounded-full outline-none transition-all text-xs font-bold ${
                isScrolled
                  ? 'bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:bg-white/10'
                  : 'bg-gray-100/50 border-gray-200 text-indigo-950 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-indigo-500'
              }`}
            />
            <div
              className={`absolute ${
                isRTL ? 'right-4' : 'left-4'
              } top-1/2 -translate-y-1/2 transition-colors duration-700 ${
                isScrolled ? 'text-white/60' : 'text-indigo-600'
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </form>

        {/* ✅ BOUTONS NAVIGATION RAPIDE (pour voyageurs connectés) */}
        {currentUser && userRole === 'TRAVELER' && (
          <div className="hidden lg:flex items-center gap-2">
            {/* Bouton Explorer */}
            <button
              onClick={() => onNavigate('EXPLORE')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                isScrolled
                  ? 'text-white/70 hover:text-white hover:bg-white/10'
                  : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'
              }`}
            >
              {t.explore}
            </button>

            {/* ✅ Bouton Mon Espace (visible) */}
            <button
              onClick={() => onNavigate('PROFILE')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                isScrolled
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg'
              }`}
            >
              <span>🏠</span>
              <span className="hidden xl:inline">
                {language === 'ar' ? 'مساحتي' : language === 'en' ? 'My Space' : 'Mon Espace'}
              </span>
            </button>
          </div>
        )}

        {/* ✅ BOUTON DASHBOARD HÔTE (pour hôtes connectés) */}
        {currentUser && userRole === 'HOST' && (
          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={() => onNavigate('HOST_DASH')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                isScrolled
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
              }`}
            >
              <span>📊</span>
              <span className="hidden xl:inline">
                {language === 'ar' ? 'لوحة التحكم' : language === 'en' ? 'Dashboard' : 'Dashboard'}
              </span>
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 shrink-0">
          {/* Cloud Status Indicator */}
          <div className="relative group hidden sm:block">
            <div
              className={`w-2 h-2 rounded-full ${
                dbStatus === 'CONNECTED'
                  ? 'bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse'
                  : dbStatus === 'CONNECTING'
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-rose-500 shadow-[0_0_8px_#ef4444]'
              }`}
            ></div>
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black text-white text-[7px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-[200]">
              {dbStatus === 'CONNECTED' ? 'Cloud Sync ON' : 'Cloud Sync OFF'}
            </div>
          </div>

          {/* Menu profil */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => (currentUser ? setIsMenuOpen(!isMenuOpen) : onOpenAuth())}
              className={`flex items-center gap-2 p-1.5 pl-4 border rounded-full transition-all duration-700 active:scale-90 group relative ${
                isScrolled
                  ? 'bg-white/10 border-white/20 hover:bg-white/20'
                  : 'bg-white border-gray-200 hover:shadow-xl'
              } ${isMenuOpen ? 'shadow-lg' : ''} ${isScrolled ? 'scale-95' : 'scale-100'}`}
              style={{
                borderColor: isScrolled && isMenuOpen ? accentColor : undefined,
              }}
            >
              <div className="flex flex-col items-end mr-1 hidden lg:flex">
                <span
                  className={`text-[9px] font-black uppercase tracking-widest leading-none transition-colors duration-700 ${
                    isScrolled ? 'text-white' : 'text-indigo-950'
                  }`}
                >
                  {currentUser ? currentUser.full_name.split(' ')[0] : t.login}
                </span>
                {currentUser && (
                  <span
                    className={`text-[7px] font-black uppercase tracking-tighter transition-colors duration-700 ${
                      isScrolled ? 'text-white/40' : 'text-indigo-400'
                    }`}
                  >
                    {userRole === 'TRAVELER' ? t.traveler : t.host}
                  </span>
                )}
              </div>

              <div
                className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all duration-700 group-hover:scale-105 flex items-center justify-center relative ${
                  isScrolled ? 'bg-white/5' : 'bg-gray-50'
                }`}
                style={{
                  borderColor: isScrolled ? `${accentColor}88` : '#EEF2FF',
                  boxShadow: isScrolled ? `0 0 15px ${accentColor}33` : 'none',
                }}
              >
                {currentUser ? (
                  <img
                    src={currentUser.avatar_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg
                    className={`w-4 h-4 transition-colors duration-700 ${
                      isScrolled ? 'text-white' : 'text-gray-400'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                )}
              </div>

              <div
                className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                style={{ boxShadow: `0 0 20px ${accentColor}44` }}
              />
            </button>

            {/* Menu déroulant */}
            {isMenuOpen && currentUser && (
              <div
                className={`
                  z-[120] p-3 bg-white
                  shadow-[0_25px_80px_rgba(0,0,0,0.25)]
                  border border-white overflow-y-auto
                  animate-in zoom-in-95 duration-300 origin-top

                  fixed left-1/2 -translate-x-1/2
                  top-[calc(env(safe-area-inset-top,0px)+80px)]
                  w-[90vw] max-w-sm max-h-[calc(100vh-120px)]
                  rounded-[2rem]

                  md:absolute md:top-full md:mt-4
                  md:right-0 md:left-auto
                  md:w-72 md:max-h-none
                  md:rounded-[2.5rem] md:translate-x-0
                `}
              >
                {/* Header du menu */}
                <div
                  className="p-6 rounded-[1.8rem] text-white mb-3 transition-colors duration-1000"
                  style={{ backgroundColor: userRole === 'HOST' ? '#f59e0b' : accentColor }}
                >
                  <p className="font-black text-xl italic truncate">
                    {currentUser.full_name} ✨
                  </p>
                  <p className="text-xs text-white/70 mt-1">
                    {userRole === 'TRAVELER' ? t.traveler : t.host}
                  </p>
                </div>

                <div className="space-y-1">
                  {/* Admin */}
                  {currentUser.role === 'ADMIN' && (
                    <button
                      onClick={() => handleMenuItemClick('ADMIN')}
                      className="w-full text-left p-4 text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 rounded-2xl transition-all flex items-center gap-3 group/admin"
                    >
                      <span className="group-hover/admin:animate-pulse">⚡</span>
                      <span>{t.admin}</span>
                    </button>
                  )}

                  {/* ✅ Mon Espace (Voyageur seulement) */}
                  {userRole === 'TRAVELER' && (
                    <button
                      onClick={() => handleMenuItemClick('PROFILE')}
                      className="w-full text-left p-4 text-[10px] font-black uppercase tracking-widest text-purple-600 bg-purple-50 rounded-2xl transition-all flex items-center gap-3"
                    >
                      <span>🏠</span>
                      <span>{t.mySpace}</span>
                    </button>
                  )}

                  {/* ✅ Dashboard Hôte (Hôte seulement) */}
                  {userRole === 'HOST' && (
                    <button
                      onClick={() => handleMenuItemClick('HOST_DASH')}
                      className="w-full text-left p-4 text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 rounded-2xl transition-all flex items-center gap-3"
                    >
                      <span>📊</span>
                      <span>{t.dashboard}</span>
                    </button>
                  )}

                  {/* Mes Voyages */}
                  <button
                    onClick={() => handleMenuItemClick('BOOKINGS')}
                    className="w-full text-left p-4 text-[10px] font-black uppercase tracking-widest text-gray-700 hover:bg-indigo-50 rounded-2xl transition-all flex items-center gap-3"
                  >
                    <span>🎒</span>
                    <span>{t.myTrips}</span>
                  </button>

                  {/* Mes Favoris */}
                  <button
                    onClick={() => handleMenuItemClick('FAVORITES')}
                    className="w-full text-left p-4 text-[10px] font-black uppercase tracking-widest text-gray-700 hover:bg-indigo-50 rounded-2xl transition-all flex items-center gap-3"
                  >
                    <span>❤️</span>
                    <span>{t.myFavorites}</span>
                  </button>

                  <div className="h-[1px] bg-gray-100 my-2 mx-4" />

                  {/* À propos */}
                  <button
                    onClick={() => handleMenuItemClick('ABOUT')}
                    className="w-full text-left p-4 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all flex items-center gap-3"
                  >
                    <span>🚀</span>
                    <span>{t.about}</span>
                  </button>

                  {/* Switch mode */}
                  <button
                    onClick={() => {
                      onSwitchRole();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left p-4 text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:bg-indigo-50 rounded-2xl transition-all flex items-center gap-3"
                  >
                    <span>🔄</span>
                    <span>
                      {t.switchMode}{' '}
                      {userRole === 'TRAVELER' ? t.host : t.traveler}
                    </span>
                  </button>

                  {/* Sélecteur de langue */}
                  <div className="px-4 py-3 mt-2 border-t border-gray-50">
                    <p className="text-[8px] font-black uppercase text-gray-400 tracking-[0.2em] mb-3">
                      {t.languageLabel}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onLanguageChange('fr')}
                        className={`flex-1 py-2 rounded-xl text-[9px] font-black transition-all ${
                          language === 'fr'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        🇫🇷 FR
                      </button>
                      <button
                        onClick={() => onLanguageChange('en')}
                        className={`flex-1 py-2 rounded-xl text-[9px] font-black transition-all ${
                          language === 'en'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        🇬🇧 EN
                      </button>
                      <button
                        onClick={() => onLanguageChange('ar')}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all ${
                          language === 'ar'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        🇩🇿 AR
                      </button>
                    </div>
                  </div>

                  {/* Déconnexion */}
                  <button
                    onClick={() => {
                      onLogout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left p-4 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 rounded-2xl transition-all flex items-center gap-3"
                  >
                    <span>🚪</span>
                    <span>{t.logout}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};
