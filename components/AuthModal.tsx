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
    welcomeTitle: 'Bienvenue',
    welcomeSubtitle: 'Accès autorisé',
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
    termsLabel: 'I accept LOCA DZ Terms of Use and Privacy Policy.',
    termsLink: 'Read terms',
    termsRequired: 'You must accept the terms to create an account.',
    welcomeTitle: 'Welcome',
    welcomeSubtitle: 'Access granted',
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
    forgotSuccess: 'تم إرسال بريد لإعادة تعيين كلمة المرور. تحقق من بريدك.',
    forgotError: 'خطأ أثناء إرسال بريد إعادة التعيين.',
    loginSuccess: 'تم تسجيل الدخول بنجاح.',
    termsLabel: 'أوافق على شروط الاستخدام وسياسة الخصوصية الخاصة بمنصة لوكادز.',
    termsLink: 'قراءة الشروط',
    termsRequired: 'يجب عليك قبول الشروط لإنشاء حساب.',
    welcomeTitle: 'مرحباً',
    welcomeSubtitle: 'تم السماح بالدخول',
  },
};

// 🎨 CSS Keyframes injectés globalement (une seule fois)
const injectGlobalStyles = () => {
  if (typeof document === 'undefined') return;
  if (document.getElementById('locadz-auth-styles')) return;

  const style = document.createElement('style');
  style.id = 'locadz-auth-styles';
  style.textContent = `
    @keyframes locadz-float {
      0%, 100% { transform: translateY(0px) scale(1); opacity: 0.3; }
      50% { transform: translateY(-20px) scale(1.1); opacity: 0.6; }
    }
    @keyframes locadz-glow {
      0%, 100% { opacity: 0.4; transform: scale(1); }
      50% { opacity: 0.8; transform: scale(1.05); }
    }
    @keyframes locadz-shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    @keyframes locadz-success-ring {
      0% { transform: scale(0.8); opacity: 1; }
      100% { transform: scale(2); opacity: 0; }
    }
    @keyframes locadz-success-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
    @keyframes locadz-fade-in {
      0% { opacity: 0; transform: scale(0.95) translateY(10px); }
      100% { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes locadz-shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-5px); }
      40%, 80% { transform: translateX(5px); }
    }
    .locadz-animate-float { animation: locadz-float 6s ease-in-out infinite; }
    .locadz-animate-glow { animation: locadz-glow 4s ease-in-out infinite; }
    .locadz-animate-shimmer { animation: locadz-shimmer 2s ease-in-out infinite; }
    .locadz-animate-fade-in { animation: locadz-fade-in 0.5s ease-out forwards; }
    .locadz-animate-shake { animation: locadz-shake 0.4s ease-in-out; }
  `;
  document.head.appendChild(style);
};

