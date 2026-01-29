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
      <div className="relative z-10 flex flex-col 
