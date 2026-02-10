import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Property,
  UserProfile,
  PaymentMethod,
  Payout,
  AppLanguage,
} from '../types';
import {
  calculatePricing,
  createLocalPaymentSession,
  formatCurrency,
  formatCurrencyEURFromDZD,
} from '../services/stripeService';
import { bookingService } from '../services/bookingService';
import { payoutService } from '../services/payoutService';
import { paymentService } from '../services/paymentService';
import { ReviewSection } from './ReviewSection';
import L from 'leaflet';
import { useNotification } from './NotificationProvider';
import { supabase } from '../supabaseClient';
import { PLATFORM_PAYOUT } from '../constants';

interface PropertyDetailProps {
  property: Property;
  isOpen: boolean;
  currentUser: UserProfile | null;
  onClose: () => void;
  onBookingSuccess: () => void;
  language: AppLanguage;
  translations: any;
}

type Step =
  | 'OVERVIEW'
  | 'DATES'
  | 'CONFIRMATION'
  | 'UPLOAD_RECEIPT'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'REVIEWS'
  | 'MAP';

const PropertyMap: React.FC<{ property: Property }> = ({ property }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || !property.latitude || !property.longitude)
      return;

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView(
        [property.latitude, property.longitude],
        13
      );
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(mapRef.current);

      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #4f46e5; width: 40px; height: 40px; border-radius: 50%; border: 4px solid white; box-shadow: 0 4px 15px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 20px;">🏠</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      L.marker([property.latitude, property.longitude], { icon: customIcon })
        .addTo(mapRef.current)
        .bindPopup(
          `<div style="font-family: 'Inter', sans-serif; font-weight: 800; color: #1e1b4b;">${property.title}</div>`
        )
        .openPopup();
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [property]);

  return (
    <div className="w-full animate-in fade-in zoom-in-95 duration-700">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/50">
          Emplacement approximatif • {property.location}
        </p>
        {property.maps_url && (
          <a
            href={property.maps_url}
            target="_blank"
            rel="noreferrer"
            className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-300 underline hover:text-indigo-100"
          >
            Ouvrir dans Google Maps
          </a>
        )}
      </div>

      <div className="h-[400px] md:h-[500px] shadow-2xl border-4 border-white/50 rounded-3xl overflow-hidden">
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
};