// 🌟 Portail de succès épuré et fluide
const SuccessPortal: React.FC<{ language: AppLanguage }> = ({ language }) => {
  const t = AUTH_TRANSLATIONS[language];

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
      {/* Cercles qui s'expandent */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full border-2 border-white/30"
            style={{
              width: '200px',
              height: '200px',
              animation: `locadz-success-ring 2s ease-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      {/* Centre avec icône */}
      <div
        className="relative z-10 flex flex-col items-center gap-4"
        style={{ animation: 'locadz-success-pulse 1s ease-in-out infinite' }}
      >
        <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center shadow-2xl">
          <span className="text-5xl">✓</span>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-black text-white tracking-wide">
            {t.welcomeTitle}
          </h2>
          <p className="text-sm text-white/80 mt-1">{t.welcomeSubtitle}</p>
        </div>
      </div>
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
  const [isVisible, setIsVisible] = useState(false);

  const t = AUTH_TRANSLATIONS[language];
  const isRTL = language === 'ar';
  const { notify } = useNotification();

  // Injection des styles au montage
  useEffect(() => {
    injectGlobalStyles();
  }, []);

  // Animation d'entrée/sortie
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
      // Reset des champs
      setTimeout(() => {
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
      }, 300);
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
    }, 1800);
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

  if (!isOpen && !isVisible) return null;

  return (
    <>
      {/* Portail de succès */}
      {isPortal && <SuccessPortal language={language} />}

      {/* Overlay */}
      <div
        className={`fixed inset-0 z-[150] transition-all duration-500 ${
          isVisible
            ? 'bg-black/70 backdrop-blur-md'
            : 'bg-black/0 backdrop-blur-none'
        }`}
        onClick={onClose}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Orbes lumineux en arrière-plan */}
        <div
          className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/20 blur-3xl locadz-animate-glow"
          style={{ animationDelay: '0s' }}
        />
        <div
          className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-fuchsia-600/20 blur-3xl locadz-animate-glow"
          style={{ animationDelay: '2s' }}
        />
      </div>

      {/* Modal */}
      <div
        className={`fixed inset-0 z-[160] flex items-center justify-center p-4 pointer-events-none`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div
          className={`relative w-full max-w-4xl max-h-[90vh] overflow-auto pointer-events-auto transition-all duration-500 ${
            isVisible
              ? 'opacity-100 scale-100 translate-y-0'
              : 'opacity-0 scale-95 translate-y-8'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Container principal */}
          <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950/90 to-slate-900 rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
            {/* Bouton fermer */}
            <button
              onClick={onClose}
              className={`absolute top-4 ${
                isRTL ? 'left-4' : 'right-4'
              } z-20 w-10 h-10 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all duration-300 hover:rotate-90`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="flex flex-col md:flex-row">
              {/* Panneau gauche - Branding */}
              <div className="hidden md:flex md:w-[40%] relative bg-gradient-to-br from-indigo-600 via-purple-700 to-fuchsia-800 p-10 flex-col justify-center overflow-hidden">
                {/* Effet de lumière */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />

                {/* Particules subtiles */}
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 rounded-full bg-white/30 locadz-animate-float"
                    style={{
                      left: `${15 + Math.random() * 70}%`,
                      top: `${10 + Math.random() * 80}%`,
                      animationDelay: `${i * 0.5}s`,
                      animationDuration: `${4 + Math.random() * 4}s`,
                    }}
                  />
                ))}

                <div className="relative z-10 space-y-6">
                  {/* Badge logo */}
                  <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                    <LocadzLogo className="w-8 h-8" />
                    <span className="text-xs font-bold text-white/80 uppercase tracking-wider">
                      Portal
                    </span>
                  </div>

                  <h2 className="text-3xl font-black text-white leading-tight">
                    {t.portal}
                  </h2>

                  <p className="text-sm text-white/70 leading-relaxed">
                    {t.req}
                  </p>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 pt-4">
                    {['🔐 Secure', '⚡ Fast', '☁️ Cloud'].map((badge) => (
                      <span
                        key={badge}
                        className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-medium text-white/90"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Panneau droit - Formulaire */}
              <div className="w-full md:w-[60%] p-8 md:p-10">
                {/* Toggle Login/Register */}
                <div className="relative bg-white/5 border border-white/10 p-1 rounded-2xl mb-8">
                  {/* Indicateur glissant */}
                  <div
                    className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl shadow-lg transition-all duration-300 ease-out ${
                      isLogin ? 'left-1' : 'left-[calc(50%+2px)]'
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
                      className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors duration-300 ${
                        isLogin ? 'text-white' : 'text-white/40 hover:text-white/60'
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
                      className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors duration-300 ${
                        !isLogin ? 'text-white' : 'text-white/40 hover:text-white/60'
                      }`}
                    >
                      {t.join}
                    </button>
                  </div>
                </div>

                {/* Formulaire */}
                <form onSubmit={handleFormSubmit} className="space-y-5">
                  {/* Nom (inscription) */}
                  {!isLogin && (
                    <div className="space-y-2 locadz-animate-fade-in">
                      <label className="text-xs font-bold uppercase text-indigo-300 tracking-wider ml-1">
                        {t.name}
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all outline-none text-white placeholder:text-white/30"
                        placeholder="Nom complet"
                      />
                    </div>
                  )}

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-indigo-300 tracking-wider ml-1">
                      {t.email}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={`w-full px-4 py-3 bg-white/5 border rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all outline-none text-white placeholder:text-white/30 ${
                        error === t.invalidEmail
                          ? 'border-rose-500 locadz-animate-shake'
                          : 'border-white/10'
                      }`}
                      placeholder="votre@email.com"
                    />
                  </div>

                  {/* Mot de passe */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-indigo-300 tracking-wider ml-1">
                      {t.password}
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all outline-none text-white placeholder:text-white/30"
                      placeholder={t.passwordPlaceholder}
                    />
                  </div>

                  {/* Mot de passe oublié */}
                  {isLogin && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-xs font-medium text-indigo-400 hover:text-indigo-300 underline-offset-4 hover:underline transition-colors"
                      >
                        {t.forgotPassword}
                      </button>
                    </div>
                  )}

                  {/* Téléphone (inscription) */}
                  {!isLogin && (
                    <div className="space-y-2 locadz-animate-fade-in">
                      <label className="text-xs font-bold uppercase text-indigo-300 tracking-wider ml-1">
                        {t.phone}
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        maxLength={10}
                        className={`w-full px-4 py-3 bg-white/5 border rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all outline-none text-white placeholder:text-white/30 ${
                          error === t.invalidPhone
                            ? 'border-rose-500 locadz-animate-shake'
                            : 'border-white/10'
                        }`}
                        placeholder={t.phoneHint}
                      />
                    </div>
                  )}

                  {/* Rôle (inscription) */}
                  {!isLogin && (
                    <div className="space-y-3 locadz-animate-fade-in">
                      <label className="text-xs font-bold uppercase text-indigo-300 tracking-wider ml-1">
                        {t.role}
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setRole('TRAVELER')}
                          className={`group relative p-4 rounded-xl border-2 transition-all duration-300 ${
                            role === 'TRAVELER'
                              ? 'border-indigo-500 bg-indigo-500/20 shadow-lg shadow-indigo-500/20'
                              : 'border-white/10 bg-white/5 hover:border-white/20'
                          }`}
                        >
                          <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                            🎒
                          </div>
                          <div className="text-xs font-bold text-white uppercase">
                            {t.traveler}
                          </div>
                          {role === 'TRAVELER' && (
                            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setRole('HOST')}
                          className={`group relative p-4 rounded-xl border-2 transition-all duration-300 ${
                            role === 'HOST'
                              ? 'border-indigo-500 bg-indigo-500/20 shadow-lg shadow-indigo-500/20'
                              : 'border-white/10 bg-white/5 hover:border-white/20'
                          }`}
                        >
                          <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                            🗝️
                          </div>
                          <div className="text-xs font-bold text-white uppercase">
                            {t.host}
                          </div>
                          {role === 'HOST' && (
                            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Conditions (inscription) */}
                  {!isLogin && (
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 locadz-animate-fade-in">
                      <input
                        type="checkbox"
                        id="locadz-terms"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-white/30 bg-white/10 text-indigo-500 focus:ring-2 focus:ring-indigo-500/50"
                      />
                      <label
                        htmlFor="locadz-terms"
                        className="text-xs text-white/70 leading-relaxed cursor-pointer"
                      >
                        {t.termsLabel}{' '}
                        <a
                          href="/about"
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 underline"
                        >
                          {t.termsLink}
                        </a>
                      </label>
                    </div>
                  )}

                  {/* Message d'erreur */}
                  {error && (
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 locadz-animate-fade-in">
                      <p className="text-rose-300 text-sm font-medium text-center">
                        ⚠️ {error}
                      </p>
                      {error === t.emailExists && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsLogin(true);
                            setError('');
                          }}
                          className="mt-2 w-full text-xs font-bold text-rose-200 underline"
                        >
                          {t.loginInstead}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Message d'info */}
                  {info && (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 locadz-animate-fade-in">
                      <p className="text-emerald-300 text-sm font-medium text-center">
                        ✅ {info}
                      </p>
                    </div>
                  )}

                  {/* Bouton Submit */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="relative w-full py-4 rounded-xl font-bold text-white uppercase tracking-wider overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {/* Fond gradient */}
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600" />

                    {/* Effet shimmer */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent locadz-animate-shimmer" />
                    </div>

                    {/* Contenu */}
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {isLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>...</span>
                        </>
                      ) : (
                        <>
                          <span>{isLogin ? t.access : t.joinBtn}</span>
                          <svg
                            className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M13 7l5 5m0 0l-5 5m5-5H6"
                            />
                          </svg>
                        </>
                      )}
                    </span>

                    {/* Ombre */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl blur opacity-40 group-hover:opacity-60 transition-opacity -z-10" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
