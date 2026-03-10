import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Property,
  UserProfile,
  PaymentMethod,
  AppLanguage,
} from '../types';
import {
  calculatePricing,
  createLocalPaymentSession,
  formatCurrency,
  formatCurrencyEURFromDZD,
} from '../services/stripeService';
import { bookingService } from '../services/bookingService';
import { ReviewSection } from './ReviewSection';
import L from 'leaflet';
import { useNotification } from './NotificationProvider';
import { supabase } from '../supabaseClient';

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
        html: `<div style="background: linear-gradient(135deg, #6366f1, #a855f7); width: 48px; height: 48px; border-radius: 50%; border: 4px solid white; box-shadow: 0 8px 30px rgba(99,102,241,0.4); display: flex; align-items: center; justify-content: center; font-size: 24px;">🏠</div>`,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      });

      L.marker([property.latitude, property.longitude], { icon: customIcon })
        .addTo(mapRef.current)
        .bindPopup(
          `<div style="font-family: 'Inter', sans-serif; font-weight: 800; color: #1e1b4b; font-size: 14px;">${property.title}</div>`
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
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-indigo-600 mb-1">
            📍 Emplacement
          </p>
          <p className="text-sm font-bold text-gray-700">{property.location}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Position approximative pour votre confidentialité</p>
        </div>
        
        {property.maps_url && (
          <a
            href={property.maps_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold text-xs shadow-lg hover:shadow-xl hover:scale-105 transition-all active:scale-95"
          >
            <span>🗺️</span>
            <span>Ouvrir dans Google Maps</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>

      <div className="h-[400px] md:h-[500px] rounded-3xl overflow-hidden shadow-2xl border-2 border-indigo-100 relative group">
        <div ref={mapContainerRef} className="w-full h-full" />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
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
  const [guestsCount, setGuestsCount] = useState<number>(1);
  const [birthdate, setBirthdate] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BARIDIMOB');
  const [isBlocking, setIsBlocking] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep('OVERVIEW');
      setCurrentImg(0);
      setGuestsCount(1);
      setBirthdate('');
      setPaymentMethod('BARIDIMOB');
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
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const handleSafeClose = () => {
    if (isBlocking) return;
    onClose();
  };

  const handleBooking = async () => {
    if (!currentUser) {
      notify({ type: 'error', message: 'Veuillez vous connecter pour réserver.' });
      return;
    }
    if (!startDate || !endDate || nights <= 0) {
      notify({ type: 'error', message: 'Merci de sélectionner des dates valides.' });
      setStep('DATES');
      return;
    }
    if (!guestsCount || guestsCount < 1) {
      notify({ type: 'error', message: 'Merci de saisir le nombre de voyageurs.' });
      setStep('DATES');
      return;
    }
    if (!birthdate) {
      notify({ type: 'error', message: 'Merci de saisir la date de naissance du voyageur principal.' });
      setStep('DATES');
      return;
    }

    setStep('PROCESSING');
    setIsBlocking(true);

    try {
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
      notify({ type: 'error', message: "Désolé, ces dates viennent d'être bloquées par un autre voyageur." });
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
        guests_count: guestsCount,
        traveler_birthdate: birthdate,
      });

      if (newBooking) {
        notify({ type: 'success', message: 'Demande de réservation envoyée.' });
        setStep('SUCCESS');
        onBookingSuccess();
      } else {
        notify({ type: 'error', message: "Impossible de créer la réservation, veuillez réessayer." });
        setStep('CONFIRMATION');
      }
    } else {
      notify({ type: 'error', message: 'La simulation de demande a échoué, veuillez réessayer.' });
      setStep('CONFIRMATION');
    }

    setIsBlocking(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-0 md:p-4"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-indigo-950/60 via-purple-950/40 to-black/60 backdrop-blur-xl animate-in fade-in duration-500"
        onClick={handleSafeClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-6xl h-[100dvh] md:h-[92vh] bg-white md:rounded-[3rem] shadow-[0_60px_150px_rgba(0,0,0,0.6)] border-none md:border-2 md:border-white/20 overflow-hidden flex flex-col md:flex-row animate-in slide-in-from-bottom-20 md:zoom-in-95 duration-500">
        
        {/* Bouton fermer */}
        <button
          onClick={handleSafeClose}
          className={`absolute top-4 md:top-6 ${isRTL ? 'right-4 md:right-6' : 'left-4 md:left-6'} z-50 w-12 h-12 flex items-center justify-center bg-white/90 backdrop-blur-md hover:bg-white text-gray-900 rounded-2xl transition-all shadow-xl hover:shadow-2xl active:scale-90 group border border-gray-200`}
        >
          <svg
            className={`w-5 h-5 transition-transform group-hover:scale-110 ${isRTL ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* ========== GALERIE ========== */}
        <div className="w-full md:w-[55%] h-[35vh] md:h-full relative overflow-hidden bg-gradient-to-br from-gray-900 to-black group/gallery">
          {/* Images slider */}
          <div
            className="absolute inset-0 flex transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${currentImg * 100}%)` }}
          >
            {property.images.map((img, idx) => (
              <div key={img.id} className="w-full h-full flex-shrink-0 relative">
                <img
                  src={img.image_url}
                  className="w-full h-full object-cover"
                  alt={`${property.title} - Image ${idx + 1}`}
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              </div>
            ))}
          </div>

          {/* Navigation dots */}
          {property.images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {property.images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImg(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentImg 
                      ? 'w-8 bg-white' 
                      : 'w-1.5 bg-white/40 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Infos bottom */}
          <div className={`absolute bottom-8 ${isRTL ? 'right-6 md:right-10' : 'left-6 md:left-10'} pointer-events-none max-w-[90%] md:max-w-[70%]`}>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider rounded-full">
                {property.category}
              </span>
              <span className="px-3 py-1 bg-amber-500 text-white text-[10px] font-black rounded-full flex items-center gap-1">
                <span>⭐</span>
                <span>{property.rating}</span>
              </span>
            </div>
            
            <h2 className="text-3xl md:text-6xl font-black text-white tracking-tight leading-[1.1] drop-shadow-2xl mb-3">
              {property.title}
            </h2>
            
            <p className="text-white/90 font-bold text-sm md:text-lg flex items-center gap-2">
              <span>📍</span> 
              <span>{property.location}</span>
            </p>

            <div className="mt-4 flex items-center gap-3">
              <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                <p className="text-white/60 text-[9px] font-bold uppercase tracking-wide">À partir de</p>
                <p className="text-white text-2xl font-black">{formatCurrency(property.price)}<span className="text-sm font-normal">/nuit</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* ========== PANNEAU DROIT ========== */}
        <div className="w-full md:w-[45%] flex flex-col bg-gradient-to-br from-gray-50 to-white overflow-y-auto no-scrollbar relative">
          <div className="p-6 md:p-10 space-y-6 flex-1">
            
            {/* Tabs OVERVIEW/MAP/REVIEWS */}
            {(step === 'OVERVIEW' || step === 'REVIEWS' || step === 'MAP') && (
              <div className="flex bg-gray-100 p-1 rounded-2xl sticky top-0 z-10">
                <button
                  onClick={() => setStep('OVERVIEW')}
                  className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wide transition-all ${
                    step === 'OVERVIEW'
                      ? 'bg-white shadow-lg text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Détails
                </button>
                <button
                  onClick={() => setStep('MAP')}
                  className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wide transition-all ${
                    step === 'MAP'
                      ? 'bg-white shadow-lg text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Carte
                </button>
                <button
                  onClick={() => setStep('REVIEWS')}
                  className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wide transition-all ${
                    step === 'REVIEWS'
                      ? 'bg-white shadow-lg text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Avis
                </button>
              </div>
            )}

            {/* ========== OVERVIEW ========== */}
            {step === 'OVERVIEW' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-indigo-600 mb-2">📝 Description</h3>
                  <p className="text-gray-700 leading-relaxed text-base italic">
                    &quot;{property.description}&quot;
                  </p>
                </div>

                {/* Amenities (si dispo) */}
                {property.amenities && property.amenities.length > 0 && (
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-indigo-600 mb-3">✨ Équipements</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {property.amenities.slice(0, 6).map((amenity, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg text-sm text-gray-700">
                          <span className="text-indigo-500">✓</span>
                          <span className="font-medium">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-5 rounded-2xl border border-indigo-100 shadow-sm">
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-wider mb-1">Prix / nuit</p>
                    <p className="text-2xl font-black text-indigo-950">{formatCurrency(property.price)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-2xl border border-amber-100 shadow-sm">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider mb-1">Évaluation</p>
                    <p className="text-2xl font-black text-amber-700">{property.rating} ⭐</p>
                    <p className="text-[9px] text-gray-500 mt-0.5">{property.reviews_count} avis</p>
                  </div>
                </div>

                <button
                  onClick={() => setStep('DATES')}
                  className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl font-black uppercase tracking-wider shadow-xl hover:shadow-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <span>🎯</span>
                  <span>Réserver ce séjour</span>
                </button>
              </div>
            )}

            {/* ========== DATES ========== */}
            {step === 'DATES' && (
              <div className="animate-in slide-in-from-right duration-500 space-y-6">
                <button
                  onClick={() => setStep('OVERVIEW')}
                  className="flex items-center gap-2 text-indigo-600 font-bold text-sm hover:text-indigo-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Retour</span>
                </button>

                <div>
                  <h3 className="text-2xl font-black text-gray-900 mb-1">Dates & voyageurs</h3>
                  <p className="text-sm text-gray-500">Remplissez les informations de votre séjour</p>
                </div>

                <div className="space-y-4">
                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black text-gray-700 uppercase mb-2">📅 Arrivée</label>
                      <input
                        type="date"
                        value={startDate}
                        min={todayStr}
                        onChange={e => setStartDate(e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-xl px-3 py-3 text-sm font-bold text-gray-900 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-700 uppercase mb-2">📅 Départ</label>
                      <input
                        type="date"
                        value={endDate}
                        min={startDate || todayStr}
                        onChange={e => setEndDate(e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-xl px-3 py-3 text-sm font-bold text-gray-900 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                      />
                    </div>
                  </div>

                  {/* Nombre voyageurs */}
                  <div>
                    <label className="block text-xs font-black text-gray-700 uppercase mb-2">👥 Nombre de voyageurs</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={guestsCount}
                      onChange={e => setGuestsCount(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
                      className="w-full border-2 border-gray-200 rounded-xl px-3 py-3 text-sm font-bold text-gray-900 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                    <p className="text-[10px] text-gray-400 mt-1.5">Maximum 20 personnes</p>
                  </div>

                  {/* Date de naissance */}
                  <div>
                    <label className="block text-xs font-black text-gray-700 uppercase mb-2">🎂 Date de naissance (voyageur principal)</label>
                    <input
                      type="date"
                      value={birthdate}
                      max={todayStr}
                      onChange={e => setBirthdate(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-3 py-3 text-sm font-bold text-gray-900 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                    <p className="text-[10px] text-gray-400 mt-1.5 leading-relaxed">
                      Pour la sécurité, l'hôte pourra demander une pièce d'identité à votre arrivée
                    </p>
                  </div>
                </div>

                {/* Récap prix */}
                {nights > 0 && (
                  <div className="bg-gradient-to-br from-indigo-950 to-purple-950 rounded-3xl p-6 text-white space-y-4 shadow-2xl border border-white/10">
                    <p className="text-xs font-black uppercase tracking-wider text-indigo-200">Détail du prix</p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/70">{nights} nuit{nights > 1 ? 's' : ''} × {formatCurrency(property.price)}</span>
                        <span className="font-bold">{formatCurrency(nights * property.price)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/70">Frais de service (5%)</span>
                        <span className="font-bold">{formatCurrency(pricing.serviceFeeClient)}</span>
                      </div>
                    </div>

                    <div className="h-px bg-white/10 my-3" />

                    <div className="flex justify-between items-end">
                      <span className="text-lg font-black">Total</span>
                      <div className="text-right">
                        <p className="text-3xl font-black text-indigo-200">{formatCurrency(pricing.totalClient)}</p>
                        <p className="text-xs text-white/60 mt-0.5">≈ {formatCurrencyEURFromDZD(pricing.totalClient)}</p>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setStep('CONFIRMATION')}
                  disabled={nights <= 0 || !guestsCount || !birthdate}
                  className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white rounded-2xl font-black uppercase tracking-wider shadow-xl hover:shadow-2xl transition-all active:scale-[0.98]"
                >
                  Continuer
                </button>
              </div>
            )}

            {/* ========== CONFIRMATION ========== */}
            {step === 'CONFIRMATION' && (
              <div className="animate-in slide-in-from-right duration-500 space-y-6">
                <button
                  onClick={() => setStep('DATES')}
                  className="flex items-center gap-2 text-indigo-600 font-bold text-sm hover:text-indigo-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Retour</span>
                </button>

                <div>
                  <h3 className="text-2xl font-black text-gray-900 mb-1">Mode de paiement</h3>
                  <p className="text-sm text-gray-500">Choisissez comment vous souhaitez payer</p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {/* BARIDIMOB */}
                  <button
                    onClick={() => setPaymentMethod('BARIDIMOB')}
                    className={`p-5 rounded-2xl border-2 transition-all flex items-center gap-4 text-left group ${
                      paymentMethod === 'BARIDIMOB'
                        ? 'border-indigo-600 bg-indigo-50 shadow-lg ring-2 ring-indigo-200'
                        : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50'
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-all ${
                      paymentMethod === 'BARIDIMOB'
                        ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-400 group-hover:bg-indigo-100 group-hover:text-indigo-500'
                    }`}>
                      📱
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black uppercase text-gray-900">BaridiMob / CCP</p>
                      <p className="text-xs text-gray-500 mt-0.5">Virement Algérie Poste</p>
                    </div>
                    {paymentMethod === 'BARIDIMOB' && (
                      <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>

                  {/* RIB */}
                  <button
                    onClick={() => setPaymentMethod('RIB')}
                    className={`p-5 rounded-2xl border-2 transition-all flex items-center gap-4 text-left group ${
                      paymentMethod === 'RIB'
                        ? 'border-indigo-600 bg-indigo-50 shadow-lg ring-2 ring-indigo-200'
                        : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50'
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-all ${
                      paymentMethod === 'RIB'
                        ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-400 group-hover:bg-indigo-100 group-hover:text-indigo-500'
                    }`}>
                      🏦
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black uppercase text-gray-900">Virement bancaire (RIB)</p>
                      <p className="text-xs text-gray-500 mt-0.5">Banques algériennes</p>
                    </div>
                    {paymentMethod === 'RIB' && (
                      <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>

                  {/* PAYPAL */}
                  <button
                    onClick={() => setPaymentMethod('PAYPAL')}
                    className={`p-5 rounded-2xl border-2 transition-all flex items-center gap-4 text-left group ${
                      paymentMethod === 'PAYPAL'
                        ? 'border-indigo-600 bg-indigo-50 shadow-lg ring-2 ring-indigo-200'
                        : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50'
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-all ${
                      paymentMethod === 'PAYPAL'
                        ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-400 group-hover:bg-indigo-100 group-hover:text-indigo-500'
                    }`}>
                      💳
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black uppercase text-gray-900">PayPal</p>
                      <p className="text-xs text-gray-500 mt-0.5">Paiement en ligne sécurisé</p>
                    </div>
                    {paymentMethod === 'PAYPAL' && (
                      <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <p className="text-xs text-amber-900 leading-relaxed">
                    <span className="font-black">⚠️ Important :</span> Ne payez rien avant que l'hôte accepte votre demande. 
                    Une fois acceptée, vous recevrez un lien pour envoyer votre preuve de paiement.
                  </p>
                </div>

                <button
                  onClick={handleBooking}
                  disabled={isBlocking}
                  className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-2xl font-black uppercase tracking-wider shadow-xl hover:shadow-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isBlocking ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Envoi en cours...</span>
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      <span>Demander à réserver</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* ========== PROCESSING ========== */}
            {step === 'PROCESSING' && (
              <div className="h-full flex flex-col items-center justify-center text-center py-20 animate-in zoom-in-95">
                <div className="w-24 h-24 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-8" />
                <h3 className="text-2xl font-black text-gray-900 mb-2">Vérification en cours...</h3>
                <p className="text-sm text-gray-500">Nous vérifions la disponibilité</p>
              </div>
            )}

            {/* ========== SUCCESS ========== */}
            {step === 'SUCCESS' && (
              <div className="h-full flex flex-col items-center justify-center text-center py-16 animate-in zoom-in-95 duration-700">
                <div className="w-28 h-28 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-2xl mb-8 animate-bounce-slow">
                  <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                
                <h2 className="text-4xl font-black text-gray-900 mb-3">Demande envoyée !</h2>
                
                <p className="text-sm text-gray-600 leading-relaxed mb-8 max-w-md px-4">
                  L'hôte a été notifié et dispose de <span className="font-black text-indigo-600">24 heures</span> pour répondre. 
                  Vous recevrez une notification dès qu'il acceptera ou refusera.
                </p>

                <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 mb-8 max-w-md">
                  <p className="text-xs text-indigo-900 leading-relaxed">
                    <span className="font-black">💡 Rappel :</span> Ne payez rien maintenant ! Si l'hôte accepte, 
                    vous pourrez envoyer votre preuve de paiement depuis <span className="font-black">"Mes Voyages"</span>.
                  </p>
                </div>

                <button
                  onClick={handleSafeClose}
                  className="w-full max-w-sm py-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl font-black uppercase tracking-wider shadow-xl hover:shadow-2xl transition-all active:scale-[0.98]"
                >
                  Terminer
                </button>
              </div>
            )}

            {/* ========== MAP ========== */}
            {step === 'MAP' && <PropertyMap property={property} />}

            {/* ========== REVIEWS ========== */}
            {step === 'REVIEWS' && (
              <ReviewSection propertyId={property.id} currentUser={currentUser} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
