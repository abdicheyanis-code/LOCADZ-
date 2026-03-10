import React, { useState } from 'react';
import { Booking, CancellationReason } from '../types';
import { cancellationService, TRAVELER_CANCELLATION_REASONS, HOST_CANCELLATION_REASONS } from '../services/cancellationService';
import { formatCurrency } from '../services/stripeService';
import { useNotification } from './NotificationProvider';

interface CancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  userRole: 'TRAVELER' | 'HOST';
  userId: string;
  onSuccess: () => void;
}

export const CancellationModal: React.FC<CancellationModalProps> = ({
  isOpen,
  onClose,
  booking,
  userRole,
  userId,
  onSuccess,
}) => {
  const [step, setStep] = useState<'CONFIRM' | 'REASON' | 'PROCESSING' | 'SUCCESS'>('CONFIRM');
  const [selectedReason, setSelectedReason] = useState<CancellationReason | null>(null);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { notify } = useNotification();

  const reasons = userRole === 'TRAVELER' ? TRAVELER_CANCELLATION_REASONS : HOST_CANCELLATION_REASONS;

  const handleCancel = async () => {
    if (!selectedReason) {
      notify({ type: 'error', message: 'Veuillez sélectionner une raison' });
      return;
    }

    setStep('PROCESSING');
    setIsSubmitting(true);

    const result = await cancellationService.cancelBooking({
      bookingId: booking.id,
      userId,
      userRole,
      reason: selectedReason,
      details: details.trim() || undefined,
    });

    setIsSubmitting(false);

    if (result.success) {
      setStep('SUCCESS');
      setTimeout(() => {
        onSuccess();
        onClose();
        setStep('CONFIRM');
        setSelectedReason(null);
        setDetails('');
      }, 2500);
    } else {
      notify({ type: 'error', message: result.error || 'Erreur lors de l\'annulation' });
      setStep('REASON');
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
    setStep('CONFIRM');
    setSelectedReason(null);
    setDetails('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-[#0a0a0f] border border-white/10 rounded-3xl overflow-hidden animate-in zoom-in-95 duration-300 shadow-2xl">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-gradient-to-bl from-rose-600/10 via-orange-600/5 to-transparent rounded-full blur-3xl" />
        </div>

        {/* ========== ÉTAPE 1 : CONFIRMATION ========== */}
        {step === 'CONFIRM' && (
          <div className="relative p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-white">Annuler la réservation ?</h3>
              <button
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white/60 hover:text-white transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Booking preview */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
              <p className="text-white font-bold">{booking.property_title || 'Votre réservation'}</p>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 text-white/60">
                  <span>📅</span>
                  <span>{new Date(booking.start_date).toLocaleDateString('fr-FR')} → {new Date(booking.end_date).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex items-center gap-2 text-white/60">
                  <span>💰</span>
                  <span>{formatCurrency(booking.total_price)}</span>
                </div>
              </div>
            </div>

            {/* Refund guarantee message */}
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                  🔒
                </div>
                <div>
                  <p className="text-emerald-300 font-bold text-sm mb-1">Remboursement garanti</p>
                  <p className="text-emerald-200/70 text-xs leading-relaxed">
                    {booking.status === 'PAID' 
                      ? 'Si vous avez déjà payé, vous serez intégralement remboursé sous 48h. Votre argent est en sécurité avec LOCADZ.'
                      : 'Aucun paiement n\'a été effectué, vous pouvez annuler sans frais.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
              <p className="text-amber-200/80 text-xs leading-relaxed">
                <span className="font-bold">⚠️ Attention :</span> L'annulation est définitive. 
                {userRole === 'HOST' 
                  ? ' Le voyageur sera notifié immédiatement.'
                  : ' L\'hôte sera notifié immédiatement.'}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 py-4 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-2xl font-bold text-sm transition-all active:scale-95"
              >
                Garder ma réservation
              </button>
              <button
                onClick={() => setStep('REASON')}
                className="flex-1 py-4 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 text-white rounded-2xl font-bold text-sm transition-all active:scale-95"
              >
                Continuer l'annulation
              </button>
            </div>
          </div>
        )}

        {/* ========== ÉTAPE 2 : RAISON ========== */}
        {step === 'REASON' && (
          <div className="relative p-6 space-y-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep('CONFIRM')}
                className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white/60 hover:text-white transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h3 className="text-xl font-black text-white">Pourquoi annulez-vous ?</h3>
            </div>

            <p className="text-white/50 text-sm">
              Votre retour nous aide à améliorer LOCADZ. Sélectionnez la raison principale :
            </p>

            {/* Reasons grid */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
              {reasons.map((reason) => (
                <button
                  key={reason.id}
                  onClick={() => setSelectedReason(reason.id)}
                  className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 text-left ${
                    selectedReason === reason.id
                      ? 'border-rose-500 bg-rose-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${
                    selectedReason === reason.id
                      ? 'bg-rose-500/20'
                      : 'bg-white/10'
                  }`}>
                    {reason.icon}
                  </div>
                  <span className="text-white font-medium text-sm">{reason.label}</span>
                  {selectedReason === reason.id && (
                    <div className="ml-auto w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Details textarea */}
            {selectedReason && (
              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <label className="text-xs font-bold text-white/60">
                  Détails supplémentaires (optionnel)
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Partagez plus de détails si vous le souhaitez..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none resize-none transition-all"
                />
              </div>
            )}

            {/* Submit button */}
            <button
              onClick={handleCancel}
              disabled={!selectedReason || isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-rose-600 to-orange-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Annulation en cours...</span>
                </>
              ) : (
                <>
                  <span>❌</span>
                  <span>Confirmer l'annulation</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* ========== ÉTAPE 3 : PROCESSING ========== */}
        {step === 'PROCESSING' && (
          <div className="relative p-12 flex flex-col items-center justify-center">
            <div className="relative w-16 h-16 mb-6">
              <div className="absolute inset-0 border-4 border-rose-500/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-transparent border-t-rose-500 rounded-full animate-spin" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">Annulation en cours...</h3>
            <p className="text-white/50 text-sm">Veuillez patienter</p>
          </div>
        )}

        {/* ========== ÉTAPE 4 : SUCCESS ========== */}
        {step === 'SUCCESS' && (
          <div className="relative p-12 flex flex-col items-center justify-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-emerald-500/30 rounded-full blur-2xl animate-pulse" />
              <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-2xl">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            
            <h3 className="text-2xl font-black text-white mb-2">Réservation annulée</h3>
            <p className="text-white/50 text-sm text-center max-w-xs mb-4">
              {userRole === 'TRAVELER' 
                ? 'L\'hôte a été notifié de votre annulation.'
                : 'Le voyageur a été notifié de l\'annulation.'}
            </p>
            
            {booking.status === 'PAID' && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                <p className="text-emerald-300 text-xs text-center">
                  🔒 Votre remboursement sera traité sous 48h
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
