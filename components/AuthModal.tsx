import React, { useState, useEffect } from 'react';
import { UserRole, UserProfile, AppLanguage } from '../types';
import { authService } from '../services/authService';
import { LocadzLogo } from './Navbar';
import { useNotification } from './NotificationProvider';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  language: AppLanguage;
}

const AUTH_TRANSLATIONS: Record<AppLanguage, any> = {
  fr: {
    portal: 'Portail Membre LOCADZ',
    req: 'Accès sécurisé · Cloud Supabase',
    member: 'Connexion',
    join: 'Nouvelle adhésion',
    name: 'Nom & Prénom',
    email: 'Email Professionnel',
    phone: 'Numéro Mobile (Algérie)',
    phoneHint: 'Ex: 0550 12 34 56',
    role: 'Rôle Réseau',
    traveler: 'Voyageur',
    host: 'Hôte',
    password: 'Mot de passe',
    passwordPlaceholder: 'Au moins 6 caractères',
    passwordRequired: 'Mot de passe requis (au moins 6 caractères).',
    access: 'SE CONNECTER',
    joinBtn: 'CRÉER MON COMPTE',
    invalidPhone: 'Numéro invalide. Format : 05, 06 ou 07 + 8 chiffres.',
    invalidEmail: "Format d'email incorrect.",
    noAccount: "Compte introuvable. Veuillez d'abord vous inscrire.",
    emailExists: 'Cet email est déjà utilisé.',
    phoneExists: 'Ce numéro est déjà utilisé.',
    loginInstead: 'Se connecter maintenant',
    invalidCredentials: 'Email ou mot de passe incorrect.',
    emailNotConfirmed:
      'Email non confirmé. Vérifiez votre boîte mail et cliquez sur le lien.',
    registerInfo:
      'Email de confirmation envoyé. Cliquez sur le lien pour activer votre compte, puis connectez-vous.',
    cloudError: 'Erreur de connexion au Cloud Supabase.',
    forgotPassword: 'Mot de passe oublié ?',
    forgotSuccess: 'Email de réinitialisation envoyé. Vérifiez votre boîte mail.',
    forgotError: "Erreur lors de l'envoi de l'email de réinitialisation.",
    loginSuccess: 'Connexion réussie.',
    termsLabel:
      "J'accepte les Conditions Générales d'Utilisation et la Politique de Confidentialité LOCA DZ.",
    termsLink: 'Lire les conditions',
    termsRequired: 'Vous devez accepter les conditions pour créer un compte.',
  },
  en: {
    portal: 'LOCADZ Member Portal',
    req: 'Secure Access · Supabase Cloud',
    member: 'Sign In',
    join: 'Create Account',
    name: 'Full Name',
    email: 'Professional Email',
    phone: 'Mobile Number (Algeria)',
    phoneHint: 'Ex: 0550 12 34 56',
    role: 'Network Role',
    traveler: 'Traveler',
    host: 'Host',
    password: 'Password',
    passwordPlaceholder: 'At least 6 characters',
    passwordRequired: 'Password required (minimum 6 characters).',
    access: 'SIGN IN',
    joinBtn: 'CREATE ACCOUNT',
    invalidPhone: 'Invalid phone. Format: 05, 06 or 07 + 8 digits.',
    invalidEmail: 'Incorrect email format.',
    noAccount: 'Account not found. Please register first.',
    emailExists: 'This email is already used.',
    phoneExists: 'This phone number is already used.',
    loginInstead: 'Login instead',
    invalidCredentials: 'Incorrect email or password.',
    emailNotConfirmed:
      'Email not confirmed. Check your inbox and click the link.',
    registerInfo:
      'We sent you a confirmation email. Click the link to activate your account, then log in.',
    cloudError: 'Cloud Supabase connection error.',
    forgotPassword: 'Forgot password ?',
    forgotSuccess: 'Password reset email sent. Check your inbox.',
    forgotError: 'Error while sending reset email.',
    loginSuccess: 'Login successful.',
    termsLabel:
      'I accept LOCA DZ Terms of Use and Privacy Policy.',
    termsLink: 'Read terms',
    termsRequired: 'You must accept the terms to create an account.',
  },
  ar: {
    portal: 'بوابة أعضاء لوكادز',
    req: 'دخول آمن · سحابة Supabase',
    member: 'تسجيل الدخول',
    join: 'حساب جديد',
    name: 'الاسم و اللقب',
    email: 'البريد الإلكتروني',
    phone: 'رقم الهاتف (الجزائر)',
    phoneHint: 'مثال: 0550 12 34 56',
    role: 'الدور في الشبكة',
    traveler: 'مسافر',
    host: 'مضيف',
    password: 'كلمة المرور',
    passwordPlaceholder: '6 أحرف على الأقل',
    passwordRequired: 'كلمة المرور مطلوبة (6 أحرف على الأقل).',
    access: 'دخول',
    joinBtn: 'إنشاء حساب',
    invalidPhone: 'رقم غير صحيح. يبدأ بـ 05، 06 أو 07 متبوعًا بـ 8 أرقام.',
    invalidEmail: 'صيغة البريد الإلكتروني غير صحيحة.',
    noAccount: 'الحساب غير موجود. يرجى التسجيل أولاً.',
    emailExists: 'هذا البريد الإلكتروني مستعمل مسبقاً.',
    phoneExists: 'هذا الرقم مستعمل مسبقاً.',
    loginInstead: 'سجل دخولك الآن',
    invalidCredentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    emailNotConfirmed: 'البريد غير مؤكد. تحقق من بريدك واضغط على الرابط.',
    registerInfo:
      'تم إرسال بريد تأكيد. اضغط على الرابط لتفعيل الحساب ثم قم بتسجيل الدخول.',
    cloudError: 'خطأ في الاتصال بسحابة Supabase.',
    forgotPassword: 'نسيت كلمة المرور ؟',
    forgotSuccess:
      'تم إرسال بريد لإعادة تعيين كلمة المرور. تحقق من بريدك.',
    forgotError: 'خطأ أثناء إرسال بريد إعادة التعيين.',
    loginSuccess: 'تم تسجيل الدخول بنجاح.',
    termsLabel:
      'أوافق على شروط الاستخدام وسياسة الخصوصية الخاصة بمنصة لوكادز.',
    termsLink: 'قراءة الشروط',
    termsRequired: 'يجب عليك قبول الشروط لإنشاء حساب.',
  },
};

