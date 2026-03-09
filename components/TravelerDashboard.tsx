import React, { useState, useEffect, useCallback } from 'react';
import {
  Property,
  UserProfile,
  Booking,
  BookingStatus,
  Notification,
  AppLanguage,
} from '../types';
import { bookingService } from '../services/bookingService';
import { propertyService } from '../services/propertyService';
import { favoriteService } from '../services/favoriteService';
import { authService } from '../services/authService';
import { formatCurrency } from '../services/stripeService';
import { fetchMyNotifications } from '../services/notifications';
import { IdVerificationModal } from './IdVerificationModal';

interface TravelerDashboardProps {
  travelerId: string;
  travelerName: string;
  language: AppLanguage;
  onLanguageChange: (lang: AppLanguage) => void;
  onRefresh: () => void;
  onNavigateToProperty?: (propertyId: string) => void;
  onLogout: () => void;
  initialTab?: 'home' | 'trips' | 'favorites' | 'profile';
}

type TabType = 'home' | 'trips' | 'favorites' | 'profile';

// 🌍 Traductions
const DASHBOARD_TRANSLATIONS: Record<AppLanguage, any> = {
  fr: {
    greeting: 'Salut',
    level: 'Niveau',
    nextTrip: 'Prochain voyage',
    loading: 'Chargement...',
    tabs: {
      home: 'Mon Espace',
      trips: 'Mes Voyages',
      favorites: 'Favoris',
      profile: 'Mon Profil',
    },
    home: {
      nextTripIn: 'Prochain voyage dans',
      days: 'jours',
      hours: 'heures',
      minutes: 'min',
      noTrip: 'Aucun voyage prévu',
      noTripDesc: "C'est le moment de planifier ta prochaine aventure !",
      explore: 'Explorer',
      nightsSpent: 'Nuits',
      trips: 'Voyages',
      favorites: 'Favoris',
      upcoming: 'À venir',
      recentNotifs: 'Notifications',
      moreTrips: 'voyage(s) pour le niveau suivant',
      maxLevel: 'Niveau max atteint !',
    },
    trips: {
      pending: 'En attente',
      upcoming: 'À venir',
      history: 'Historique',
      noBooking: 'Aucune réservation',
      noBookingDesc: "Tu n'as pas encore réservé",
      discover: 'Découvrir',
      leaveReview: 'Avis',
      travelers: 'voyageur(s)',
    },
    favorites: {
      title: 'Mes favoris',
      empty: 'Aucun favori',
      emptyDesc: 'Explore et ajoute tes coups de cœur !',
      exploreNow: 'Explorer',
      perNight: '/nuit',
      reviews: 'avis',
    },
    profile: {
      title: 'Mon compte',
      phone: 'Téléphone',
      verifyIdentity: 'Vérifie ton identité',
      verifyDesc: 'Pour une expérience complète',
      verifyNow: 'Vérifier',
      verified: 'Identité vérifiée',
      verifiedDesc: 'Compte vérifié',
      tripsCompleted: 'Voyages',
      nightsBooked: 'Nuits',
      memberSince: 'Membre depuis',
      language: 'Langue',
      logout: 'Déconnexion',
    },
    status: {
      PENDING_APPROVAL: '⏳ En attente',
      APPROVED: '✅ Confirmée',
      PAID: '💳 Payée',
      CANCELLED: '❌ Annulée',
      REJECTED: '🚫 Refusée',
    },
    levels: {
      new: 'Nouveau',
      beginner: 'Débutant',
      explorer: 'Explorateur',
      adventurer: 'Aventurier',
      legend: 'Légende',
    },
  },
  en: {
    greeting: 'Hi',
    level: 'Level',
    nextTrip: 'Next trip',
    loading: 'Loading...',
    tabs: {
      home: 'My Space',
      trips: 'My Trips',
      favorites: 'Favorites',
      profile: 'Profile',
    },
    home: {
      nextTripIn: 'Next trip in',
      days: 'days',
      hours: 'hours',
      minutes: 'min',
      noTrip: 'No trip planned',
      noTripDesc: 'Time to plan your next adventure!',
      explore: 'Explore',
      nightsSpent: 'Nights',
      trips: 'Trips',
      favorites: 'Favorites',
      upcoming: 'Upcoming',
      recentNotifs: 'Notifications',
      moreTrips: 'trip(s) to next level',
      maxLevel: 'Max level reached!',
    },
    trips: {
      pending: 'Pending',
      upcoming: 'Upcoming',
      history: 'History',
      noBooking: 'No reservations',
      noBookingDesc: "You haven't booked yet",
      discover: 'Discover',
      leaveReview: 'Review',
      travelers: 'traveler(s)',
    },
    favorites: {
      title: 'My favorites',
      empty: 'No favorites',
      emptyDesc: 'Explore and add your favorites!',
      exploreNow: 'Explore',
      perNight: '/night',
      reviews: 'reviews',
    },
    profile: {
      title: 'My account',
      phone: 'Phone',
      verifyIdentity: 'Verify identity',
      verifyDesc: 'For a complete experience',
      verifyNow: 'Verify',
      verified: 'Verified',
      verifiedDesc: 'Account verified',
      tripsCompleted: 'Trips',
      nightsBooked: 'Nights',
      memberSince: 'Member since',
      language: 'Language',
      logout: 'Log out',
    },
    status: {
      PENDING_APPROVAL: '⏳ Pending',
      APPROVED: '✅ Confirmed',
      PAID: '💳 Paid',
      CANCELLED: '❌ Cancelled',
      REJECTED: '🚫 Rejected',
    },
    levels: {
      new: 'New',
      beginner: 'Beginner',
      explorer: 'Explorer',
      adventurer: 'Adventurer',
      legend: 'Legend',
    },
  },
  ar: {
    greeting: 'مرحباً',
    level: 'المستوى',
    nextTrip: 'الرحلة القادمة',
    loading: 'جاري التحميل...',
    tabs: {
      home: 'مساحتي',
      trips: 'رحلاتي',
      favorites: 'المفضلة',
      profile: 'حسابي',
    },
    home: {
      nextTripIn: 'الرحلة القادمة خلال',
      days: 'يوم',
      hours: 'ساعة',
      minutes: 'دقيقة',
      noTrip: 'لا توجد رحلة',
      noTripDesc: 'خطط لمغامرتك القادمة!',
      explore: 'استكشاف',
      nightsSpent: 'ليالٍ',
      trips: 'رحلات',
      favorites: 'مفضلة',
      upcoming: 'قادمة',
      recentNotifs: 'إشعارات',
      moreTrips: 'رحلة للمستوى التالي',
      maxLevel: 'أقصى مستوى!',
    },
    trips: {
      pending: 'قيد الانتظار',
      upcoming: 'القادمة',
      history: 'السجل',
      noBooking: 'لا حجوزات',
      noBookingDesc: 'لم تحجز بعد',
      discover: 'اكتشف',
      leaveReview: 'تقييم',
      travelers: 'مسافر',
    },
    favorites: {
      title: 'المفضلة',
      empty: 'لا مفضلات',
      emptyDesc: 'أضف مفضلاتك!',
      exploreNow: 'استكشف',
      perNight: '/ليلة',
      reviews: 'تقييم',
    },
    profile: {
      title: 'حسابي',
      phone: 'الهاتف',
      verifyIdentity: 'تحقق من هويتك',
      verifyDesc: 'لتجربة كاملة',
      verifyNow: 'تحقق',
      verified: 'تم التحقق',
      verifiedDesc: 'حساب مُفعّل',
      tripsCompleted: 'رحلات',
      nightsBooked: 'ليالٍ',
      memberSince: 'عضو منذ',
      language: 'اللغة',
      logout: 'خروج',
    },
    status: {
      PENDING_APPROVAL: '⏳ انتظار',
      APPROVED: '✅ مؤكدة',
      PAID: '💳 مدفوعة',
      CANCELLED: '❌ ملغاة',
      REJECTED: '🚫 مرفوضة',
    },
    levels: {
      new: 'جديد',
      beginner: 'مبتدئ',
      explorer: 'مستكشف',
      adventurer: 'مغامر',
      legend: 'أسطوري',
    },
  },
};

