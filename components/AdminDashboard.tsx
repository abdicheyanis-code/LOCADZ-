import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { adminService } from '../services/adminService';
import { paymentService } from '../services/paymentService';
import { formatCurrency } from '../services/stripeService';
import { Booking, UserProfile, PaymentProof } from '../types';
import { useNotification } from './NotificationProvider';

type AdminTab = 'STATS' | 'USERS' | 'VERIFICATIONS' | 'PAYMENTS';

interface AdminDashboardProps {
  currentUser: UserProfile;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('STATS');
  const [stats, setStats] = useState({
    totalVolume: 0,
    totalCommission: 0,
    count: 0,
  });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [paymentProofs, setPaymentProofs] = useState<PaymentProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [reviewingProofId, setReviewingProofId] = useState<string | null>(null);

  const { notify } = useNotification();

  const loadData = async (silent = false) => {
    // Décision d'accès basée uniquement sur currentUser.role
    if (!currentUser || currentUser.role !== 'ADMIN') {
      setUnauthorized(true);
      notify({
        type: 'error',
        message: 'Accès refusé. Réservé aux administrateurs LOCADZ.',
      });
      return;
    }

    if (!silent) setLoading(true);
    else setIsRefreshing(true);

    try {
      const [s, u, p, proofs] = await Promise.all([
        adminService.getPlatformStats(),
        adminService.getAllUsers(),
        adminService.getPendingVerifications(),
        paymentService.getPendingProofsForAdmin(),
      ]);

      if ((s as any).error) {
        setUnauthorized(true);
        notify({
          type: 'error',
          message: "Accès refusé côté serveur pour les statistiques admin.",
        });
      } else {
        setStats(s);
        setBookings((s as any).bookings || []);
        setAllUsers(u);
        setPendingUsers(p);
        setPaymentProofs(proofs);

        if (silent) {
          notify({ type: 'success', message: 'Données admin rafraîchies.' });
        }
      }
    } catch (e) {
      console.error(e);
      setUnauthorized(true);
      notify({
        type: 'error',
        message: 'Erreur lors du chargement des données admin.',
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.id, currentUser.role]);

  const handleApprove = async (id: string) => {
    const ok = await adminService.approveHost(id);
    if (ok) {
      notify({ type: 'success', message: 'Hôte approuvé avec succès.' });
      loadData(true);
    } else {
      notify({
        type: 'error',
        message: "Impossible d'approuver cet hôte. Réessayez plus tard.",
      });
    }
  };

  const handleChangeRole = async (userId: string, role: string) => {
    const success = await adminService.updateUserRole(userId, role);
    if (success) {
      notify({ type: 'success', message: 'Rôle mis à jour.' });
      loadData(true);
    } else {
      notify({
        type: 'error',
        message: "Impossible de mettre à jour le rôle de l'utilisateur.",
      });
    }
  };

  const handleOpenIdDoc = async (u: UserProfile) => {
    if (!u.id_document_url) {
      notify({
        type: 'error',
        message: "Aucun document d'identité pour cet utilisateur.",
      });
      return;
    }

    // Cas 1 : ancienne version où on stockait une URL complète
    if (u.id_document_url.startsWith('http')) {
      window.open(u.id_document_url, '_blank');
      return;
    }

    // Cas 2 : nouvelle version, on a stocké un PATH dans le bucket privé id_documents
    const { data, error } = await supabase.storage
      .from('id_documents')
      .createSignedUrl(u.id_document_url, 600); // 600 secondes = 10 minutes

    if (error || !data?.signedUrl) {
      console.error('Erreur createSignedUrl', error);
      notify({
        type: 'error',
        message:
          "Impossible de générer l'aperçu de la carte d'identité.",
      });
      return;
    }

    window.open(data.signedUrl, '_blank');
  };

  const handleReviewProof = async (proof: PaymentProof, approve: boolean) => {
    setReviewingProofId(proof.id);

    let rejectionReason: string | undefined;
    if (!approve) {
      const input = window.prompt('Raison du refus ? (optionnel)');
      rejectionReason = input || undefined;
    }

    const { success, error } = await paymentService.reviewPaymentProof({
      proofId: proof.id,
      approve,
      rejectionReason,
    });

    setReviewingProofId(null);

    if (success) {
      notify({
        type: 'success',
        message: approve
          ? 'Preuve de paiement validée. Réservation marquée comme PAYÉE.'
          : 'Preuve de paiement rejetée.',
      });
      loadData(true);
    } else {
      console.error('reviewPaymentProof error:', error);
      notify({
        type: 'error',
        message:
          error === 'UNAUTHORIZED'
            ? "Vous n'êtes pas autorisé à valider ces paiements."
            : "Erreur lors de la revue de la preuve de paiement.",
      });
    }
  };

  if (unauthorized)
    return (
      <div className="py-40 text-center font-black text-rose-500 uppercase">
        Accès Refusé 🔒
      </div>
    );

  if (loading)
    return (
      <div className="py-40 text-center flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">
          Initialisation de la console Admin...
        </span>
      </div>
    );

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      {/* Header with Refresh */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter">
            Locadz Console
          </h2>
          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mt-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            Cloud Core System Online
          </p>
        </div>
        <button
          onClick={() => loadData(true)}
          disabled={isRefreshing}
          className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50 group"
        >
          <svg
            className={`w-5 h-5 text-indigo-400 ${
              isRefreshing
                ? 'animate-spin'
                : 'group-hover:rotate-180 transition-transform duration-500'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-white/5 backdrop-blur-3xl p-2 rounded-[2.5rem] border border-white/10 max-w-3xl mx-auto">
        {(['STATS', 'VERIFICATIONS', 'USERS', 'PAYMENTS'] as AdminTab[]).map(
          tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab
                  ? 'bg-indigo-600 text-white shadow-xl'
                  : 'text-white/40 hover:bg-white/5'
              }`}
            >
              {tab === 'STATS'
                ? '📊 Performances'
                : tab === 'USERS'
                ? '👥 Membres'
                : tab === 'VERIFICATIONS'
                ? `🛂 Alertes (${pendingUsers.length})`
                : `💸 Paiements (${paymentProofs.length})`}
            </button>
          )
        )}
      </div>

