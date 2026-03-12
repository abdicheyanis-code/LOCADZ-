// App.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Categories } from './components/Categories';
import { ListingCard } from './components/ListingCard';
import { WelcomeScreen } from './components/WelcomeScreen';
import { FilterBar } from './components/FilterBar';
import { PropertyDetail } from './components/PropertyDetail';
import { AuthModal } from './components/AuthModal';
import { AuthLanding } from './components/AuthLanding';
import { AdminDashboard } from './components/AdminDashboard';
import { HostDashboard } from './components/HostDashboard';
import { TravelerDashboard } from './components/TravelerDashboard';
import { AboutUs } from './components/AboutUs';
import { ProfileSettings } from './components/ProfileSettings';
import { LegalPages } from './components/LegalPages';
import { ResetPassword } from './components/ResetPassword';
import { PaymentPage } from './components/PaymentPage';
import { CATEGORIES, CATEGORY_COLORS } from './constants';
import { Property, UserRole, UserProfile, AppLanguage } from './types';
import { authService } from './services/authService';
import { propertyService } from './services/propertyService';
import { favoriteService } from './services/favoriteService';
import { parseSmartSearch } from './services/geminiService';
import { notificationService } from './services/notificationService'; // ✅ AJOUTÉ
import { TRANSLATIONS } from './services/i18n';

type ActiveView =
  | 'EXPLORE'
  | 'BOOKINGS'
  | 'FAVORITES'
  | 'PROFILE'
  | 'ADMIN'
  | 'HOST_DASH'
  | 'ABOUT';

