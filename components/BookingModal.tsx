import React, { useState, useMemo } from 'react';
import { Property, UserProfile } from '../types';
import { calculatePricing } from '../services/stripeService';
import { bookingService } from '../services/bookingService';
import type { PaymentMethod } from '../types';
import { PLATFORM_PAYOUT } from '../constants';

interface BookingModalProps {
  property: Property;
  isOpen: boolean;
  currentUser: UserProfile | null;
  onClose: () => void;
  onOpenAuth: () => void;
  onBookingSuccess: () => void;
}

type BookingStep = 'DETAILS' | 'SUCCESS';

export const BookingModal: React.FC<BookingModalProps> = ({
  property,
  isOpen,
  currentUser,
  onClose,
  onOpenAuth,
  onBookingSuccess,
}) => {
  const [step, setStep] = useState<BookingStep>('DETAILS');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modes : BARIDIMOB / RIB / PAYPAL
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BARIDIMOB');

  const nights = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diff = e.getTime() - s.getTime();
    const result = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return result > 0 ? result : 0;
  }, [startDate, endDate]);

  const pricing = calculatePricing(property.price, nights || 1);
  const basePrice = property.price * (nights || 1);
  const serviceFeeClient = pricing.commission; // 8 %
  const hostCommission = Math.round(basePrice * 0.1); // 10 % plateforme côté hôte
  const payoutHost = basePrice - hostCommission;

  const handleStartBooking = async () => {
    setError(null);

    if (!startDate || !endDate || nights <= 0) {
      setError('Veuillez sélectionner des dates valides.');
      return;
    }

    if (!currentUser) {
      setError('Vous devez être connecté pour réserver.');
      onOpenAuth();
      return;
    }

    setIsProcessing(true);

    try {
      // Vérifier la disponibilité
      const isAvailable = await bookingService.isRangeAvailable(
        property.id,
        new Date(startDate),
        new Date(endDate)
      );

      if (!isAvailable) {
        setError('Désolé, ces dates ne sont plus disponibles.');
        setIsProcessing(false);
        return;
      }

      const newBooking = await bookingService.createBooking({
        property_id: property.id,
        traveler_id: currentUser.id,
        start_date: startDate,
        end_date: endDate,
        total_price: pricing.total,
        base_price: basePrice,
        service_fee_client: serviceFeeClient,
        host_commission: hostCommission,
        payout_host: payoutHost,
        payment_method: paymentMethod, // 'BARIDIMOB' | 'RIB' | 'PAYPAL'
      });

      if (!newBooking) {
        setError("Impossible de créer la réservation pour le moment.");
        setIsProcessing(false);
        return;
      }

      setStep('SUCCESS');
      onBookingSuccess();
    } catch (e) {
      console.error('handleStartBooking error:', e);
      setError("Une erreur inattendue s'est produite.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  const paymentLabel =
    paymentMethod === 'BARIDIMOB'
      ? 'BaridiMob / CCP'
      : paymentMethod === 'RIB'
      ? 'Virement bancaire (RIB)'
      : 'PayPal';

  const ccp = PLATFORM_PAYOUT.ccp;
  const rib = PLATFORM_PAYOUT.rib;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-indigo-950/40 backdrop-blur-3xl animate-in fade-in duration-500 p-0 md:p-8">
      <div className="bg-white/95 backdrop-blur-md w-full max-w-6xl h-full md:h-auto md:max-h-[90vh] rounded-none md:rounded-[4rem] shadow-[0_50px_150px_rgba(0,0,0,0.4)] border-none md:border border-white/40 overflow-hidden flex flex-col md:flex-row relative">
        <button
          onClick={onClose}
          className="absolute top-8 right-8 z-50 bg-indigo-950/10 hover:bg-indigo-950/20 text-indigo-950 p-3 rounded-full backdrop-blur-xl transition-all active:scale-90"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* VISUEL BIEN */}
        <div className="w-full md:w-3/5 h-64 md:h-auto relative overflow-hidden group">
          <img
            src={property.images[0]?.image_url}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
            alt={property.title}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />

          <div className="absolute bottom-12 left-12 text-white drop-shadow-2xl">
            <div className="flex gap-2 mb-4">
              <span className="bg-indigo-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                Exclusivité LOCADZ
              </span>
              <span className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/30">
                {property.category}
              </span>
            </div>
            <h2 className="text-5xl font-black italic tracking-tighter mb-2">
              {property.title}
            </h2>
            <p className="text-xl font-medium opacity-80">
              {property.location}
            </p>
          </div>
        </div>

        {/* CONTENU DROIT */}
        <div className="w-full md:w-2/5 flex flex-col p-10 bg-white relative overflow-y-auto no-scrollbar">
          {step === 'DETAILS' && (
            <div className="space-y-8 animate-in slide-in-from-right duration-500">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-6">
                  À propos du séjour
                </h3>
                <p className="text-indigo-950 font-medium leading-relaxed italic text-lg">
                  "
                  {property.description ||
                    "Un lieu d'exception conçu pour les voyageurs en quête de sérénité et de luxe absolu."}
                  "
                </p>
                <div className="flex items-center gap-4 mt-8 pt-8 border-t border-indigo-50">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-xl shadow-inner">
                    👤
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Hôte LOCADZ
                    </p>
                    <p className="font-bold text-indigo-900">
                      {property.hostName || 'Hôte LOCADZ'}
                    </p>
                  </div>
                </div>
              </div>

              {/* DATES */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">
                  Planifier votre arrivée
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-indigo-50/50 rounded-3xl border border-indigo-100">
                    <label className="text-[9px] font-black text-indigo-300 uppercase block mb-2">
                      Arrivée
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full bg-transparent font-bold text-indigo-950 outline-none"
                    />
                  </div>
                  <div className="p-4 bg-indigo-50/50 rounded-3xl border border-indigo-100">
                    <label className="text-[9px] font-black text-indigo-300 uppercase block mb-2">
                      Départ
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="w-full bg-transparent font-bold text-indigo-950 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* MODE DE PAIEMENT */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">
                  Mode de paiement
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('BARIDIMOB')}
                    className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
                      paymentMethod === 'BARIDIMOB'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg'
                        : 'bg-indigo-50 text-indigo-900 border-indigo-100 hover:bg-indigo-100'
                    }`}
                  >
                    <span className="text-xl">📲</span>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em]">
                        BaridiMob / CCP
                      </p>
                      <p className="text-[11px] opacity-80">
                        Virement vers le CCP LOCADZ
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('RIB')}
                    className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
                      paymentMethod === 'RIB'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg'
                        : 'bg-indigo-50 text-indigo-900 border-indigo-100 hover:bg-indigo-100'
                    }`}
                  >
                    <span className="text-xl">🏦</span>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em]">
                        Virement bancaire (RIB)
                      </p>
                      <p className="text-[11px] opacity-80">
                        Virement vers le RIB bancaire LOCADZ
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('PAYPAL')}
                    className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
                      paymentMethod === 'PAYPAL'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg'
                        : 'bg-indigo-50 text-indigo-900 border-indigo-100 hover:bg-indigo-100'
                    }`}
                  >
                    <span className="text-xl">💳</span>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em]">
                        PayPal (en ligne)
                      </p>
                      <p className="text-[11px] opacity-80">
                        Paiement sécurisé via PayPal (bientôt disponible)
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* RÉCAP PRIX */}
              {nights > 0 && (
                <div className="p-8 bg-gradient-to-br from-indigo-900 to-violet-900 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
                  <div className="relative z-10 space-y-3">
                    <div className="flex justify-between text-[10px] font-black opacity-60 uppercase">
                      <span>
                        {nights} nuits x DA {property.price}
                      </span>
                      <span>DA {pricing.subtotal}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-black opacity-60 uppercase">
                      <span>Frais de service (8%)</span>
                      <span>DA {pricing.commission.toFixed(0)}</span>
                    </div>
                    <div className="h-[1px] bg-white/10 my-4" />
                    <div className="flex justify-between items:end">
                      <span className="text-3xl font-black italic tracking-tighter">
                        Total
                      </span>
                      <span className="text-4xl font-black">
                        DA {pricing.total.toFixed(0)}
                      </span>
                    </div>
                  </div>
                  <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white/10 opacity-40 group-hover:animate-shine" />
                </div>
              )}

              {error && (
                <p className="text-rose-500 text-[10px] font-black uppercase text-center">
                  {error}
                </p>
              )}

              <button
                onClick={handleStartBooking}
                disabled={isProcessing || nights <= 0}
                className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-30 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                {isProcessing ? (
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg:white rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg:white rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg:white rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                ) : (
                  'ENVOYER MA DEMANDE'
                )}
              </button>
            </div>
          )}

          {step === 'SUCCESS' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-700">
              <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-200 mb-8 animate-bounce-slow">
                <svg
                  className="w-12 h-12 text:white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="4"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-4xl font-black text-indigo-950 italic tracking-tighter mb-4">
                Demande envoyée
              </h2>
              <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-4 px-6 leading-loose">
                Votre demande de séjour à{' '}
                <span className="text-indigo-600">
                  {property.location}
                </span>{' '}
                a été enregistrée. Après validation de l&apos;hôte, vous
                pourrez effectuer le paiement par{' '}
                <span className="text-indigo-600 font-extrabold">
                  {paymentLabel}
                </span>
                .
              </p>

              {/* Coordonnées de paiement LOCA DZ : seulement pour BARIDIMOB / RIB */}
              {paymentMethod !== 'PAYPAL' && (
                <div className="bg-indigo-50 p-6 rounded-3xl w-full text-left space-y-3 mb-6">
                  <p className="text-[9px] font-black text-indigo-300 uppercase">
                    Coordonnées de paiement LOCA DZ
                  </p>

                  {paymentMethod === 'BARIDIMOB' && (
                    <>
                      <p className="text-xs text-indigo-900">
                        <span className="font-black">Titulaire :</span>{' '}
                        {ccp.accountName}
                      </p>
                      <p className="text-xs text-indigo-900">
                        <span className="font-black">CCP / RIP :</span>{' '}
                        {ccp.accountNumber}
                      </p>
                      <p className="text-[11px] text-indigo-800/70 mt-2">
                        Effectuez un virement BaridiMob / CCP vers ce compte
                        en indiquant votre nom et la référence de réservation
                        dans le motif, puis envoyez le reçu dans l&apos;onglet
                        "Mes voyages".
                      </p>
                    </>
                  )}

                  {paymentMethod === 'RIB' && (
                    <>
                      <p className="text-xs text-indigo-900">
                        <span className="font-black">Titulaire :</span>{' '}
                        {rib.accountName}
                      </p>
                      <p className="text-xs text-indigo-900">
                        <span className="font-black">Banque :</span>{' '}
                        {rib.bankName}
                      </p>
                      <p className="text-xs text-indigo-900">
                        <span className="font-black">RIB :</span>{' '}
                        {rib.accountNumber}
                      </p>
                      <p className="text-[11px] text-indigo-800/70 mt-2">
                        Effectuez un virement bancaire vers ce RIB, puis
                        envoyez le reçu dans l&apos;onglet "Mes voyages".
                      </p>
                    </>
                  )}
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full py-5 border-2 border-indigo-600 text-indigo-600 rounded-full font-black uppercase tracking-widest hover:bg-indigo-600 hover:text:white transition-all"
              >
                Fermer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
