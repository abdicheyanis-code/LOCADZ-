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
    forgotError: "Erreur lors de l’envoi de l’email de réinitialisation.",
    loginSuccess: 'Connexion réussie.',
    termsLabel:
      "J'accepte les Conditions Générales d’Utilisation et la Politique de Confidentialité LOCA DZ.",
    termsLink: 'Lire les conditions',
    termsRequired: 'Vous devez accepter les conditions pour créer un compte.',
    // Portail succès
    portalSuccessTitle: 'Connexion sécurisée',
    portalSuccessSubtitle: "Bienvenue dans l’univers LOCA DZ",
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
    portalSuccessTitle: 'Secure login',
    portalSuccessSubtitle: 'Welcome into the LOCA DZ universe',
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
    portalSuccessTitle: 'تم تسجيل الدخول بأمان',
    portalSuccessSubtitle: 'مرحباً بك في عالم لوكادز',
  },
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
  const [isPortal, setIsPortal] = useState(false); // 🌌 Animation portail
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const t = AUTH_TRANSLATIONS[language];
  const isRTL = language === 'ar';
  const { notify } = useNotification();

  useEffect(() => {
    if (!isOpen) {
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
    }, 900); // durée de l’animation portail
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
          } else
