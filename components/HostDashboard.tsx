import React, { useState, useEffect, useCallback } from 'react';
import {
  Property,
  UserProfile,
  Booking,
  BookingStatus,
  PayoutRecord,
  PayoutDetails,
} from '../types';
import { bookingService } from '../services/bookingService';
import { propertyService } from '../services/propertyService';
import { authService } from '../services/authService';
import { payoutsService } from '../services/payoutsService';
import { formatCurrency } from '../services/stripeService';
import { ALGERIAN_BANKS } from '../constants';
import { AddPropertyModal } from './AddPropertyModal';
import { IdVerificationModal } from './IdVerificationModal';

interface HostDashboardProps {
  hostId: string;
  hostName: string;
  onRefresh: () => void;
}

const PropertyCalendar: React.FC<{ propertyId: string }> = ({ propertyId }) => {
  const now = new Date();
  const currentMonth = now.toLocaleString('fr-FR', { month: 'long' });
  const year = now.getFullYear();

  const [bookedDays, setBookedDays] = useState<number[]>([]);

  useEffect(() => {
    const fetchBookings = async () => {
      const bookings = await bookingService.getBookingsForProperty(propertyId);
      const days: number[] = [];
      bookings.forEach(b => {
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
    <div className="mt-4 p-4 bg-indigo-950/5 rounded-2xl border border-indigo-100/50">
      <div className="flex justify-between items-center mb-3">
        <h5 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
          Occupation • {currentMonth}
        </h5>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
          <span className="text-[8px] font-bold text-gray-400 uppercase">
            Bloqué
          </span>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
          <div
            key={i}
            className="text-[8px] font-black text-indigo-300 text-center mb-1"
          >
            {d}
          </div>
        ))}
        {Array.from({ length: emptyDays }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        {daysArray.map(day => {
          const isBooked = bookedDays.includes(day);
          return (
            <div
              key={day}
              className={`aspect-square flex items-center justify-center text-[9px] font-bold rounded-lg transition-all ${
                isBooked
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-indigo-900/40'
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

export const HostDashboard: React.FC<HostDashboardProps> = ({
  hostId,
  hostName,
  onRefresh,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isVerifModalOpen, setIsVerifModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [pendingRequests, setPendingRequests] = useState<Booking[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  // Formulaire de configuration des virements (UNE méthode à la fois : CCP OU RIB)
  const [payoutForm, setPayoutForm] = useState({
    method: 'CCP' as 'CCP' | 'RIB',
    account_name: hostName,
    account_number: '',
    bank_name: '',
  });
  const [payoutConfigured, setPayoutConfigured] = useState(false);
  const [saveStatus, setSaveStatus] =
    useState<'IDLE' | 'SAVING' | 'SUCCESS'>('IDLE');
  const [error, setError] = useState<string | null>(null);

  const [myProperties, setMyProperties] = useState<Property[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalBookings, setTotalBookings] = useState(0);

  const [payoutHistory, setPayoutHistory] = useState<PayoutRecord[]>([]);

  const loadDashboardData = useCallback(async () => {
    const props = await propertyService.getByHost(hostId);
    setMyProperties(props);

    const revenue = await bookingService.getHostRevenue(
      props.map(p => p.id)
    );
    setTotalRevenue(revenue);

    const allBookings = await bookingService.getHostBookings(hostId);
    setPendingRequests(
      allBookings.filter(b => b.status === 'PENDING_APPROVAL')
    );
    setTotalBookings(
      allBookings.filter(
        b => b.status === 'APPROVED' || b.status === 'PAID'
      ).length
    );

    // Charger l'historique réel des virements depuis la table payouts
    const payouts = await payoutsService.getHostPayouts(hostId);
    setPayoutHistory(payouts);

    setLoadingRequests(false);
  }, [hostId]);

  useEffect(() => {
    const init = async () => {
      const session = authService.getSession();
      if (session) {
        setCurrentUser(session);

        // Pré-remplir le formulaire avec payout_details si déjà configuré
        const pd = session.payout_details as PayoutDetails | undefined;
        if (pd && pd.method !== 'NONE') {
          setPayoutForm(prev => ({
            ...prev,
            method:
              pd.method === 'CCP' || pd.method === 'RIB' ? pd.method : 'CCP',
            account_name: pd.accountName || hostName,
            account_number: pd.accountNumber || '',
            bank_name: pd.bankName || '',
          }));
          setPayoutConfigured(!!pd.accountNumber);
        }
      }

      await loadDashboardData();
    };

    init();
  }, [hostId, hostName, loadDashboardData]);

  const handleBookingAction = async (
    id: string,
    status: BookingStatus
  ) => {
    const success = await bookingService.updateBookingStatus(id, status);
    if (success) {
      loadDashboardData();
      onRefresh();
    }
  };

  const handleSavePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanNumber = payoutForm.account_number.replace(/\s/g, '');
    if (cleanNumber.length !== 20 || !/^\d+$/.test(cleanNumber)) {
      setError(
        `Le ${
          payoutForm.method === 'CCP' ? 'RIP CCP' : 'RIB bancaire'
        } doit contenir exactement 20 chiffres.`
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
        bankName:
          payoutForm.method === 'RIB'
            ? payoutForm.bank_name || undefined
            : undefined,
      };

      const updatedProfile = await authService.updatePayoutDetails(
        currentUser.id,
        payoutDetails
      );

      if (updatedProfile) {
        setCurrentUser(updatedProfile);
        setPayoutConfigured(true);
      } else {
        setError(
          "Impossible de mettre à jour vos coordonnées pour l'instant."
        );
      }
    } catch (e) {
      console.error('handleSavePayout error:', e);
      setError(
        "Erreur lors de l'enregistrement de vos coordonnées. Réessayez plus tard."
      );
    } finally {
      setSaveStatus('SUCCESS');
      setTimeout(() => setSaveStatus('IDLE'), 3000);
    }
  };

  const handleUpdatePrice = async (
    propertyId: string,
    currentPrice: number
  ) => {
    const newPrice = prompt(
      `Modifier le tarif par nuit (Actuel: ${currentPrice} DA)`,
      currentPrice.toString()
    );
    if (newPrice && !isNaN(parseInt(newPrice))) {
      const success = await propertyService.update(propertyId, {
        price: parseInt(newPrice),
      });
      if (success) {
        loadDashboardData();
        onRefresh();
      }
    }
  };

  const isVerified =
    currentUser?.id_verification_status === 'VERIFIED';

  const statusClass: Record<PayoutRecord['status'], string> = {
    COMPLETED:
      'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
    PROCESSING:
      'bg-amber-500/10 text-amber-500 border border-amber-500/20',
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 animate-in fade-in slide-in-from-bottom-10 duration-700">
      {/* Bannière Sécurité Hôte */}
      {currentUser && !isVerified && (
        <div className="mb-8 p-6 backdrop-blur-xl rounded-[2.5rem] border border-amber-500/30 bg-amber-500/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-amber-500 rounded-3xl flex items-center justify-center text-3xl shadow-lg animate-bounce-slow">
              ⚠️
            </div>
            <div>
              <h4 className="text-xl font-black italic text-amber-100">
                Vérification Requise
              </h4>
              <p className="text-[10px] font-bold uppercase tracking-widest mt-1 text-amber-200/60">
                Vous devez valider votre identité pour gérer vos
                réservations et publier vos logements.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsVerifModalOpen(true)}
            className="px-8 py-4 bg-amber-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-amber-600 transition-all active:scale-95"
          >
            VÉRIFIER MON IDENTITÉ
          </button>
        </div>
      )}

      {/* Demandes en attente */}
      <div className={`mb-12 ${!isVerified ? 'opacity-80' : ''}`}>
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-black text-white uppercase tracking-tight italic">
            Demandes de Réservation ({pendingRequests.length})
          </h3>
          <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest animate-pulse">
            Action Requise
          </span>
        </div>

        {pendingRequests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingRequests.map(req => (
              <div
                key={req.id}
                className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-indigo-100 flex flex-col justify-between animate-in zoom-in-95 durée-500"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                      {req.property_title}
                    </span>
                    <span className="text-[9px] font-black text-gray-300 uppercase">
                      {new Date(
                        req.created_at
                      ).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-indigo-300 uppercase mb-1">
                      Voyageur
                    </p>
                    <p className="text-xl font-black text-indigo-950 italic">
                      {req.traveler_name || 'Membre LOCADZ'}
                    </p>
                  </div>
                  <div className="flex gap-4 p-4 bg-indigo-50/50 rounded-2xl">
                    <div className="flex-1">
                      <p className="text-[8px] font-black text-gray-400 uppercase">
                        Du
                      </p>
                      <p className="text-xs font-black text-indigo-900">
                        {new Date(
                          req.start_date
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-[8px] font-black text-gray-400 uppercase">
                        Au
                      </p>
                      <p className="text-xs font-black text-indigo-900">
                        {new Date(
                          req.end_date
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <p className="text-[9px] font-black text-indigo-300 uppercase">
                      Net hôte
                    </p>
                    <p className="text-lg font-black text-indigo-950">
                      {formatCurrency(
                        req.payout_host != null
                          ? Number(req.payout_host)
                          : Number(req.total_price) -
                              Number(req.commission_fee || 0)
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 mt-8">
                  <button
                    onClick={() =>
                      handleBookingAction(req.id, 'REJECTED')
                    }
                    className="flex-1 py-4 border-2 border-rose-100 text-rose-500 rounded-2xl text-[9px] font-black uppercase hover:bg-rose-50 transition-all active:scale-95"
                  >
                    REFUSER
                  </button>
                  <button
                    onClick={() =>
                      handleBookingAction(req.id, 'APPROVED')
                    }
                    className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl text-[9px] font-black uppercase shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                  >
                    ACCEPTER
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 bg-white/5 border border-white/10 rounded-[2.5rem] text-center opacity-20 italic font-black uppercase text-xs tracking-[0.4em]">
            Aucune demande en attente
          </div>
        )}
      </div>

      {/* Bloc revenu + config payout */}
      <div
        className={`flex flex-col lg:flex-row gap-8 mb-12 ${
          !isVerified ? 'opacity-80' : ''
        }`}
      >
        <div className="lg:w-1/3 space-y-8">
          <div className="bg-white/20 backdrop-blur-2xl p-8 rounded-[3rem] border border-white/40 shadow-2xl relative overflow-hidden group">
            <p className="text-[10px] font-black uppercase tracking-widest text:white/60 mb-2">
              Revenu Confirmé (DZD)
            </p>
            <h2 className="text-4xl md:text-5xl font-black text-white italic">
              {formatCurrency(totalRevenue)}
            </h2>
            <div className="absolute top-0 right-0 p-6 opacity-20 text-5xl">
              💰
            </div>
          </div>

          <div className="bg-indigo-600 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
            <p className="text-[10px] font-black uppercase tracking-widest text:white/60 mb-2">
              Réservations Approuvées
            </p>
            <h2 className="text-4xl md:text-5xl font-black text:white italic">
              {totalBookings}
            </h2>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-6 bg:white text-indigo-600 px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-xl active:scale-95 w-full"
            >
              Ajouter Logement DZ
            </button>
          </div>
        </div>

        {/* Config virement */}
        <div className="lg:w-2/3">
          <div className="bg:white/95 backdrop-blur-2xl rounded-[3rem] p-10 border border:white shadow-2xl h-full flex flex-col">
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg">
                <svg
                  className="w-5 h-5 text:white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-black italic text-indigo-950 tracking-tighter">
                  Virement Automatique
                </h3>
                <p className="text-[9px] font-black uppercase text-indigo-300 tracking-[0.2em]">
                  Coordonnées de paiement hôte
                </p>
              </div>
            </div>
            <form onSubmit={handleSavePayout} className="flex-1 flex flex-col">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <button
                  type="button"
                  onClick={() =>
                    setPayoutForm({ ...payoutForm, method: 'CCP' })
                  }
                  className={`p-6 rounded-[2rem] border-2 transition-all flex items-center gap-4 text-left ${
                    payoutForm.method === 'CCP'
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-100 hover:border-indigo-100'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items:center justify-center text-2xl ${
                      payoutForm.method === 'CCP'
                        ? 'bg-indigo-600 text:white scale-110'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    📮
                  </div>
                  <div>
                    <span
                      className={`text-xs font-black uppercase tracking-widest block ${
                        payoutForm.method === 'CCP'
                          ? 'text-indigo-900'
                          : 'text-gray-400'
                      }`}
                    >
                      Algérie Poste (CCP)
                    </span>
                    <span className="text-[9px] font-bold text-gray-400">
                      Virement via RIP
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPayoutForm({ ...payoutForm, method: 'RIB' })
                  }
                  className={`p-6 rounded-[2rem] border-2 transition-all flex items-center gap-4 text-left ${
                    payoutForm.method === 'RIB'
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-100 hover:border-indigo-100'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items:center justify-center text-2xl ${
                      payoutForm.method === 'RIB'
                        ? 'bg-indigo-600 text:white scale-110'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    🏦
                  </div>
                  <div>
                    <span
                      className={`text-xs font-black uppercase tracking-widest block ${
                        payoutForm.method === 'RIB'
                          ? 'text-indigo-900'
                          : 'text-gray-400'
                      }`}
                    >
                      Banque Classique
                    </span>
                    <span className="text-[9px] font-bold text-gray-400">
                      Virement via RIB
                    </span>
                  </div>
                </button>
              </div>
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-indigo-300 uppercase ml-3">
                      Titulaire
                    </label>
                    <input
                      type="text"
                      required
                      value={payoutForm.account_name}
                      onChange={e =>
                        setPayoutForm({
                          ...payoutForm,
                          account_name: e.target.value,
                        })
                      }
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-indigo-950 outline-none focus:border-indigo-600 transition-all text-sm"
                      placeholder="NOM PRENOM"
                    />
                  </div>
                  {payoutForm.method === 'RIB' && (
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-indigo-300 uppercase ml-3">
                        Banque
                      </label>
                      <select
                        required
                        value={payoutForm.bank_name}
                        onChange={e =>
                          setPayoutForm({
                            ...payoutForm,
                            bank_name: e.target.value,
                          })
                        }
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-indigo-950 outline-none focus:border-indigo-600 transition-all text-sm appearance-none"
                      >
                        <option value="">
                          Sélectionnez votre banque
                        </option>
                        {ALGERIAN_BANKS.map(bank => (
                          <option key={bank.id} value={bank.id}>
                            {bank.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-indigo-300 uppercase ml-3">
                    Numéro de compte (20 chiffres)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={25}
                    value={payoutForm.account_number}
                    onChange={e =>
                      setPayoutForm({
                        ...payoutForm,
                        account_number: e.target.value,
                      })
                    }
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-indigo-950 outline-none focus:border-indigo-600 tracking-widest transition-all text-sm"
                    placeholder={
                      payoutForm.method === 'CCP'
                        ? 'RIP CCP (20 chiffres)'
                        : 'RIB (20 chiffres)'
                    }
                  />
                </div>
              </div>
              {error && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-[11px] font-black text-rose-600 uppercase tracking-wide">
                  {error}
                </div>
              )}
              <div className="mt-auto">
                <button
                  type="submit"
                  disabled={saveStatus === 'SAVING'}
                  className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3 ${
                    saveStatus === 'SUCCESS'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-indigo-950 text-white hover:bg-black'
                  }`}
                >
                  {saveStatus === 'SAVING'
                    ? 'ENREGISTREMENT...'
                    : saveStatus === 'SUCCESS'
                    ? 'CONFIG ENREGISTRÉE'
                    : 'SAUVEGARDER'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Historique des versements */}
      <div className={`${!isVerified ? 'opacity-80' : ''} mb-12`}>
        <div className="flex items-center gap-4 mb-8">
          <h3 className="text-2xl font-black text-white uppercase tracking-tight italic">
            Historique des Versements
          </h3>
          <div className="h-[1px] flex-1 bg-white/10" />
        </div>

        {payoutHistory.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {payoutHistory.map(record => (
              <div
                key={record.id}
                className="bg-white/5 backdrop-blur-3xl border border-white/10 p-8 rounded-[2.5rem] flex flex-col justify-between hover:bg-white/10 transition-all group overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 p-6 opacity-5 text-4xl group-hover:rotate-12 transition-transform select-none">
                  {record.method === 'CCP' ? '📮' : '🏦'}
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                      {record.id}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${
                        statusClass[record.status]
                      }`}
                    >
                      {record.status === 'COMPLETED'
                        ? 'Virement Effectué'
                        : 'En Cours'}
                    </span>
                  </div>
                  <div>
                    <p className="text-3xl font-black text:white tracking-tighter italic">
                      {formatCurrency(record.amount)}
                    </p>
                    <p className="text-[9px] font-black text:white/40 uppercase tracking-widest mt-1">
                      Transféré le{' '}
                      {new Date(record.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[8px] font-black text:white/30 uppercase tracking-widest">
                    Via {record.method}
                  </span>
                  <svg
                    className="w-4 h-4 text:white/20"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-white/10 rounded-[2.5rem] opacity-20">
            <p className="font-black uppercase tracking-[0.4em] text-[10px] text:white">
              Aucun versement enregistré
            </p>
          </div>
        )}
      </div>

      {/* Propriétés */}
      <div
        className={`grid grid-cols-1 md:grid-cols-2 gap-8 ${
          !isVerified ? 'opacity-80' : ''
        }`}
      >
        {myProperties.map(prop => (
          <div
            key={prop.id}
            className="bg-white/95 backdrop-blur-xl p-8 rounded-[2.5rem] flex flex-col border border-white shadow-2xl transition-all group"
          >
            <div className="flex gap-6 items-start mb-6">
              <img
                src={prop.images[0]?.image_url}
                className="w-28 h-28 rounded-3xl object-cover shadow-2xl"
                alt={prop.title}
              />
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-black text-indigo-900 text-xl italic">
                    {prop.title}
                  </h4>
                  <button
                    onClick={() =>
                      handleUpdatePrice(prop.id, prop.price)
                    }
                    className="text-indigo-600 hover:text-indigo-800 p-2 bg-indigo-50 rounded-xl transition-all hover:scale-110"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </button>
                </div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wide mb-2">
                  {prop.location}
                </p>
                <div className="bg-indigo-50 px-3 py-1.5 rounded-xl inline-flex items:center gap-2">
                  <span className="text-[10px] font-black text-indigo-400 uppercase">
                    Tarif:
                  </span>
                  <span className="text-sm font-black text-indigo-900">
                    {formatCurrency(prop.price)}
                  </span>
                </div>
              </div>
            </div>
            <PropertyCalendar propertyId={prop.id} />
          </div>
        ))}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="border-4 border-dashed border-white/20 rounded-[2.5rem] flex flex-col items:center justify-center p-12 text:white hover:bg:white/10 hover:border:white/40 transition-all min-h-[300px] group"
        >
          <div className="w-16 h-16 rounded-3xl bg:white/20 flex items:center justify-center mb-6">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="4"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>
          <span className="font-black uppercase tracking-[0.3em] text-sm">
            Ajouter DZ
          </span>
        </button>
      </div>

      {/* Modals */}
      {currentUser && (
        <IdVerificationModal
          isOpen={isVerifModalOpen}
          onClose={() => setIsVerifModalOpen(false)}
          currentUser={currentUser}
          onSuccess={updated => {
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
    </div>
  );
};
