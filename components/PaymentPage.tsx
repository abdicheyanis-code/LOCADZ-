// components/PaymentPage.tsx

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Booking } from '../types';
import { paymentService } from '../services/paymentService';
import { platformService, PlatformSettings } from '../services/platformService';
import { formatCurrency } from '../services/stripeService';

export const PaymentPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const bookingId = location.pathname.split('/payment/')[1];

  const [booking, setBooking] = useState<Booking | null>(null);
  const [propertyTitle, setPropertyTitle] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Coordonnées de la plateforme
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    loadBooking();
    loadPlatformSettings();
  }, [bookingId]);

  const loadPlatformSettings = async () => {
    const settings = await platformService.getPlatformSettings();
    setPlatformSettings(settings);
  };

  const loadBooking = async () => {
    if (!bookingId) {
      setError('Réservation introuvable');
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (fetchError || !data) {
        console.error('Booking fetch error:', fetchError);
        setError('Réservation introuvable');
        setLoading(false);
        return;
      }

      setBooking(data as Booking);

      if (data.property_id) {
        const { data: property } = await supabase
          .from('properties')
          .select('title')
          .eq('id', data.property_id)
          .single();
        
        if (property?.title) {
          setPropertyTitle(property.title);
        }
      }
    } catch (e) {
      console.error('Load booking error:', e);
      setError('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !booking) return;

    setUploading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Vous devez être connecté');
        setUploading(false);
        return;
      }

      const { proofId, error: uploadError } = await paymentService.uploadPaymentProof({
        userId: user.id,
        bookingId: booking.id,
        amount: booking.total_price,
        paymentMethod: booking.payment_method,
        file,
      });

      if (uploadError || !proofId) {
        setError("Erreur lors de l'envoi. Réessayez.");
        setUploading(false);
        return;
      }

      setSuccess(true);
      
      setTimeout(() => {
        navigate('/bookings');
      }, 3000);

    } catch (e) {
      setError("Erreur inattendue. Réessayez.");
    } finally {
      setUploading(false);
    }
  };

  // ✅ Fonction pour copier dans le presse-papier
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // ✅ Affiche les coordonnées selon la méthode de paiement
  const renderPaymentDetails = () => {
    if (!platformSettings || !booking) return null;

    const method = booking.payment_method;

    // BaridiMob
    if (method === 'BARIDIMOB' && platformSettings.baridimob_number) {
      return (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-5 mb-6">
          <h4 className="text-yellow-300 font-bold mb-3 flex items-center gap-2">
            📱 Payer par BaridiMob
          </h4>
          
          <div className="space-y-3">
            <div>
              <p className="text-yellow-200/60 text-xs mb-1">Numéro</p>
              <div className="flex items-center justify-between bg-yellow-500/10 rounded-xl p-3">
                <p className="text-yellow-100 font-bold text-lg">
                  {platformSettings.baridimob_number}
                </p>
                <button
                  onClick={() => copyToClipboard(platformSettings.baridimob_number!, 'baridimob')}
                  className="px-3 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-lg text-yellow-100 text-xs font-bold transition-colors"
                >
                  {copiedField === 'baridimob' ? '✓ Copié' : '📋 Copier'}
                </button>
              </div>
            </div>

            {platformSettings.baridimob_name && (
              <div>
                <p className="text-yellow-200/60 text-xs mb-1">Nom du compte</p>
                <p className="text-yellow-100 font-medium">{platformSettings.baridimob_name}</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    // RIB
    if (method === 'RIB' && platformSettings.rib_account_number) {
      return (
        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-5 mb-6">
          <h4 className="text-green-300 font-bold mb-3 flex items-center gap-2">
            🏦 Virement bancaire (RIB)
          </h4>
          
          <div className="space-y-3">
            <div>
              <p className="text-green-200/60 text-xs mb-1">RIB</p>
              <div className="flex items-center justify-between bg-green-500/10 rounded-xl p-3">
                <p className="text-green-100 font-mono text-sm break-all">
                  {platformSettings.rib_account_number}
                </p>
                <button
                  onClick={() => copyToClipboard(platformSettings.rib_account_number!, 'rib')}
                  className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-green-100 text-xs font-bold transition-colors ml-2 shrink-0"
                >
                  {copiedField === 'rib' ? '✓' : '📋'}
                </button>
              </div>
            </div>

            {platformSettings.rib_account_name && (
              <div>
                <p className="text-green-200/60 text-xs mb-1">Nom du compte</p>
                <p className="text-green-100 font-medium">{platformSettings.rib_account_name}</p>
              </div>
            )}

            {platformSettings.rib_bank_name && (
              <div>
                <p className="text-green-200/60 text-xs mb-1">Banque</p>
                <p className="text-green-100 font-medium">{platformSettings.rib_bank_name}</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    // CCP
    if (method === 'CCP' && platformSettings.ccp_account_number) {
      return (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-5 mb-6">
          <h4 className="text-orange-300 font-bold mb-3 flex items-center gap-2">
            📮 Payer par CCP
          </h4>
          
          <div className="space-y-3">
            <div>
              <p className="text-orange-200/60 text-xs mb-1">Numéro CCP</p>
              <div className="flex items-center justify-between bg-orange-500/10 rounded-xl p-3">
                <p className="text-orange-100 font-bold text-lg">
                  {platformSettings.ccp_account_number}
                </p>
                <button
                  onClick={() => copyToClipboard(platformSettings.ccp_account_number!, 'ccp')}
                  className="px-3 py-1 bg-orange-500/20 hover:bg-orange-500/30 rounded-lg text-orange-100 text-xs font-bold transition-colors"
                >
                  {copiedField === 'ccp' ? '✓ Copié' : '📋 Copier'}
                </button>
              </div>
            </div>

            {platformSettings.ccp_account_name && (
              <div>
                <p className="text-orange-200/60 text-xs mb-1">Nom du compte</p>
                <p className="text-orange-100 font-medium">{platformSettings.ccp_account_name}</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    // PayPal
    if (method === 'PAYPAL' && platformSettings.paypal_email) {
      return (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-5 mb-6">
          <h4 className="text-blue-300 font-bold mb-3 flex items-center gap-2">
            💳 Payer par PayPal
          </h4>
          
          <div>
            <p className="text-blue-200/60 text-xs mb-1">Email PayPal</p>
            <div className="flex items-center justify-between bg-blue-500/10 rounded-xl p-3">
              <p className="text-blue-100 font-medium">
                {platformSettings.paypal_email}
              </p>
              <button
                onClick={() => copyToClipboard(platformSettings.paypal_email!, 'paypal')}
                className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-100 text-xs font-bold transition-colors"
              >
                {copiedField === 'paypal' ? '✓ Copié' : '📋 Copier'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Chargement...</p>
        </div>
      </div>
    );
  }

  // Error
  if (error && !booking) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center max-w-md">
          <span className="text-5xl mb-4 block">❌</span>
          <h1 className="text-2xl font-black text-white mb-2">Erreur</h1>
          <p className="text-white/60 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-purple-600 text-white rounded-2xl font-bold"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  // Success
  if (success) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-8 text-center max-w-md">
          <span className="text-6xl mb-4 block">✅</span>
          <h1 className="text-2xl font-black text-emerald-300 mb-2">
            Preuve envoyée !
          </h1>
          <p className="text-emerald-200/70 mb-6">
            Votre paiement est en cours de vérification. Vous serez notifié une fois validé.
          </p>
          <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto" />
          <p className="text-emerald-200/50 text-sm mt-4">Redirection...</p>
        </div>
      </div>
    );
  }

  if (!booking) return null;

  const getPaymentMethodInfo = () => {
    switch (booking.payment_method) {
      case 'PAYPAL':
        return { icon: '💳', name: 'PayPal', color: 'text-blue-400' };
      case 'BARIDIMOB':
        return { icon: '📱', name: 'BaridiMob', color: 'text-yellow-400' };
      case 'RIB':
        return { icon: '🏦', name: 'Virement bancaire (RIB)', color: 'text-green-400' };
      case 'CCP':
        return { icon: '📮', name: 'CCP', color: 'text-orange-400' };
      default:
        return { icon: '💰', name: 'Paiement', color: 'text-white' };
    }
  };

  const paymentInfo = getPaymentMethodInfo();

  return (
    <div className="min-h-screen bg-[#050505] py-8 px-4">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-[#050505] to-pink-900/20" />
      </div>

      <div className="max-w-lg mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors"
        >
          <span>←</span>
          <span>Retour</span>
        </button>

        <h1 className="text-3xl font-black text-white mb-2">
          💳 Paiement
        </h1>
        <p className="text-white/60 mb-8">
          Finalisez votre réservation
        </p>

        {/* ✅ ALERTE : Paiement à la plateforme */}
        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-4 mb-6">
          <p className="text-indigo-200 text-sm">
            ℹ️ Le paiement se fait à la plateforme <strong>LocaDZ</strong>. L'hôte recevra son paiement après validation.
          </p>
        </div>

        {/* Booking Info */}
        <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-3xl p-6 mb-6">
          <h2 className="font-bold text-white text-lg mb-4">
            {propertyTitle || 'Votre séjour'}
          </h2>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-white/60">📅 Dates</span>
              <span className="text-white font-medium">
                {new Date(booking.start_date).toLocaleDateString('fr-FR')} → {new Date(booking.end_date).toLocaleDateString('fr-FR')}
              </span>
            </div>
            
            {booking.guests_count && (
              <div className="flex justify-between">
                <span className="text-white/60">👥 Voyageurs</span>
                <span className="text-white font-medium">{booking.guests_count} personne(s)</span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-white/60">{paymentInfo.icon} Méthode</span>
              <span className={`font-medium ${paymentInfo.color}`}>{paymentInfo.name}</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10">
            <div className="flex justify-between items-center">
              <span className="text-white/80 font-bold">Total à payer</span>
              <span className="text-3xl font-black text-white">
                {formatCurrency(booking.total_price)}
              </span>
            </div>
          </div>
        </div>

        {/* ✅ Coordonnées bancaires selon la méthode */}
        {renderPaymentDetails()}

        {/* Payment Instructions */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-6">
          <h3 className="font-bold text-white mb-4">📋 Instructions</h3>
          
          {booking.payment_method === 'BARIDIMOB' && (
            <div className="space-y-3 text-sm text-white/70">
              <p>1️⃣ Ouvrez votre application BaridiMob</p>
              <p>2️⃣ Effectuez un virement vers le numéro ci-dessus</p>
              <p>3️⃣ Prenez une capture d'écran de la confirmation</p>
              <p>4️⃣ Envoyez la preuve ci-dessous</p>
            </div>
          )}

          {booking.payment_method === 'RIB' && (
            <div className="space-y-3 text-sm text-white/70">
              <p>1️⃣ Effectuez un virement vers le RIB ci-dessus</p>
              <p>2️⃣ Gardez le reçu ou la confirmation</p>
              <p>3️⃣ Prenez une photo ou capture d'écran</p>
              <p>4️⃣ Envoyez la preuve ci-dessous</p>
            </div>
          )}

          {booking.payment_method === 'CCP' && (
            <div className="space-y-3 text-sm text-white/70">
              <p>1️⃣ Rendez-vous dans un bureau de poste</p>
              <p>2️⃣ Effectuez un versement vers le CCP ci-dessus</p>
              <p>3️⃣ Gardez le reçu</p>
              <p>4️⃣ Envoyez la preuve ci-dessous</p>
            </div>
          )}

          {booking.payment_method === 'PAYPAL' && (
            <div className="space-y-3 text-sm text-white/70">
              <p>1️⃣ Connectez-vous à PayPal</p>
              <p>2️⃣ Envoyez le montant à l'email ci-dessus</p>
              <p>3️⃣ Prenez une capture d'écran de la confirmation</p>
              <p>4️⃣ Envoyez la preuve ci-dessous</p>
            </div>
          )}
        </div>

        {/* Upload Section */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
          <h3 className="font-bold text-white mb-4">📤 Envoyer la preuve de paiement</h3>
          
          <label className="block">
            <div className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              file 
                ? 'border-emerald-500/50 bg-emerald-500/10' 
                : 'border-white/20 hover:border-purple-500/50 hover:bg-purple-500/5'
            }`}>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              
              {file ? (
                <>
                  <span className="text-4xl block mb-2">✅</span>
                  <p className="text-emerald-300 font-bold">{file.name}</p>
                  <p className="text-emerald-300/60 text-sm mt-1">Cliquez pour changer</p>
                </>
              ) : (
                <>
                  <span className="text-4xl block mb-2">📁</span>
                  <p className="text-white/80 font-bold">Cliquez pour sélectionner</p>
                  <p className="text-white/50 text-sm mt-1">Image ou PDF</p>
                </>
              )}
            </div>
          </label>

          {error && (
            <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl">
              <p className="text-rose-300 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className={`w-full mt-6 py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-all ${
              !file || uploading
                ? 'bg-white/10 text-white/30 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98]'
            }`}
          >
            {uploading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                📤 Envoyer la preuve
              </>
            )}
          </button>
        </div>

        <p className="text-center text-white/40 text-sm mt-6">
          Besoin d'aide ? Contactez notre support
        </p>
      </div>
    </div>
  );
};
