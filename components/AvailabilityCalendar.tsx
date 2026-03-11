import React, { useState, useEffect } from 'react';
import { Property } from '../types';
import { availabilityService, BlockedDate, DateRange } from '../services/availabilityService';
import { bookingService } from '../services/bookingService';
import { useNotification } from './NotificationProvider';

interface AvailabilityCalendarProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
}

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const BLOCK_REASONS = [
  { id: 'PERSONAL', label: 'Usage personnel', icon: '🏠' },
  { id: 'MAINTENANCE', label: 'Travaux / Maintenance', icon: '🔧' },
  { id: 'RENOVATION', label: 'Rénovation', icon: '🏗️' },
  { id: 'CLEANING', label: 'Nettoyage approfondi', icon: '🧹' },
  { id: 'OTHER', label: 'Autre raison', icon: '📝' },
];

export const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  property,
  isOpen,
  onClose,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [unavailableRanges, setUnavailableRanges] = useState<DateRange[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Sélection de dates
  const [selectionStart, setSelectionStart] = useState<Date | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<Date | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  
  // Modal de blocage
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockReason, setBlockReason] = useState('PERSONAL');
  const [customReason, setCustomReason] = useState('');
  const [isBlocking, setIsBlocking] = useState(false);

  const { notify } = useNotification();

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, property.id]);

  const loadData = async () => {
    setLoading(true);
    const [blocked, ranges] = await Promise.all([
      availabilityService.getBlockedDates(property.id),
      availabilityService.getAllUnavailableDates(property.id),
    ]);
    setBlockedDates(blocked);
    setUnavailableRanges(ranges);
    setLoading(false);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Jour de la semaine du premier jour (0 = Dimanche, on veut Lundi = 0)
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;
    
    return { daysInMonth, startDay };
  };

  const isDateInRange = (date: Date, start: Date, end: Date) => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    return d >= s && d <= e;
  };

  const getDateStatus = (date: Date): { status: 'AVAILABLE' | 'BLOCKED' | 'BOOKED'; reason?: string; blockedId?: string } => {
    // Vérifier si bloqué
    for (const blocked of blockedDates) {
      const start = new Date(blocked.start_date);
      const end = new Date(blocked.end_date);
      if (isDateInRange(date, start, end)) {
        return { status: 'BLOCKED', reason: blocked.reason || 'Bloqué', blockedId: blocked.id };
      }
    }

    // Vérifier si réservé
    for (const range of unavailableRanges) {
      if (range.type === 'BOOKED' && isDateInRange(date, range.start, range.end)) {
        return { status: 'BOOKED', reason: 'Réservé' };
      }
    }

    return { status: 'AVAILABLE' };
  };

  const isDateSelected = (date: Date) => {
    if (!selectionStart) return false;
    if (!selectionEnd) {
      return date.toDateString() === selectionStart.toDateString();
    }
    return isDateInRange(date, selectionStart, selectionEnd);
  };

  const handleDayClick = (day: number) => {
    const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (clickedDate < today) {
      notify({ type: 'error', message: 'Impossible de bloquer des dates passées' });
      return;
    }

    const status = getDateStatus(clickedDate);

    if (status.status === 'BOOKED') {
      notify({ type: 'error', message: 'Cette date est déjà réservée' });
      return;
    }

    if (status.status === 'BLOCKED') {
      // Débloquer
      handleUnblock(status.blockedId!);
      return;
    }

    // Sélection
    if (!isSelecting) {
      setSelectionStart(clickedDate);
      setSelectionEnd(null);
      setIsSelecting(true);
    } else {
      if (clickedDate >= selectionStart!) {
        setSelectionEnd(clickedDate);
      } else {
        setSelectionEnd(selectionStart);
        setSelectionStart(clickedDate);
      }
      setIsSelecting(false);
      setShowBlockModal(true);
    }
  };

  const handleUnblock = async (blockedId: string) => {
    const confirm = window.confirm('Voulez-vous débloquer ces dates ?');
    if (!confirm) return;

    const success = await availabilityService.unblockDates(blockedId);
    if (success) {
      notify({ type: 'success', message: 'Dates débloquées' });
      await loadData();
    } else {
      notify({ type: 'error', message: 'Erreur lors du déblocage' });
    }
  };

  const handleBlock = async () => {
    if (!selectionStart || !selectionEnd) return;

    setIsBlocking(true);

    const reason = blockReason === 'OTHER' ? customReason : BLOCK_REASONS.find(r => r.id === blockReason)?.label;

    const result = await availabilityService.blockDates({
      propertyId: property.id,
      startDate: selectionStart.toISOString().split('T')[0],
      endDate: selectionEnd.toISOString().split('T')[0],
      reason,
    });

    setIsBlocking(false);

    if (result.success) {
      notify({ type: 'success', message: 'Dates bloquées avec succès' });
      setShowBlockModal(false);
      setSelectionStart(null);
      setSelectionEnd(null);
      await loadData();
    } else {
      notify({ type: 'error', message: result.error || 'Erreur' });
    }
  };

  const cancelSelection = () => {
    setSelectionStart(null);
    setSelectionEnd(null);
    setIsSelecting(false);
    setShowBlockModal(false);
  };

  const navigateMonth = (direction: number) => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
  };

  if (!isOpen) return null;

  const { daysInMonth, startDay } = getDaysInMonth(currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: startDay }, (_, i) => i);

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#0a0a0f] border border-white/10 rounded-3xl overflow-hidden animate-in zoom-in-95 duration-300 shadow-2xl flex flex-col">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-gradient-to-bl from-indigo-600/10 via-purple-600/5 to-transparent rounded-full blur-3xl" />
        </div>

        {/* Header */}
        <div className="relative p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-white">Calendrier de disponibilité</h3>
              <p className="text-sm text-white/50 mt-1">{property.title}</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white/60 hover:text-white transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Calendar */}
        <div className="relative p-6 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Navigation mois */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => navigateMonth(-1)}
                  className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h4 className="text-lg font-black text-white">
                  {MONTHS_FR[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h4>
                <button
                  onClick={() => navigateMonth(1)}
                  className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Légende */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-emerald-500" />
                  <span className="text-xs text-white/60">Disponible</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-rose-500" />
                  <span className="text-xs text-white/60">Bloqué</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-indigo-500" />
                  <span className="text-xs text-white/60">Réservé</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-amber-500" />
                  <span className="text-xs text-white/60">Sélectionné</span>
                </div>
              </div>

              {/* Grille jours de la semaine */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS_FR.map(day => (
                  <div key={day} className="text-center text-xs font-bold text-white/40 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Grille jours */}
              <div className="grid grid-cols-7 gap-1">
                {emptyDays.map(i => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}
                {days.map(day => {
                  const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const isPast = date < today;
                  const isToday = date.toDateString() === today.toDateString();
                  const status = getDateStatus(date);
                  const isSelected = isDateSelected(date);

                  let bgColor = 'bg-white/5 hover:bg-white/10';
                  let textColor = 'text-white/80';

                  if (isPast) {
                    bgColor = 'bg-white/5';
                    textColor = 'text-white/20';
                  } else if (isSelected) {
                    bgColor = 'bg-amber-500';
                    textColor = 'text-white';
                  } else if (status.status === 'BLOCKED') {
                    bgColor = 'bg-rose-500/30 hover:bg-rose-500/50';
                    textColor = 'text-rose-300';
                  } else if (status.status === 'BOOKED') {
                    bgColor = 'bg-indigo-500/30';
                    textColor = 'text-indigo-300';
                  } else {
                    bgColor = 'bg-emerald-500/20 hover:bg-emerald-500/30';
                    textColor = 'text-emerald-300';
                  }

                  return (
                    <button
                      key={day}
                      onClick={() => !isPast && handleDayClick(day)}
                      disabled={isPast}
                      className={`aspect-square flex flex-col items-center justify-center rounded-xl transition-all ${bgColor} ${textColor} ${
                        isPast ? 'cursor-not-allowed' : 'cursor-pointer active:scale-95'
                      } ${isToday ? 'ring-2 ring-white/50' : ''}`}
                      title={status.reason}
                    >
                      <span className="text-sm font-bold">{day}</span>
                      {status.status === 'BLOCKED' && (
                        <span className="text-[8px] mt-0.5">🔒</span>
                      )}
                      {status.status === 'BOOKED' && (
                        <span className="text-[8px] mt-0.5">📅</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Instructions */}
              <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-2xl">
                <p className="text-xs text-white/50 leading-relaxed">
                  💡 <span className="font-bold text-white/70">Bloquer :</span> Cliquez sur une date, puis sur une autre pour sélectionner une plage.
                  <br />
                  🔓 <span className="font-bold text-white/70">Débloquer :</span> Cliquez sur une date bloquée (rouge).
                </p>
              </div>
            </>
          )}
        </div>

        {/* Sélection en cours */}
        {isSelecting && selectionStart && (
          <div className="relative p-4 border-t border-white/10 bg-amber-500/10">
            <div className="flex items-center justify-between">
              <p className="text-sm text-amber-200">
                📅 Début : <span className="font-bold">{selectionStart.toLocaleDateString('fr-FR')}</span>
                <span className="text-amber-200/60 ml-2">→ Cliquez sur la date de fin</span>
              </p>
              <button
                onClick={cancelSelection}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold transition-all"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de blocage */}
      {showBlockModal && selectionStart && selectionEnd && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={cancelSelection} />
          <div className="relative w-full max-w-md bg-[#0a0a0f] border border-white/10 rounded-3xl p-6 animate-in zoom-in-95">
            <h4 className="text-xl font-black text-white mb-2">Bloquer ces dates</h4>
            <p className="text-sm text-white/50 mb-6">
              Du {selectionStart.toLocaleDateString('fr-FR')} au {selectionEnd.toLocaleDateString('fr-FR')}
            </p>

            <div className="space-y-3 mb-6">
              {BLOCK_REASONS.map(reason => (
                <button
                  key={reason.id}
                  onClick={() => setBlockReason(reason.id)}
                  className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-3 text-left ${
                    blockReason === reason.id
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <span className="text-xl">{reason.icon}</span>
                  <span className="text-white font-medium text-sm">{reason.label}</span>
                </button>
              ))}
            </div>

            {blockReason === 'OTHER' && (
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Précisez la raison..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:border-indigo-500 outline-none mb-6"
              />
            )}

            <div className="flex gap-3">
              <button
                onClick={cancelSelection}
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-sm transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleBlock}
                disabled={isBlocking || (blockReason === 'OTHER' && !customReason.trim())}
                className="flex-1 py-3 bg-gradient-to-r from-rose-600 to-orange-600 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isBlocking ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Blocage...</span>
                  </>
                ) : (
                  <>
                    <span>🔒</span>
                    <span>Bloquer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
