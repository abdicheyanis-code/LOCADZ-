import React, { useEffect, useState } from 'react';
import {
  Booking,
  Property,
  UserProfile,
  PaymentMethod,
  AppLanguage,
} from '../types';
import { bookingService } from '../services/bookingService';
import { propertyService } from '../services/propertyService';
import { paymentService } from '../services/paymentService';
import { formatCurrency } from '../services/stripeService';
import { PLATFORM_PAYOUT } from '../constants';

type BookingWithProperty = Booking & { property?: Property };

interface BookingsViewProps {
  currentUser: UserProfile;
  language: AppLanguage;
  translations: any;
}

const getLocale = (language: AppLanguage) =>
  language === 'fr' ? 'fr-FR' : language === 'ar' ? 'ar-DZ' : 'en-US';

export const BookingsView: React.FC<BookingsViewProps> = ({
  currentUser,
  language,
  translations: t,
}) => {
  const [bookings, setBookings] = useState<BookingWithProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ccp = PLATFORM_PAYOUT.ccp;
  const rib = PLATFORM_PAYOUT.rib;
  const paypal = PLATFORM_PAYOUT.paypal;
  const locale = getLocale(language);

  const paymentMethodLabel = (method: PaymentMethod) => {
    switch (method) {
      case 'BARIDIMOB':
        return 'BaridiMob / CCP';
      case 'RIB':
        return language === 'fr'
          ? 'Virement bancaire (RIB)'
          : language === 'ar'
          ? 'تحويل بنكي (RIB)'
          : 'Bank transfer (RIB)';
      case 'PAYPAL':
        return 'PayPal';
      case 'ON_ARRIVAL':
      default:
        return t.payArrival;
    }
  };

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
      setError(t.bookingsLoadError);
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

    const allowed: PaymentMethod[] = ['BARIDIMOB', 'RIB', 'PAYPAL'];
    if (!allowed.includes(booking.payment_method)) {
      setError(t.noHostInfo);
      return;
    }

    if (booking.status !== 'APPROVED') {
      setError(t.waitHostBeforeProof);
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
        setError(t.proofUploadFailed);
      } else {
        setMessage(t.proofUploadSuccess);
        loadData();
      }
    } catch (e) {
      console.error('handleUploadProof error:', e);
      setError(t.proofUploadUnexpected);
    } finally {
      setUploadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-40 text-center flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">
          {t.bookingsLoading}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter">
            {t.bookings}
          </h2>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mt-1">
            {t.bookingsSubtitle}
          </p>
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-white/10 active:scale-95 transition-all flex items-center gap-2"
        >
          <span>↻</span>
          <span>{t.bookingsRefresh}</span>
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
            {t.noBookings}
          </p>
          <p className="text-xs text-white/40 mt-3">
            {t.bookingsNoneSubtitle}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(b => {
            const prop = b.property;
            const canUploadProof =
              (b.payment_method === 'BARIDIMOB' ||
                b.payment_method === 'RIB' ||
                b.payment_method === 'PAYPAL') &&
              b.status === 'APPROVED';

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
                    <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-white/10 text-white/70">
                      {b.status === 'PENDING_APPROVAL'
                        ? t.statusPending || 'En attente validation hôte'
                        : b.status === 'APPROVED'
                        ? t.statusApproved || 'En attente paiement'
                        : b.status === 'PAID'
                        ? t.statusPaid || 'Payée'
                        : b.status === 'CANCELLED'
                        ? t.statusCancelled || 'Annulée'
                        : t.statusRejected || 'Refusée'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-[11px] text-white/60 mt-1">
                    <div>
                      <span className="font-black uppercase text-[9px] text-white/40">
                        {t.labelFrom}
                      </span>
                      <div className="font-bold">
                        {new Date(b.start_date).toLocaleDateString(locale)}
                      </div>
                    </div>
                    <div>
                      <span className="font-black uppercase text-[9px] text-white/40">
                        {t.labelTo}
                      </span>
                      <div className="font-bold">
                        {new Date(b.end_date).toLocaleDateString(locale)}
                      </div>
                    </div>
                    <div>
                      <span className="font-black uppercase text-[9px] text-white/40">
                        {t.labelAmount}
                      </span>
                      <div className="font-bold">
                        {formatCurrency(b.total_price)}
                      </div>
                    </div>
                    <div>
                      <span className="font-black uppercase text-[9px] text-white/40">
                        {t.labelPayment}
                      </span>
                      <div className="font-bold">
                        {paymentMethodLabel(b.payment_method)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* BOUTON ENVOI PREUVE + INSTRUCTIONS */}
                <div className="w-full md:w-64 space-y-2">
                  {canUploadProof && (
                    <>
                      <label className="inline-flex items-center gap-2 px-4 py-3 rounded-full bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] cursor-pointer hover:bg-indigo-700 active:scale-95 transition-all">
                        {uploadingId === b.id ? (
                          <>
                            <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            <span>{t.uploadReceiptLoading}</span>
                          </>
                        ) : (
                          <>
                            <span>{t.uploadReceiptCta}</span>
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

                      <div className="text-[10px] text-white/50 leading-snug mt-1">
                        {b.payment_method === 'BARIDIMOB' && (
                          <>
                            <p>{t.paymentInfoIntroBaridi}</p>
                            <p className="font-semibold">
                              Titulaire : {ccp.accountName}
                            </p>
                            <p className="font-semibold">
                              CCP / RIP : {ccp.accountNumber}
                            </p>
                          </>
                        )}

                        {b.payment_method === 'RIB' && (
                          <>
                            <p>{t.paymentInfoIntroRib}</p>
                            <p className="font-semibold">
                              Titulaire : {rib.accountName}
                            </p>
                            <p className="font-semibold">
                              Banque : {rib.bankName}
                            </p>
                            <p className="font-semibold">
                              RIB : {rib.accountNumber}
                            </p>
                          </>
                        )}

                        {b.payment_method === 'PAYPAL' && (
                          <>
                            <p>{t.paymentInfoIntroPaypal}</p>
                            <p className="font-semibold break-all">
                              {paypal.email}
                            </p>
                          </>
                        )}

                        <p className="mt-1">
                          {t.paymentInfoThenUpload}
                        </p>
                      </div>
                    </>
                  )}

                  {!canUploadProof && b.status === 'PENDING_APPROVAL' && (
                    <p className="text-[10px] text-white/40 leading-snug">
                      {t.waitHostBeforeProof}
                    </p>
                  )}

                  {!canUploadProof && b.status === 'PAID' && (
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">
                      {t.paidLabel}
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