// 🌟 Composant Particules animées
const ParticleField: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(30)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full opacity-20"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float ${5 + Math.random() * 10}s linear infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(-40px) translateX(-10px); }
          75% { transform: translateY(-20px) translateX(5px); }
        }
      `}</style>
    </div>
  );
};

// 🔥 Composant Portail de succès
const SuccessPortal: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
      {/* Fond gradient animé */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 animate-pulse" />
      
      {/* Cercles concentriques */}
      <div className="relative">
        <div className="w-96 h-96 rounded-full border-4 border-white/30 animate-[ping_1.5s_ease-out_infinite]" />
        <div className="absolute inset-0 w-96 h-96 rounded-full border-4 border-white/20 animate-[ping_2s_ease-out_infinite]" 
             style={{ animationDelay: '0.3s' }} />
        <div className="absolute inset-0 w-96 h-96 rounded-full border-4 border-white/10 animate-[ping_2.5s_ease-out_infinite]" 
             style={{ animationDelay: '0.6s' }} />
        
        {/* Centre brillant */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 rounded-full bg-white/90 shadow-[0_0_100px_rgba(255,255,255,0.8)] flex flex-col items-center justify-center animate-[spin_3s_linear_infinite]">
            <div className="text-center">
              <div className="text-4xl mb-2">✨</div>
              <div className="text-xs font-black text-indigo-600 tracking-widest">WELCOME</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Particules de lumière */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 bg-white rounded-full animate-[sparkle_1s_ease-out_infinite]"
          style={{
            left: `${50 + (Math.random() - 0.5) * 60}%`,
            top: `${50 + (Math.random() - 0.5) * 60}%`,
            animationDelay: `${Math.random() * 1}s`,
          }}
        />
      ))}
      
      <style jsx>{`
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  language,
}) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('TRAVELER');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPortal, setIsPortal] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const t = AUTH_TRANSLATIONS[language];
  const isRTL = language === 'ar';
  const { notify } = useNotification();

  useEffect(() => {
    if (isOpen) {
      // Animation d'entrée
      setTimeout(() => setModalVisible(true), 50);
    } else {
      setModalVisible(false);
      setIsLogin(true);
      setEmail('');
      setFullName('');
      setPhone('');
      setRole('TRAVELER');
      setPassword('');
      setAcceptedTerms(false);
      setError('');
      setInfo('');
      setIsLoading(false);
      setIsPortal(false);
    }
  }, [isOpen]);

  const validateEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const validatePhone = (value: string) =>
    /^(0)(5|6|7)[0-9]{8}$/.test(value.replace(/\s/g, ''));

  const triggerPortalAndClose = (user: UserProfile) => {
    setIsPortal(true);
    setTimeout(() => {
      onSuccess(user);
      onClose();
      setIsPortal(false);
    }, 2000);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!validateEmail(email)) {
      setError(t.invalidEmail);
      notify({ type: 'error', message: t.invalidEmail });
      return;
    }

    if (!password || password.length < 6) {
      setError(t.passwordRequired);
      notify({ type: 'error', message: t.passwordRequired });
      return;
    }

    if (!isLogin && !validatePhone(phone)) {
      setError(t.invalidPhone);
      notify({ type: 'error', message: t.invalidPhone });
      return;
    }

    if (!isLogin && !acceptedTerms) {
      setError(t.termsRequired);
      notify({ type: 'error', message: t.termsRequired });
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        try {
          const user = await authService.login(email, password);
          if (user) {
            notify({ type: 'success', message: t.loginSuccess });
            triggerPortalAndClose(user);
          } else {
            setError(t.noAccount);
            notify({ type: 'error', message: t.noAccount });
          }
        } catch (err: any) {
          if (err.message === 'EMAIL_NOT_CONFIRMED') {
            setError(t.emailNotConfirmed);
            notify({ type: 'error', message: t.emailNotConfirmed });
          } else if (err.message === 'INVALID_CREDENTIALS') {
            setError(t.invalidCredentials);
            notify({ type: 'error', message: t.invalidCredentials });
          } else {
            setError(t.cloudError);
            notify({ type: 'error', message: t.cloudError });
          }
        }
      } else {
        const { error: regError } = await authService.register(
          fullName,
          email,
          phone,
          role,
          password
        );
        if (regError === 'EMAIL_EXISTS') {
          setError(t.emailExists);
          notify({ type: 'error', message: t.emailExists });
        } else if (regError === 'PHONE_EXISTS') {
          setError(t.phoneExists);
          notify({ type: 'error', message: t.phoneExists });
        } else if (regError) {
          setError(regError);
          notify({ type: 'error', message: regError });
        } else {
          setInfo(t.registerInfo);
          notify({ type: 'success', message: t.registerInfo });
          setIsLogin(true);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError('');
    setInfo('');

    if (!email || !validateEmail(email)) {
      setError(t.invalidEmail);
      notify({ type: 'error', message: t.invalidEmail });
      return;
    }

    try {
      setIsLoading(true);
      await authService.forgotPassword(email);
      setInfo(t.forgotSuccess);
      notify({ type: 'success', message: t.forgotSuccess });
    } catch (err) {
      console.error(err);
      setError(t.forgotError);
      notify({ type: 'error', message: t.forgotError });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 🌟 Animation PORTAIL de succès */}
      {isPortal && <SuccessPortal />}

      {/* Fond avec effet blur progressif */}
      <div
        className={`fixed inset-0 z-[150] transition-all duration-700 ${
          modalVisible ? 'backdrop-blur-xl bg-black/60' : 'backdrop-blur-none bg-black/0'
        }`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Gradient animé d'arrière-plan */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -left-1/4 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-indigo-600/30 via-purple-600/20 to-transparent blur-3xl animate-[pulse_8s_ease-in-out_infinite]" />
          <div className="absolute -bottom-1/2 -right-1/4 w-[800px] h-[800px] rounded-full bg-gradient-to-tl from-pink-600/30 via-fuchsia-600/20 to-transparent blur-3xl animate-[pulse_10s_ease-in-out_infinite]" 
               style={{ animationDelay: '2s' }} />
        </div>

        {/* Particules flottantes */}
        <ParticleField />

        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <div
            className={`w-full max-w-5xl transition-all duration-700 ${
              modalVisible
                ? 'opacity-100 scale-100 translate-y-0'
                : 'opacity-0 scale-95 translate-y-8'
            }`}
          >
            {/* Container principal avec effet glassmorphism */}
            <div className="relative bg-gradient-to-br from-slate-900/90 via-indigo-950/80 to-slate-900/90 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.8)] border border-white/10 overflow-hidden">
              
              {/* Halo lumineux au survol */}
              <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-1000 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 blur-xl" />
              </div>

              {/* Bouton fermer stylisé */}
              <button
                onClick={onClose}
                className={`absolute top-6 ${
                  isRTL ? 'left-6' : 'right-6'
                } z-30 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all hover:rotate-90 hover:scale-110 group`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 opacity-0 group-hover:opacity-20 blur transition-opacity" />
              </button>

              <div className="flex flex-col md:flex-row">
                {/* Panneau gauche - Branding */}
                <div className="hidden md:flex md:w-[42%] relative bg-gradient-to-br from-indigo-600 via-purple-700 to-fuchsia-900 p-12 flex-col justify-between overflow-hidden">
                  {/* Effet de grille animée */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                      backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                      backgroundSize: '50px 50px',
                      animation: 'grid-move 20s linear infinite'
                    }} />
                  </div>

                  {/* Logo et titre */}
                  <div className="relative z-10 space-y-6">
                    <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                      <LocadzLogo className="w-10 h-10" />
                      <div className="text-left">
                        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/80">
                          Secure Portal
                        </div>
                        <div className="text-[8px] font-bold text-white/50">
                          {t.req}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h2 className="text-4xl font-black tracking-tight text-white leading-tight">
                        Bienvenue dans<br />
                        l'extraordinaire
                      </h2>
                      <p className="text-sm text-white/70 leading-relaxed max-w-sm">
                        Accédez à votre espace personnel sécurisé. Gérez vos réservations, 
                        vos paiements et profitez d'une expérience premium.
                      </p>
                    </div>

                    {/* Badges technos */}
                    <div className="flex flex-wrap gap-2">
                      {['🔒 Sécurisé', '⚡ Rapide', '☁️ Cloud', '🎯 Smart AI'].map((badge) => (
                        <span key={badge} className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-[10px] font-bold text-white/90">
                          {badge}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Orbe lumineux animé */}
                  <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-gradient-to-tl from-white/20 to-transparent blur-3xl animate-pulse" />
                  
                  <style jsx>{`
                    @keyframes grid-move {
                      0% { transform: translate(0, 0); }
                      100% { transform: translate(50px, 50px); }
                    }
                  `}</style>
                </div>

                {/* Panneau droit - Formulaire */}
                <div className="w-full md:w-[58%] p-8 md:p-12">
                  {/* Switch Login/Register avec effet glissant */}
                  <div className="relative bg-white/5 border border-white/10 p-1.5 rounded-2xl mb-8 shadow-inner">
                    <div
                      className={`absolute top-1.5 bottom-1.5 w-[calc(50%-0.375rem)] bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl shadow-lg transition-all duration-300 ${
                        isLogin ? 'left-1.5' : 'left-[calc(50%+0.375rem)]'
                      }`}
                    />
                    <div className="relative flex">
                      <button
                        type="button"
                        onClick={() => {
                          setIsLogin(true);
                          setError('');
                          setInfo('');
                        }}
                        className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${
                          isLogin ? 'text-white' : 'text-white/40 hover:text-white/70'
                        }`}
                      >
                        {t.member}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsLogin(false);
                          setError('');
                          setInfo('');
                        }}
                        className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${
                          !isLogin ? 'text-white' : 'text-white/40 hover:text-white/70'
                        }`}
                      >
                        {t.join}
                      </button>
                    </div>
                  </div>

                  {/* Formulaire */}
                  <form onSubmit={handleFormSubmit} className="space-y-5">
                    {/* Champ Nom (inscription uniquement) */}
                    {!isLogin && (
                      <div className="group space-y-2">
                        <label className="text-xs font-bold uppercase text-indigo-300 tracking-wider flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 group-focus-within:animate-pulse" />
                          {t.name}
                        </label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={e => setFullName(e.target.value)}
                          required
                          className="w-full px-5 py-3.5 bg-black/30 border border-white/10 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 transition-all outline-none text-white placeholder:text-white/30 text-sm font-medium hover:border-white/20"
                          placeholder="John Doe"
                        />
                      </div>
                    )}

                    {/* Email */}
                    <div className="group space-y-2">
                      <label className="text-xs font-bold uppercase text-indigo-300 tracking-wider flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 group-focus-within:animate-pulse" />
                        {t.email}
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        className={`w-full px-5 py-3.5 bg-black/30 border rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 transition-all outline-none text-white placeholder:text-white/30 text-sm font-medium hover:border-white/20 ${
                          error === t.invalidEmail ? 'border-rose-500 animate-shake' : 'border-white/10'
                        }`}
                        placeholder="john@example.com"
                      />
                    </div>

                    {/* Mot de passe */}
                    <div className="group space-y-2">
                      <label className="text-xs font-bold uppercase text-indigo-300 tracking-wider flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 group-focus-within:animate-pulse" />
                        {t.password}
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full px-5 py-3.5 bg-black/30 border border-white/10 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 transition-all outline-none text-white placeholder:text-white/30 text-sm font-medium hover:border-white/20"
                        placeholder="••••••••"
                      />
                    </div>

                    {/* Lien mot de passe oublié */}
                    {isLogin && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          className="text-xs font-bold text-indigo-400 hover:text-indigo-300 underline transition-colors"
                        >
                          {t.forgotPassword}
                        </button>
                      </div>
                    )}

                    {/* Téléphone (inscription) */}
                    {!isLogin && (
                      <div className="group space-y-2">
                        <label className="text-xs font-bold uppercase text-indigo-300 tracking-wider flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 group-focus-within:animate-pulse" />
                          {t.phone}
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          required
                          maxLength={10}
                          className={`w-full px-5 py-3.5 bg-black/30 border rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 transition-all outline-none text-white placeholder:text-white/30 text-sm font-medium hover:border-white/20 ${
                            error === t.invalidPhone ? 'border-rose-500 animate-shake' : 'border-white/10'
                          }`}
                          placeholder={t.phoneHint}
                        />
                      </div>
                    )}

                    {/* Sélection du rôle (inscription) */}
                    {!isLogin && (
                      <div className="space-y-3">
                        <label className="text-xs font-bold uppercase text-indigo-300 tracking-wider flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                          {t.role}
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            type="button"
                            onClick={() => setRole('TRAVELER')}
                            className={`group relative p-5 rounded-2xl border-2 transition-all ${
                              role === 'TRAVELER'
                                ? 'border-indigo-500 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 shadow-lg shadow-indigo-500/30'
                                : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                            }`}
                          >
                            <div className={`text-4xl mb-2 transition-transform group-hover:scale-110 ${
                              role === 'TRAVELER' ? 'animate-bounce' : ''
                            }`}>
                              🎒
                            </div>
                            <div className="text-xs font-black uppercase tracking-wider text-white">
                              {t.traveler}
                            </div>
                            {role === 'TRAVELER' && (
                              <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 animate-pulse" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => setRole('HOST')}
                            className={`group relative p-5 rounded-2xl border-2 transition-all ${
                              role === 'HOST'
                                ? 'border-indigo-500 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 shadow-lg shadow-indigo-500/30'
                                : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                            }`}
                          >
                            <div className={`text-4xl mb-2 transition-transform group-hover:scale-110 ${
                              role === 'HOST' ? 'animate-bounce' : ''
                            }`}>
                              🗝️
                            </div>
                            <div className="text-xs font-black uppercase tracking-wider text-white">
                              {t.host}
                            </div>
                            {role === 'HOST' && (
                              <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 animate-pulse" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Conditions (inscription) */}
                    {!isLogin && (
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                        <input
                          type="checkbox"
                          id="locadz-terms"
                          checked={acceptedTerms}
                          onChange={e => setAcceptedTerms(e.target.checked)}
                          className="mt-0.5 w-5 h-5 rounded border-2 border-white/30 bg-black/30 text-indigo-500 focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer"
                        />
                        <label htmlFor="locadz-terms" className="text-xs text-gray-300 leading-relaxed cursor-pointer">
                          {t.termsLabel}{' '}
                          <a
                            href="/about"
                            target="_blank"
                            rel="noreferrer"
                            className="underline text-indigo-300 hover:text-indigo-200 font-semibold"
                          >
                            {t.termsLink}
                          </a>
                        </label>
                      </div>
                    )}

                    {/* Messages d'erreur/info */}
                    {error && (
                      <div className="p-4 rounded-xl border-2 bg-rose-500/10 border-rose-400/40 backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
                        <p className="text-rose-300 text-xs font-bold leading-relaxed text-center">
                          ⚠️ {error}
                        </p>
                        {error === t.emailExists && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsLogin(true);
                              setError('');
                              setInfo('');
                            }}
                            className="mt-3 w-full text-xs font-black text-rose-200 underline uppercase tracking-wider hover:text-rose-100"
                          >
                            {t.loginInstead}
                          </button>
                        )}
                      </div>
                    )}

                    {info && (
                      <div className="p-4 rounded-xl border-2 bg-emerald-500/10 border-emerald-400/40 backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
                        <p className="text-emerald-300 text-xs font-bold leading-relaxed text-center">
                          ✅ {info}
                        </p>
                      </div>
                    )}

                    {/* Bouton Submit avec effet holographique */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="relative w-full py-4 mt-2 rounded-2xl font-black uppercase tracking-widest text-white overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {/* Fond gradient animé */}
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 transition-all" />
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Effet de brillance qui passe */}
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                      
                      {/* Contenu */}
                      <span className="relative z-10 flex items-center justify-center gap-3 text-sm">
                        {isLoading ? (
                          <>
                            <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>TRAITEMENT...</span>
                          </>
                        ) : (
                          <>
                            <span>{isLogin ? t.access : t.joinBtn}</span>
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </>
                        )}
                      </span>

                      {/* Ombre portée animée */}
                      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity -z-10" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </>
  );
};
