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
import { CATEGORIES, CATEGORY_COLORS } from './constants';
import { Property, UserRole, UserProfile, AppLanguage } from './types';
import { authService } from './services/authService';
import { propertyService } from './services/propertyService';
import { favoriteService } from './services/favoriteService';
import { parseSmartSearch } from './services/geminiService';
import { TRANSLATIONS } from './services/i18n';
import { ResetPassword } from './components/ResetPassword';

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
  const [dbStatus, setDbStatus] =
    useState<'CONNECTING' | 'CONNECTED' | 'ERROR'>('CONNECTING');

  const [properties, setProperties] = useState<Property[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('trending');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  const [maxPrice, setMaxPrice] = useState(200000);
  const [minRating, setMinRating] = useState(0);

  const t = TRANSLATIONS[language];

  const location = useLocation();
  const navigate = useNavigate();

  // Mapping vue -> URL
  const viewToPath = (view: ActiveView): string => {
    switch (view) {
      case 'ABOUT':
        return '/about';
      case 'PROFILE':
        return '/profile';
      case 'ADMIN':
        return '/admin';
      case 'HOST_DASH':
        return '/host';
      case 'BOOKINGS':
        return '/bookings';
      case 'FAVORITES':
        return '/favorites';
      default:
        return '/';
    }
  };

  // Mapping URL -> vue
  const pathToView = (path: string): ActiveView => {
    switch (path) {
      case '/about':
        return 'ABOUT';
      case '/profile':
        return 'PROFILE';
      case '/admin':
        return 'ADMIN';
      case '/host':
        return 'HOST_DASH';
      case '/bookings':
        return 'BOOKINGS';
      case '/favorites':
        return 'FAVORITES';
      default:
        return 'EXPLORE';
    }
  };

  // Charger propriétés + favoris
  const refreshData = async () => {
    const session = authService.getSession();
    setIsLoading(true);
    try {
      const props = await propertyService.getAll();

      setProperties(props || []);

      if (props && props.length > 0) {
        setDbStatus('CONNECTED');
      } else {
        setDbStatus('ERROR');
      }

      if (session) {
        const favs = await favoriteService.getUserFavoritePropertyIds(
          session.id
        );
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

  // Init session + data
  useEffect(() => {
    const initApp = async () => {
      setIsLoading(true);

      try {
        const freshProfile = await authService.refreshSession();

        if (freshProfile) {
          setCurrentUser(freshProfile);
          setUserRole(freshProfile.role);
          setDbStatus('CONNECTED');
        } else {
          setCurrentUser(null);
          setUserRole('TRAVELER');
          setShowWelcome(true);
          setDbStatus('ERROR');
          await authService.logout();
        }
      } catch (e) {
        console.warn(
          'Impossible de rafraîchir la session depuis Supabase.',
          e
        );

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 🎨 Couleurs dynamiques par catégorie
  const getAmbientColor = (catId: string): string => {
    return CATEGORY_COLORS[catId]?.primary || '#6366f1';
  };

  // Synchroniser activeView avec l'URL
  useEffect(() => {
    const viewFromPath = pathToView(location.pathname);

    if (viewFromPath === 'ADMIN' && currentUser?.role !== 'ADMIN') {
      setActiveView('EXPLORE');
      if (location.pathname !== '/') {
        navigate('/', { replace: true });
      }
      return;
    }

    setActiveView(viewFromPath);
  }, [location.pathname, currentUser?.role, navigate]);

  const activeCategory = useMemo(() => {
    const activeId = hoveredCategory || selectedCategory;
    return CATEGORIES.find(c => c.id === activeId) || CATEGORIES[0];
  }, [selectedCategory, hoveredCategory]);

  const ambientColor = useMemo(
    () => getAmbientColor(activeCategory.id),
    [activeCategory.id]
  );

  const handleNavigate = (view: ActiveView, closeWelcome: boolean = false) => {
    if (view === 'ADMIN' && currentUser?.role !== 'ADMIN') {
      setActiveView('EXPLORE');
      if (location.pathname !== '/') {
        navigate('/', { replace: true });
      }
      return;
    }

    setActiveView(view);
    setShowWelcome(!closeWelcome);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const targetPath = viewToPath(view);
    if (location.pathname !== targetPath) {
      navigate(targetPath);
    }
  };

  const toggleFavorite = async (propertyId: string) => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }
    await favoriteService.toggleFavorite(currentUser.id, propertyId);
    const favs = await favoriteService.getUserFavoritePropertyIds(
      currentUser.id
    );
    setFavoriteIds(favs);
  };

  const handleAuthSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setUserRole(user.role);
    setIsAuthOpen(false);
    refreshData();
  };

  // Fonction pour naviguer vers une propriété depuis TravelerDashboard
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

  // Fonction de déconnexion
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
    result = result.filter(
      p => p.price <= maxPrice && p.rating >= minRating
    );
    return result;
  }, [selectedCategory, properties, maxPrice, minRating]);

  // Déterminer l'onglet initial du TravelerDashboard selon la vue active
  const getTravelerInitialTab = (): 'home' | 'trips' | 'favorites' | 'profile' => {
    switch (activeView) {
      case 'BOOKINGS':
        return 'trips';
      case 'FAVORITES':
        return 'favorites';
      case 'PROFILE':
        return 'home';
      default:
        return 'home';
    }
  };

  if (!hasCheckedSession) return null;

  // Page spéciale : réinitialisation de mot de passe
  if (location.pathname === '/reset-password') {
    return (
      <div
        className="min-h-screen bg-[#050505] text-white selection:bg-indigo-500 relative overflow-x-hidden"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-[#050505]" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black" />
        </div>
        <div className="relative z-10 flex flex-col min-h-screen">
          <ResetPassword language={language} translations={t} />
        </div>
      </div>
    );
  }

  // Page spéciale : /about accessible même sans être connecté
  if (!currentUser && activeView === 'ABOUT') {
    return (
      <div
        className="min-h-screen bg-[#050505] text-white selection:bg-indigo-500 relative overflow-x-hidden"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* BACKGROUND */}
        <div className="fixed inset-0 -z-10">
          <div
            className="absolute inset-0 transition-all duration-1000"
            style={{
              background: `
                radial-gradient(ellipse at 0% 0%, ${ambientColor}40, transparent 50%),
                radial-gradient(ellipse at 100% 100%, ${ambientColor}30, transparent 50%),
                radial-gradient(ellipse at 50% 50%, ${ambientColor}10, transparent 70%),
                linear-gradient(to bottom right, #020617, #0a0a1a, #020617)
              `,
            }}
          />
          <div className="absolute inset-0 bg-grain pointer-events-none opacity-[0.18]" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black" />
        </div>

        {/* APP SHELL ABOUT PUBLIC */}
        <div className="relative z-10 flex flex-col min-h-screen">
          <Navbar
            userRole={userRole}
            currentUser={null}
            language={language}
            onLanguageChange={setLanguage}
            onSearch={async q => {
              const m = await parseSmartSearch(
                q,
                CATEGORIES.map(c => c.id)
              );
              if (m) setSelectedCategory(m);
            }}
            onSwitchRole={() => {}}
            onOpenAuth={() => setIsAuthOpen(true)}
            onLogout={() => {}}
            onGoHome={() => navigate('/')}
            onNavigate={v => handleNavigate(v as ActiveView, true)}
            accentColor={ambientColor}
            dbStatus={dbStatus}
          />

          <main className="flex-1 transition-all duration-1000 pt-32 pb-40">
            <div className="px-6 md:px-20 max-w-7xl mx-auto">
              <AboutUs language={language} translations={t} />
              <LegalPages language={language} />
            </div>
          </main>
        </div>

        <AuthModal
          language={language}
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onSuccess={handleAuthSuccess}
        />
      </div>
    );
  }

  // APP PRINCIPALE
  return (
    <div
      className="min-h-screen bg-[#050505] text-white selection:bg-indigo-500 relative overflow-x-hidden"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* 🎨 BACKGROUND DYNAMIQUE SELON LA CATÉGORIE */}
      <div className="fixed inset-0 -z-10">
        {/* Gradient principal avec couleur de catégorie */}
        <div
          className="absolute inset-0 transition-all duration-1000 ease-in-out"
          style={{
            background: `
              radial-gradient(ellipse at 0% 0%, ${ambientColor}40, transparent 50%),
              radial-gradient(ellipse at 100% 100%, ${ambientColor}30, transparent 50%),
              radial-gradient(ellipse at 50% 50%, ${ambientColor}10, transparent 70%),
              linear-gradient(to bottom right, #020617, #0a0a1a, #020617)
            `,
          }}
        />

        {/* Image de fond avec flou */}
        <div className="absolute inset-0 transition-opacity duration-1000 ease-in-out mix-blend-overlay opacity-20">
          <div
            className="w-full h-full bg-cover bg-center scale-110 blur-2xl transition-all duration-1000"
            style={{
              backgroundImage: `url(${activeCategory.background_image})`,
            }}
          />
        </div>

        {/* Orbe lumineux principal (suit la couleur) */}
        <div
          className="absolute -top-40 -left-40 w-[60vw] h-[60vw] rounded-full blur-[150px] opacity-40 transition-all duration-1000"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${ambientColor}, transparent 70%)`,
          }}
        />

        {/* Orbe secondaire */}
        <div
          className="absolute bottom-[-20%] right-[-15%] w-[50vw] h-[50vw] rounded-full blur-[150px] opacity-25 transition-all duration-1000"
          style={{
            background: `radial-gradient(circle at 70% 70%, ${ambientColor}, transparent 70%)`,
          }}
        />

        {/* Orbe central subtil */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] rounded-full blur-[180px] opacity-15 transition-all duration-1000"
          style={{
            background: ambientColor,
          }}
        />

        {/* Grain texture */}
        <div className="absolute inset-0 bg-grain pointer-events-none opacity-[0.15]" />

        {/* Gradient overlay pour profondeur */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90" />
      </div>

      {/* APP SHELL */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {!currentUser ? (
          <AuthLanding
            language={language}
            onLanguageChange={setLanguage}
            onOpenAuth={() => setIsAuthOpen(true)}
            translations={t}
          />
        ) : showWelcome ? (
          <WelcomeScreen
            currentUser={currentUser}
            currentRole={userRole}
            onSelectRole={role => {
              setUserRole(role);
              handleNavigate(
                role === 'HOST' ? 'HOST_DASH' : 'EXPLORE',
                true
              );
            }}
            onNavigate={view =>
              handleNavigate(view as ActiveView, true)
            }
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
              onSearch={async q => {
                const m = await parseSmartSearch(
                  q,
                  CATEGORIES.map(c => c.id)
                );
                if (m) setSelectedCategory(m);
              }}
              onSwitchRole={() => {
                const nr =
                  userRole === 'TRAVELER' ? 'HOST' : 'TRAVELER';
                setUserRole(nr);
                handleNavigate(
                  nr === 'HOST' ? 'HOST_DASH' : 'EXPLORE',
                  true
                );
              }}
              onOpenAuth={() => setIsAuthOpen(true)}
              onLogout={handleLogout}
              onGoHome={() => {
                setShowWelcome(true);
                navigate('/');
              }}
              onNavigate={v =>
                handleNavigate(v as ActiveView, true)
              }
              accentColor={ambientColor}
              dbStatus={dbStatus}
            />

            <main className="flex-1 transition-all duration-1000 pt-32 pb-40">
              {activeView === 'EXPLORE' && (
                <div className="space-y-16 animate-in fade-in slide-in-from-bottom-20 duration-1000">
                  {/* Header avec titre de catégorie */}
                  <div className="px-6 md:px-20 max-w-[1600px] mx-auto">
                    <div className="flex flex-col gap-2 animate-in slide-in-from-left duration-[1200ms]">
                      <div className="flex items-center gap-6">
                        <div
                          className="h-[2px] w-16 rounded-full transition-all duration-700"
                          style={{ backgroundColor: ambientColor }}
                        />
                        <span
                          className="text-[10px] font-black uppercase tracking-[0.8em] transition-colors duration-700"
                          style={{ color: ambientColor }}
                        >
                          LOCADZ COLLECTION
                        </span>
                      </div>
                      <h1 className="text-5xl md:text-[8rem] font-black italic tracking-tighter leading-[0.85] uppercase select-none">
                        <span
                          className="transition-colors duration-700"
                          style={{ color: ambientColor }}
                        >
                          {activeCategory.label}
                        </span>
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/60 to-transparent">
                          Signature
                        </span>
                      </h1>
                    </div>
                  </div>

                  {/* Barre de catégories */}
                  <div className="sticky top-24 z-[100] px-4 md:px-0">
                    <div 
                      className="max-w-4xl mx-auto backdrop-blur-2xl border rounded-[3rem] p-2 shadow-[0_30px_80px_rgba(0,0,0,0.5)] transition-all duration-700"
                      style={{
                        backgroundColor: `${ambientColor}10`,
                        borderColor: `${ambientColor}30`,
                      }}
                    >
                      <Categories
                        selectedCategory={selectedCategory}
                        onSelect={setSelectedCategory}
                        onHover={setHoveredCategory}
                        accentColor={ambientColor}
                      />
                    </div>
                  </div>

                  {/* Filtres et listings */}
                  <div className="px-6 md:px-20 max-w-[1600px] mx-auto">
                    <FilterBar
                      maxPrice={maxPrice}
                      setMaxPrice={setMaxPrice}
                      minRating={minRating}
                      setMinRating={setMinRating}
                      minReviews={0}
                      setMinReviews={() => {}}
                      onReset={() => {
                        setMaxPrice(200000);
                        setMinRating(0);
                      }}
                      accentColor={ambientColor}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16 mt-12">
                      {filteredProperties.length > 0 ? (
                        filteredProperties.map((p, idx) => (
                          <div
                            key={p.id}
                            onClick={() => setSelectedProperty(p)}
                            className={`animate-in fade-in zoom-in-95 duration-700 ${
                              idx % 2 === 1 ? 'md:mt-16' : ''
                            }`}
                            style={{
                              animationDelay: `${idx * 100}ms`,
                            }}
                          >
                            <ListingCard
                              property={{
                                ...p,
                                isFavorite: favoriteIds.includes(p.id),
                              }}
                              onToggleFavorite={toggleFavorite}
                              accentColor={getAmbientColor(p.category)}
                            />
                          </div>
                        ))
                      ) : (
                        <div className="col-span-full py-40 text-center flex flex-col items-center animate-in fade-in">
                          <span className="text-8xl mb-6 opacity-20">🔍</span>
                          <h3 
                            className="text-3xl font-black italic tracking-tighter uppercase"
                            style={{ color: `${ambientColor}60` }}
                          >
                            Aucun Trésor Trouvé
                          </h3>
                          <p className="text-white/40 mt-2 text-sm">
                            Essayez une autre catégorie ou modifiez les filtres
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="px-6 md:px-20 max-w-7xl mx-auto">
                {activeView === 'ADMIN' && currentUser && (
                  <AdminDashboard currentUser={currentUser} />
                )}

                {/* VOYAGEUR : PROFILE, BOOKINGS, FAVORITES → TravelerDashboard */}
                {(activeView === 'PROFILE' || activeView === 'BOOKINGS' || activeView === 'FAVORITES') && 
                  currentUser && 
                  userRole === 'TRAVELER' && (
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

                {/* HÔTE : PROFILE → ProfileSettings */}
                {activeView === 'PROFILE' && currentUser && userRole === 'HOST' && (
                  <ProfileSettings
                    currentUser={currentUser}
                    language={language}
                    translations={t}
                    onLogout={handleLogout}
                    onSwitchRole={() => {}}
                  />
                )}

                {activeView === 'ABOUT' && (
                  <>
                    <AboutUs language={language} translations={t} />
                    <LegalPages language={language} />
                  </>
                )}

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
