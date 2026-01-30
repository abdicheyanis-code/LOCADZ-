import React, { useEffect, useState } from 'react';
import { Booking, Property, UserProfile, PaymentMethod } from '../types';
import { bookingService } from '../services/bookingService';
import { propertyService } from '../services/propertyService';
import { paymentService } from '../services/paymentService';
import { formatCurrency } from '../services/stripeService';

type BookingWithProperty = Booking & { property?: Property };

interface BookingsViewProps {
  currentUser: UserProfile;
}

const paymentMethodLabel = (method: PaymentMethod) => {
  switch (method) {
    case 'BARIDIMOB':
      return 'BaridiMob / CCP';
    case 'RIB':
      return 'Virement bancaire (RIB)';
    case 'ON_ARRIVAL':
    default:
      return 'Paiement à l’arrivée';
  }
};

const statusLabel: Record<Booking['status'], string> = {
  PENDING_APPROVAL: 'En attente validation hôte',
  APPROVED: 'En attente paiement',
  PAID: 'Payée',
  CANCELLED: 'Annulée',
  REJECTED: 'Refusée',
};

const statusClass: Record<Booking['status'], string> = {
  PENDING_APPROVAL:
    'bg-amber-500/10 text-amber-500 border border-amber-500/20',
  APPROVED:
    'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20',
  PAID:
    'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
  CANCELLED:
    'bg-gray-500/10 text-gray-400 border border-gray-500/20',
  REJECTED:
    'bg-rose-500/10 text-rose-500 border border-rose-500/20',
};

export const BookingsView: React.FC<BookingsViewProps> = ({
  currentUser,
}) => {
  const [bookings, setBookings] = useState<BookingWithProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const rawBookings = await bookingService.getUserBookings(
        currentUser.id
      );
      const props = await propertyService.getAll();
      const mapProps: Record<string, Property> = {};
      props.forEach(p => {
        mapProps[p.id] = p;
      });

      const withProps: BookingWithProperty[] = rawBookings.map(b => ({
        ...b,
        property: mapProps[b.property_id],
      }));

      setBookings(withProps);
    } catch (e) {
      console.error('loadData bookings error:', e);
      setError("Impossible de charger vos réservations pour l'instant.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUploadProof = async (
    booking: BookingWithProperty,
    file: File | null
  ) => {
    if (!file) return;
    setError(null);
    setMessage(null);

    // On ne permet l’envoi que pour BARIDIMOB / RIB
    if (
      booking.payment_method !== 'BARIDIMOB' &&
      booking.payment_method !== 'RIB'
    ) {
      setError(
        "Ce mode de paiement ne nécessite pas d'envoi de reçu via la plateforme."
      );
      return;
    }

    // Idéalement quand la réservation est APPROVED par l’hôte
    if (booking.status === 'PENDING_APPROVAL') {
      setError(
        "Attendez que l'hôte accepte la demande avant d'envoyer la preuve de paiement."
      );
      return;
    }

    setUploadingId(booking.id);

    try {
      const { proofId, error } = await paymentService.uploadPaymentProof({
        userId: currentUser.id,
        bookingId: booking.id,
        amount: booking.total_price,
        paymentMethod: booking.payment_method,
        file,
      });

      if (error || !proofId) {
        console.error('uploadPaymentProof error:', error);
        setError(
          "Échec de l'envoi du reçu. Réessayez plus tard ou contactez le support."
        );
      } else {
        setMessage(
          "Reçu envoyé. L'équipe LOCADZ validera votre paiement manuellement."
        );
      }
    } catch (e) {
      console.error('handleUploadProof error:', e);
      setError(
        "Une erreur inattendue s'est produite lors de l'envoi du reçu."
      );
    } finally {
      setUploadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-40 text-center flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">
          Chargement de vos voyages...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter">
            Mes Voyages
          </h2>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mt-1">
            Suivi de vos réservations & paiements
          </p>
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-white/10 active:scale-95 transition-all flex items-center gap-2"
        >
          <span>↻</span>
          <span>Rafraîchir</span>
        </button>
      </div>

      {message && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-400 font-bold uppercase tracking-wide">
          {message}
        </div>
      )}

      {error && (
        <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-[11px] text-rose-400 font-bold uppercase tracking-wide">
          {error}
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="py-40 text-center opacity-30">
          <p className="text-5xl mb-6">🧳</p>
          <p className="text-[11px] font-black text-white uppercase tracking-[0.4em]">
            Aucune réservation pour le moment
          </p>
          <p className="text-xs text-white/40 mt-3">
            Dès que vous réserverez un séjour, il apparaîtra ici avec son
            statut et les informations de paiement.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(b => {
            const prop = b.property;
            const canUploadProof =
              (b.payment_method === 'BARIDIMOB' ||
                b.payment_method === 'RIB') &&
              (b.status === 'APPROVED' || b.status === 'PENDING_APPROVAL');

            return (
              <div
                key={b.id}
                className="bg-white/5 border border-white/10 rounded-[2rem] p-5 flex flex-col md:flex-row gap-4 items-start md:items-center"
              >
                {/* IMAGE */}
                {prop && prop.images && prop.images[0] && (
                  <img
                    src={prop.images[0].image_url}
                    alt={prop.title}
                    className="w-24 h-24 rounded-2xl object-cover shadow-lg"
                  />
                )}

                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2 justify-between">
                    <div>
                      <p className="text-sm font-black text-white uppercase tracking-tight">
                        {prop?.title || 'Séjour LOCADZ'}
                      </p>
                      <p className="text-[10px] text-white/40 uppercase tracking-[0.2em]">
                        {prop?.location || 'Algérie'}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${statusClass[b.status]}`}
                    >
                      {statusLabel[b.status]}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-[11px] text-white/60 mt-1">
                    <div>
                      <span className="font-black uppercase text-[9px] text-white/40">
                        Du
                      </span>
                      <div className="font-bold">
                        {new Date(b.start_date).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <span className="font-black uppercase text-[9px] text-white/40">
                        Au
                      </span>
                      <div className="font-bold">
                        {new Date(b.end_date).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <span className="font-black uppercase text-[9px] text-white/40">
                        Montant
                      </span>
                      <div className="font-bold">
                        {formatCurrency(b.total_price)}
                      </div>
                    </div>
                    <div>
                      <span className="font-black uppercase text-[9px] text-white/40">
                        Paiement
                      </span>
                      <div className="font-bold">
                        {paymentMethodLabel(b.payment_method)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* BOUTON ENVOI PREUVE */}
                <div className="w-full md:w-auto">
                  {canUploadProof && (
                    <label className="inline-flex items-center gap-2 px-4 py-3 rounded-full bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] cursor-pointer hover:bg-indigo-700 active:scale-95 transition-all">
                      {uploadingId === b.id ? (
                        <>
                          <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          <span>Envoi en cours...</span>
                        </>
                      ) : (
                        <>
                          <span>Envoyer mon reçu</span>
                          <span>📎</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={e =>
                          handleUploadProof(
                            b,
                            e.target.files ? e.target.files[0] : null
                          )
                        }
                      />
                    </label>
                  )}

                  {!canUploadProof && b.status === 'PAID' && (
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">
                      Paiement validé
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
