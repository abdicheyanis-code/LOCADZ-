'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Booking } from '@/lib/types';
import { paymentService } from '@/lib/services/paymentService';
import { useNotification } from '@/contexts/NotificationContext';

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const { notify } = useNotification();
  const bookingId = params.bookingId as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  const loadBooking = async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (error || !data) {
      notify({ type: 'error', message: 'Réservation introuvable' });
      router.push('/');
      return;
    }

    setBooking(data as Booking);
    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !booking) return;

    setUploading(true);

    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      notify({ type: 'error', message: 'Non connecté' });
      setUploading(false);
      return;
    }

    const { proofId, error } = await paymentService.uploadPaymentProof({
      userId,
      bookingId: booking.id,
      amount: booking.total_price,
      paymentMethod: booking.payment_method,
      file,
    });

    setUploading(false);

    if (error || !proofId) {
      notify({ type: 'error', message: "Erreur lors de l'envoi" });
      return;
    }

    notify({
      type: 'success',
      message: 'Preuve envoyée ! En attente de validation.',
    });
    router.push('/bookings');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Chargement...</p>
      </div>
    );
  }

  if (!booking) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          💳 Paiement de votre réservation
        </h1>

        <div className="bg-indigo-50 rounded-2xl p-6 mb-8">
          <h2 className="font-semibold text-lg mb-3">
            Détails de la réservation
          </h2>
          <p className="text-gray-700">
            Du {booking.start_date} au {booking.end_date}
          </p>
          <p className="text-2xl font-bold text-indigo-600 mt-4">
            {booking.total_price} DA
          </p>
        </div>

        <div className="mb-8">
          <h2 className="font-semibold text-lg mb-3">Méthode de paiement</h2>
          <p className="text-gray-700 capitalize">{booking.payment_method}</p>
        </div>

        {booking.payment_method === 'PAYPAL' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-6">
            <p className="text-yellow-800">
              ⚠️ Le paiement PayPal sera bientôt disponible. En attendant,
              utilisez BaridiMob ou RIB.
            </p>
          </div>
        )}

        <div className="border-t pt-6">
          <h2 className="font-semibold text-lg mb-4">
            📤 Envoyer votre preuve de paiement
          </h2>

          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 mb-4"
          />

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full bg-indigo-600 text-white py-3 rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition"
          >
            {uploading ? 'Envoi en cours...' : 'Envoyer la preuve'}
          </button>
        </div>
      </div>
    </div>
  );
}
