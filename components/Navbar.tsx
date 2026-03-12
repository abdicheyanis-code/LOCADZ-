// components/Navbar.tsx

import React, { useState, useEffect, useRef } from 'react';
import { UserRole, UserProfile, AppLanguage } from '../types';
import { NotificationBell } from './NotificationBell'; // ✅ NOUVEAU : Import du composant cloche

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
  unreadCount?: number; // ✅ NOUVEAU : Nombre de notifications non lues
  onMarkAllNotificationsRead?: () => void; // ✅ NOUVEAU : Callback pour marquer tout comme lu
}

const NAVBAR_TRANSLATIONS: Record<AppLanguage, any> = {
  fr: {
    traveler: 'Voyageur',
    host: 'Hôte',
    login: 'Connexion',
    searchPlaceholder: 'Où voulez-vous aller ?',
    explore: 'Explorer',
    mySpace: 'Mon Espace',
    dashboard: 'Dashboard',
    admin: 'Admin',
    logout: 'Déconnexion',
    switchRole: 'Changer de mode',
    profile: 'Mon Profil',
    profileDesc: 'Gérer mon compte',
  },
  en: {
    traveler: 'Traveler',
    host: 'Host',
    login: 'Login',
    searchPlaceholder: 'Where do you want to go?',
    explore: 'Explore',
    mySpace: 'My Space',
    dashboard: 'Dashboard',
    admin: 'Admin',
    logout: 'Log out',
    switchRole: 'Switch mode',
    profile: 'My Profile',
    profileDesc: 'Manage my account',
  },
  ar: {
    traveler: 'مسافر',
    host: 'مضيف',
    login: 'دخول',
    searchPlaceholder: 'إلى أين تريد الذهاب؟',
    explore: 'استكشاف',
    mySpace: 'مساحتي',
    dashboard: 'لوحة التحكم',
    admin: 'الإدارة',
    logout: 'خروج',
    switchRole: 'تغيير الوضع',
    profile: 'ملفي الشخصي',
    profileDesc: 'إدارة حسابي',
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
  unreadCount = 0, // ✅ NOUVEAU
  onMarkAllNotificationsRead, // ✅ NOUVEAU
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const t = NAVBAR_TRANSLATIONS[language];
  const isRTL = language === 'ar';

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

  const handleSwitchRole = () => {
    onSwitchRole();
    setIsMenuOpen(false);
  };

  const handleGoToProfile = () => {
    if (userRole === 'TRAVELER') {
      onNavigate('PROFILE');
    } else {
      onNavigate('HOST_DASH');
    }
    setIsMenuOpen(false);
  };

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
              className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 transition-colors duration-700 ${
                isScrolled ? 'text-white/60' : 'text-indigo-600'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </form>

        {/* Boutons navigation rapide */}
        {currentUser && (
          <div className="hidden lg:flex items-center gap-2">
            {/* Bouton Explorer */}
            <button
              onClick={() => onNavigate('EXPLORE')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                isScrolled
                  ? 'text-white/70 hover:text-white hover:bg-white/10'
                  : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'
              }`}
            >
              <span>🌍</span>
              <span>{t.explore}</span>
            </button>

            {/* Bouton Mon Espace (Voyageur) ou Dashboard (Hôte) */}
            {userRole === 'TRAVELER' ? (
              <button
                onClick={() => onNavigate('PROFILE')}
                className="px-4 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl hover:scale-105"
              >
                <span>🏠</span>
                <span>{t.mySpace}</span>
              </button>
            ) : (
              <button
                onClick={() => onNavigate('HOST_DASH')}
                className="px-4 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg hover:shadow-xl hover:scale-105"
              >
                <span>📊</span>
                <span>{t.dashboard}</span>
              </button>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 shrink-0">
          {/* Cloud Status */}
          <div className="relative group hidden sm:block">
            <div
              className={`w-2 h-2 rounded-full ${
                dbStatus === 'CONNECTED'
                  ? 'bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse'
                  : dbStatus === 'CONNECTING'
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-rose-500 shadow-[0_0_8px_#ef4444]'
              }`}
            />
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black text-white text-[7px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-[200]">
              {dbStatus === 'CONNECTED' ? 'Cloud Sync ON' : 'Cloud Sync OFF'}
            </div>
          </div>

          {/* ✅ NOUVEAU : CLOCHE NOTIFICATIONS */}
          {currentUser && onMarkAllNotificationsRead && (
            <NotificationBell
              userId={currentUser.id}
              unreadCount={unreadCount}
              onMarkAllRead={onMarkAllNotificationsRead}
              isScrolled={isScrolled}
            />
          )}

          {/* Menu profil */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => (currentUser ? setIsMenuOpen(!isMenuOpen) : onOpenAuth())}
              className={`flex items-center gap-2 p-1.5 pl-4 border rounded-full transition-all duration-500 active:scale-90 group relative ${
                isScrolled
                  ? 'bg-white/10 border-white/20 hover:bg-white/20'
                  : 'bg-white border-gray-200 hover:shadow-xl'
              } ${isMenuOpen ? 'shadow-lg ring-2 ring-offset-2' : ''}`}
              style={{
                ringColor: isMenuOpen ? accentColor : undefined,
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
                      isScrolled ? 'text-white/40' : userRole === 'HOST' ? 'text-amber-500' : 'text-purple-500'
                    }`}
                  >
                    {userRole === 'TRAVELER' ? t.traveler : t.host}
                  </span>
                )}
              </div>

              <div
                className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all duration-500 group-hover:scale-110 flex items-center justify-center relative ${
                  isScrolled ? 'bg-white/5' : 'bg-gray-50'
                }`}
                style={{
                  borderColor: userRole === 'HOST' ? '#f59e0b' : '#a855f7',
                }}
              >
                {currentUser ? (
                  <img src={currentUser.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <svg
                    className={`w-4 h-4 transition-colors duration-700 ${isScrolled ? 'text-white' : 'text-gray-400'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </div>

              <svg
                className={`w-3 h-3 transition-transform duration-300 hidden md:block ${
                  isScrolled ? 'text-white/60' : 'text-gray-400'
                } ${isMenuOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Menu déroulant */}
            {isMenuOpen && currentUser && (
              <div
                className={`
                  z-[120] bg-white/95 backdrop-blur-xl
                  shadow-[0_30px_100px_rgba(0,0,0,0.3)]
                  border border-white/50 overflow-hidden
                  animate-in zoom-in-95 fade-in duration-300 origin-top-right

                  fixed left-1/2 -translate-x-1/2
                  top-[calc(env(safe-area-inset-top,0px)+80px)]
                  w-[85vw] max-w-xs
                  rounded-[2rem]

                  md:absolute md:top-full md:mt-3
                  md:right-0 md:left-auto md:translate-x-0
                  md:w-80
                `}
              >
                {/* Header avec avatar et nom */}
                <div className="relative overflow-hidden">
                  <div 
                    className="absolute inset-0 opacity-20"
                    style={{
                      background: userRole === 'HOST' 
                        ? 'linear-gradient(135deg, #f59e0b, #ea580c)' 
                        : 'linear-gradient(135deg, #a855f7, #ec4899)'
                    }}
                  />
                  <div className="relative p-6 flex items-center gap-4">
                    <div 
                      className="w-14 h-14 rounded-2xl overflow-hidden border-3 shadow-xl"
                      style={{ borderColor: userRole === 'HOST' ? '#f59e0b' : '#a855f7' }}
                    >
                      <img src={currentUser.avatar_url} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-gray-900 text-lg truncate">
                        {currentUser.full_name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  {/* Bouton Profil */}
                  <button
                    onClick={handleGoToProfile}
                    className={`w-full p-4 rounded-2xl font-bold text-sm flex items-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98] ${
                      userRole === 'TRAVELER'
                        ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border border-purple-200'
                        : 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-200'
                    }`}
                  >
                    <div 
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-lg ${
                        userRole === 'TRAVELER'
                          ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                          : 'bg-gradient-to-br from-amber-400 to-orange-500'
                      }`}
                    >
                      {userRole === 'TRAVELER' ? '👤' : '📊'}
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`font-black ${
                        userRole === 'TRAVELER' ? 'text-purple-900' : 'text-amber-900'
                      }`}>
                        {t.profile}
                      </p>
                      <p className={`text-xs ${
                        userRole === 'TRAVELER' ? 'text-purple-600/70' : 'text-amber-600/70'
                      }`}>
                        {t.profileDesc}
                      </p>
                    </div>
                    <div className={`${
                      userRole === 'TRAVELER' ? 'text-purple-400' : 'text-amber-400'
                    }`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>

                  {/* Switch Voyageur/Hôte */}
                  <div className="bg-gray-100 rounded-2xl p-1.5">
                    <div className="relative flex">
                      <div
                        className={`absolute top-0 bottom-0 w-1/2 rounded-xl transition-all duration-500 ease-out shadow-lg ${
                          userRole === 'TRAVELER'
                            ? 'left-0 bg-gradient-to-r from-purple-600 to-pink-600'
                            : 'left-1/2 bg-gradient-to-r from-amber-500 to-orange-500'
                        }`}
                      />

                      <button
                        onClick={userRole !== 'TRAVELER' ? handleSwitchRole : undefined}
                        className={`relative flex-1 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                          userRole === 'TRAVELER'
                            ? 'text-white'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <span className="text-lg">🎒</span>
                        <span>{t.traveler}</span>
                      </button>

                      <button
                        onClick={userRole !== 'HOST' ? handleSwitchRole : undefined}
                        className={`relative flex-1 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                          userRole === 'HOST'
                            ? 'text-white'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <span className="text-lg">🏠</span>
                        <span>{t.host}</span>
                      </button>
                    </div>
                  </div>

                  {/* Admin */}
                  {currentUser.role === 'ADMIN' && (
                    <button
                      onClick={() => {
                        onNavigate('ADMIN');
                        setIsMenuOpen(false);
                      }}
                      className="w-full p-4 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                    >
                      <span className="text-lg">⚡</span>
                      <span>{t.admin} Dashboard</span>
                    </button>
                  )}

                  <div className="h-px bg-gray-200" />

                  {/* Sélecteur de langue */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => onLanguageChange('fr')}
                      className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1.5 ${
                        language === 'fr'
                          ? 'bg-gray-900 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <span>🇫🇷</span>
                      <span>FR</span>
                    </button>
                    <button
                      onClick={() => onLanguageChange('en')}
                      className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1.5 ${
                        language === 'en'
                          ? 'bg-gray-900 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <span>🇬🇧</span>
                      <span>EN</span>
                    </button>
                    <button
                      onClick={() => onLanguageChange('ar')}
                      className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1.5 ${
                        language === 'ar'
                          ? 'bg-gray-900 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <span>🇩🇿</span>
                      <span>AR</span>
                    </button>
                  </div>

                  {/* Déconnexion */}
                  <button
                    onClick={() => {
                      onLogout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full p-4 bg-rose-50 hover:bg-rose-100 rounded-2xl text-rose-600 font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                  >
                    <span>👋</span>
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