export const PropertyDetail: React.FC<PropertyDetailProps> = ({
  property,
  isOpen,
  currentUser,
  onClose,
  onBookingSuccess,
  language,
  translations: t,
}) => {
  const [step, setStep] = useState<Step>('OVERVIEW');
  const [currentImg, setCurrentImg] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // ✅ nouveaux champs
  const [guestsCount, setGuestsCount] = useState<number>(1);
  const [birthdate, setBirthdate] = useState<string>('');

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('BARIDIMOB');

  const [hostPayout, setHostPayout] = useState<Payout | null>(null);
  const [isBlocking, setIsBlocking] = useState(false);

  const [lastBookingId, setLastBookingId] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadInfo, setUploadInfo] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('OVERVIEW');
      setCurrentImg(0);
      setHostPayout(payoutService.getByHost(property.host_id));
      setLastBookingId(null);
      setProofFile(null);
      setUploadError(null);
      setUploadInfo(null);
      setGuestsCount(1);
      setBirthdate('');
    }
  }, [isOpen, property.host_id]);

  const nights = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diff = e.getTime() - s.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [startDate, endDate]);

  const pricing = calculatePricing(property.price, nights || 1);
  const isRTL = language === 'ar';
  const { notify } = useNotification();

  const todayStr = useMemo(
    () => new Date().toISOString().slice(0, 10),
    []
  );

  const handleSafeClose = () => {
    if (isBlocking) return;
    onClose();
  };

  const handleBooking = async () => {
    if (!currentUser) {
      notify({
        type: 'error',
        message: 'Veuillez vous connecter pour réserver.',
      });
      return;
    }
    if (!startDate || !endDate || nights <= 0) {
      notify({
        type: 'error',
        message: 'Merci de sélectionner des dates valides.',
      });
      setStep('DATES');
      return;
    }
    if (!guestsCount || guestsCount < 1) {
      notify({
        type: 'error',
        message: 'Merci de saisir le nombre de voyageurs.',
      });
      setStep('DATES');
      return;
    }
    if (!birthdate) {
      notify({
        type: 'error',
        message:
          'Merci de saisir la date de naissance du voyageur principal.',
      });
      setStep('DATES');
      return;
    }

    setStep('PROCESSING');
    setIsBlocking(true);

    try {
      // Nettoyer ancienne demande PENDING_APPROVAL du même voyageur / mêmes dates
      await supabase
        .from('bookings')
        .delete()
        .eq('property_id', property.id)
        .eq('traveler_id', currentUser.id)
        .eq('status', 'PENDING_APPROVAL')
        .eq('start_date', startDate)
        .eq('end_date', endDate);
    } catch (e) {
      console.warn('Cleanup ancienne réservation PENDING échouée :', e);
    }

    const isAvail = await bookingService.isRangeAvailable(
      property.id,
      new Date(startDate),
      new Date(endDate)
    );

    if (!isAvail) {
      notify({
        type: 'error',
        message:
          "Désolé, ces dates viennent d'être bloquées par un autre voyageur.",
      });
      setStep('DATES');
      setIsBlocking(false);
      return;
    }

    const result = await createLocalPaymentSession(property.id, pricing);

    if (result.success) {
      const newBooking = await bookingService.createBooking({
        property_id: property.id,
        traveler_id: currentUser.id,
        start_date: startDate,
        end_date: endDate,

        total_price: pricing.totalClient,
        base_price: pricing.base,
        service_fee_client: pricing.serviceFeeClient,
        host_commission: pricing.hostCommission,
        payout_host: pricing.payoutHost,

        payment_method: paymentMethod,
        payment_id: result.transactionId,
        receipt_url: undefined,

        // ✅ nouveaux champs
        guests_count: guestsCount,
        traveler_birthdate: birthdate,
      });

      if (newBooking) {
        setLastBookingId(newBooking.id);

        if (
          paymentMethod === 'BARIDIMOB' ||
          paymentMethod === 'RIB' ||
          paymentMethod === 'PAYPAL'
        ) {
          setStep('UPLOAD_RECEIPT');
        } else {
          notify({
            type: 'success',
            message: 'Demande de réservation envoyée.',
          });
          setStep('SUCCESS');
          onBookingSuccess();
        }
      } else {
        notify({
          type: 'error',
          message:
            "Impossible de créer la réservation, veuillez réessayer.",
        });
        setStep('CONFIRMATION');
      }
    } else {
      notify({
        type: 'error',
        message:
          'La simulation de paiement a échoué, veuillez réessayer.',
      });
      setStep('CONFIRMATION');
    }

    setIsBlocking(false);
  };

  const handleUploadProof = async () => {
    if (!currentUser) {
      setUploadError('Veuillez vous connecter pour envoyer une preuve.');
      return;
    }
    if (!lastBookingId) {
      setUploadError('Aucune réservation associée trouvée.');
      return;
    }
    if (!proofFile) {
      setUploadError(
        'Merci de sélectionner un fichier (image ou PDF).'
      );
      return;
    }

    setIsBlocking(true);
    setUploadError(null);
    setUploadInfo(null);

    const { proofId, error } = await paymentService.uploadPaymentProof({
      userId: currentUser.id,
      bookingId: lastBookingId,
      amount: pricing.total,
      paymentMethod,
      file: proofFile,
    });

    setIsBlocking(false);

    if (error || !proofId) {
      console.error('Upload proof error:', error);
      setUploadError(
        "Erreur lors de l'envoi de la preuve. Merci de réessayer."
      );
      return;
    }

    setUploadInfo(
      "Preuve de paiement envoyée. Elle sera vérifiée par l'hôte / LOCA DZ."
    );
    setStep('SUCCESS');
    onBookingSuccess();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end md:items-center justify-center"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div
        className="absolute inset-0 bg-indigo-950/40 backdrop-blur-2xl animate-in fade-in duration-500"
        onClick={handleSafeClose}
      />

      <div className="relative w-full max-w-6xl h-[100dvh] md:h-[90vh] bg-white md:rounded-[4rem] shadow-[0_60px_150px_rgba(0,0,0,0.5)] border-none md:border border-white/40 overflow-hidden flex flex-col md:flex-row animate-in slide-in-from-bottom-20 duration-500">
        <button
          onClick={handleSafeClose}
          className={`absolute top-6 ${
            isRTL ? 'right-6' : 'left-6'
          } z-50 bg-white/20 hover:bg-white/40 text-white p-4 rounded-full backdrop-blur-xl transition-all border border-white/20 shadow-xl active:scale-90 group`}
        >
          <svg
            className={`w-6 h-6 transition-transform ${
              isRTL
                ? 'group-hover:translate-x-1'
                : 'group-hover:-translate-x-1'
            } ${isRTL ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </button>

        {/* Galerie */}
        <div className="w-full md:w-[60%] h-[35vh] md:h-full relative overflow-hidden bg-black group/gallery">
          <div
            className="absolute inset-0 flex transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${currentImg * 100}%)` }}
          >
            {property.images.map(img => (
              <img
                key={img.id}
                src={img.image_url}
                className="w-full h-full object-cover flex-shrink-0"
                alt={property.title}
              />
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
          <div
            className={`absolute bottom-12 ${
              isRTL ? 'right-8' : 'left-8'
            } pointer-events-none`}
          >
            <h2 className="text-4xl md:text-7xl font-black text-white italic tracking-tighter drop-shadow-2xl leading-tight uppercase">
              {property.title}
            </h2>
            <p className="text-white/70 font-bold text-lg md:text-xl mt-2 flex items-center gap-2">
              <span>📍</span> {property.location}
            </p>
          </div>
        </div>

        {/* Panneau droit */}
        <div className="w-full md:w-[40%] flex flex-col bg-white overflow-y-auto no-scrollbar relative">
          <div className="p-8 md:p-12 space-y-8 flex-1">
            {(step === 'OVERVIEW' ||
              step === 'REVIEWS' ||
              step === 'MAP') && (
              <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-4">
                <button
                  onClick={() => setStep('OVERVIEW')}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    step === 'OVERVIEW'
                      ? 'bg-white shadow-lg text-indigo-600'
                      : 'text-gray-400'
                  }`}
                >
                  Détails
                </button>
                <button
                  onClick={() => setStep('MAP')}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    step === 'MAP'
                      ? 'bg-white shadow-lg text-indigo-600'
                      : 'text-gray-400'
                  }`}
                >
                  Carte
                </button>
                <button
                  onClick={() => setStep('REVIEWS')}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    step === 'REVIEWS'
                      ? 'bg-white shadow-lg text-indigo-600'
                      : 'text-gray-400'
                  }`}
                >
                  Avis
                </button>
              </div>
            )}

            {step === 'OVERVIEW' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
                <p className="text-indigo-950 font-medium italic text-2xl leading-relaxed">
                  &quot;{property.description}&quot;
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-indigo-50/50 p-6 rounded-[2.5rem] border border-indigo-100/50 shadow-inner group">
                    <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-1">
                      Prix Nuitée
                    </p>
                    <p className="text-2xl font-black text-indigo-950">
                      {formatCurrency(property.price)}
                    </p>
                  </div>
                  <div className="bg-amber-50/50 p-6 rounded-[2.5rem] border border-amber-100/50 shadow-inner group">
                    <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-1">
                      Qualité Hôte
                    </p>
                    <p className="text-2xl font-black text-amber-600">
                      {property.rating} ★
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setStep('DATES')}
                  className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95"
                >
                  RÉSERVER CE SÉJOUR
                </button>
              </div>
            )}

            {step === 'DATES' && (
              <div className="animate-in slide-in-from-right duration-500 space-y-8">
                <button
                  onClick={() => setStep('OVERVIEW')}
                  className="text-indigo-400 font-black uppercase text-[10px] tracking-[0.3em]"
                >
                  ← RETOUR
                </button>
                <h3 className="text-3xl font-black italic text-indigo-950 tracking-tighter mb-2">
                  Dates & Détails du séjour
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-black text-indigo-700 uppercase block mb-1">
                      Arrivée
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full border border-indigo-200 rounded-xl px-3 py-2 text-sm text-indigo-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-black text-indigo-700 uppercase block mb-1">
                      Départ
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="w-full border border-indigo-200 rounded-xl px-3 py-2 text-sm text-indigo-900 bg-white"
                    />
                  </div>

                  {/* Nombre de voyageurs */}
                  <div>
                    <label className="text-[11px] font-black text-indigo-700 uppercase block mb-1">
                      Nombre de voyageurs
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={guestsCount}
                      onChange={e =>
                        setGuestsCount(
                          Math.max(1, Math.min(20, Number(e.target.value) || 1))
                        )
                      }
                      className="w-full border border-indigo-200 rounded-xl px-3 py-2 text-sm text-indigo-900 bg-white"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      Indiquez le nombre total de personnes présentes pendant le séjour.
                    </p>
                  </div>

                  {/* Date de naissance */}
                  <div>
                    <label className="text-[11px] font-black text-indigo-700 uppercase block mb-1">
                      Date de naissance du voyageur principal
                    </label>
                    <input
                      type="date"
                      value={birthdate}
                      max={todayStr}
                      onChange={e => setBirthdate(e.target.value)}
                      className="w-full border border-indigo-200 rounded-xl px-3 py-2 text-sm text-indigo-900 bg-white"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      L&apos;hôte pourra demander une pièce d&apos;identité le jour J
                      pour vérifier que c&apos;est bien vous.
                    </p>
                  </div>
                </div>

                {nights > 0 && (
                  <div className="mt-6 p-6 bg-indigo-950 rounded-[2.5rem] text-white space-y-4 shadow-2xl">
                    <div className="flex justify-between text-[10px] font-black opacity-50 uppercase">
                      <span>
                        {nights} nuits x {formatCurrency(property.price)}
                      </span>
                      <span>
                        {formatCurrency(nights * property.price)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] font-black opacity-50 uppercase">
                      <span>Frais de service (5%)</span>
                      <span>{formatCurrency(pricing.commission)}</span>
                    </div>
                    <div className="h-[1px] bg-white/10 my-4" />
                    <div className="flex justify-between items-end">
                      <span className="text-2xl font-black italic tracking-tighter">
                        Total
                      </span>
                      <div className="flex flex-col items-end">
                        <span className="text-4xl font-black text-indigo-300">
                          {formatCurrency(pricing.total)}
                        </span>
                        <span className="text-[11px] text-indigo-200 mt-1">
                          ≈ {formatCurrencyEURFromDZD(pricing.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setStep('CONFIRMATION')}
                  disabled={nights <= 0}
                  className="w-full mt-4 py-6 bg-indigo-600 disabled:opacity-30 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl transition-all"
                >
                  CONTINUER
                </button>
              </div>
            )}

            {step === 'CONFIRMATION' && (
              <div className="animate-in slide-in-from-right duration-500 space-y-8 pb-10">
                <button
                  onClick={() => setStep('DATES')}
                  className="text-indigo-400 font-black uppercase text-[10px] tracking-[0.3em]"
                >
                  ← RETOUR
                </button>
                <h3 className="text-2xl font-black italic text-indigo-950 tracking-tighter uppercase">
                  Mode de paiement
                </h3>

                <div className="grid grid-cols-1 gap-3">
                  {/* BARIDIMOB / CCP */}
                  <button
                    onClick={() => setPaymentMethod('BARIDIMOB')}
                    className={`p-6 rounded-[2rem] border-2 transition-all flex items-center gap-4 text-left ${
                      paymentMethod === 'BARIDIMOB'
                        ? 'border-indigo-600 bg-indigo-50 shadow-xl'
                        : 'border-gray-100 bg-white'
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${
                        paymentMethod === 'BARIDIMOB'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      📲
                    </div>
                    <div>
                      <span className="text-xs font-black uppercase block text-indigo-900">
                        BaridiMob / CCP
                      </span>
                      <span className="text-[9px] font-bold text-gray-400 leading-none">
                        Virement Algérie Poste
                      </span>
                    </div>
                  </button>

                  {/* RIB bancaire */}
                  <button
                    onClick={() => setPaymentMethod('RIB')}
                    className={`p-6 rounded-[2rem] border-2 transition-all flex items-center gap-4 text-left ${
                      paymentMethod === 'RIB'
                        ? 'border-indigo-600 bg-indigo-50 shadow-xl'
                        : 'border-gray-100 bg-white'
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${
                        paymentMethod === 'RIB'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      🏦
                    </div>
                    <div>
                      <span className="text-xs font-black uppercase block text-indigo-900">
                        Banque (RIB)
                      </span>
                      <span className="text-[9px] font-bold text-gray-400 leading-none">
                        Virement vers un RIB bancaire
                      </span>
                    </div>
                  </button>

                  {/* PayPal (paiement manuel + reçu) */}
                  <button
                    onClick={() => setPaymentMethod('PAYPAL')}
                    className={`p-6 rounded-[2rem] border-2 transition-all flex items-center gap-4 text-left ${
                      paymentMethod === 'PAYPAL'
                        ? 'border-indigo-600 bg-indigo-50 shadow-xl'
                        : 'border-gray-100 bg-white'
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${
                        paymentMethod === 'PAYPAL'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      💳
                    </div>
                    <div>
                      <span className="text-xs font-black uppercase block text-indigo-900">
                        PayPal
                      </span>
                      <span className="text-[9px] font-bold text-gray-400 leading-none">
                        Paiement en ligne (reçu à uploader)
                      </span>
                    </div>
                  </button>
                </div>

                <button
                  onClick={handleBooking}
                  disabled={isBlocking}
                  className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl transition-all disabled:opacity-50"
                >
                  DEMANDER À RÉSERVER
                </button>
              </div>
            )}

            {step === 'UPLOAD_RECEIPT' && (
              <div className="animate-in slide-in-from-right duration-500 space-y-8 pb-10">
                <button
                  onClick={() => setStep('CONFIRMATION')}
                  className="text-indigo-400 font-black uppercase text-[10px] tracking-[0.3em]"
                >
                  ← RETOUR
                </button>
                <h3 className="text-2xl font-black italic text-indigo-950 tracking-tighter uppercase">
                  Preuve de paiement
                </h3>

                <div className="p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100 space-y-2 text-[11px]">
                  <p className="font-bold text-indigo-900">
                    Montant à payer : {formatCurrency(pricing.total)}
                  </p>

                  {paymentMethod === 'PAYPAL' ? (
                    <>
                      <p className="text-indigo-700 font-semibold">
                        Paiement via PayPal :
                      </p>
                      <p className="text-gray-600">
                        Envoyez le montant à cette adresse PayPal :
                      </p>
                      <p className="text-gray-900 font-semibold break-all">
                        {PLATFORM_PAYOUT.paypal.email}
                      </p>
                      <p className="text-gray-500 mt-2">
                        Après paiement, faites une capture d&apos;écran ou
                        téléchargez le reçu depuis votre compte PayPal, puis
                        uploadez-le ci-dessous.
                      </p>
                    </>
                  ) : hostPayout ? (
                    <>
                      <p className="text-indigo-700 font-semibold">
                        Coordonnées de paiement (bénéficiaire) :
                      </p>
                      <p className="text-gray-600">
                        {hostPayout.method} • {hostPayout.account_number}
                      </p>
                      {hostPayout.bank_name && (
                        <p className="text-gray-600">
                          {hostPayout.bank_name}
                        </p>
                      )}
                      <p className="text-gray-500 mt-2">
                        Merci d&apos;effectuer le paiement via le mode choisi
                        (BaridiMob / RIB), puis d&apos;uploader un reçu
                        (capture écran ou PDF).
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-500">
                      Coordonnées de paiement hôte non configurées. Merci de
                      contacter LOCA DZ.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-indigo-300 ml-1">
                    Fichier (image ou PDF)
                  </label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={e => {
                      const file = e.target.files?.[0] || null;
                      setProofFile(file);
                      setUploadError(null);
                      setUploadInfo(null);
                    }}
                    className="w-full text-[11px] bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2 file:mr-3 file:px-3 file:py-1 file:rounded-xl file:border-none file:bg-indigo-600 file:text-white file:text-[10px] file:font-black"
                  />
                </div>

                {uploadError && (
                  <div className="p-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 text-[11px] font-black uppercase tracking-wide">
                    {uploadError}
                  </div>
                )}

                {uploadInfo && (
                  <div className="p-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 text-[11px] font-black uppercase tracking-wide">
                    {uploadInfo}
                  </div>
                )}

                <button
                  onClick={handleUploadProof}
                  disabled={isBlocking || !proofFile}
                  className="w-full py-4 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-40"
                >
                  ENVOYER LA PREUVE
                </button>
              </div>
            )}

            {step === 'PROCESSING' && (
              <div className="h-full flex flex-col items-center justify-center text-center py-20 animate-in zoom-in-95">
                <div className="w-28 h-28 border-4 border-indigo-50 border-t-indigo-600 rounded-full animate-spin mb-12" />
                <h3 className="text-2xl font-black italic text-indigo-950 uppercase tracking-tight">
                  Vérification de disponibilité...
                </h3>
              </div>
            )}

            {step === 'SUCCESS' && (
              <div className="h-full flex flex-col items-center justify-center text-center py-20 animate-in zoom-in-95 duration-700">
                <div className="w-32 h-32 bg-amber-500 rounded-full flex items-center justify-center shadow-2xl mb-12 animate-bounce-slow">
                  <svg
                    className="w-16 h-16 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="4"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h2 className="text-5xl font-black text-indigo-950 italic tracking-tighter mb-4">
                  Demande Envoyée
                </h2>
                <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-12 px-8 leading-relaxed">
                  L&apos;hôte a été notifié. Il a{' '}
                  <span className="text-indigo-600">24 heures</span> pour
                  accepter ou refuser votre demande. Vous recevrez une
                  notification.
                </p>
                <button
                  onClick={handleSafeClose}
                  className="w-full py-6 bg-indigo-950 hover:bg-black text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl transition-all"
                >
                  TERMINER
                </button>
              </div>
            )}

            {step === 'MAP' && <PropertyMap property={property} />}

            {step === 'REVIEWS' && (
              <ReviewSection
                propertyId={property.id}
                currentUser={currentUser}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