      {/* STATS */}
      {activeTab === 'STATS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-indigo-600 p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
            <p className="text-[10px] font-black uppercase opacity-60 mb-2">
              Profit Net
            </p>
            <h2 className="text-5xl font-black italic">
              {formatCurrency(stats.totalCommission)}
            </h2>
            <div className="absolute -right-4 -bottom-4 text-9xl opacity-10">
              💰
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 p-10 rounded-[4rem] text-white">
            <p className="text-[10px] font-black uppercase opacity-40 mb-2">
              Volume d'affaires
            </p>
            <h2 className="text-4xl font-black italic">
              {formatCurrency(stats.totalVolume)}
            </h2>
          </div>
          <div className="bg-white p-10 rounded-[4rem] text-indigo-950">
            <p className="text-[10px] font-black uppercase text-indigo-300 mb-2">
              Réservations
            </p>
            <h2 className="text-4xl font-black italic">{stats.count} flux</h2>
          </div>
        </div>
      )}

      {/* VERIFICATIONS */}
      {activeTab === 'VERIFICATIONS' && (
        <div className="bg-white rounded-[4rem] p-12 shadow-2xl border border-indigo-50 animate-in slide-in-from-right duration-500">
          <h3 className="text-3xl font-black italic text-indigo-950 mb-10">
            Dossiers CNI en attente
          </h3>
          <div className="space-y-6">
            {pendingUsers.map(u => (
              <div
                key={u.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 bg-indigo-50/50 rounded-[2.5rem] border border-indigo-100"
              >
                <div className="flex items-center gap-5">
                  <img
                    src={u.avatar_url}
                    className="w-16 h-16 rounded-2xl border-2 border-white shadow-md"
                    alt=""
                  />
                  <div>
                    <p className="font-black text-indigo-950">
                      {u.full_name}
                    </p>
                    <button
                      onClick={() => handleOpenIdDoc(u)}
                      className="mt-1 text-[9px] font-black text-indigo-400 uppercase underline"
                    >
                      Voir CNI ↗
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => handleApprove(u.id)}
                    className="px-8 py-3 bg-indigo-600 text-white text-[10px] font-black rounded-2xl hover:bg-indigo-700 shadow-xl"
                  >
                    APPROUVER
                  </button>
                </div>
              </div>
            ))}
            {pendingUsers.length === 0 && (
              <p className="text-center py-20 text-indigo-950/20 italic font-black uppercase text-sm">
                Aucun dossier à traiter
              </p>
            )}
          </div>
        </div>
      )}

      {/* USERS */}
      {activeTab === 'USERS' && (
        <div className="bg-white/5 border border-white/10 rounded-[4rem] p-12 overflow-hidden animate-in slide-in-from-left duration-500">
          <h3 className="text-3xl font-black italic text-white mb-10">
            Annuaire du Réseau
          </h3>
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] border-b border-white/10">
                  <th className="pb-6 px-4">Membre</th>
                  <th className="pb-6 px-4">Rôle</th>
                  <th className="pb-6 px-4">Statut</th>
                  <th className="pb-6 px-4">Paiement</th>
                  <th className="pb-6 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {allUsers.map(u => (
                  <tr key={u.id} className="group hover:bg-white/5 transition-all">
                    <td className="py-6 px-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={u.avatar_url}
                          className="w-10 h-10 rounded-xl"
                          alt=""
                        />
                        <div>
                          <p className="text-sm font-bold text-white">
                            {u.full_name}
                          </p>
                          <p className="text-[10px] text-white/40">
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-6 px-4">
                      <select
                        value={u.role}
                        onChange={e =>
                          handleChangeRole(u.id, e.target.value)
                        }
                        className="bg-black/40 border border-white/10 text-[10px] font-black text-white rounded-lg px-2 py-1 outline-none"
                      >
                        <option value="TRAVELER">TRAVELER</option>
                        <option value="HOST">HOST</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td className="py-6 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${
                          u.is_verified
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-white/10 text-white/40'
                        }`}
                      >
                        {u.is_verified ? 'Vérifié' : 'Basique'}
                      </span>
                    </td>
                    <td className="py-6 px-4">
                      {u.role === 'HOST' ? (
                        <div className="flex gap-2">
                          <span
                            className={`text-xs ${
                              u.payout_details?.method !== 'NONE'
                                ? 'opacity-100'
                                : 'opacity-10'
                            }`}
                            title={u.payout_details?.method || 'Aucun'}
                          >
                            {u.payout_details?.method === 'CCP'
                              ? '📮'
                              : u.payout_details?.method === 'RIB'
                              ? '🏦'
                              : '❌'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[8px] text-white/10">-</span>
                      )}
                    </td>
                    <td className="py-6 px-4 text-right">
                      <button className="text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.5"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PAYMENTS */}
      {activeTab === 'PAYMENTS' && (
        <div className="bg-white rounded-[4rem] p-12 shadow-2xl border border-indigo-50 animate-in slide-in-from-right duration-500">
          <h3 className="text-3xl font-black italic text-indigo-950 mb-2">
            Preuves de paiement en attente
          </h3>
          <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.3em] mb-8">
            Validation manuelle des virements clients
          </p>

          {paymentProofs.length === 0 ? (
            <p className="text-center py-20 text-indigo-950/20 italic font-black uppercase text-sm">
              Aucune preuve en attente
            </p>
          ) : (
            <div className="space-y-4">
              {paymentProofs.map(proof => (
                <div
                  key={proof.id}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-indigo-50/60 rounded-[2.5rem] border border-indigo-100"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em]">
                        {proof.id}
                      </span>
                      <span className="text-[9px] font-black text-gray-400 uppercase">
                        {new Date(proof.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 items-center">
                      <div>
                        <p className="text-[8px] font-black text-gray-400 uppercase">
                          Montant payé
                        </p>
                        <p className="text-xl font-black text-indigo-950">
                          {formatCurrency(proof.amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-gray-400 uppercase">
                          Méthode
                        </p>
                        <p className="text-xs font-black text-indigo-700 flex items-center gap-1">
                          {proof.payment_method === 'BARIDIMOB'
                            ? '📲 BaridiMob'
                            : proof.payment_method === 'RIB'
                            ? '🏦 Virement banque'
                            : '🤝 À l’arrivée'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-gray-400 uppercase">
                          Réservation
                        </p>
                        <p className="text-xs font-mono text-gray-600">
                          {proof.booking_id}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end gap-3">
                    <a
                      href={proof.proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border border-indigo-200 text-indigo-600 hover:bg-indigo-50 flex items-center gap-2"
                    >
                      Voir la preuve ↗
                    </a>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReviewProof(proof, false)}
                        disabled={reviewingProofId === proof.id}
                        className="px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border-2 border-rose-200 text-rose-500 hover:bg-rose-50 disabled:opacity-50"
                      >
                        Refuser
                      </button>
                      <button
                        onClick={() => handleReviewProof(proof, true)}
                        disabled={reviewingProofId === proof.id}
                        className="px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2"
                      >
                        {reviewingProofId === proof.id ? (
                          <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        ) : null}
                        Valider
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