const App: React.FC = () => {
  const [showWelcome, setShowWelcome] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>('TRAVELER');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>('EXPLORE');
  const [language, setLanguage] = useState<AppLanguage>('fr');
  const [hasCheckedSession, setHasCheckedSession] = useState(false);
  const [dbStatus, setDbStatus] = useState<'CONNECTING' | 'CONNECTED' | 'ERROR'>('CONNECTING');
  const [unreadCount, setUnreadCount] = useState(0); // ✅ AJOUTÉ

  const [properties, setProperties] = useState<Property[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('trending');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [maxPrice, setMaxPrice] = useState(200000);
  const [minRating, setMinRating] = useState(0);

  const t = TRANSLATIONS[language];
  const location = useLocation();
  const navigate = useNavigate();

  const viewToPath = (view: ActiveView): string => {
    switch (view) {
      case 'ABOUT': return '/about';
      case 'PROFILE': return '/profile';
      case 'ADMIN': return '/admin';
      case 'HOST_DASH': return '/host';
      case 'BOOKINGS': return '/bookings';
      case 'FAVORITES': return '/favorites';
      default: return '/';
    }
  };

  const pathToView = (path: string): ActiveView => {
    switch (path) {
      case '/about': return 'ABOUT';
      case '/profile': return 'PROFILE';
      case '/admin': return 'ADMIN';
      case '/host': return 'HOST_DASH';
      case '/bookings': return 'BOOKINGS';
      case '/favorites': return 'FAVORITES';
      default: return 'EXPLORE';
    }
  };

  const refreshData = async () => {
    const session = authService.getSession();
    setIsLoading(true);
    try {
      const props = await propertyService.getAll();
      setProperties(props || []);
      setDbStatus(props && props.length > 0 ? 'CONNECTED' : 'ERROR');

      if (session) {
        const favs = await favoriteService.getUserFavoritePropertyIds(session.id);
        setFavoriteIds(favs);
      }
    } catch (e) {
      console.error('refreshData error', e);
      setDbStatus('ERROR');
      setProperties([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initApp = async () => {
      setIsLoading(true);
      try {
        const freshProfile = await authService.refreshSession();
        if (freshProfile) {
          setCurrentUser(freshProfile);
          setUserRole(freshProfile.role === 'HOST' ? 'HOST' : 'TRAVELER');
          setDbStatus('CONNECTED');
        } else {
          setCurrentUser(null);
          setUserRole('TRAVELER');
          setShowWelcome(true);
          setDbStatus('ERROR');
          await authService.logout();
        }
      } catch (e) {
        console.warn('Session refresh error', e);
        setCurrentUser(null);
        setUserRole('TRAVELER');
        setShowWelcome(true);
        setDbStatus('ERROR');
        await authService.logout();
      } finally {
        setHasCheckedSession(true);
        await refreshData();
        setIsLoading(false);
      }
    };
    initApp();
  }, []);

  // ✅ NOUVEAU : Récupère le compteur de notifications non lues
  useEffect(() => {
    if (currentUser) {
      notificationService.getUnreadCount(currentUser.id)
        .then(setUnreadCount);
    } else {
      setUnreadCount(0);
    }
  }, [currentUser]);

  // ✅ NOUVEAU : Écoute les nouvelles notifications en TEMPS RÉEL
  useEffect(() => {
    if (currentUser) {
      const unsubscribe = notificationService.subscribeToNewNotifications(
        currentUser.id,
        () => {
          notificationService.getUnreadCount(currentUser.id)
            .then(setUnreadCount);
        }
      );
      return unsubscribe;
    }
  }, [currentUser]);

  const getAmbientColor = (catId: string): string => {
    return CATEGORY_COLORS[catId]?.primary || '#6366f1';
  };

  useEffect(() => {
    if (location.pathname === '/reset-password' || location.pathname.startsWith('/payment/')) {
      return;
    }

    const viewFromPath = pathToView(location.pathname);
    if (viewFromPath === 'ADMIN' && currentUser?.role !== 'ADMIN') {
      setActiveView('EXPLORE');
      if (location.pathname !== '/') navigate('/', { replace: true });
      return;
    }
    setActiveView(viewFromPath);
  }, [location.pathname, currentUser?.role, navigate]);

  const activeCategory = useMemo(() => {
    const activeId = hoveredCategory || selectedCategory;
    return CATEGORIES.find(c => c.id === activeId) || CATEGORIES[0];
  }, [selectedCategory, hoveredCategory]);

  const ambientColor = useMemo(() => getAmbientColor(activeCategory.id), [activeCategory.id]);

  const handleNavigate = (view: ActiveView, closeWelcome: boolean = false) => {
    if (view === 'ADMIN' && currentUser?.role !== 'ADMIN') {
      setActiveView('EXPLORE');
      if (location.pathname !== '/') navigate('/', { replace: true });
      return;
    }
    setActiveView(view);
    setShowWelcome(!closeWelcome);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const targetPath = viewToPath(view);
    if (location.pathname !== targetPath) navigate(targetPath);
  };

  const toggleFavorite = async (propertyId: string) => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }
    await favoriteService.toggleFavorite(currentUser.id, propertyId);
    const favs = await favoriteService.getUserFavoritePropertyIds(currentUser.id);
    setFavoriteIds(favs);
  };

  const handleAuthSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setUserRole(user.role === 'HOST' ? 'HOST' : 'TRAVELER');
    setIsAuthOpen(false);
    refreshData();
  };

  const handleNavigateToProperty = (propertyId: string) => {
    const prop = properties.find(p => p.id === propertyId);
    if (prop) {
      setSelectedProperty(prop);
    } else {
      propertyService.getById(propertyId).then(p => {
        if (p) setSelectedProperty(p);
      });
    }
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setShowWelcome(true);
    navigate('/');
  };

  const filteredProperties = useMemo(() => {
    let result = properties;
    if (selectedCategory !== 'all' && selectedCategory !== 'trending') {
      result = result.filter(p => p.category === selectedCategory);
    }
    result = result.filter(p => p.price <= maxPrice && p.rating >= minRating);
    return result;
  }, [selectedCategory, properties, maxPrice, minRating]);

  const getTravelerInitialTab = (): 'home' | 'trips' | 'favorites' | 'profile' => {
    switch (activeView) {
      case 'BOOKINGS': return 'trips';
      case 'FAVORITES': return 'favorites';
      case 'PROFILE': return 'home';
      default: return 'home';
    }
  };

  const showTravelerDashboard = 
    currentUser && 
    userRole === 'TRAVELER' && 
    (activeView === 'PROFILE' || activeView === 'BOOKINGS' || activeView === 'FAVORITES');

  const showProfileSettings = 
    currentUser && 
    userRole === 'HOST' && 
    activeView === 'PROFILE';

  // ✅ NOUVEAU : Fonction pour marquer toutes les notifications comme lues
  const handleMarkAllNotificationsRead = async () => {
    if (currentUser) {
      await notificationService.markAllAsRead(currentUser.id);
      setUnreadCount(0);
    }
  };

  if (!hasCheckedSession) return null;

  // Reset password page
  if (location.pathname === '/reset-password') {
    return (
      <div className="min-h-screen bg-[#050505] text-white" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="fixed inset-0 -z-10 bg-[#050505]" />
        <ResetPassword language={language} translations={t} />
      </div>
    );
  }

  // Payment page
  if (location.pathname.startsWith('/payment/')) {
    return (
      <div className="min-h-screen bg-[#050505] text-white" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <PaymentPage />
      </div>
    );
  }

  // About page (public)
  if (!currentUser && activeView === 'ABOUT') {
    return (
      <div className="min-h-screen bg-[#050505] text-white" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0" style={{
            background: `radial-gradient(ellipse at 0% 0%, ${ambientColor}30, transparent 50%), linear-gradient(to bottom right, #020617, #0a0a1a, #020617)`
          }} />
        </div>
        <div className="relative z-10">
          <Navbar
            userRole={userRole}
            currentUser={null}
            language={language}
            onLanguageChange={setLanguage}
            onSearch={async q => { const m = await parseSmartSearch(q, CATEGORIES.map(c => c.id)); if (m) setSelectedCategory(m); }}
            onSwitchRole={() => {}}
            onOpenAuth={() => setIsAuthOpen(true)}
            onLogout={() => {}}
            onGoHome={() => navigate('/')}
            onNavigate={v => handleNavigate(v as ActiveView, true)}
            accentColor={ambientColor}
            dbStatus={dbStatus}
            unreadCount={0} // ✅ AJOUTÉ
            onMarkAllNotificationsRead={() => {}} // ✅ AJOUTÉ
          />
          <main className="pt-32 pb-40 px-6 md:px-20 max-w-7xl mx-auto">
            <AboutUs language={language} translations={t} />
            <LegalPages language={language} />
          </main>
        </div>
        <AuthModal language={language} isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onSuccess={handleAuthSuccess} />
      </div>
    );
  }

  // Main app
  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-x-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 transition-all duration-500" style={{
          background: `radial-gradient(ellipse at 0% 0%, ${ambientColor}30, transparent 50%), radial-gradient(ellipse at 100% 100%, ${ambientColor}20, transparent 50%), linear-gradient(to bottom right, #020617, #0a0a1a, #020617)`
        }} />
        <div className="absolute -top-20 -left-20 md:-top-32 md:-left-32 w-[70vw] md:w-[45vw] h-[70vw] md:h-[45vw] rounded-full blur-[50px] md:blur-[80px] opacity-25 md:opacity-35 transition-all duration-500" style={{
          background: `radial-gradient(circle at 30% 30%, ${ambientColor}, transparent 70%)`
        }} />
        <div className="hidden md:block absolute bottom-[-15%] right-[-10%] w-[35vw] h-[35vw] rounded-full blur-[80px] opacity-20" style={{
          background: `radial-gradient(circle at 70% 70%, ${ambientColor}, transparent 70%)`
        }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />
      </div>

      {/* App */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {!currentUser ? (
          <AuthLanding language={language} onLanguageChange={setLanguage} onOpenAuth={() => setIsAuthOpen(true)} translations={t} />
        ) : showWelcome ? (
          <WelcomeScreen
            currentUser={currentUser}
            currentRole={userRole}
            onSelectRole={role => {
              setUserRole(role);
              handleNavigate(role === 'HOST' ? 'HOST_DASH' : 'EXPLORE', true);
            }}
            onNavigate={view => handleNavigate(view as ActiveView, true)}
            language={language}
            translations={t}
          />
        ) : (
          <>
            <Navbar
              userRole={userRole}
              currentUser={currentUser}
              language={language}
              onLanguageChange={setLanguage}
              onSearch={async q => { const m = await parseSmartSearch(q, CATEGORIES.map(c => c.id)); if (m) setSelectedCategory(m); }}
              onSwitchRole={() => {
                const nr = userRole === 'TRAVELER' ? 'HOST' : 'TRAVELER';
                setUserRole(nr);
                handleNavigate(nr === 'HOST' ? 'HOST_DASH' : 'EXPLORE', true);
              }}
              onOpenAuth={() => setIsAuthOpen(true)}
              onLogout={handleLogout}
              onGoHome={() => { setShowWelcome(true); navigate('/'); }}
              onNavigate={v => handleNavigate(v as ActiveView, true)}
              accentColor={ambientColor}
              dbStatus={dbStatus}
              unreadCount={unreadCount} // ✅ AJOUTÉ
              onMarkAllNotificationsRead={handleMarkAllNotificationsRead} // ✅ AJOUTÉ
            />

            <main className="flex-1 pt-28 md:pt-32 pb-20 md:pb-40">
              {/* EXPLORE */}
              {activeView === 'EXPLORE' && (
                <div className="space-y-10 md:space-y-16">
                  <div className="px-4 md:px-20 max-w-[1600px] mx-auto">
                    <div className="flex items-center gap-4 md:gap-6 mb-2">
                      <div className="h-[2px] w-10 md:w-16 rounded-full" style={{ backgroundColor: ambientColor }} />
                      <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.5em]" style={{ color: ambientColor }}>
                        LOCADZ COLLECTION
                      </span>
                    </div>
                    <h1 className="text-4xl md:text-[8rem] font-black italic tracking-tighter leading-[0.9] uppercase">
                      <span style={{ color: ambientColor }}>{activeCategory.label}</span>
                      <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/60 to-transparent text-3xl md:text-[6rem]">
                        Signature
                      </span>
                    </h1>
                  </div>

                  <div className="sticky top-20 md:top-24 z-[100] px-2 md:px-0">
                    <div className="max-w-4xl mx-auto backdrop-blur-md md:backdrop-blur-xl border rounded-2xl md:rounded-[3rem] p-1 md:p-2 shadow-lg" style={{
                      backgroundColor: `${ambientColor}08`,
                      borderColor: `${ambientColor}20`
                    }}>
                      <Categories
                        selectedCategory={selectedCategory}
                        onSelect={setSelectedCategory}
                        onHover={setHoveredCategory}
                        accentColor={ambientColor}
                      />
                    </div>
                  </div>

                  <div className="px-4 md:px-20 max-w-[1600px] mx-auto">
                    <FilterBar
                      maxPrice={maxPrice}
                      setMaxPrice={setMaxPrice}
                      minRating={minRating}
                      setMinRating={setMinRating}
                      minReviews={0}
                      setMinReviews={() => {}}
                      onReset={() => { setMaxPrice(200000); setMinRating(0); }}
                      accentColor={ambientColor}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-x-8 md:gap-y-16 mt-8 md:mt-12">
                      {filteredProperties.length > 0 ? (
                        filteredProperties.map((p, idx) => (
                          <div
                            key={p.id}
                            onClick={() => setSelectedProperty(p)}
                            className={`cursor-pointer ${idx % 2 === 1 ? 'md:mt-12' : ''}`}
                          >
                            <ListingCard
                              property={{ ...p, isFavorite: favoriteIds.includes(p.id) }}
                              onToggleFavorite={toggleFavorite}
                              accentColor={getAmbientColor(p.category)}
                            />
                          </div>
                        ))
                      ) : (
                        <div className="col-span-full py-20 text-center">
                          <span className="text-6xl mb-4 block opacity-20">🔍</span>
                          <h3 className="text-2xl font-black uppercase" style={{ color: `${ambientColor}60` }}>
                            Aucun résultat
                          </h3>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Other views */}
              <div className="px-4 md:px-20 max-w-7xl mx-auto">
                {/* ADMIN */}
                {activeView === 'ADMIN' && currentUser && (
                  <AdminDashboard currentUser={currentUser} />
                )}

                {/* TRAVELER DASHBOARD */}
                {showTravelerDashboard && (
                  <TravelerDashboard
                    travelerId={currentUser.id}
                    travelerName={currentUser.full_name}
                    language={language}
                    onLanguageChange={setLanguage}
                    onRefresh={refreshData}
                    onNavigateToProperty={handleNavigateToProperty}
                    onLogout={handleLogout}
                    initialTab={getTravelerInitialTab()}
                  />
                )}

                {/* PROFILE SETTINGS (HOST) */}
                {showProfileSettings && (
                  <ProfileSettings
                    currentUser={currentUser}
                    language={language}
                    translations={t}
                    onLogout={handleLogout}
                    onSwitchRole={() => {}}
                  />
                )}

                {/* ABOUT */}
                {activeView === 'ABOUT' && (
                  <>
                    <AboutUs language={language} translations={t} />
                    <LegalPages language={language} />
                  </>
                )}

                {/* HOST DASHBOARD */}
                {activeView === 'HOST_DASH' && currentUser && (
                  <HostDashboard
                    hostId={currentUser.id}
                    hostName={currentUser.full_name}
                    onRefresh={refreshData}
                  />
                )}
              </div>
            </main>
          </>
        )}
      </div>

      {/* Property detail modal */}
      {selectedProperty && (
        <PropertyDetail
          property={selectedProperty}
          isOpen={!!selectedProperty}
          currentUser={currentUser}
          onClose={() => setSelectedProperty(null)}
          onBookingSuccess={refreshData}
          language={language}
          translations={t}
        />
      )}

      {/* Auth modal */}
      <AuthModal
        language={language}
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default App;
