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
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      }).addTo(mapRef.current);

      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background: linear-gradient(135deg, #6366f1, #ec4899); width: 52px; height: 52px; border-radius: 50%; border: 4px solid rgba(255,255,255,0.9); box-shadow: 0 8px 32px rgba(99,102,241,0.6); display: flex; align-items: center; justify-content: center; font-size: 24px; animation: pulse 2s infinite;">🏠</div>`,
        iconSize: [52, 52],
        iconAnchor: [26, 26],
      });

      L.marker([property.latitude, property.longitude], { icon: customIcon })
        .addTo(mapRef.current)
        .bindPopup(
          `<div style="font-family: 'Inter', sans-serif; font-weight: 800; color: #1e1b4b; font-size: 14px; padding: 4px;">${property.title}</div>`
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
      <div className="mb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-lg shadow-lg">
            📍
          </div>
          <div>
            <p className="text-white font-black text-sm">{property.location}</p>
            <p className="text-white/40 text-[10px] mt-0.5">Position approximative</p>
          </div>
        </div>
        
        {property.maps_url && (
          <a
            href={property.maps_url}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white rounded-2xl font-bold text-xs transition-all hover:scale-105 active:scale-95"
          >
            <span>🗺️</span>
            <span>Google Maps</span>
            <svg className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>

      <div className="h-[350px] md:h-[450px] rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative">
        <div ref={mapContainerRef} className="w-full h-full" />
        <div className="absolute inset-0 pointer-events-none rounded-3xl border-2 border-white/5" />
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
      setStartDate('');
      setEndDate('');
    }
  }, [isOpen, property.id]);

  // Auto-slide images
  useEffect(() => {
    if (!isOpen || property.images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImg(prev => (prev + 1) % property.images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isOpen, property.images.length]);

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
      notify({ type: 'error', message: 'Merci de saisir la date de naissance.' });
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
      console.warn('Cleanup error:', e);
    }

    const isAvail = await bookingService.isRangeAvailable(
      property.id,
      new Date(startDate),
      new Date(endDate)
    );

    if (!isAvail) {
      notify({ type: 'error', message: "Ces dates ne sont plus disponibles." });
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
        notify({ type: 'success', message: 'Demande envoyée !' });
        setStep('SUCCESS');
        onBookingSuccess();
      } else {
        notify({ type: 'error', message: "Erreur, veuillez réessayer." });
        setStep('CONFIRMATION');
      }
    } else {
      notify({ type: 'error', message: 'Erreur, veuillez réessayer.' });
      setStep('CONFIRMATION');
    }

    setIsBlocking(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end md:items-center justify-center"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Backdrop avec blur intense */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-2xl animate-in fade-in duration-300"
        onClick={handleSafeClose}
      />

      {/* Modal Container */}
      <div className="relative w-full h-[100dvh] md:h-[95vh] md:max-w-7xl md:mx-4 flex flex-col md:flex-row overflow-hidden animate-in slide-in-from-bottom-8 md:zoom-in-95 duration-500">
        
        {/* ========== GALERIE PLEIN ÉCRAN ========== */}
        <div className="relative w-full md:w-[55%] h-[40vh] md:h-full overflow-hidden md:rounded-l-[2.5rem]">
          {/* Images */}
          <div
            className="absolute inset-0 flex transition-transform duration-1000 ease-out"
            style={{ transform: `translateX(-${currentImg * 100}%)` }}
          >
            {property.images.map((img, idx) => (
              <div key={img.id} className="relative w-full h-full flex-shrink-0">
                <img
                  src={img.image_url}
                  className="w-full h-full object-cover"
                  alt={`${property.title} - ${idx + 1}`}
                />
              </div>
            ))}
          </div>

          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent hidden md:block" />

          {/* Close button */}
          <button
            onClick={handleSafeClose}
            className="absolute top-4 left-4 md:top-6 md:left-6 z-50 w-11 h-11 flex items-center justify-center bg-black/40 hover:bg-black/60 backdrop-blur-xl text-white rounded-full transition-all hover:scale-110 active:scale-95 border border-white/10"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Image counter */}
          {property.images.length > 1 && (
            <div className="absolute top-4 right-4 md:top-6 md:right-6 px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-full text-white text-xs font-bold border border-white/10">
              {currentImg + 1} / {property.images.length}
            </div>
          )}

          {/* Property info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1.5 bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider rounded-full border border-white/20">
                {property.category}
              </span>
              <span className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black rounded-full flex items-center gap-1 shadow-lg">
                ⭐ {property.rating}
                <span className="opacity-70">({property.reviews_count})</span>
              </span>
              {property.isHostVerified && (
                <span className="px-3 py-1.5 bg-emerald-500/20 backdrop-blur-md text-emerald-300 text-[10px] font-black rounded-full border border-emerald-500/30">
                  ✓ Hôte vérifié
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight mb-3">
              {property.title}
            </h1>

            {/* Location */}
            <div className="flex items-center gap-2 text-white/80 mb-4">
              <span className="text-lg">📍</span>
              <span className="font-medium">{property.location}</span>
            </div>

            {/* Price badge */}
            <div className="inline-flex items-baseline gap-1 px-5 py-3 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20">
              <span className="text-3xl md:text-4xl font-black text-white">{formatCurrency(property.price)}</span>
              <span className="text-white/60 font-medium text-sm">/nuit</span>
            </div>

            {/* Dots navigation */}
            {property.images.length > 1 && (
              <div className="flex gap-1.5 mt-6">
                {property.images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImg(idx)}
                    className={`h-1 rounded-full transition-all duration-500 ${
                      idx === currentImg 
                        ? 'w-8 bg-white' 
                        : 'w-1 bg-white/30 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ========== PANNEAU DROIT - DARK GLASS ========== */}
        <div className="relative w-full md:w-[45%] flex-1 md:flex-none md:h-full overflow-hidden md:rounded-r-[2.5rem] bg-[#0a0a0f]">
          {/* Background effects */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 right-0 w-[80%] h-[60%] bg-gradient-to-bl from-indigo-600/10 via-purple-600/5 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-[60%] h-[40%] bg-gradient-to-tr from-pink-600/10 via-transparent to-transparent rounded-full blur-3xl" />
          </div>

          {/* Content */}
          <div className="relative h-full overflow-y-auto no-scrollbar">
            <div className="p-6 md:p-8 space-y-6">
              
              {/* ========== TABS ========== */}
              {(step === 'OVERVIEW' || step === 'REVIEWS' || step === 'MAP') && (
                <div className="flex p-1 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
                  {[
                    { id: 'OVERVIEW', label: 'Aperçu', icon: '✨' },
                    { id: 'MAP', label: 'Carte', icon: '🗺️' },
                    { id: 'REVIEWS', label: 'Avis', icon: '💬' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setStep(tab.id as Step)}
                      className={`flex-1 py-3 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        step === tab.id
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                          : 'text-white/50 hover:text-white/80'
                      }`}
                    >
                      <span>{tab.icon}</span>
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* ========== OVERVIEW ========== */}
              {step === 'OVERVIEW' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  {/* Description */}
                  <div className="relative">
                    <div className="absolute -left-3 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500 rounded-full" />
                    <p className="text-white/70 leading-relaxed text-sm md:text-base italic pl-4">
                      "{property.description}"
                    </p>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="group relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-indigo-500/30 transition-all">
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-wider mb-1 relative">Prix / nuit</p>
                      <p className="text-2xl font-black text-white relative">{formatCurrency(property.price)}</p>
                      <p className="text-[10px] text-white/40 mt-1 relative">≈ {formatCurrencyEURFromDZD(property.price)}</p>
                    </div>
                    
                    <div className="group relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-amber-500/30 transition-all">
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <p className="text-[10px] font-black text-amber-400 uppercase tracking-wider mb-1 relative">Évaluation</p>
                      <p className="text-2xl font-black text-white relative">{property.rating} ⭐</p>
                      <p className="text-[10px] text-white/40 mt-1 relative">{property.reviews_count} avis vérifiés</p>
                    </div>
                  </div>

                  {/* Amenities */}
                  {property.amenities && property.amenities.length > 0 && (
                    <div>
                      <p className="text-xs font-black text-white/50 uppercase tracking-wider mb-3">Équipements</p>
                      <div className="flex flex-wrap gap-2">
                        {property.amenities.slice(0, 6).map((amenity, idx) => (
                          <span 
                            key={idx} 
                            className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white/70 font-medium"
                          >
                            {amenity}
                          </span>
                        ))}
                        {property.amenities.length > 6 && (
                          <span className="px-3 py-2 bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-xs text-indigo-300 font-bold">
                            +{property.amenities.length - 6}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* CTA */}
                  <button
                    onClick={() => setStep('DATES')}
                    className="group relative w-full py-5 overflow-hidden rounded-2xl font-black uppercase tracking-wider transition-all active:scale-[0.98]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 transition-all" />
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-10" />
                    <span className="relative text-white flex items-center justify-center gap-2 text-sm">
                      <span>Réserver maintenant</span>
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  </button>
                </div>
              )}

              {/* ========== DATES ========== */}
              {step === 'DATES' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <button
                    onClick={() => setStep('OVERVIEW')}
                    className="flex items-center gap-2 text-white/50 hover:text-white font-bold text-sm transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Retour</span>
                  </button>

                  <div>
                    <h3 className="text-2xl font-black text-white mb-1">Votre séjour</h3>
                    <p className="text-sm text-white/40">Sélectionnez vos dates et informations</p>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-xs font-bold text-white/60">
                        <span>📅</span> Arrivée
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        min={todayStr}
                        onChange={e => setStartDate(e.target.value)}
                        className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-xs font-bold text-white/60">
                        <span>📅</span> Départ
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        min={startDate || todayStr}
                        onChange={e => setEndDate(e.target.value)}
                        className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Guests */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-white/60">
                      <span>👥</span> Nombre de voyageurs
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setGuestsCount(Math.max(1, guestsCount - 1))}
                        className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl text-white font-bold text-xl hover:bg-white/10 transition-all active:scale-95"
                      >
                        −
                      </button>
                      <div className="flex-1 px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-center">
                        <span className="text-white text-lg font-black">{guestsCount}</span>
                        <span className="text-white/40 text-sm ml-2">personne{guestsCount > 1 ? 's' : ''}</span>
                      </div>
                      <button
                        onClick={() => setGuestsCount(Math.min(20, guestsCount + 1))}
                        className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl text-white font-bold text-xl hover:bg-white/10 transition-all active:scale-95"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Birthdate */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-white/60">
                      <span>🎂</span> Date de naissance (voyageur principal)
                    </label>
                    <input
                      type="date"
                      value={birthdate}
                      max={todayStr}
                      onChange={e => setBirthdate(e.target.value)}
                      className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                    />
                    <p className="text-[10px] text-white/30">Pour la vérification d'identité à l'arrivée</p>
                  </div>

                  {/* Price summary */}
                  {nights > 0 && (
                    <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-pink-600/20 border border-white/10">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl" />
                      
                      <div className="relative space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/60">{nights} nuit{nights > 1 ? 's' : ''} × {formatCurrency(property.price)}</span>
                          <span className="text-white font-bold">{formatCurrency(nights * property.price)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/60">Frais de service</span>
                          <span className="text-white font-bold">{formatCurrency(pricing.serviceFeeClient)}</span>
                        </div>
                        
                        <div className="h-px bg-white/10 my-2" />
                        
                        <div className="flex justify-between items-end">
                          <span className="text-white font-bold">Total</span>
                          <div className="text-right">
                            <p className="text-2xl font-black text-white">{formatCurrency(pricing.totalClient)}</p>
                            <p className="text-[10px] text-white/40">≈ {formatCurrencyEURFromDZD(pricing.totalClient)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setStep('CONFIRMATION')}
                    disabled={nights <= 0 || !guestsCount || !birthdate}
                    className="group relative w-full py-5 overflow-hidden rounded-2xl font-black uppercase tracking-wider transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600" />
                    <span className="relative text-white flex items-center justify-center gap-2 text-sm">
                      Continuer
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  </button>
                </div>
              )}

              {/* ========== CONFIRMATION ========== */}
              {step === 'CONFIRMATION' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <button
                    onClick={() => setStep('DATES')}
                    className="flex items-center gap-2 text-white/50 hover:text-white font-bold text-sm transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Retour</span>
                  </button>

                  <div>
                    <h3 className="text-2xl font-black text-white mb-1">Paiement</h3>
                    <p className="text-sm text-white/40">Comment souhaitez-vous payer ?</p>
                  </div>

                  <div className="space-y-3">
                    {[
                      { id: 'BARIDIMOB', icon: '📱', name: 'BaridiMob / CCP', desc: 'Virement Algérie Poste' },
                      { id: 'RIB', icon: '🏦', name: 'Virement bancaire', desc: 'RIB banques algériennes' },
                      { id: 'PAYPAL', icon: '💳', name: 'PayPal', desc: 'Paiement international' },
                    ].map(method => (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                        className={`group w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 text-left ${
                          paymentMethod === method.id
                            ? 'border-indigo-500 bg-indigo-500/10'
                            : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all ${
                          paymentMethod === method.id
                            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg'
                            : 'bg-white/10'
                        }`}>
                          {method.icon}
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-bold text-sm">{method.name}</p>
                          <p className="text-white/40 text-xs">{method.desc}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center ${
                          paymentMethod === method.id
                            ? 'border-indigo-500 bg-indigo-500'
                            : 'border-white/30'
                        }`}>
                          {paymentMethod === method.id && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                    <p className="text-xs text-amber-200/80 leading-relaxed">
                      <span className="font-black">⚠️ Important :</span> Ne payez rien avant l'acceptation de l'hôte. 
                      Vous recevrez un lien de paiement après confirmation.
                    </p>
                  </div>

                  <button
                    onClick={handleBooking}
                    disabled={isBlocking}
                    className="group relative w-full py-5 overflow-hidden rounded-2xl font-black uppercase tracking-wider transition-all disabled:opacity-50 active:scale-[0.98]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
                    <span className="relative text-white flex items-center justify-center gap-2 text-sm">
                      {isBlocking ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Envoi en cours...</span>
                        </>
                      ) : (
                        <>
                          <span>✨</span>
                          <span>Envoyer ma demande</span>
                        </>
                      )}
                    </span>
                  </button>
                </div>
              )}

              {/* ========== PROCESSING ========== */}
              {step === 'PROCESSING' && (
                <div className="flex flex-col items-center justify-center py-20 animate-in zoom-in-95">
                  <div className="relative w-20 h-20 mb-8">
                    <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full" />
                    <div className="absolute inset-0 border-4 border-transparent border-t-indigo-500 rounded-full animate-spin" />
                    <div className="absolute inset-2 border-4 border-transparent border-t-purple-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
                  </div>
                  <h3 className="text-xl font-black text-white mb-2">Vérification...</h3>
                  <p className="text-sm text-white/40">Nous vérifions la disponibilité</p>
                </div>
              )}

              {/* ========== SUCCESS ========== */}
              {step === 'SUCCESS' && (
                <div className="flex flex-col items-center justify-center py-12 animate-in zoom-in-95 duration-700">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-emerald-500/30 rounded-full blur-2xl animate-pulse" />
                    <div className="relative w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-2xl">
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  
                  <h2 className="text-3xl font-black text-white mb-3 text-center">Demande envoyée !</h2>
                  
                  <p className="text-sm text-white/50 text-center leading-relaxed mb-8 max-w-xs">
                    L'hôte a <span className="text-indigo-400 font-bold">24h</span> pour répondre. 
                    Vous serez notifié dès qu'il acceptera.
                  </p>

                  <div className="w-full p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-6">
                    <p className="text-xs text-indigo-200/80 text-center leading-relaxed">
                      💡 Ne payez rien maintenant. Si accepté, vous recevrez un lien de paiement dans <span className="font-bold">"Mes Voyages"</span>.
                    </p>
                  </div>

                  <button
                    onClick={handleSafeClose}
                    className="w-full py-5 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-2xl font-black uppercase tracking-wider transition-all active:scale-[0.98]"
                  >
                    Fermer
                  </button>
                </div>
              )}

              {/* ========== MAP ========== */}
              {step === 'MAP' && <PropertyMap property={property} />}

              {/* ========== REVIEWS ========== */}
              {step === 'REVIEWS' && (
                <div className="animate-in fade-in duration-500">
                  <ReviewSection propertyId={property.id} currentUser={currentUser} />
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Keyframes pour les animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};
