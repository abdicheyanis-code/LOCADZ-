import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { AppLanguage } from '../types';
import { LocadzLogo } from './Navbar';

interface ResetPasswordProps {
  language: AppLanguage;
  translations: any;
}

export const ResetPassword: React.FC<ResetPasswordProps> = ({
  language,
  translations: t,
}) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const isRTL = language === 'ar';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!password || !confirm) {
      setError('Merci de saisir et confirmer votre nouveau mot de passe.');
      return;
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        console.error('updateUser (reset password) error:', error);
        // Cas typique : le lien a expiré ou la session de recovery est manquante
        setError(
          "Lien invalide ou expiré. Merci de relancer la procédure 'mot de passe oublié'."
        );
        return;
      }

      setMessage(
        'Votre mot de passe a été mis à jour. Vous pouvez maintenant vous reconnecter.'
      );
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      console.error('Unexpected reset password error:', err);
      setError("Erreur inattendue. Merci de réessayer plus tard.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 relative z-10 text-center"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* BACKGROUND simple */}
      <div className="absolute inset-0 z-[-1] overflow-hidden bg-[#050505]">
        <div
          className="absolute top-[-20%] left-[-10%] w-[120%] h-[120%] opacity-[0.15] animate-drift"
          style={{
            background:
              'radial-gradient(circle at 30% 30%, #4f46e5 0%, transparent 60%), radial-gradient(circle at 70% 70%, #f59e0b 0%, transparent 60%)',
          }}
        />
        <div className="absolute inset-0 bg-grain opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black" />
      </div>

      <div className="w-full max-w-md bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 shadow-[0_40px_100px_rgba(0,0,0,0.6)]">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-white/10 p-4 rounded-3xl mb-4 border border-white/20">
            <LocadzLogo className="w-14 h-14" />
          </div>
          <h1 className="text-xl font-black text-white uppercase tracking-[0.3em] mb-2">
            Réinitialisation
          </h1>
          <p className="text-xs text-white/50">
            Choisissez un nouveau mot de passe pour votre compte LOCA DZ.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-indigo-300 ml-2">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-2xl text-sm text-white placeholder:text-white/30 outline-none focus:border-indigo-400"
              placeholder="********"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-indigo-300 ml-2">
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/40 border border:white/10 rounded-2xl text-sm text-white placeholder:text-white/30 outline-none focus:border-indigo-400"
              placeholder="********"
            />
          </div>

          {error && (
            <p className="text-[11px] text-rose-400 font-bold uppercase tracking-wide mt-2">
              {error}
            </p>
          )}

          {message && (
            <p className="text-[11px] text-emerald-400 font-bold uppercase tracking-wide mt-2">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] text-white transition-all active:scale-95"
          >
            {loading ? 'MISE À JOUR...' : 'RÉINITIALISER LE MOT DE PASSE'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full mt-2 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/60 hover:text-white transition-colors"
          >
            Retour à la connexion
          </button>
        </form>
      </div>
    </div>
  );
};
