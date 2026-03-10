import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { fetchMyNotifications, markNotificationAsRead } from '../services/notifications';
import { IdVerificationModal } from './IdVerificationModal';
import { CancellationModal } from './CancellationModal';

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
const T: Record<AppLanguage, any> = {
  fr: {
    greeting: 'Salut',
    level: 'Niveau',
    tabs: { home: 'Espace', trips: 'Voyages', favorites: 'Favoris', profile: 'Profil' },
    home: {
      nextTripIn: 'Prochain voyage',
      days: 'j', hours: 'h', minutes: 'min',
      noTrip: 'Aucun voyage prévu',
      noTripDesc: 'Planifie ta prochaine aventure !',
      explore: 'Explorer',
      nights: 'Nuits', trips: 'Voyages', favorites: 'Favoris', upcoming: 'À venir',
      notifs: 'Notifications',
      payNow: 'Payer maintenant',
    },
    trips: {
      pending: 'En attente', upcoming: 'À venir', history: 'Historique',
      noBooking: 'Aucune réservation', noBookingDesc: 'Réserve ton premier séjour',
      review: 'Avis',
      cancel: 'Annuler',
      cancelled: 'Annulées',
    },
    favorites: {
      title: 'Mes favoris', empty: 'Aucun favori', emptyDesc: 'Ajoute des coups de cœur !',
      perNight: '/nuit',
    },
    profile: {
      phone: 'Téléphone', verify: 'Vérifier identité', verifyDesc: 'Pour plus de sécurité',
      verifyNow: 'Vérifier', verified: 'Vérifié', verifiedDesc: 'Compte actif',
      language: 'Langue', logout: 'Déconnexion',
      stats: { trips: 'Voyages', nights: 'Nuits', favs: 'Favoris', since: 'Membre' },
    },
    status: {
      PENDING_APPROVAL: '⏳ Attente', APPROVED: '✅ Confirmée', PAID: '💳 Payée',
      CANCELLED: '❌ Annulée', REJECTED: '🚫 Refusée',
    },
    levels: { new: 'Nouveau', beginner: 'Débutant', explorer: 'Explorateur', adventurer: 'Aventurier', legend: 'Légende' },
  },
  en: {
    greeting: 'Hi',
    level: 'Level',
    tabs: { home: 'Home', trips: 'Trips', favorites: 'Favorites', profile: 'Profile' },
    home: {
      nextTripIn: 'Next trip',
      days: 'd', hours: 'h', minutes: 'min',
      noTrip: 'No trip planned',
      noTripDesc: 'Plan your next adventure!',
      explore: 'Explore',
      nights: 'Nights', trips: 'Trips', favorites: 'Favorites', upcoming: 'Upcoming',
      notifs: 'Notifications',
      payNow: 'Pay now',
    },
    trips: {
      pending: 'Pending', upcoming: 'Upcoming', history: 'History',
      noBooking: 'No bookings', noBookingDesc: 'Book your first stay',
      review: 'Review',
      cancel: 'Cancel',
      cancelled: 'Cancelled',
    },
    favorites: {
      title: 'My favorites', empty: 'No favorites', emptyDesc: 'Add some favorites!',
      perNight: '/night',
    },
    profile: {
      phone: 'Phone', verify: 'Verify identity', verifyDesc: 'For security',
      verifyNow: 'Verify', verified: 'Verified', verifiedDesc: 'Account active',
      language: 'Language', logout: 'Log out',
      stats: { trips: 'Trips', nights: 'Nights', favs: 'Favorites', since: 'Member' },
    },
    status: {
      PENDING_APPROVAL: '⏳ Pending', APPROVED: '✅ Confirmed', PAID: '💳 Paid',
      CANCELLED: '❌ Cancelled', REJECTED: '🚫 Rejected',
    },
    levels: { new: 'New', beginner: 'Beginner', explorer: 'Explorer', adventurer: 'Adventurer', legend: 'Legend' },
  },
  ar: {
    greeting: 'مرحباً',
    level: 'المستوى',
    tabs: { home: 'الرئيسية', trips: 'رحلاتي', favorites: 'المفضلة', profile: 'حسابي' },
    home: {
      nextTripIn: 'الرحلة القادمة',
      days: 'يوم', hours: 'سا', minutes: 'د',
      noTrip: 'لا رحلات',
      noTripDesc: 'خطط لرحلتك القادمة!',
      explore: 'استكشف',
      nights: 'ليالٍ', trips: 'رحلات', favorites: 'مفضلة', upcoming: 'قادمة',
      notifs: 'إشعارات',
      payNow: 'ادفع الآن',
    },
    trips: {
      pending: 'انتظار', upcoming: 'قادمة', history: 'السجل',
      noBooking: 'لا حجوزات', noBookingDesc: 'احجز إقامتك الأولى',
      review: 'تقييم',
      cancel: 'إلغاء',
      cancelled: 'ملغاة',
    },
    favorites: {
      title: 'المفضلة', empty: 'فارغة', emptyDesc: 'أضف مفضلاتك!',
      perNight: '/ليلة',
    },
    profile: {
      phone: 'الهاتف', verify: 'تحقق من هويتك', verifyDesc: 'للأمان',
      verifyNow: 'تحقق', verified: 'مُفعّل', verifiedDesc: 'حساب نشط',
      language: 'اللغة', logout: 'خروج',
      stats: { trips: 'رحلات', nights: 'ليالٍ', favs: 'مفضلة', since: 'عضو منذ' },
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
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isVerifModalOpen, setIsVerifModalOpen] = useState(false);
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [favoriteProperties, setFavoriteProperties] = useState<Property[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ NOUVEAU : État pour le modal d'annulation
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);

  const t = T[language];
  const isRTL = language === 'ar';
  const isVerified = currentUser?.id_verification_status === 'VERIFIED';

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Charger les données
  const loadData = async () => {
    try {
      const session = authService.getSession();
      if (session) setCurrentUser(session);

      const userBookings = await bookingService.getUserBookings(travelerId);
      setBookings(userBookings || []);

      const favIds = await favoriteService.getUserFavoritePropertyIds(travelerId);
      if (favIds.length > 0) {
        const props = await Promise.all(favIds.map(id => propertyService.getById(id)));
        setFavoriteProperties(props.filter((p): p is Property => p !== null));
      }

      const { data: notifs } = await fetchMyNotifications();
      if (notifs) setNotifications(notifs);
    } catch (err) {
      console.error('TravelerDashboard load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initLoad = async () => {
      if (isMounted) await loadData();
    };

    initLoad();

    const timeout = setTimeout(() => {
      if (isMounted) setIsLoading(false);
    }, 5000);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [travelerId]);

  // Calculs
  const now = new Date();
  const upcomingTrips = bookings.filter(
    b => new Date(b.start_date) > now && ['APPROVED', 'PAID'].includes(b.status)
  );
  const pastTrips = bookings.filter(
    b => new Date(b.end_date) < now && ['APPROVED', 'PAID'].includes(b.status)
  );
  const pendingBookings = bookings.filter(b => b.status === 'PENDING_APPROVAL');
  const cancelledBookings = bookings.filter(b => b.status === 'CANCELLED');
  const nextTrip = upcomingTrips.sort((a, b) => 
    new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  )[0];

  const totalNights = pastTrips.reduce((sum, b) => {
    const nights = Math.ceil(
      (new Date(b.end_date).getTime() - new Date(b.start_date).getTime()) / 86400000
    );
    return sum + nights;
  }, 0);

  // Niveau
  const getLevel = () => {
    const n = pastTrips.length;
    if (n >= 10) return { name: t.levels.legend, emoji: '🏆', pct: 100 };
    if (n >= 5) return { name: t.levels.adventurer, emoji: '🎯', pct: 75 };
    if (n >= 2) return { name: t.levels.explorer, emoji: '🧭', pct: 50 };
    if (n >= 1) return { name: t.levels.beginner, emoji: '🌱', pct: 25 };
    return { name: t.levels.new, emoji: '👋', pct: 0 };
  };
  const level = getLevel();

  // Tabs config
  const tabs: { id: TabType; icon: string; label: string; badge?: number }[] = [
    { id: 'home', icon: '🏠', label: t.tabs.home },
    { id: 'trips', icon: '📅', label: t.tabs.trips, badge: pendingBookings.length || undefined },
    { id: 'favorites', icon: '❤️', label: t.tabs.favorites, badge: favoriteProperties.length || undefined },
    { id: 'profile', icon: '👤', label: t.tabs.profile },
  ];

  // Status colors
  const statusColor: Record<BookingStatus, string> = {
    PENDING_APPROVAL: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    APPROVED: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    PAID: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    CANCELLED: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    REJECTED: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  };

  // Supprimer favori
  const handleRemoveFavorite = async (propertyId: string) => {
    await favoriteService.toggleFavorite(travelerId, propertyId);
    setFavoriteProperties(prev => prev.filter(p => p.id !== propertyId));
  };

  // Gérer le clic sur une notification
  const handleNotificationClick = async (notif: Notification) => {
    await markNotificationAsRead(notif.id);
    if (notif.type === 'booking_accepted' && notif.data?.payment_url) {
      navigate(notif.data.payment_url);
    }
  };

  // ✅ Callback après annulation réussie
  const handleCancellationSuccess = async () => {
    await loadData();
    onRefresh();
    setCancellingBooking(null);
  };

  return (
    <div className="min-h-screen pb-10" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-black text-white">
          {t.greeting}, {travelerName.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-white/50 mt-1">
          {level.emoji} {t.level}: <span className="text-purple-300 font-bold">{level.name}</span>
        </p>
      </div>

      {/* TABS */}
      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex-shrink-0 px-4 py-2.5 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'bg-white/10 text-white/60 active:bg-white/20'
            }`}
          >
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.badge && tab.badge > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* LOADING */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4" />
          <p className="text-white/50 text-sm">Chargement...</p>
        </div>
      )}

      {/* CONTENT */}
      {!isLoading && (
        <div className="space-y-6">
          {/* =============== HOME =============== */}
          {activeTab === 'home' && (
            <>
              {/* Prochain voyage */}
              {nextTrip ? (
                <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-6 rounded-3xl shadow-xl">
                  <p className="text-white/80 text-sm font-bold mb-1">✈️ {t.home.nextTripIn}</p>
                  <h2 className="text-xl md:text-2xl font-black text-white mb-2">
                    {nextTrip.property_title || 'Séjour LOCADZ'}
                  </h2>
                  <p className="text-white/80 text-sm">
                    📅 {new Date(nextTrip.start_date).toLocaleDateString()} → {new Date(nextTrip.end_date).toLocaleDateString()}
                  </p>
                </div>
              ) : (
                <div className="bg-white/5 border border-white/10 p-8 rounded-3xl text-center">
                  <span className="text-5xl mb-4 block">🌴</span>
                  <h3 className="text-xl font-black text-white mb-2">{t.home.noTrip}</h3>
                  <p className="text-white/50 mb-4">{t.home.noTripDesc}</p>
                  <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold">
                    {t.home.explore}
                  </button>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { icon: '🌙', val: totalNights, label: t.home.nights },
                  { icon: '🏠', val: pastTrips.length, label: t.home.trips },
                  { icon: '❤️', val: favoriteProperties.length, label: t.home.favorites },
                  { icon: '📅', val: upcomingTrips.length, label: t.home.upcoming },
                ].map((s, i) => (
                  <div key={i} className="bg-white/10 border border-white/10 p-4 rounded-2xl text-center">
                    <span className="text-2xl block mb-1">{s.icon}</span>
                    <p className="text-2xl font-black text-white">{s.val}</p>
                    <p className="text-[10px] text-white/50 uppercase">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Niveau */}
              <div className="bg-white/10 border border-white/10 p-5 rounded-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{level.emoji}</span>
                  <div>
                    <p className="font-black text-white">{level.name}</p>
                    <p className="text-xs text-white/50">
                      {pastTrips.length < 10 ? `${10 - pastTrips.length} voyages pour le prochain niveau` : 'Niveau max !'}
                    </p>
                  </div>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                    style={{ width: `${level.pct}%` }}
                  />
                </div>
              </div>

              {/* Notifications */}
              {notifications.length > 0 && (
                <div>
                  <h3 className="text-lg font-black text-white mb-3">🔔 {t.home.notifs}</h3>
                  <div className="space-y-2">
                    {notifications.slice(0, 5).map(n => (
                      <div 
                        key={n.id} 
                        className="bg-white/5 border border-white/10 p-4 rounded-2xl"
                      >
                        <div className="flex gap-3">
                          <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                            {n.type === 'booking_accepted' ? '✅' : n.type === 'booking_rejected' || n.type === 'booking_cancelled' ? '❌' : '📬'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-white text-sm">{n.title}</p>
                            {n.body && (
                              <p className="text-xs text-white/50 mt-1 line-clamp-2">{n.body}</p>
                            )}
                            
                            {/* Bouton Payer maintenant */}
                            {n.type === 'booking_accepted' && n.data?.payment_url && (
                              <button
                                onClick={() => handleNotificationClick(n)}
                                className="mt-3 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:from-emerald-700 hover:to-teal-700 transition-all active:scale-95"
                              >
                                💳 {t.home.payNow}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* =============== TRIPS =============== */}
          {activeTab === 'trips' && (
            <>
              {/* En attente */}
              {pendingBookings.length > 0 && (
                <div>
                  <h3 className="text-lg font-black text-white mb-3">⏳ {t.trips.pending} ({pendingBookings.length})</h3>
                  <div className="space-y-3">
                    {pendingBookings.map(b => (
                      <div key={b.id} className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-white truncate">{b.property_title}</p>
                            <p className="text-sm text-white/60 mt-1">
                              📅 {new Date(b.start_date).toLocaleDateString()} → {new Date(b.end_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2 ml-4">
                            <p className="font-bold text-white">{formatCurrency(b.total_price)}</p>
                            {/* ✅ Bouton Annuler */}
                            <button
                              onClick={() => setCancellingBooking(b)}
                              className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-bold transition-all active:scale-95"
                            >
                              {t.trips.cancel}
                            </button>
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
                  <h3 className="text-lg font-black text-white mb-3">🎯 {t.trips.upcoming} ({upcomingTrips.length})</h3>
                  <div className="space-y-3">
                    {upcomingTrips.map(b => (
                      <div key={b.id} className="bg-white/10 border border-white/10 p-4 rounded-2xl">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-white truncate">{b.property_title}</p>
                            <p className="text-sm text-white/60 mt-1">
                              📅 {new Date(b.start_date).toLocaleDateString()} → {new Date(b.end_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2 ml-4">
                            <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${statusColor[b.status]}`}>
                              {t.status[b.status]}
                            </span>
                            <p className="font-bold text-white">{formatCurrency(b.total_price)}</p>
                            {/* ✅ Bouton Annuler */}
                            <button
                              onClick={() => setCancellingBooking(b)}
                              className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-bold transition-all active:scale-95"
                            >
                              {t.trips.cancel}
                            </button>
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
                  <h3 className="text-lg font-black text-white mb-3">📚 {t.trips.history} ({pastTrips.length})</h3>
                  <div className="space-y-3">
                    {pastTrips.map(b => (
                      <div key={b.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl opacity-80">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-bold text-white">{b.property_title}</p>
                            <p className="text-xs text-white/50">{new Date(b.start_date).toLocaleDateString()}</p>
                          </div>
                          <button className="px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded-xl text-xs font-bold">
                            {t.trips.review} ⭐
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ✅ Réservations annulées */}
              {cancelledBookings.length > 0 && (
                <div>
                  <h3 className="text-lg font-black text-white mb-3">❌ {t.trips.cancelled} ({cancelledBookings.length})</h3>
                  <div className="space-y-3">
                    {cancelledBookings.map(b => (
                      <div key={b.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl opacity-60">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-bold text-white line-through">{b.property_title}</p>
                            <p className="text-xs text-white/50">
                              {new Date(b.start_date).toLocaleDateString()} → {new Date(b.end_date).toLocaleDateString()}
                            </p>
                            {b.cancellation_reason && (
                              <p className="text-xs text-rose-400 mt-1">
                                Raison : {b.cancellation_reason.replace(/_/g, ' ')}
                              </p>
                            )}
                          </div>
                          <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${statusColor.CANCELLED}`}>
                            {t.status.CANCELLED}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vide */}
              {bookings.length === 0 && (
                <div className="bg-white/5 border border-white/10 p-8 rounded-3xl text-center">
                  <span className="text-5xl mb-4 block">🧳</span>
                  <h3 className="text-xl font-black text-white mb-2">{t.trips.noBooking}</h3>
                  <p className="text-white/50">{t.trips.noBookingDesc}</p>
                </div>
              )}
            </>
          )}

          {/* =============== FAVORITES =============== */}
          {activeTab === 'favorites' && (
            <>
              <h3 className="text-lg font-black text-white mb-4">❤️ {t.favorites.title} ({favoriteProperties.length})</h3>
              
              {favoriteProperties.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {favoriteProperties.map(p => (
                    <div
                      key={p.id}
                      onClick={() => onNavigateToProperty?.(p.id)}
                      className="bg-white/10 border border-white/10 rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
                    >
                      <div className="relative h-32">
                        <img 
                          src={p.images[0]?.image_url || '/placeholder.jpg'} 
                          alt={p.title}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemoveFavorite(p.id); }}
                          className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-rose-500"
                        >
                          ❤️
                        </button>
                        <div className="absolute bottom-2 left-2 bg-white/90 px-2 py-1 rounded-lg">
                          <span className="font-bold text-gray-900 text-sm">{formatCurrency(p.price)}</span>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="font-bold text-white text-sm truncate">{p.title}</p>
                        <p className="text-white/50 text-xs truncate">📍 {p.location}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white/5 border border-white/10 p-8 rounded-3xl text-center">
                  <span className="text-5xl mb-4 block">💔</span>
                  <h3 className="text-xl font-black text-white mb-2">{t.favorites.empty}</h3>
                  <p className="text-white/50">{t.favorites.emptyDesc}</p>
                </div>
              )}
            </>
          )}

          {/* =============== PROFILE =============== */}
          {activeTab === 'profile' && (
            <>
              {/* Infos utilisateur */}
              <div className="bg-white/10 border border-white/10 p-5 rounded-2xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-2xl font-black text-white">
                    {travelerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xl font-black text-white">{travelerName}</p>
                    <p className="text-white/50 text-sm">{currentUser?.email}</p>
                  </div>
                </div>
                {currentUser?.phone_number && (
                  <div className="bg-white/5 p-3 rounded-xl">
                    <p className="text-xs text-white/50 uppercase">{t.profile.phone}</p>
                    <p className="text-white font-bold">{currentUser.phone_number}</p>
                  </div>
                )}
              </div>

              {/* Langue */}
              <div className="bg-white/10 border border-white/10 p-5 rounded-2xl">
                <p className="font-bold text-white mb-3">{t.profile.language}</p>
                <div className="flex gap-2">
                  {(['fr', 'en', 'ar'] as AppLanguage[]).map(lang => (
                    <button
                      key={lang}
                      onClick={() => onLanguageChange(lang)}
                      className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-1 transition-all ${
                        language === lang
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                          : 'bg-white/5 text-white/60'
                      }`}
                    >
                      {lang === 'fr' ? '🇫🇷' : lang === 'en' ? '🇬🇧' : '🇩🇿'}
                      <span>{lang.toUpperCase()}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Vérification */}
              {!isVerified ? (
                <div className="bg-amber-500/10 border border-amber-500/30 p-5 rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <p className="font-bold text-amber-100">{t.profile.verify}</p>
                      <p className="text-xs text-amber-200/70">{t.profile.verifyDesc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsVerifModalOpen(true)}
                    className="px-4 py-2 bg-amber-500 text-white rounded-xl font-bold text-sm flex-shrink-0"
                  >
                    {t.profile.verifyNow}
                  </button>
                </div>
              ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-5 rounded-2xl flex items-center gap-3">
                  <span className="text-2xl">✓</span>
                  <div>
                    <p className="font-bold text-emerald-100">{t.profile.verified}</p>
                    <p className="text-xs text-emerald-200/70">{t.profile.verifiedDesc}</p>
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { val: pastTrips.length, label: t.profile.stats.trips },
                  { val: totalNights, label: t.profile.stats.nights },
                  { val: favoriteProperties.length, label: t.profile.stats.favs },
                  { val: new Date(currentUser?.created_at || '').getFullYear() || '-', label: t.profile.stats.since },
                ].map((s, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 p-3 rounded-xl text-center">
                    <p className="text-lg font-black text-white">{s.val}</p>
                    <p className="text-[9px] text-white/50 uppercase">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Déconnexion */}
              <button
                onClick={onLogout}
                className="w-full py-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-2xl font-bold flex items-center justify-center gap-2"
              >
                👋 {t.profile.logout}
              </button>
            </>
          )}
        </div>
      )}

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

      {/* ✅ NOUVEAU : Modal d'annulation */}
      {cancellingBooking && (
        <CancellationModal
          isOpen={!!cancellingBooking}
          onClose={() => setCancellingBooking(null)}
          booking={cancellingBooking}
          userRole="TRAVELER"
          userId={travelerId}
          onSuccess={handleCancellationSuccess}
        />
      )}
    </div>
  );
};
