import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Categories } from './components/Categories';
import { ListingCard } from './components/ListingCard';
import { GeminiAssistant } from './components/GeminiAssistant';
import { WelcomeScreen } from './components/WelcomeScreen';
import { FilterBar } from './components/FilterBar';
import { PropertyDetail } from './components/PropertyDetail';
import { AuthModal } from './components/AuthModal';
import { AuthLanding } from './components/AuthLanding';
import { AdminDashboard } from './components/AdminDashboard';
import { HostDashboard } from './components/HostDashboard';
import { AboutUs } from './components/AboutUs';
import { ProfileSettings } from './components/ProfileSettings';
import { LegalPages } from './components/LegalPages';
import { CATEGORIES, INITIAL_PROPERTIES } from './constants';
import { Property, UserRole, UserProfile, AppLanguage } from './types';
import { authService } from './services/authService';
import { propertyService } from './services/propertyService';
import { favoriteService } from './services/favoriteService';
import { bookingService } from './services/bookingService';
import { parseSmartSearch } from './services/geminiService';
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

      if (props && props.length > 0) {
        setProperties(props);
        setDbStatus('CONNECTED');
      } else {
        setProperties(INITIAL_PROPERTIES as any);
        setDbStatus('ERROR');
      }

      if (session) {
        const favs = await favoriteService.getUserFavoritePropertyIds(
          session.id
        );
        setFavoriteIds(favs);
      }
    } catch (e) {
      setDbStatus('ERROR');
      setProperties(INITIAL_PROPERTIES as any);
    } finally {
      setIsLoading(false);
    }
  };

  // Init session + data
  useEffect(() => {
    const initApp = async () => {
      setIsLoading(true);

      try {
        // On essaye d'abord de rafraîchir la session directement depuis Supabase
        const freshProfile = await authService.refreshSession();

        if (freshProfile) {
          // L'utilisateur est encore connecté côté Supabase
          setCurrentUser(freshProfile);
          setUserRole(freshProfile.role);
          setDbStatus('CONNECTED');
        } else {
          // Pas de session Supabase → on considère l'utilisateur déconnecté
          setCurrentUser(null);
          setUserRole('TRAVELER');
          setShowWelcome(true);
          setDbStatus('ERROR');
          await authService.logout();
        }
      } catch (e) {
        console.warn('Impossible de rafraîchir la session depuis Supabase.', e);

        // Backend KO → on ne fait plus confiance au cache local
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

  const getAmbientColor = (catId: string) => {
    switch (catId) {
      case 'trending':
        return '#ef4444';
      case 'beachfront':
        return '#06b6d4';
      case 'cabins':
        return '#10b981';
      case 'sahara':
        return '#f59e0b';
      default:
        return '#6366f1';
    }
  };

  // Synchroniser activeView avec l’URL
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

  if (!hasCheckedSession) return null;

  return (
    <div
      className="min-h-screen bg-[#050505] text-white selection:bg-indigo-500 relative overflow-x-hidden"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* BACKGROUND */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#050505]" />

        <div className="absolute inset-0 transition-opacity duration-[3000ms] ease-in-out">
          {activeCategory.background_video ? (
            <video
              key={activeCategory.background_video}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover scale-110 blur-[4px] opacity-[0.15]"
            >
              <source
                src={activeCategory.background_video}
                type="video/mp4"
              />
            </video>
          ) : (
            <div
              className="w-full h-full bg-cover bg-center scale-110 blur-[4px] opacity-[0.15] transition-all duration-[3000ms]"
              style={{
                backgroundImage: `url(${activeCategory.background_image})`,
              }}
            />
          )}
        </div>

        <div
          className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] rounded-full blur-[180px] opacity-[0.12] animate-drift transition-colors duration-[4000ms]"
          style={{ background: `radial-gradient(circle, ${ambientColor}, transparent)` }}
        />

        <div className="absolute inset-0 bg-grain pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black" />
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
              onLogout={() => {
                authService.logout();
                setCurrentUser(null);
                setShowWelcome(true);
                navigate('/');
              }}
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
                  <div className="px-6 md:px-20 max-w-[1600px] mx-auto">
                    <div className="flex flex-col gap-2 animate-in slide-in-from-left duration-[1200ms]">
                      <div className="flex items-center gap-6">
                        <div
                          className="h-[1px] w-16 opacity-30"
                          style={{ backgroundColor: ambientColor }}
                        ></div>
                        <span
                          className="text-[10px] font-black uppercase tracking-[0.8em] transition-colors duration-1000"
                          style={{ color: ambientColor }}
                        >
                          LOCADZ DZ COLLECTION
                        </span>
                      </div>
                      <h1 className="text-6xl md:text-[10rem] font-black italic tracking-tighter leading-[0.8] uppercase select-none">
                        {activeCategory.label}
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/40 to-transparent">
                          Signature
                        </span>
                      </h1>
                    </div>
                  </div>

                  <div className="sticky top-28 z-[100] px-4 md:px-0">
                    <div className="max-w-4xl mx-auto bg-black/30 backdrop-blur-3xl border border-white/10 rounded-[4rem] p-2 shadow-[0_40px_100px_rgba(0,0,0,0.5)]">
                      <Categories
                        selectedCategory={selectedCategory}
                        onSelect={setSelectedCategory}
                        onHover={setHoveredCategory}
                        accentColor={ambientColor}
                      />
                    </div>
                  </div>

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

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-12 gap-y-20 mt-12">
                      {filteredProperties.length > 0 ? (
                        filteredProperties.map((p, idx) => (
                          <div
                            key={p.id}
                            onClick={() => setSelectedProperty(p)}
                            className={`animate-in fade-in zoom-in-95 duration-1000 ${
                              idx % 2 === 1 ? 'md:mt-24' : ''
                            }`}
                            style={{
                              animationDelay: `${idx * 150}ms`,
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
                        <div className="col-span-full py-60 text-center flex flex-col items-center animate-in fade-in">
                          <span className="text-9xl mb-8 opacity-10">
                            🏜️
                          </span>
                          <h3 className="text-4xl font-black italic tracking-tighter uppercase opacity-30">
                            Aucun Trésor Trouvé
                          </h3>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="px-6 md:px-20 max-w-7xl mx-auto">
                {activeView === 'ADMIN' && <AdminDashboard />}

                {activeView === 'PROFILE' && currentUser && (
                  <ProfileSettings
                    currentUser={currentUser}
                    language={language}
                    translations={t}
                    onLogout={() => {
                      authService.logout();
                      setCurrentUser(null);
                      setShowWelcome(true);
                      navigate('/');
                    }}
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

      <GeminiAssistant currentProperty={selectedProperty} />
    </div>
  );
};

export default App;
