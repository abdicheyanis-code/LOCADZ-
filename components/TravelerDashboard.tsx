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

// 🌍 Traductions complètes
const DASHBOARD_TRANSLATIONS: Record<AppLanguage, any> = {
  fr: {
    greeting: 'Salut',
    level: 'Niveau',
    nextTrip: 'Prochain voyage',
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
      explore: 'Explorer les logements',
      nightsSpent: 'Nuits passées',
      trips: 'Voyages',
      favorites: 'Favoris',
      upcoming: 'À venir',
      recentNotifs: 'Notifications récentes',
      moreTrips: 'voyage(s) pour le niveau suivant',
      maxLevel: 'Niveau maximum atteint !',
    },
    trips: {
      pending: 'En attente de confirmation',
      upcoming: 'Voyages à venir',
      history: 'Historique',
      noBooking: 'Aucune réservation',
      noBookingDesc: "Tu n'as pas encore réservé de logement",
      discover: 'Découvrir les logements',
      leaveReview: 'Laisser un avis',
      travelers: 'voyageur(s)',
    },
    favorites: {
      title: 'Mes coups de cœur',
      empty: 'Aucun favori',
      emptyDesc: 'Explore les logements et ajoute tes coups de cœur !',
      exploreNow: 'Explorer maintenant',
      perNight: '/nuit',
      reviews: 'avis',
    },
    profile: {
      title: 'Paramètres du compte',
      phone: 'Téléphone',
      verifyIdentity: 'Vérifie ton identité',
      verifyDesc: 'Pour une expérience complète et sécurisée',
      verifyNow: 'Vérifier maintenant',
      verified: 'Identité vérifiée',
      verifiedDesc: 'Ton compte est entièrement vérifié',
      tripsCompleted: 'Voyages effectués',
      nightsBooked: 'Nuits réservées',
      memberSince: 'Membre depuis',
      language: 'Langue',
      logout: 'Se déconnecter',
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
      adventurer: 'Aventurier Pro',
      legend: 'Nomade Légendaire',
    },
  },
  en: {
    greeting: 'Hi',
    level: 'Level',
    nextTrip: 'Next trip',
    tabs: {
      home: 'My Space',
      trips: 'My Trips',
      favorites: 'Favorites',
      profile: 'My Profile',
    },
    home: {
      nextTripIn: 'Next trip in',
      days: 'days',
      hours: 'hours',
      minutes: 'min',
      noTrip: 'No trip planned',
      noTripDesc: "It's time to plan your next adventure!",
      explore: 'Explore listings',
      nightsSpent: 'Nights spent',
      trips: 'Trips',
      favorites: 'Favorites',
      upcoming: 'Upcoming',
      recentNotifs: 'Recent notifications',
      moreTrips: 'trip(s) to next level',
      maxLevel: 'Maximum level reached!',
    },
    trips: {
      pending: 'Pending confirmation',
      upcoming: 'Upcoming trips',
      history: 'History',
      noBooking: 'No reservations',
      noBookingDesc: "You haven't booked a place yet",
      discover: 'Discover listings',
      leaveReview: 'Leave a review',
      travelers: 'traveler(s)',
    },
    favorites: {
      title: 'My favorites',
      empty: 'No favorites',
      emptyDesc: 'Explore listings and add your favorites!',
      exploreNow: 'Explore now',
      perNight: '/night',
      reviews: 'reviews',
    },
    profile: {
      title: 'Account settings',
      phone: 'Phone',
      verifyIdentity: 'Verify your identity',
      verifyDesc: 'For a complete and secure experience',
      verifyNow: 'Verify now',
      verified: 'Identity verified',
      verifiedDesc: 'Your account is fully verified',
      tripsCompleted: 'Trips completed',
      nightsBooked: 'Nights booked',
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
      adventurer: 'Pro Adventurer',
      legend: 'Legendary Nomad',
    },
  },
  ar: {
    greeting: 'مرحباً',
    level: 'المستوى',
    nextTrip: 'الرحلة القادمة',
    tabs: {
      home: 'مساحتي',
      trips: 'رحلاتي',
      favorites: 'المفضلة',
      profile: 'ملفي الشخصي',
    },
    home: {
      nextTripIn: 'الرحلة القادمة خلال',
      days: 'يوم',
      hours: 'ساعة',
      minutes: 'دقيقة',
      noTrip: 'لا توجد رحلة مخططة',
      noTripDesc: 'حان الوقت للتخطيط لمغامرتك القادمة!',
      explore: 'استكشاف الأماكن',
      nightsSpent: 'ليالٍ قضيتها',
      trips: 'رحلات',
      favorites: 'المفضلة',
      upcoming: 'القادمة',
      recentNotifs: 'الإشعارات الأخيرة',
      moreTrips: 'رحلة للمستوى التالي',
      maxLevel: 'وصلت للمستوى الأقصى!',
    },
    trips: {
      pending: 'في انتظار التأكيد',
      upcoming: 'الرحلات القادمة',
      history: 'السجل',
      noBooking: 'لا توجد حجوزات',
      noBookingDesc: 'لم تحجز أي مكان بعد',
      discover: 'اكتشف الأماكن',
      leaveReview: 'اترك تقييماً',
      travelers: 'مسافر(ين)',
    },
    favorites: {
      title: 'المفضلة لدي',
      empty: 'لا توجد مفضلات',
      emptyDesc: 'استكشف الأماكن وأضف مفضلاتك!',
      exploreNow: 'استكشف الآن',
      perNight: '/ليلة',
      reviews: 'تقييم',
    },
    profile: {
      title: 'إعدادات الحساب',
      phone: 'الهاتف',
      verifyIdentity: 'تحقق من هويتك',
      verifyDesc: 'لتجربة كاملة وآمنة',
      verifyNow: 'تحقق الآن',
      verified: 'تم التحقق من الهوية',
      verifiedDesc: 'حسابك مُفعّل بالكامل',
      tripsCompleted: 'رحلات مكتملة',
      nightsBooked: 'ليالٍ محجوزة',
      memberSince: 'عضو منذ',
      language: 'اللغة',
      logout: 'تسجيل الخروج',
    },
    status: {
      PENDING_APPROVAL: '⏳ قيد الانتظار',
      APPROVED: '✅ مؤكدة',
      PAID: '💳 مدفوعة',
      CANCELLED: '❌ ملغاة',
      REJECTED: '🚫 مرفوضة',
    },
    levels: {
      new: 'جديد',
      beginner: 'مبتدئ',
      explorer: 'مستكشف',
      adventurer: 'مغامر محترف',
      legend: 'رحّالة أسطوري',
    },
  },
};

