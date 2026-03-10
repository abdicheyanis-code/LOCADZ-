import React, { useState, useEffect, useCallback } from 'react';
import {
  Property,
  UserProfile,
  Booking,
  BookingStatus,
  PayoutRecord,
  PayoutDetails,
  Notification,
} from '../types';
import { bookingService } from '../services/bookingService';
import { propertyService } from '../services/propertyService';
import { authService } from '../services/authService';
import { payoutsService } from '../services/payoutsService';
import { formatCurrency } from '../services/stripeService';
import { ALGERIAN_BANKS } from '../constants';
import { AddPropertyModal } from './AddPropertyModal';
import { EditPropertyModal } from './EditPropertyModal';
import { IdVerificationModal } from './IdVerificationModal';
import { CancellationModal } from './CancellationModal';
import { fetchMyNotifications } from '../services/notifications';

interface HostDashboardProps {
  hostId: string;
  hostName: string;
  onRefresh: () => void;
}

type TabType = 'overview' | 'properties' | 'bookings' | 'revenue' | 'settings';

// 📅 Mini calendrier d'occupation
const PropertyCalendar: React.FC<{ propertyId: string }> = ({ propertyId }) => {
  const now = new Date();
  const currentMonth = now.toLocaleString('fr-FR', { month: 'long' });
  const year = now.getFullYear();
  const [bookedDays, setBookedDays] = useState<number[]>([]);

  useEffect(() => {
    const fetchBookings = async () => {
      const bookings = await bookingService.getBookingsForProperty(propertyId);
      const days: number[] = [];
      bookings.forEach((b) => {
        const start = new Date(b.start_date).getDate();
        const end = new Date(b.end_date).getDate();
        for (let i = start; i <= end; i++) days.push(i);
      });
      setBookedDays(days);
    };
    fetchBookings();
  }, [propertyId]);

  const daysInMonth = new Date(year, now.getMonth() + 1, 0).getDate();
  const firstDay = new Date(year, now.getMonth(), 1).getDay();
  const emptyDays = firstDay === 0 ? 6 : firstDay - 1;
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="mt-4 p-4 bg-white/5 rounded-2xl border border-white/10">
      <div className="flex justify-between items-center mb-3">
        <h5 className="text-xs font-bold uppercase text-indigo-300">
          {currentMonth} {year}
        </h5>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500" />
          <span className="text-[10px] text-white/60">Réservé</span>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
          <div key={i} className="text-[10px] font-bold text-white/40 text-center">
            {d}
          </div>
        ))}
        {Array.from({ length: emptyDays }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {daysArray.map((day) => {
          const isBooked = bookedDays.includes(day);
          return (
            <div
              key={day}
              className={`aspect-square flex items-center justify-center text-[10px] font-bold rounded-lg transition-all ${
                isBooked
                  ? 'bg-indigo-500 text-white shadow-lg'
                  : 'text-white/30 hover:bg-white/5'
              }`}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Calcule l'âge à partir d'une date de naissance
const calculateAge = (birthdate?: string | null): number | null => {
  if (!birthdate) return null;
  const d = new Date(birthdate);
  if (isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

export const HostDashboard: React.FC<HostDashboardProps> = ({
  hostId,
  hostName,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isVerifModalOpen, setIsVerifModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  // ✅ NOUVEAU : Modal d'annulation
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);

  const [myProperties, setMyProperties] = useState<Property[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Booking[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalBookings, setTotalBookings] = useState(0);
  const [payoutHistory, setPayoutHistory] = useState<PayoutRecord[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loadingNotifs, setLoadingNotifs] = useState(true);

  const [payoutForm, setPayoutForm] = useState({
    method: 'CCP' as 'CCP' | 'RIB',
    account_name: hostName,
    account_number: '',
    bank_name: '',
  });
  const [payoutConfigured, setPayoutConfigured] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SUCCESS'>('IDLE');
  const [error, setError] = useState<string | null>(null);

  const isVerified = currentUser?.id_verification_status === 'VERIFIED';

  const loadDashboardData = useCallback(async () => {
    const props = await propertyService.getByHost(hostId);
    setMyProperties(props);

    const revenue = await bookingService.getHostRevenue(props.map((p) => p.id));
    setTotalRevenue(revenue);

    const bookings = await bookingService.getHostBookings(hostId);
    setAllBookings(bookings);
    setPendingRequests(bookings.filter((b) => b.status === 'PENDING_APPROVAL'));
    setTotalBookings(bookings.filter((b) => b.status === 'APPROVED' || b.status === 'PAID').length);

    const payouts = await payoutsService.getHostPayouts(hostId);
    setPayoutHistory(payouts);

    setLoadingRequests(false);
  }, [hostId]);

  const loadNotifications = useCallback(async () => {
    setLoadingNotifs(true);
    try {
      const { data, error } = await fetchMyNotifications();
      if (!error && data) setNotifications(data);
    } catch (e) {
      console.error('loadNotifications error:', e);
    } finally {
      setLoadingNotifs(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const session = authService.getSession();
      if (session) {
        setCurrentUser(session);
        const pd = session.payout_details as PayoutDetails | undefined;
        if (pd && pd.method !== 'NONE') {
          setPayoutForm({
            method: pd.method === 'CCP' || pd.method === 'RIB' ? pd.method : 'CCP',
            account_name: pd.accountName || hostName,
            account_number: pd.accountNumber || '',
            bank_name: pd.bankName || '',
          });
          setPayoutConfigured(!!pd.accountNumber);
        }
      }
      await loadDashboardData();
      await loadNotifications();
    };
    init();
  }, [hostId, hostName, loadDashboardData, loadNotifications]);

  const handleBookingAction = async (id: string, status: BookingStatus) => {
    const success = await bookingService.updateBookingStatus(id, status);
    if (success) {
      await loadDashboardData();
      onRefresh();
    }
  };

  // ✅ Callback après annulation
  const handleCancellationSuccess = async () => {
    await loadDashboardData();
    onRefresh();
    setCancellingBooking(null);
  };

  const handleSavePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanNumber = payoutForm.account_number.replace(/\s/g, '');
    if (cleanNumber.length !== 20 || !/^\d+$/.test(cleanNumber)) {
      setError(
        `Le ${payoutForm.method === 'CCP' ? 'RIP CCP' : 'RIB bancaire'} doit contenir exactement 20 chiffres.`
      );
      return;
    }

    if (payoutForm.method === 'RIB' && !payoutForm.bank_name) {
      setError('Veuillez sélectionner votre banque.');
      return;
    }

    if (!currentUser) {
      setError('Session expirée, veuillez vous reconnecter.');
      return;
    }

    setSaveStatus('SAVING');

    try {
      const payoutDetails: PayoutDetails = {
        method: payoutForm.method,
        accountName: payoutForm.account_name,
        accountNumber: payoutForm.account_number,
        bankName: payoutForm.method === 'RIB' ? payoutForm.bank_name || undefined : undefined,
      };

      const updatedProfile = await authService.updatePayoutDetails(currentUser.id, payoutDetails);
      if (updatedProfile) {
        setCurrentUser(updatedProfile);
        setPayoutConfigured(true);
        setSaveStatus('SUCCESS');
      } else {
        setError("Impossible de mettre à jour vos coordonnées pour l'instant.");
        setSaveStatus('IDLE');
      }
    } catch (e) {
      console.error('handleSavePayout error:', e);
      setError("Erreur lors de l'enregistrement de vos coordonnées. Réessayez plus tard.");
      setSaveStatus('IDLE');
    } finally {
      setTimeout(() => setSaveStatus('IDLE'), 3000);
    }
  };

  const handleDeleteProperty = async (propertyId: string, title: string) => {
    const ok = window.confirm(
      `Êtes-vous sûr de vouloir supprimer "${title}" ? Cette action est définitive.`
    );
    if (!ok) return;
    const success = await propertyService.remove(propertyId);
    if (success) {
      await loadDashboardData();
      onRefresh();
    } else {
      alert("Impossible de supprimer ce logement pour l'instant.");
    }
  };

  const statusClassPayout: Record<PayoutRecord['status'], string> = {
    COMPLETED: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
    PROCESSING: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
  };

  const recentNotifications = notifications.slice(0, 5);

  // ✅ Séparer les réservations
  const upcomingBookings = allBookings.filter(
    (b) => new Date(b.start_date) > new Date() && ['APPROVED', 'PAID'].includes(b.status)
  );
  const pastBookings = allBookings.filter(
    (b) => new Date(b.end_date) < new Date() && ['APPROVED', 'PAID'].includes(b.status)
  );
  const cancelledBookings = allBookings.filter((b) => b.status === 'CANCELLED');

  // Onglets
  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'overview', label: "Vue d'ensemble", icon: '📊' },
    { id: 'properties', label: 'Mes Biens', icon: '🏠' },
    { id: 'bookings', label: 'Réservations', icon: '📅' },
    { id: 'revenue', label: 'Revenus', icon: '💰' },
    { id: 'settings', label: 'Paramètres', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Header avec tabs */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                Dashboard Hôte
              </h1>
              <p className="text-sm text-white/60 mt-1">
                Bienvenue, <span className="font-bold text-white">{hostName}</span>
              </p>
            </div>
            {!isVerified && (
              <button
                onClick={() => setIsVerifModalOpen(true)}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold text-sm transition-all active:scale-95 flex items-center gap-2"
              >
                <span>⚠️</span>
                <span>Vérifier mon identité</span>
              </button>
            )}
          </div>

          {/* Tabs Navigation */}
          <div className="flex overflow-x-auto gap-2 bg-white/5 p-2 rounded-3xl border border-white/10">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300 flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Contenu selon l'onglet actif */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* 📊 VUE D'ENSEMBLE */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-6 rounded-3xl shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white/80 text-sm font-bold">Revenus confirmés</span>
                    <span className="text-3xl">💰</span>
                  </div>
                  <p className="text-4xl font-black text-white">{formatCurrency(totalRevenue)}</p>
                </div>

                <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white/80 text-sm font-bold">Réservations</span>
                    <span className="text-3xl">📅</span>
                  </div>
                  <p className="text-4xl font-black text-white">{totalBookings}</p>
                </div>

                <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white/80 text-sm font-bold">Logements actifs</span>
                    <span className="text-3xl">🏠</span>
                  </div>
                  <p className="text-4xl font-black text-white">{myProperties.length}</p>
                </div>
              </div>

              {/* Demandes urgentes */}
              {pendingRequests.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-black text-white">
                      Demandes en attente ({pendingRequests.length})
                    </h2>
                    <span className="text-xs font-bold text-amber-400 uppercase animate-pulse">
                      Action requise
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pendingRequests.map((req) => {
                      const age = calculateAge(req.traveler_birthdate);
                      const guests = req.guests_count ?? 1;

                      return (
                        <div
                          key={req.id}
                          className="bg-white/95 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-white/20"
                        >
                          <div className="space-y-4">
                            <div className="flex justify-between items-start">
                              <span className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold">
                                {req.property_title}
                              </span>
                              <span className="text-xs text-gray-400">
                                {new Date(req.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-indigo-400">Voyageur</p>
                              <p className="text-xl font-black text-gray-900">
                                {req.traveler_name || 'Membre LOCADZ'}
                              </p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                <span>
                                  👥 {guests} voyageur{guests > 1 ? 's' : ''}
                                </span>
                                {age != null && <span>• {age} ans</span>}
                              </div>
                            </div>
                            <div className="flex gap-3 p-3 bg-indigo-50 rounded-2xl">
                              <div className="flex-1">
                                <p className="text-xs text-gray-500">Du</p>
                                <p className="text-sm font-bold text-gray-900">
                                  {new Date(req.start_date).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex-1 text-right">
                                <p className="text-xs text-gray-500">Au</p>
                                <p className="text-sm font-bold text-gray-900">
                                  {new Date(req.end_date).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-xs text-indigo-400">Net hôte</p>
                                <p className="text-2xl font-black text-gray-900">
                                  {formatCurrency(
                                    req.payout_host != null
                                      ? Number(req.payout_host)
                                      : Number(req.total_price) - Number(req.commission_fee || 0)
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-3 mt-6">
                            <button
                              onClick={() => handleBookingAction(req.id, 'REJECTED')}
                              className="flex-1 py-3 border-2 border-rose-200 text-rose-500 rounded-2xl text-sm font-bold hover:bg-rose-50 transition-all"
                            >
                              Refuser
                            </button>
                            <button
                              onClick={() => handleBookingAction(req.id, 'APPROVED')}
                              className="flex-[2] py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all"
                            >
                              Accepter
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notifications récentes */}
              <div>
                <h2 className="text-2xl font-black text-white mb-4">Notifications récentes</h2>
                {loadingNotifs ? (
                  <p className="text-white/60">Chargement...</p>
                ) : recentNotifications.length === 0 ? (
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center">
                    <p className="text-white/40">Aucune notification pour le moment</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentNotifications.map((n) => (
                      <div
                        key={n.id}
                        className="bg-white/10 backdrop-blur-xl border border-white/10 p-4 rounded-2xl flex justify-between items-start gap-4"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-bold text-white">{n.title}</p>
                          {n.body && <p className="text-xs text-white/60 mt-1">{n.body}</p>}
                        </div>
                        <span className="text-xs text-white/40">
                          {new Date(n.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 🏠 MES BIENS */}
          {activeTab === 'properties' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-white">Mes logements ({myProperties.length})</h2>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm transition-all active:scale-95 flex items-center gap-2"
                >
                  <span>➕</span>
                  <span>Ajouter un bien</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myProperties.map((prop) => (
                  <div
                    key={prop.id}
                    className="bg-white/95 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl border border-white/20"
                  >
                    <div className="relative h-48">
                      <img
                        src={prop.images[0]?.image_url}
                        alt={prop.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 right-4 flex gap-2">
                        <button
                          onClick={() => setEditingProperty(prop)}
                          className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center text-indigo-600 hover:bg-white transition-all"
                          title="Modifier"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteProperty(prop.id, prop.title)}
                          className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center text-rose-500 hover:bg-white transition-all"
                          title="Supprimer"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-black text-gray-900 mb-2">{prop.title}</h3>
                      <p className="text-sm text-gray-500 mb-4">{prop.location}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-black text-indigo-600">
                          {formatCurrency(prop.price)}
                        </span>
                        <span className="text-sm text-gray-400">/nuit</span>
                      </div>
                      <PropertyCalendar propertyId={prop.id} />
                    </div>
                  </div>
                ))}

                {/* Carte d'ajout */}
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="border-4 border-dashed border-white/20 rounded-3xl p-12 flex flex-col items-center justify-center hover:bg-white/5 hover:border-white/40 transition-all min-h-[400px]"
                >
                  <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <span className="text-white font-bold uppercase tracking-wider">Ajouter un logement</span>
                </button>
              </div>
            </div>
          )}

          {/* 📅 RÉSERVATIONS */}
          {activeTab === 'bookings' && (
            <div className="space-y-8">
              {/* En attente */}
              {pendingRequests.length > 0 && (
                <div>
                  <h2 className="text-2xl font-black text-white mb-4">
                    ⏳ En attente ({pendingRequests.length})
                  </h2>
                  <div className="space-y-3">
                    {pendingRequests.map((booking) => (
                      <div
                        key={booking.id}
                        className="bg-amber-500/10 backdrop-blur-xl border border-amber-500/30 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                      >
                        <div className="flex-1">
                          <h3 className="text-lg font-black text-white mb-2">
                            {booking.property_title || 'Logement'}
                          </h3>
                          <p className="text-sm text-white/60 mb-1">
                            Voyageur : <span className="font-bold text-white">{booking.traveler_name}</span>
                          </p>
                          <p className="text-sm text-white/60">
                            Du {new Date(booking.start_date).toLocaleDateString()} au{' '}
                            {new Date(booking.end_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleBookingAction(booking.id, 'REJECTED')}
                            className="px-4 py-2 bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-sm font-bold hover:bg-rose-500/30 transition-all"
                          >
                            Refuser
                          </button>
                          <button
                            onClick={() => handleBookingAction(booking.id, 'APPROVED')}
                            className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl text-sm font-bold hover:bg-emerald-500/30 transition-all"
                          >
                            Accepter
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* À venir */}
              {upcomingBookings.length > 0 && (
                <div>
                  <h2 className="text-2xl font-black text-white mb-4">
                    🎯 À venir ({upcomingBookings.length})
                  </h2>
                  <div className="space-y-3">
                    {upcomingBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-black text-white">
                              {booking.property_title || 'Logement'}
                            </h3>
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              {booking.status === 'PAID' ? '💳 Payée' : '✅ Confirmée'}
                            </span>
                          </div>
                          <p className="text-sm text-white/60 mb-1">
                            Voyageur : <span className="font-bold text-white">{booking.traveler_name}</span>
                          </p>
                          <p className="text-sm text-white/60">
                            Du {new Date(booking.start_date).toLocaleDateString()} au{' '}
                            {new Date(booking.end_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <p className="text-2xl font-black text-white">
                            {formatCurrency(
                              booking.payout_host != null
                                ? Number(booking.payout_host)
                                : Number(booking.total_price) - Number(booking.commission_fee || 0)
                            )}
                          </p>
                          {/* ✅ Bouton Annuler */}
                          <button
                            onClick={() => setCancellingBooking(booking)}
                            className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-bold transition-all active:scale-95"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Passées */}
              {pastBookings.length > 0 && (
                <div>
                  <h2 className="text-2xl font-black text-white mb-4">
                    📚 Historique ({pastBookings.length})
                  </h2>
                  <div className="space-y-3">
                    {pastBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 opacity-70"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-lg font-black text-white">
                              {booking.property_title || 'Logement'}
                            </h3>
                            <p className="text-sm text-white/60">
                              {new Date(booking.start_date).toLocaleDateString()} - {booking.traveler_name}
                            </p>
                          </div>
                          <p className="text-xl font-black text-white">
                            {formatCurrency(
                              booking.payout_host != null
                                ? Number(booking.payout_host)
                                : Number(booking.total_price) - Number(booking.commission_fee || 0)
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ✅ Annulées */}
              {cancelledBookings.length > 0 && (
                <div>
                  <h2 className="text-2xl font-black text-white mb-4">
                    ❌ Annulées ({cancelledBookings.length})
                  </h2>
                  <div className="space-y-3">
                    {cancelledBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 opacity-50"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-lg font-black text-white line-through">
                              {booking.property_title || 'Logement'}
                            </h3>
                            <p className="text-sm text-white/60">
                              {new Date(booking.start_date).toLocaleDateString()} → {new Date(booking.end_date).toLocaleDateString()}
                            </p>
                            {booking.cancellation_reason && (
                              <p className="text-xs text-rose-400 mt-1">
                                Raison : {booking.cancellation_reason.replace(/_/g, ' ')}
                              </p>
                            )}
                          </div>
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-500/20 text-gray-400 border border-gray-500/30">
                            Annulée
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vide */}
              {allBookings.length === 0 && (
                <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
                  <p className="text-white/40 text-lg">Aucune réservation pour le moment</p>
                </div>
              )}
            </div>
          )}

          {/* 💰 REVENUS */}
          {activeTab === 'revenue' && (
            <div className="space-y-8">
              {/* Configuration virement */}
              <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-900">Virement automatique</h3>
                    <p className="text-sm text-gray-500">Configurez vos coordonnées de paiement</p>
                  </div>
                </div>

                <form onSubmit={handleSavePayout} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setPayoutForm({ ...payoutForm, method: 'CCP' })}
                      className={`p-6 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                        payoutForm.method === 'CCP'
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-200'
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${
                          payoutForm.method === 'CCP' ? 'bg-indigo-600 text-white' : 'bg-gray-100'
                        }`}
                      >
                        📮
                      </div>
                      <div className="text-left">
                        <span
                          className={`text-sm font-bold block ${
                            payoutForm.method === 'CCP' ? 'text-indigo-900' : 'text-gray-400'
                          }`}
                        >
                          Algérie Poste (CCP)
                        </span>
                        <span className="text-xs text-gray-400">Virement via RIP</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPayoutForm({ ...payoutForm, method: 'RIB' })}
                      className={`p-6 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                        payoutForm.method === 'RIB'
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-200'
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${
                          payoutForm.method === 'RIB' ? 'bg-indigo-600 text-white' : 'bg-gray-100'
                        }`}
                      >
                        🏦
                      </div>
                      <div className="text-left">
                        <span
                          className={`text-sm font-bold block ${
                            payoutForm.method === 'RIB' ? 'text-indigo-900' : 'text-gray-400'
                          }`}
                        >
                          Banque classique
                        </span>
                        <span className="text-xs text-gray-400">Virement via RIB</span>
                      </div>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-600 uppercase">Titulaire</label>
                      <input
                        type="text"
                        required
                        value={payoutForm.account_name}
                        onChange={(e) => setPayoutForm({ ...payoutForm, account_name: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition-all"
                        placeholder="NOM PRENOM"
                      />
                    </div>

                    {payoutForm.method === 'RIB' && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-600 uppercase">Banque</label>
                        <select
                          required
                          value={payoutForm.bank_name}
                          onChange={(e) => setPayoutForm({ ...payoutForm, bank_name: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition-all"
                        >
                          <option value="">Sélectionnez votre banque</option>
                          {ALGERIAN_BANKS.map((bank) => (
                            <option key={bank.id} value={bank.id}>
                              {bank.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-600 uppercase">Numéro de compte (20 chiffres)</label>
                    <input
                      type="text"
                      required
                      maxLength={25}
                      value={payoutForm.account_number}
                      onChange={(e) => setPayoutForm({ ...payoutForm, account_number: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-900 tracking-wider focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition-all"
                      placeholder={payoutForm.method === 'CCP' ? 'RIP CCP (20 chiffres)' : 'RIB (20 chiffres)'}
                    />
                  </div>

                  {error && (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-sm font-bold text-rose-600">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={saveStatus === 'SAVING'}
                    className={`w-full py-4 rounded-2xl font-bold uppercase tracking-wider transition-all ${
                      saveStatus === 'SUCCESS'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    } disabled:opacity-50`}
                  >
                    {saveStatus === 'SAVING'
                      ? 'Enregistrement...'
                      : saveStatus === 'SUCCESS'
                      ? '✓ Enregistré'
                      : 'Sauvegarder'}
                  </button>
                </form>
              </div>

              {/* Historique versements */}
              <div>
                <h2 className="text-2xl font-black text-white mb-6">Historique des versements</h2>
                {payoutHistory.length === 0 ? (
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
                    <p className="text-white/40">Aucun versement enregistré</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {payoutHistory.map((record) => (
                      <div
                        key={record.id}
                        className="bg-white/10 backdrop-blur-xl border border-white/10 p-6 rounded-3xl"
                      >
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-xs text-white/60">{record.id}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusClassPayout[record.status]}`}>
                            {record.status === 'COMPLETED' ? 'Effectué' : 'En cours'}
                          </span>
                        </div>
                        <p className="text-3xl font-black text-white mb-2">{formatCurrency(record.amount)}</p>
                        <p className="text-xs text-white/60">
                          Transféré le {new Date(record.date).toLocaleDateString()}
                        </p>
                        <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                          <span className="text-xs text-white/40">Via {record.method}</span>
                          <span className="text-xl">{record.method === 'CCP' ? '📮' : '🏦'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ⚙️ PARAMÈTRES */}
          {activeTab === 'settings' && (
            <div>
              <h2 className="text-2xl font-black text-white mb-6">Paramètres du compte</h2>

              {!isVerified ? (
                <div className="bg-amber-500/20 border border-amber-500/30 rounded-3xl p-8 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-amber-500 rounded-3xl flex items-center justify-center text-3xl">
                      ⚠️
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-amber-100">Vérification d'identité requise</h3>
                      <p className="text-sm text-amber-200/80">
                        Vous devez vérifier votre identité pour gérer vos réservations
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsVerifModalOpen(true)}
                    className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold transition-all"
                  >
                    Vérifier maintenant
                  </button>
                </div>
              ) : (
                <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-3xl p-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center text-3xl">
                      ✓
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-emerald-100">Identité vérifiée</h3>
                      <p className="text-sm text-emerald-200/80">
                        Votre compte est entièrement vérifié et actif
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
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

      <AddPropertyModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        hostId={hostId}
        hostName={hostName}
        onSuccess={loadDashboardData}
      />

      <EditPropertyModal
        isOpen={!!editingProperty}
        onClose={() => setEditingProperty(null)}
        property={editingProperty}
        onSuccess={async () => {
          await loadDashboardData();
          onRefresh();
        }}
      />

      {/* ✅ NOUVEAU : Modal d'annulation */}
      {cancellingBooking && (
        <CancellationModal
          isOpen={!!cancellingBooking}
          onClose={() => setCancellingBooking(null)}
          booking={cancellingBooking}
          userRole="HOST"
          userId={hostId}
          onSuccess={handleCancellationSuccess}
        />
      )}
    </div>
  );
};
