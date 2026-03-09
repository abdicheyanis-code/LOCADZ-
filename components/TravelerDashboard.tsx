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

const TRANSLATIONS: Record<AppLanguage, any> = {
  fr: {
    greeting: 'Salut',
    level: 'Niveau',
    loading: 'Chargement...',
    tabs: { home: 'Espace', trips: 'Voyages', favorites: 'Favoris', profile: 'Profil' },
    home: {
      nextTripIn: 'Prochain voyage dans',
      days: 'j', hours: 'h', minutes: 'min',
      noTrip: 'Aucun voyage prévu',
      noTripDesc: 'Planifie ta prochaine aventure !',
      explore: 'Explorer',
      nightsSpent: 'Nuits', trips: 'Voyages', favorites: 'Favoris', upcoming: 'À venir',
      recentNotifs: 'Notifications',
      moreTrips: 'voyage(s) restants',
      maxLevel: 'Niveau max !',
    },
    trips: {
      pending: 'En attente', upcoming: 'À venir', history: 'Historique',
      noBooking: 'Aucune réservation', noBookingDesc: 'Réserve ton premier séjour',
      discover: 'Découvrir', leaveReview: 'Avis', travelers: 'voyageur(s)',
    },
    favorites: {
      title: 'Favoris', empty: 'Aucun favori', emptyDesc: 'Ajoute des favoris !',
      exploreNow: 'Explorer', perNight: '/nuit', reviews: 'avis',
    },
    profile: {
      title: 'Mon compte', phone: 'Téléphone',
      verifyIdentity: 'Vérifier identité', verifyDesc: 'Pour plus de sécurité',
      verifyNow: 'Vérifier', verified: 'Vérifié', verifiedDesc: 'Compte actif',
      tripsCompleted: 'Voyages', nightsBooked: 'Nuits', memberSince: 'Depuis',
      language: 'Langue', logout: 'Déconnexion',
    },
    status: {
      PENDING_APPROVAL: '⏳ Attente', APPROVED: '✅ OK', PAID: '💳 Payée',
      CANCELLED: '❌ Annulée', REJECTED: '🚫 Refusée',
    },
    levels: { new: 'Nouveau', beginner: 'Débutant', explorer: 'Explorateur', adventurer: 'Aventurier', legend: 'Légende' },
  },
  en: {
    greeting: 'Hi',
    level: 'Level',
    loading: 'Loading...',
    tabs: { home: 'Home', trips: 'Trips', favorites: 'Favorites', profile: 'Profile' },
    home: {
      nextTripIn: 'Next trip in',
      days: 'd', hours: 'h', minutes: 'min',
      noTrip: 'No trip planned',
      noTripDesc: 'Plan your next adventure!',
      explore: 'Explore',
      nightsSpent: 'Nights', trips: 'Trips', favorites: 'Favorites', upcoming: 'Upcoming',
      recentNotifs: 'Notifications',
      moreTrips: 'trip(s) left',
      maxLevel: 'Max level!',
    },
    trips: {
      pending: 'Pending', upcoming: 'Upcoming', history: 'History',
      noBooking: 'No bookings', noBookingDesc: 'Book your first stay',
      discover: 'Discover', leaveReview: 'Review', travelers: 'traveler(s)',
    },
    favorites: {
      title: 'Favorites', empty: 'No favorites', emptyDesc: 'Add favorites!',
      exploreNow: 'Explore', perNight: '/night', reviews: 'reviews',
    },
    profile: {
      title: 'Account', phone: 'Phone',
      verifyIdentity: 'Verify identity', verifyDesc: 'For security',
      verifyNow: 'Verify', verified: 'Verified', verifiedDesc: 'Active',
      tripsCompleted: 'Trips', nightsBooked: 'Nights', memberSince: 'Since',
      language: 'Language', logout: 'Log out',
    },
    status: {
      PENDING_APPROVAL: '⏳ Pending', APPROVED: '✅ OK', PAID: '💳 Paid',
      CANCELLED: '❌ Cancelled', REJECTED: '🚫 Rejected',
    },
    levels: { new: 'New', beginner: 'Beginner', explorer: 'Explorer', adventurer: 'Adventurer', legend: 'Legend' },
  },
  ar: {
    greeting: 'مرحباً',
    level: 'المستوى',
    loading: 'جاري التحميل...',
    tabs: { home: 'الرئيسية', trips: 'رحلاتي', favorites: 'المفضلة', profile: 'حسابي' },
    home: {
      nextTripIn: 'الرحلة القادمة',
      days: 'يوم', hours: 'سا', minutes: 'د',
      noTrip: 'لا رحلات',
      noTripDesc: 'خطط لرحلتك!',
      explore: 'استكشف',
      nightsSpent: 'ليالٍ', trips: 'رحلات', favorites: 'مفضلة', upcoming: 'قادمة',
      recentNotifs: 'إشعارات',
      moreTrips: 'رحلة متبقية',
      maxLevel: 'أقصى مستوى!',
    },
    trips: {
      pending: 'انتظار', upcoming: 'قادمة', history: 'السجل',
      noBooking: 'لا حجوزات', noBookingDesc: 'احجز أول إقامة',
      discover: 'اكتشف', leaveReview: 'تقييم', travelers: 'مسافر',
    },
    favorites: {
      title: 'المفضلة', empty: 'فارغة', emptyDesc: 'أضف مفضلات!',
      exploreNow: 'استكشف', perNight: '/ليلة', reviews: 'تقييم',
    },
    profile: {
      title: 'حسابي', phone: 'الهاتف',
      verifyIdentity: 'تحقق', verifyDesc: 'للأمان',
      verifyNow: 'تحقق', verified: 'مُفعّل', verifiedDesc: 'نشط',
      tripsCompleted: 'رحلات', nightsBooked: 'ليالٍ', memberSince: 'منذ',
      language: 'اللغة', logout: 'خروج',
    },
    status: {
      PENDING_APPROVAL: '⏳', APPROVED: '✅', PAID: '💳',
      CANCELLED: '❌', REJECTED: '🚫',
    },
    levels: { new: 'جديد', beginner: 'مبتدئ', explorer: 'مستكشف', adventurer: 'مغامر', legend: 'أسطوري' },
  },
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
  const [isLoading, setIsLoading] = useState(true);

  const t = TRANSLATIONS[language];
  const isRTL = language === 'ar';
  const isVerified = currentUser?.id_verification_status === 'VERIFIED';

  useEffect(() => { setActiveTab(initialTab); }, [initialTab]);

  // Chargement des données avec timeout
  useEffect(() => {
    let mounted = true;
    
    const load = async () => {
      try {
        const session = authService.getSession();
        if (session && mounted) setCurrentUser(session);

        const [bookingsData, favIds, notifsRes] = await Promise.allSettled([
          bookingService.getUserBookings(travelerId),
          favoriteService.getUserFavoritePropertyIds(travelerId),
          fetchMyNotifications(),
        ]);

        if (!mounted) return;

        if (bookingsData.status === 'fulfilled') {
          setBookings(bookingsData.value || []);
        }

        if (favIds.status === 'fulfilled' && favIds.value.length > 0) {
          const props = await Promise.all(favIds.value.map(id => propertyService.getById(id)));
          if (mounted) setFavoriteProperties(props.filter((p): p is Property => p !== null));
        }

        if (notifsRes.status === 'fulfilled' && notifsRes.value.data) {
          setNotifications(notifsRes.value.data);
        }
      } catch (e) {
        console.error('Load error:', e);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    // Forcer l'affichage après 3 secondes max
    const timeout = setTimeout(() => {
      if (mounted) setIsLoading(false);
    }, 3000);

    load();
    return () => { mounted = false; clearTimeout(timeout); };
  }, [travelerId]);

  // Stats
  const upcomingTrips = bookings.filter(b => new Date(b.start_date) > new Date() && ['APPROVED', 'PAID'].includes(b.status));
  const pastTrips = bookings.filter(b => new Date(b.end_date) < new Date() && ['APPROVED', 'PAID'].includes(b.status));
  const pendingBookings = bookings.filter(b => b.status === 'PENDING_APPROVAL');
  const nextTrip = upcomingTrips[0];
  const totalNights = pastTrips.reduce((sum, b) => {
    const nights = Math.ceil((new Date(b.end_date).getTime() - new Date(b.start_date).getTime()) / 86400000);
    return sum + nights;
  }, 0);

  const level = pastTrips.length >= 10 ? { name: t.levels.legend, emoji: '🏆', pct: 100 }
    : pastTrips.length >= 5 ? { name: t.levels.adventurer, emoji: '🎯', pct: 75 }
    : pastTrips.length >= 2 ? { name: t.levels.explorer, emoji: '🧭', pct: 50 }
    : pastTrips.length >= 1 ? { name: t.levels.beginner, emoji: '🌱', pct: 25 }
    : { name: t.levels.new, emoji: '👋', pct: 0 };

  const tabs = [
    { id: 'home' as TabType, icon: '🏠', label: t.tabs.home },
    { id: 'trips' as TabType, icon: '📅', label: t.tabs.trips, badge: pendingBookings.length },
    { id: 'favorites' as TabType, icon: '❤️', label: t.tabs.favorites, badge: favoriteProperties.length },
    { id: 'profile' as TabType, icon: '👤', label: t.tabs.profile },
  ];

  const statusColors: Record<BookingStatus, string> = {
    PENDING_APPROVAL: 'bg-amber-500/20 text-amber-300',
    APPROVED: 'bg-blue-500/20 text-blue-300',
    PAID: 'bg-emerald-500/20 text-emerald-300',
    CANCELLED: 'bg-gray-500/20 text-gray-400',
    REJECTED: 'bg-rose-500/20 text-rose-300',
  };

  return (
    <div className="min-h-screen pb-20" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">
          {t.greeting}, {travelerName.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-white/50">
          {level.emoji} {t.level}: {level.name}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex-shrink-0 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-1.5 transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'bg-white/10 text-white/60'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.badge ? (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-[10px] flex items-center justify-center">
                {tab.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Loader inline (pas bloquant) */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-3 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        </div>
      )}

      {/* Contenu */}
      {!isLoading && (
        <>
          {/* HOME */}
          {activeTab === 'home' && (
            <div className="space-y-4">
              {/* Prochain voyage */}
              {nextTrip ? (
                <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-5 rounded-2xl">
                  <p className="text-white/80 text-xs mb-2">✈️ {t.home.nextTripIn}</p>
                  <p className="text-2xl font-black text-white">{nextTrip.property_title}</p>
                  <p className="text-white/70 text-sm mt-1">
                    📅 {new Date(nextTrip.start_date).toLocaleDateString()}
                  </p>
                </div>
              ) : (
                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl text-center">
                  <p className="text-3xl mb-2">🌴</p>
                  <p className="font-bold text-white">{t.home.noTrip}</p>
                  <p className="text-white/50 text-sm">{t.home.noTripDesc}</p>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { icon: '🌙', value: totalNights, label: t.home.nightsSpent },
                  { icon: '🏠', value: pastTrips.length, label: t.home.trips },
                  { icon: '❤️', value: favoriteProperties.length, label: t.home.favorites },
                  { icon: '📅', value: upcomingTrips.length, label: t.home.upcoming },
                ].map((stat, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 p-3 rounded-xl text-center">
                    <p className="text-lg">{stat.icon}</p>
                    <p className="text-lg font-black text-white">{stat.value}</p>
                    <p className="text-[8px] text-white/50 uppercase">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Niveau */}
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{level.emoji}</span>
                  <span className="font-bold text-white">{level.name}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: `${level.pct}%` }} />
                </div>
              </div>
            </div>
          )}

          {/* TRIPS */}
          {activeTab === 'trips' && (
            <div className="space-y-4">
              {pendingBookings.length > 0 && (
                <div>
                  <h3 className="font-bold text-white mb-2">⏳ {t.trips.pending}</h3>
                  {pendingBookings.map(b => (
                    <div key={b.id} className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl mb-2">
                      <p className="font-bold text-white">{b.property_title}</p>
                      <p className="text-xs text-white/60">{new Date(b.start_date).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}

              {upcomingTrips.length > 0 && (
                <div>
                  <h3 className="font-bold text-white mb-2">🎯 {t.trips.upcoming}</h3>
                  {upcomingTrips.map(b => (
                    <div key={b.id} className="bg-white/5 border border-white/10 p-4 rounded-xl mb-2">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-bold text-white">{b.property_title}</p>
                          <p className="text-xs text-white/60">{new Date(b.start_date).toLocaleDateString()}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-lg text-xs ${statusColors[b.status]}`}>
                          {t.status[b.status]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {pastTrips.length > 0 && (
                <div>
                  <h3 className="font-bold text-white mb-2">📚 {t.trips.history}</h3>
                  {pastTrips.slice(0, 5).map(b => (
                    <div key={b.id} className="bg-white/5 border border-white/10 p-3 rounded-xl mb-2 opacity-70">
                      <p className="font-bold text-white text-sm">{b.property_title}</p>
                      <p className="text-xs text-white/50">{new Date(b.start_date).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}

              {bookings.length === 0 && (
                <div className="bg-white/5 border border-white/10 p-8 rounded-2xl text-center">
                  <p className="text-3xl mb-2">🧳</p>
                  <p className="font-bold text-white">{t.trips.noBooking}</p>
                  <p className="text-white/50 text-sm">{t.trips.noBookingDesc}</p>
                </div>
              )}
            </div>
          )}

          {/* FAVORITES */}
          {activeTab === 'favorites' && (
            <div>
              <h3 className="font-bold text-white mb-3">❤️ {t.favorites.title}</h3>
              {favoriteProperties.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {favoriteProperties.map(p => (
                    <div
                      key={p.id}
                      onClick={() => onNavigateToProperty?.(p.id)}
                      className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
                    >
                      <img src={p.images[0]?.image_url} alt="" className="w-full h-28 object-cover" />
                      <div className="p-2">
                        <p className="font-bold text-white text-sm truncate">{p.title}</p>
                        <p className="text-white/50 text-xs">{formatCurrency(p.price)}{t.favorites.perNight}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white/5 border border-white/10 p-8 rounded-2xl text-center">
                  <p className="text-3xl mb-2">💔</p>
                  <p className="font-bold text-white">{t.favorites.empty}</p>
                  <p className="text-white/50 text-sm">{t.favorites.emptyDesc}</p>
                </div>
              )}
            </div>
          )}

          {/* PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              {/* Info */}
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-xl font-bold text-white">
                  {travelerName.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-white">{travelerName}</p>
                  <p className="text-white/50 text-sm">{currentUser?.email}</p>
                </div>
              </div>

              {/* Langue */}
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                <p className="font-bold text-white mb-2">{t.profile.language}</p>
                <div className="flex gap-2">
                  {(['fr', 'en', 'ar'] as AppLanguage[]).map(lang => (
                    <button
                      key={lang}
                      onClick={() => onLanguageChange(lang)}
                      className={`flex-1 py-2 rounded-lg font-bold text-sm ${
                        language === lang
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                          : 'bg-white/10 text-white/60'
                      }`}
                    >
                      {lang === 'fr' ? '🇫🇷' : lang === 'en' ? '🇬🇧' : '🇩🇿'} {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vérification */}
              {!isVerified ? (
                <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>⚠️</span>
                    <div>
                      <p className="font-bold text-amber-100 text-sm">{t.profile.verifyIdentity}</p>
                      <p className="text-amber-200/70 text-xs">{t.profile.verifyDesc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsVerifModalOpen(true)}
                    className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-sm font-bold"
                  >
                    {t.profile.verifyNow}
                  </button>
                </div>
              ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex items-center gap-2">
                  <span>✓</span>
                  <p className="font-bold text-emerald-100">{t.profile.verified}</p>
                </div>
              )}

              {/* Déconnexion */}
              <button
                onClick={onLogout}
                className="w-full py-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                👋 {t.profile.logout}
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {currentUser && (
        <IdVerificationModal
          isOpen={isVerifModalOpen}
          onClose={() => setIsVerifModalOpen(false)}
          currentUser={currentUser}
          onSuccess={(u) => { setCurrentUser(u); onRefresh(); }}
        />
      )}
    </div>
  );
};