// 🎨 Mini carte propriété pour les favoris
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
      className={`group relative bg-white/10 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/10 hover:border-white/30 transition-all duration-500 cursor-pointer hover:scale-[1.02] hover:shadow-2xl ${
        isRemoving ? 'opacity-50 scale-95' : ''
      }`}
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={property.images[0]?.image_url || '/placeholder.jpg'}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        <button
          onClick={handleRemove}
          className="absolute top-3 right-3 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center text-rose-500 hover:scale-110 transition-all shadow-lg"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </button>

        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full">
          <span className="font-black text-gray-900">{formatCurrency(property.price)}</span>
          <span className="text-gray-500 text-sm">{t.favorites.perNight}</span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-white text-lg line-clamp-1 group-hover:text-indigo-300 transition-colors">
          {property.title}
        </h3>
        <p className="text-white/60 text-sm mt-1 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {property.location}
        </p>
        {property.rating > 0 && (
          <div className="flex items-center gap-1 mt-2">
            <span className="text-yellow-400">⭐</span>
            <span className="text-white font-bold">{property.rating.toFixed(1)}</span>
            <span className="text-white/40 text-sm">({property.reviews_count} {t.favorites.reviews})</span>
          </div>
        )}
      </div>
    </div>
  );
};

// 🎯 Countdown component
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
    <div className="flex gap-4">
      <div className="text-center">
        <div className="text-4xl font-black text-white">{timeLeft.days}</div>
        <div className="text-xs text-white/60 uppercase tracking-wider">{t.home.days}</div>
      </div>
      <div className="text-2xl text-white/40 font-bold">:</div>
      <div className="text-center">
        <div className="text-4xl font-black text-white">{timeLeft.hours}</div>
        <div className="text-xs text-white/60 uppercase tracking-wider">{t.home.hours}</div>
      </div>
      <div className="text-2xl text-white/40 font-bold">:</div>
      <div className="text-center">
        <div className="text-4xl font-black text-white">{timeLeft.minutes}</div>
        <div className="text-xs text-white/60 uppercase tracking-wider">{t.home.minutes}</div>
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

  // Mettre à jour l'onglet si initialTab change
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Stats calculées
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

  // Niveaux explorateur
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
      className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                {t.greeting}, {travelerName.split(' ')[0]} ! 👋
              </h1>
              <p className="text-sm text-white/60 mt-1">
                {explorerLevel.emoji} {t.level} : <span className="font-bold text-purple-300">{explorerLevel.level}</span>
              </p>
            </div>
            {nextTrip && (
              <div className="hidden md:block text-right">
                <p className="text-xs text-white/60 uppercase tracking-wider mb-1">{t.nextTrip}</p>
                <p className="text-lg font-bold text-white">{nextTrip.property_title}</p>
              </div>
            )}
          </div>

          {/* Tabs Navigation */}
          <div className="flex overflow-x-auto gap-2 bg-white/5 p-2 rounded-3xl border border-white/10 scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex-shrink-0 px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300 flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="hidden md:inline">{tab.label}</span>
                {tab.badge && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full text-xs font-bold flex items-center justify-center text-white">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Contenu des onglets */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* 🏠 MON ESPACE */}
          {activeTab === 'home' && (
            <div className="space-y-8">
              {/* Prochain voyage avec countdown */}
              {nextTrip ? (
                <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 p-8 rounded-[2rem] shadow-2xl">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl">✈️</span>
                      <span className="text-white/80 font-bold uppercase tracking-wider text-sm">
                        {t.home.nextTripIn}
                      </span>
                    </div>
                    
                    <CountdownTimer targetDate={nextTrip.start_date} t={t} />
                    
                    <div className="mt-6 pt-6 border-t border-white/20">
                      <h3 className="text-2xl font-black text-white">{nextTrip.property_title}</h3>
                      <p className="text-white/80 mt-1">
                        📅 {new Date(nextTrip.start_date).toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-FR', { day: 'numeric', month: 'long' })}
                        {' → '}
                        {new Date(nextTrip.end_date).toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-FR', { day: 'numeric', month: 'long' })}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white/5 border border-white/10 rounded-[2rem] p-12 text-center">
                  <span className="text-6xl mb-4 block">🌴</span>
                  <h3 className="text-2xl font-black text-white mb-2">{t.home.noTrip}</h3>
                  <p className="text-white/60 mb-6">{t.home.noTripDesc}</p>
                  <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold hover:scale-105 transition-all">
                    {t.home.explore}
                  </button>
                </div>
              )}

              {/* Stats fun */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-6 rounded-3xl text-center">
                  <span className="text-4xl mb-2 block">🌙</span>
                  <p className="text-3xl font-black text-white">{totalNights}</p>
                  <p className="text-xs text-white/60 uppercase tracking-wider">{t.home.nightsSpent}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-6 rounded-3xl text-center">
                  <span className="text-4xl mb-2 block">🏠</span>
                  <p className="text-3xl font-black text-white">{pastTrips.length}</p>
                  <p className="text-xs text-white/60 uppercase tracking-wider">{t.home.trips}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-6 rounded-3xl text-center">
                  <span className="text-4xl mb-2 block">❤️</span>
                  <p className="text-3xl font-black text-white">{favoriteProperties.length}</p>
                  <p className="text-xs text-white/60 uppercase tracking-wider">{t.home.favorites}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-6 rounded-3xl text-center">
                  <span className="text-4xl mb-2 block">📅</span>
                  <p className="text-3xl font-black text-white">{upcomingTrips.length}</p>
                  <p className="text-xs text-white/60 uppercase tracking-wider">{t.home.upcoming}</p>
                </div>
              </div>

              {/* Niveau explorateur */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-6 rounded-3xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{explorerLevel.emoji}</span>
                    <div>
                      <p className="font-black text-white text-lg">{explorerLevel.level}</p>
                      <p className="text-xs text-white/60">
                        {pastTrips.length < 10
                          ? `${10 - pastTrips.length} ${t.home.moreTrips}`
                          : t.home.maxLevel}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000"
                    style={{ width: `${explorerLevel.progress}%` }}
                  />
                </div>
              </div>

              {/* Notifications récentes */}
              {notifications.length > 0 && (
                <div>
                  <h2 className="text-xl font-black text-white mb-4">🔔 {t.home.recentNotifs}</h2>
                  <div className="space-y-3">
                    {notifications.slice(0, 3).map((n) => (
                      <div
                        key={n.id}
                        className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-start gap-4"
                      >
                        <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center text-xl">
                          {n.type === 'booking_accepted' ? '✅' : n.type === 'booking_rejected' ? '❌' : '📬'}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-white">{n.title}</p>
                          {n.body && <p className="text-sm text-white/60 mt-1 line-clamp-2">{n.body}</p>}
                        </div>
                        <span className="text-xs text-white/40">
                          {new Date(n.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 📅 MES VOYAGES */}
          {activeTab === 'trips' && (
            <div className="space-y-8">
              {/* En attente */}
              {pendingBookings.length > 0 && (
                <div>
                  <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
                    <span className="animate-pulse">⏳</span>
                    {t.trips.pending} ({pendingBookings.length})
                  </h2>
                  <div className="space-y-4">
                    {pendingBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-6"
                      >
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div>
                            <h3 className="text-lg font-black text-white">{booking.property_title}</h3>
                            <p className="text-white/60 text-sm">
                              📅 {new Date(booking.start_date).toLocaleDateString()} → {new Date(booking.end_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`px-4 py-2 rounded-full text-sm font-bold border ${statusColors[booking.status]}`}>
                              {t.status[booking.status]}
                            </span>
                            <p className="text-white font-bold mt-2">{formatCurrency(booking.total_price)}</p>
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
                  <h2 className="text-xl font-black text-white mb-4">🎯 {t.trips.upcoming} ({upcomingTrips.length})</h2>
                  <div className="space-y-4">
                    {upcomingTrips.map((booking) => (
                      <div
                        key={booking.id}
                        className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-6 hover:bg-white/15 transition-all"
                      >
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-black text-white">{booking.property_title}</h3>
                            </div>
                            <p className="text-white/60 text-sm">
                              📅 {new Date(booking.start_date).toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-FR', { weekday: 'short', day: 'numeric', month: 'long' })}
                              {' → '}
                              {new Date(booking.end_date).toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-FR', { weekday: 'short', day: 'numeric', month: 'long' })}
                            </p>
                            {booking.guests_count && (
                              <p className="text-white/40 text-sm mt-1">👥 {booking.guests_count} {t.trips.travelers}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className={`px-4 py-2 rounded-full text-sm font-bold border ${statusColors[booking.status]}`}>
                              {t.status[booking.status]}
                            </span>
                            <p className="text-2xl font-black text-white mt-2">{formatCurrency(booking.total_price)}</p>
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
                  <h2 className="text-xl font-black text-white mb-4">📚 {t.trips.history} ({pastTrips.length})</h2>
                  <div className="space-y-4">
                    {pastTrips.map((booking) => (
                      <div
                        key={booking.id}
                        className="bg-white/5 border border-white/10 rounded-3xl p-6 opacity-70 hover:opacity-100 transition-all"
                      >
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div>
                            <h3 className="text-lg font-bold text-white">{booking.property_title}</h3>
                            <p className="text-white/60 text-sm">
                              📅 {new Date(booking.start_date).toLocaleDateString()} → {new Date(booking.end_date).toLocaleDateString()}
                            </p>
                          </div>
                          <button className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-xl text-sm font-bold hover:bg-purple-500/30 transition-all">
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
                <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
                  <span className="text-6xl mb-4 block">🧳</span>
                  <h3 className="text-2xl font-black text-white mb-2">{t.trips.noBooking}</h3>
                  <p className="text-white/60 mb-6">{t.trips.noBookingDesc}</p>
                  <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold hover:scale-105 transition-all">
                    {t.trips.discover}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ❤️ FAVORIS */}
          {activeTab === 'favorites' && (
            <div>
              <h2 className="text-2xl font-black text-white mb-6">
                ❤️ {t.favorites.title} ({favoriteProperties.length})
              </h2>

              {loadingFavorites ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white/5 rounded-3xl h-72 animate-pulse" />
                  ))}
                </div>
              ) : favoriteProperties.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
                  <span className="text-6xl mb-4 block">💔</span>
                  <h3 className="text-2xl font-black text-white mb-2">{t.favorites.empty}</h3>
                  <p className="text-white/60 mb-6">{t.favorites.emptyDesc}</p>
                  <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold hover:scale-105 transition-all">
                    {t.favorites.exploreNow}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 👤 MON PROFIL */}
          {activeTab === 'profile' && (
            <div className="space-y-8">
              {/* Infos utilisateur */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
                <div className="flex items-center gap-6 mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center text-3xl font-black text-white">
                    {travelerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white">{travelerName}</h2>
                    <p className="text-white/60">{currentUser?.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-lg">{explorerLevel.emoji}</span>
                      <span className="text-purple-300 font-bold">{explorerLevel.level}</span>
                    </div>
                  </div>
                </div>

                {currentUser?.phone_number && (
                  <div className="p-4 bg-white/5 rounded-2xl">
                    <p className="text-xs text-white/60 uppercase tracking-wider mb-1">{t.profile.phone}</p>
                    <p className="text-white font-bold">{currentUser.phone_number}</p>
                  </div>
                )}
              </div>

              {/* Choix de langue */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
                <h3 className="text-lg font-black text-white mb-4">{t.profile.language}</h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => onLanguageChange('fr')}
                    className={`flex-1 py-4 rounded-2xl font-bold text-sm transition-all ${
                      language === 'fr'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    🇫🇷 Français
                  </button>
                  <button
                    onClick={() => onLanguageChange('en')}
                    className={`flex-1 py-4 rounded-2xl font-bold text-sm transition-all ${
                      language === 'en'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    🇬🇧 English
                  </button>
                  <button
                    onClick={() => onLanguageChange('ar')}
                    className={`flex-1 py-4 rounded-2xl font-bold text-sm transition-all ${
                      language === 'ar'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    🇩🇿 العربية
                  </button>
                </div>
              </div>

              {/* Vérification d'identité */}
              {!isVerified ? (
                <div className="bg-amber-500/20 border border-amber-500/30 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-amber-500 rounded-3xl flex items-center justify-center text-3xl">
                      ⚠️
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-amber-100">{t.profile.verifyIdentity}</h3>
                      <p className="text-sm text-amber-200/80">{t.profile.verifyDesc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsVerifModalOpen(true)}
                    className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold transition-all"
                  >
                    {t.profile.verifyNow}
                  </button>
                </div>
              ) : (
                <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-3xl p-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center text-3xl">
                      ✓
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-emerald-100">{t.profile.verified}</h3>
                      <p className="text-sm text-emerald-200/80">{t.profile.verifiedDesc}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Stats du profil */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-center">
                  <p className="text-2xl font-black text-white">{pastTrips.length}</p>
                  <p className="text-xs text-white/60">{t.profile.tripsCompleted}</p>
                </div>
                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-center">
                  <p className="text-2xl font-black text-white">{totalNights}</p>
                  <p className="text-xs text-white/60">{t.profile.nightsBooked}</p>
                </div>
                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-center">
                  <p className="text-2xl font-black text-white">{favoriteProperties.length}</p>
                  <p className="text-xs text-white/60">{t.home.favorites}</p>
                </div>
                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-center">
                  <p className="text-2xl font-black text-white">
                    {new Date(currentUser?.created_at || '').getFullYear() || '-'}
                  </p>
                  <p className="text-xs text-white/60">{t.profile.memberSince}</p>
                </div>
              </div>

              {/* Bouton déconnexion */}
              <button
                onClick={onLogout}
                className="w-full py-4 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
              >
                <span>🚪</span>
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