// 🎨 Carte propriété pour favoris
const FavoritePropertyCard: React.FC<{
  property: Property;
  onRemove: () => void;
  onView: () => void;
  t: any;
}> = ({ property, onRemove, onView, t }) => {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRemoving(true);
    await onRemove();
  };

  return (
    <div
      onClick={onView}
      className={`group relative bg-white/10 rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer active:scale-[0.98] ${
        isRemoving ? 'opacity-50 scale-95' : ''
      }`}
    >
      <div className="relative h-40 overflow-hidden">
        <img
          src={property.images[0]?.image_url || '/placeholder.jpg'}
          alt={property.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        
        <button
          onClick={handleRemove}
          className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-rose-500 active:scale-90 transition-transform"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </button>

        <div className="absolute bottom-2 left-2 bg-white/90 px-2 py-1 rounded-lg">
          <span className="font-bold text-gray-900 text-sm">{formatCurrency(property.price)}</span>
          <span className="text-gray-500 text-xs">{t.favorites.perNight}</span>
        </div>
      </div>

      <div className="p-3">
        <h3 className="font-bold text-white text-sm line-clamp-1">
          {property.title}
        </h3>
        <p className="text-white/50 text-xs mt-0.5 flex items-center gap-1">
          <span>📍</span>
          {property.location}
        </p>
        {property.rating > 0 && (
          <div className="flex items-center gap-1 mt-1.5">
            <span className="text-yellow-400 text-xs">⭐</span>
            <span className="text-white font-bold text-xs">{property.rating.toFixed(1)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// 🎯 Countdown
const CountdownTimer: React.FC<{ targetDate: string; t: any }> = ({ targetDate, t }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / (1000 * 60)) % 60),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex gap-3 md:gap-4">
      <div className="text-center">
        <div className="text-2xl md:text-4xl font-black text-white">{timeLeft.days}</div>
        <div className="text-[10px] md:text-xs text-white/60 uppercase">{t.home.days}</div>
      </div>
      <div className="text-xl md:text-2xl text-white/30 font-bold">:</div>
      <div className="text-center">
        <div className="text-2xl md:text-4xl font-black text-white">{timeLeft.hours}</div>
        <div className="text-[10px] md:text-xs text-white/60 uppercase">{t.home.hours}</div>
      </div>
      <div className="text-xl md:text-2xl text-white/30 font-bold">:</div>
      <div className="text-center">
        <div className="text-2xl md:text-4xl font-black text-white">{timeLeft.minutes}</div>
        <div className="text-[10px] md:text-xs text-white/60 uppercase">{t.home.minutes}</div>
      </div>
    </div>
  );
};

export const TravelerDashboard: React.FC<TravelerDashboardProps> = ({
  travelerId,
  travelerName,
  language,
  onLanguageChange,
  onRefresh,
  onNavigateToProperty,
  onLogout,
  initialTab = 'home',
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isVerifModalOpen, setIsVerifModalOpen] = useState(false);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [favoriteProperties, setFavoriteProperties] = useState<Property[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingFavorites, setLoadingFavorites] = useState(true);

  const t = DASHBOARD_TRANSLATIONS[language];
  const isRTL = language === 'ar';
  const isVerified = currentUser?.id_verification_status === 'VERIFIED';

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Stats
  const upcomingTrips = bookings.filter(
    (b) => new Date(b.start_date) > new Date() && (b.status === 'APPROVED' || b.status === 'PAID')
  );
  const pastTrips = bookings.filter(
    (b) => new Date(b.end_date) < new Date() && (b.status === 'APPROVED' || b.status === 'PAID')
  );
  const pendingBookings = bookings.filter((b) => b.status === 'PENDING_APPROVAL');
  const nextTrip = upcomingTrips.sort(
    (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  )[0];

  const totalNights = pastTrips.reduce((sum, b) => {
    const start = new Date(b.start_date);
    const end = new Date(b.end_date);
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return sum + nights;
  }, 0);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const userBookings = await bookingService.getUserBookings(travelerId);
      
      const enrichedBookings = await Promise.all(
        userBookings.map(async (booking) => {
          if (!booking.property_title) {
            const property = await propertyService.getById(booking.property_id);
            return { ...booking, property_title: property?.title || 'Logement' };
          }
          return booking;
        })
      );
      
      setBookings(enrichedBookings);
    } catch (e) {
      console.error('loadDashboardData error:', e);
    } finally {
      setLoading(false);
    }
  }, [travelerId]);

  const loadFavorites = useCallback(async () => {
    setLoadingFavorites(true);
    try {
      const favoriteIds = await favoriteService.getUserFavoritePropertyIds(travelerId);
      const properties = await Promise.all(
        favoriteIds.map((id) => propertyService.getById(id))
      );
      setFavoriteProperties(properties.filter((p): p is Property => p !== null));
    } catch (e) {
      console.error('loadFavorites error:', e);
    } finally {
      setLoadingFavorites(false);
    }
  }, [travelerId]);

  const loadNotifications = useCallback(async () => {
    try {
      const { data, error } = await fetchMyNotifications();
      if (!error && data) setNotifications(data);
    } catch (e) {
      console.error('loadNotifications error:', e);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const session = authService.getSession();
      if (session) setCurrentUser(session);

      await Promise.all([loadDashboardData(), loadFavorites(), loadNotifications()]);
    };
    init();
  }, [travelerId, loadDashboardData, loadFavorites, loadNotifications]);

  const handleRemoveFavorite = async (propertyId: string) => {
    await favoriteService.toggleFavorite(travelerId, propertyId);
    setFavoriteProperties((prev) => prev.filter((p) => p.id !== propertyId));
  };

  const handleViewProperty = (propertyId: string) => {
    if (onNavigateToProperty) {
      onNavigateToProperty(propertyId);
    }
  };

  // Niveaux
  const getExplorerLevel = () => {
    if (pastTrips.length >= 10) return { level: t.levels.legend, emoji: '🏆', progress: 100 };
    if (pastTrips.length >= 5) return { level: t.levels.adventurer, emoji: '🎯', progress: 75 };
    if (pastTrips.length >= 2) return { level: t.levels.explorer, emoji: '🧭', progress: 50 };
    if (pastTrips.length >= 1) return { level: t.levels.beginner, emoji: '🌱', progress: 25 };
    return { level: t.levels.new, emoji: '👋', progress: 0 };
  };

  const explorerLevel = getExplorerLevel();

  const tabs: { id: TabType; label: string; icon: string; badge?: number }[] = [
    { id: 'home', label: t.tabs.home, icon: '🏠' },
    { id: 'trips', label: t.tabs.trips, icon: '📅', badge: pendingBookings.length || undefined },
    { id: 'favorites', label: t.tabs.favorites, icon: '❤️', badge: favoriteProperties.length || undefined },
    { id: 'profile', label: t.tabs.profile, icon: '👤' },
  ];

  const statusColors: Record<BookingStatus, string> = {
    PENDING_APPROVAL: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    APPROVED: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    PAID: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    CANCELLED: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    REJECTED: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950/50 to-slate-900"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* 🔄 LOADER */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            <p className="text-white/60 text-sm">{t.loading}</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white">
                {t.greeting}, {travelerName.split(' ')[0]} ! 👋
              </h1>
              <p className="text-xs md:text-sm text-white/50 mt-0.5">
                {explorerLevel.emoji} {t.level} : <span className="text-purple-300">{explorerLevel.level}</span>
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex overflow-x-auto gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10 no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex-shrink-0 px-4 md:px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all duration-300 flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'text-white/50 active:bg-white/10'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.badge && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Contenu */}
        <div className="animate-in fade-in duration-300">
          {/* 🏠 HOME */}
          {activeTab === 'home' && (
            <div className="space-y-6">
              {/* Prochain voyage */}
              {nextTrip ? (
                <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 to-pink-600 p-6 rounded-2xl">
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">✈️</span>
                      <span className="text-white/80 font-bold text-xs uppercase">
                        {t.home.nextTripIn}
                      </span>
                    </div>
                    
                    <CountdownTimer targetDate={nextTrip.start_date} t={t} />
                    
                    <div className="mt-4 pt-4 border-t border-white/20">
                      <h3 className="text-lg font-black text-white">{nextTrip.property_title}</h3>
                      <p className="text-white/70 text-sm mt-1">
                        📅 {new Date(nextTrip.start_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                  <span className="text-4xl mb-3 block">🌴</span>
                  <h3 className="text-lg font-black text-white mb-1">{t.home.noTrip}</h3>
                  <p className="text-white/50 text-sm mb-4">{t.home.noTripDesc}</p>
                  <button className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-sm active:scale-95 transition-transform">
                    {t.home.explore}
                  </button>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-4 gap-2 md:gap-4">
                <div className="bg-white/5 border border-white/10 p-3 md:p-4 rounded-xl text-center">
                  <span className="text-xl md:text-2xl block mb-1">🌙</span>
                  <p className="text-lg md:text-2xl font-black text-white">{totalNights}</p>
                  <p className="text-[9px] md:text-xs text-white/50">{t.home.nightsSpent}</p>
                </div>
                <div className="bg-white/5 border border-white/10 p-3 md:p-4 rounded-xl text-center">
                  <span className="text-xl md:text-2xl block mb-1">🏠</span>
                  <p className="text-lg md:text-2xl font-black text-white">{pastTrips.length}</p>
                  <p className="text-[9px] md:text-xs text-white/50">{t.home.trips}</p>
                </div>
                <div className="bg-white/5 border border-white/10 p-3 md:p-4 rounded-xl text-center">
                  <span className="text-xl md:text-2xl block mb-1">❤️</span>
                  <p className="text-lg md:text-2xl font-black text-white">{favoriteProperties.length}</p>
                  <p className="text-[9px] md:text-xs text-white/50">{t.home.favorites}</p>
                </div>
                <div className="bg-white/5 border border-white/10 p-3 md:p-4 rounded-xl text-center">
                  <span className="text-xl md:text-2xl block mb-1">📅</span>
                  <p className="text-lg md:text-2xl font-black text-white">{upcomingTrips.length}</p>
                  <p className="text-[9px] md:text-xs text-white/50">{t.home.upcoming}</p>
                </div>
              </div>

              {/* Niveau */}
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{explorerLevel.emoji}</span>
                  <div>
                    <p className="font-black text-white">{explorerLevel.level}</p>
                    <p className="text-xs text-white/50">
                      {pastTrips.length < 10 ? `${10 - pastTrips.length} ${t.home.moreTrips}` : t.home.maxLevel}
                    </p>
                  </div>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                    style={{ width: `${explorerLevel.progress}%` }}
                  />
                </div>
              </div>

              {/* Notifications */}
              {notifications.length > 0 && (
                <div>
                  <h2 className="text-lg font-black text-white mb-3">🔔 {t.home.recentNotifs}</h2>
                  <div className="space-y-2">
                    {notifications.slice(0, 3).map((n) => (
                      <div key={n.id} className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-start gap-3">
                        <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center text-sm">
                          {n.type === 'booking_accepted' ? '✅' : n.type === 'booking_rejected' ? '❌' : '📬'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white text-sm truncate">{n.title}</p>
                          {n.body && <p className="text-xs text-white/50 truncate">{n.body}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 📅 TRIPS */}
          {activeTab === 'trips' && (
            <div className="space-y-6">
              {/* En attente */}
              {pendingBookings.length > 0 && (
                <div>
                  <h2 className="text-lg font-black text-white mb-3">
                    ⏳ {t.trips.pending} ({pendingBookings.length})
                  </h2>
                  <div className="space-y-3">
                    {pendingBookings.map((booking) => (
                      <div key={booking.id} className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-white">{booking.property_title}</h3>
                            <p className="text-white/60 text-xs mt-1">
                              📅 {new Date(booking.start_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${statusColors[booking.status]}`}>
                              {t.status[booking.status]}
                            </span>
                            <p className="text-white font-bold text-sm mt-1">{formatCurrency(booking.total_price)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* À venir */}
              {upcomingTrips.length > 0 && (
                <div>
                  <h2 className="text-lg font-black text-white mb-3">🎯 {t.trips.upcoming} ({upcomingTrips.length})</h2>
                  <div className="space-y-3">
                    {upcomingTrips.map((booking) => (
                      <div key={booking.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-white">{booking.property_title}</h3>
                            <p className="text-white/60 text-xs mt-1">
                              📅 {new Date(booking.start_date).toLocaleDateString()} → {new Date(booking.end_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${statusColors[booking.status]}`}>
                              {t.status[booking.status]}
                            </span>
                            <p className="text-white font-bold mt-1">{formatCurrency(booking.total_price)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Historique */}
              {pastTrips.length > 0 && (
                <div>
                  <h2 className="text-lg font-black text-white mb-3">📚 {t.trips.history} ({pastTrips.length})</h2>
                  <div className="space-y-3">
                    {pastTrips.map((booking) => (
                      <div key={booking.id} className="bg-white/5 border border-white/10 rounded-xl p-4 opacity-70">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-bold text-white text-sm">{booking.property_title}</h3>
                            <p className="text-white/50 text-xs">{new Date(booking.start_date).toLocaleDateString()}</p>
                          </div>
                          <button className="px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded-lg text-xs font-bold">
                            {t.trips.leaveReview} ⭐
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Aucune réservation */}
              {bookings.length === 0 && !loading && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                  <span className="text-4xl mb-3 block">🧳</span>
                  <h3 className="text-lg font-black text-white mb-1">{t.trips.noBooking}</h3>
                  <p className="text-white/50 text-sm mb-4">{t.trips.noBookingDesc}</p>
                  <button className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-sm">
                    {t.trips.discover}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ❤️ FAVORITES */}
          {activeTab === 'favorites' && (
            <div>
              <h2 className="text-lg font-black text-white mb-4">
                ❤️ {t.favorites.title} ({favoriteProperties.length})
              </h2>

              {loadingFavorites ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white/5 rounded-xl h-48 animate-pulse" />
                  ))}
                </div>
              ) : favoriteProperties.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                  {favoriteProperties.map((property) => (
                    <FavoritePropertyCard
                      key={property.id}
                      property={property}
                      onRemove={() => handleRemoveFavorite(property.id)}
                      onView={() => handleViewProperty(property.id)}
                      t={t}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                  <span className="text-4xl mb-3 block">💔</span>
                  <h3 className="text-lg font-black text-white mb-1">{t.favorites.empty}</h3>
                  <p className="text-white/50 text-sm mb-4">{t.favorites.emptyDesc}</p>
                  <button className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-sm">
                    {t.favorites.exploreNow}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 👤 PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Infos */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-2xl font-black text-white">
                    {travelerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white">{travelerName}</h2>
                    <p className="text-white/50 text-sm">{currentUser?.email}</p>
                  </div>
                </div>

                {currentUser?.phone_number && (
                  <div className="p-3 bg-white/5 rounded-xl">
                    <p className="text-[10px] text-white/50 uppercase">{t.profile.phone}</p>
                    <p className="text-white font-bold text-sm">{currentUser.phone_number}</p>
                  </div>
                )}
              </div>

              {/* Langue */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h3 className="font-bold text-white mb-3">{t.profile.language}</h3>
                <div className="flex gap-2">
                  {(['fr', 'en', 'ar'] as AppLanguage[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => onLanguageChange(lang)}
                      className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1 ${
                        language === lang
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                          : 'bg-white/5 text-white/50'
                      }`}
                    >
                      <span>{lang === 'fr' ? '🇫🇷' : lang === 'en' ? '🇬🇧' : '🇩🇿'}</span>
                      <span>{lang.toUpperCase()}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Vérification */}
              {!isVerified ? (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <h3 className="font-bold text-amber-100">{t.profile.verifyIdentity}</h3>
                      <p className="text-xs text-amber-200/70">{t.profile.verifyDesc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsVerifModalOpen(true)}
                    className="px-4 py-2 bg-amber-500 text-white rounded-xl font-bold text-sm"
                  >
                    {t.profile.verifyNow}
                  </button>
                </div>
              ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5 flex items-center gap-3">
                  <span className="text-2xl">✓</span>
                  <div>
                    <h3 className="font-bold text-emerald-100">{t.profile.verified}</h3>
                    <p className="text-xs text-emerald-200/70">{t.profile.verifiedDesc}</p>
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-white/5 border border-white/10 p-3 rounded-xl text-center">
                  <p className="text-lg font-black text-white">{pastTrips.length}</p>
                  <p className="text-[9px] text-white/50">{t.profile.tripsCompleted}</p>
                </div>
                <div className="bg-white/5 border border-white/10 p-3 rounded-xl text-center">
                  <p className="text-lg font-black text-white">{totalNights}</p>
                  <p className="text-[9px] text-white/50">{t.profile.nightsBooked}</p>
                </div>
                <div className="bg-white/5 border border-white/10 p-3 rounded-xl text-center">
                  <p className="text-lg font-black text-white">{favoriteProperties.length}</p>
                  <p className="text-[9px] text-white/50">{t.home.favorites}</p>
                </div>
                <div className="bg-white/5 border border-white/10 p-3 rounded-xl text-center">
                  <p className="text-lg font-black text-white">
                    {new Date(currentUser?.created_at || '').getFullYear() || '-'}
                  </p>
                  <p className="text-[9px] text-white/50">{t.profile.memberSince}</p>
                </div>
              </div>

              {/* Déconnexion */}
              <button
                onClick={onLogout}
                className="w-full py-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              >
                <span>👋</span>
                <span>{t.profile.logout}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal vérification */}
      {currentUser && (
        <IdVerificationModal
          isOpen={isVerifModalOpen}
          onClose={() => setIsVerifModalOpen(false)}
          currentUser={currentUser}
          onSuccess={(updated) => {
            setCurrentUser(updated);
            onRefresh();
          }}
        />
      )}
    </div>
  );
};
