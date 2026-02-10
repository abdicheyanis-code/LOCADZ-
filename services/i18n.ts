import { AppLanguage } from '../types';

export const TRANSLATIONS: Record<AppLanguage, any> = {
  fr: {
    explore: 'Explorer',
    bookings: 'Mes Voyages',
    favorites: 'Favoris',
    settings: 'Paramètres',
    profile: 'Profil',
    logout: 'Déconnexion',
    certified: 'Compte certifié LOCADZ',
    noResult: 'Aucun résultat trouvé',
    adjustFilter: "Ajustez vos filtres pour découvrir d'autres pépites.",
    searching: 'IA en cours d’analyse...',
    back: 'Retour',
    noBookings: "Vous n'avez pas encore de réservations.",
    noFavorites: 'Votre liste de favoris est vide.',
    welcomeTitle: "L'évasion Absolue.",
    welcomeSub:
      'Découvrez une collection de séjours uniques, sélectionnés par LOCADZ.',
    signature: 'Collection LOCADZ Signature',
    authSlogan: "L'exceptionnel vous attend.",
    authSub:
      'Pour découvrir notre collection exclusive et réserver vos séjours, une authentification est requise.',
    authBtn: "Entrer dans l'univers",
    privateAccess: 'Accès Privé • Algérie',
    securityVerify: 'Connexion sécurisée (HTTPS) • Données hébergées dans le cloud',
    confirmPay: 'Confirmer la réservation',
    payMethod: 'Choisir le mode de paiement',
    payArrival: "Paiement à l'arrivée",
    payBaridi: 'BaridiMob / Virement',
    hostInfo: 'Informations de paiement',
    noHostInfo: 'Paiement en ligne non configuré.',
    uploadReceipt: 'Envoyer le reçu de virement',
    receiptRequired: 'Le reçu est obligatoire pour valider votre demande.',
    payArrivalDesc: 'Réglez directement auprès de l’hôte lors de la remise des clés.',
    payBaridiDesc: "Virement rapide via l'application BaridiMob d'Algérie Poste.",
    aboutUs: '🚀 Notre Odyssée',
    missionTitle: 'Notre Mission',
    visionTitle: 'Notre Vision',
    missionText:
      "Redéfinir l'hospitalité algérienne en fusionnant tradition séculaire et intelligence artificielle pour offrir des séjours d’exception.",
    visionText:
      'Devenir la plateforme de référence mondiale pour le voyage de luxe en Afrique du Nord, basée sur la confiance et l’innovation.',

    // -------- MES VOYAGES / BOOKINGSVIEW --------
    bookingsSubtitle: 'Suivi de vos réservations & paiements',
    bookingsLoading: 'Chargement de vos voyages...',
    bookingsLoadError:
      "Impossible de charger vos réservations pour l'instant.",
    bookingsRefresh: 'Rafraîchir',
    bookingsNoneSubtitle:
      'Dès que vous réserverez un séjour, il apparaîtra ici avec son statut et les informations de paiement.',

    proofUploadSuccess:
      "Reçu envoyé. L'équipe LOCA DZ ou l’hôte validera votre paiement manuellement.",
    proofUploadFailed:
      "Échec de l'envoi du reçu. Réessayez plus tard ou contactez le support.",
    proofUploadUnexpected:
      "Une erreur inattendue s'est produite lors de l'envoi du reçu.",

    labelFrom: 'Du',
    labelTo: 'Au',
    labelAmount: 'Montant',
    labelPayment: 'Paiement',
    waitHostBeforeProof:
      "Attendez que l'hôte accepte votre demande avant de payer ou d'envoyer un reçu.",
    paidLabel: 'Paiement validé',
    uploadReceiptCta: 'Envoyer mon reçu',
    uploadReceiptLoading: 'Envoi en cours...',

    paymentInfoIntroBaridi: 'Effectuez un virement BaridiMob / CCP vers :',
    paymentInfoIntroRib: 'Effectuez un virement bancaire vers :',
    paymentInfoIntroPaypal: 'Payer via PayPal à cette adresse :',
    paymentInfoThenUpload:
      'Puis uploadez une capture d’écran ou un reçu PDF ci-dessus.',
  },

  en: {
    explore: 'Explore',
    bookings: 'My Trips',
    favorites: 'Favorites',
    settings: 'Settings',
    profile: 'Profile',
    logout: 'Logout',
    certified: 'LOCADZ Certified Account',
    noResult: 'No results found',
    adjustFilter: 'Adjust your filters to discover more gems.',
    searching: 'AI Analyzing...',
    back: 'Back',
    noBookings: 'No bookings yet.',
    noFavorites: 'Your favorites list is empty.',
    welcomeTitle: 'Absolute Escape.',
    welcomeSub: 'Discover unique stays, curated by LOCADZ.',
    signature: 'LOCADZ Signature Collection',
    authSlogan: 'The exceptional awaits you.',
    authSub: 'Authentication is required to book exclusive stays.',
    authBtn: 'Enter the universe',
    privateAccess: 'Private Access • Algeria',
    securityVerify: 'Secure connection (HTTPS) • Cloud‑hosted data',
    confirmPay: 'Confirm Reservation',
    payMethod: 'Choose payment method',
    payArrival: 'Payment on Arrival',
    payBaridi: 'BaridiMob / Transfer',
    hostInfo: 'Payment Info',
    noHostInfo: 'Online payment not set.',
    uploadReceipt: 'Upload Payment Receipt',
    receiptRequired: 'Receipt is required to validate your request.',
    payArrivalDesc: 'Pay the host directly when you receive the keys.',
    payBaridiDesc: "Fast transfer via Algeria Post's BaridiMob app.",
    aboutUs: '🚀 Our Odyssey',
    missionTitle: 'Our Mission',
    visionTitle: 'Our Vision',
    missionText:
      'Redefining Algerian hospitality by merging secular tradition and artificial intelligence to offer exceptional stays.',
    visionText:
      'Become the global reference platform for luxury travel in North Africa, built on trust and innovation.',

    // -------- BOOKINGSVIEW --------
    bookingsSubtitle: 'Track your reservations & payments',
    bookingsLoading: 'Loading your trips...',
    bookingsLoadError: 'Unable to load your bookings at the moment.',
    bookingsRefresh: 'Refresh',
    bookingsNoneSubtitle:
      'Once you book a stay, it will appear here with its status and payment information.',

    proofUploadSuccess:
      'Receipt sent. The LOCADZ team or the host will manually validate your payment.',
    proofUploadFailed:
      'Failed to send the receipt. Please try again later or contact support.',
    proofUploadUnexpected:
      'An unexpected error occurred while sending the receipt.',

    labelFrom: 'From',
    labelTo: 'To',
    labelAmount: 'Amount',
    labelPayment: 'Payment',
    waitHostBeforeProof:
      'Wait for the host to accept your request before paying or sending a receipt.',
    paidLabel: 'Payment validated',
    uploadReceiptCta: 'Upload my receipt',
    uploadReceiptLoading: 'Uploading...',

    paymentInfoIntroBaridi: 'Make a BaridiMob / CCP transfer to:',
    paymentInfoIntroRib: 'Make a bank transfer to:',
    paymentInfoIntroPaypal: 'Pay via PayPal at this address:',
    paymentInfoThenUpload:
      'Then upload a screenshot or PDF receipt above.',
  },

  ar: {
    explore: 'استكشاف',
    bookings: 'رحلاتي',
    favorites: 'المفضلة',
    settings: 'الإعدادات',
    profile: 'الملف الشخصي',
    logout: 'تسجيل الخروج',
    certified: 'حساب لوكادز موثق',
    noResult: 'لم يتم العثور على نتائج',
    adjustFilter: 'قم بتعديل الفلاتر لاكتشاف المزيد من الجواهر.',
    searching: 'الذكاء الاصطناعي يحلل...',
    back: 'رجوع',
    noBookings: 'ليس لديك حجوزات بعد.',
    noFavorites: 'قائمة مفضلاتك فارغة.',
    welcomeTitle: 'الهروب المطلق',
    welcomeSub: 'اكتشف مجموعة من الإقامات الفريدة المختارة بعناية.',
    signature: 'مجموعة لوكادز المتميزة',
    authSlogan: 'الاستثنائي بانتظارك',
    authSub:
      'لاكتشاف مجموعتنا الحصرية وحجز إقامتك، يلزم تسجيل الدخول.',
    authBtn: 'دخول العالم',
    privateAccess: 'دخول خاص • الجزائر',
    securityVerify: 'اتصال آمن (HTTPS) • بيانات مستضافة على السحابة',
    confirmPay: 'تأكيد الحجز',
    payMethod: 'اختر طريقة الدفع',
    payArrival: 'الدفع عند الوصول',
    payBaridi: 'بريدي موب / تحويل',
    hostInfo: 'معلومات الدفع',
    noHostInfo: 'لم يتم تهيئة الدفع بعد.',
    uploadReceipt: 'تحميل وصل التحويل',
    receiptRequired: 'الوصل ضروري لتأكيد طلبك.',
    payArrivalDesc: 'ادفع مباشرة للمضيف عند استلام المفاتيح.',
    payBaridiDesc:
      'تحويل سريع عبر تطبيق بريدي موب بريد الجزائر.',
    aboutUs: '🚀 رحلتنا',
    missionTitle: 'مهمتنا',
    visionTitle: 'رؤيتنا',
    missionText:
      'إعادة تعريف الضيافة الجزائرية من خلال دمج التقاليد العريقة والذكاء الاصطناعي لتقديم إقامات استثنائية.',
    visionText:
      'أن نصبح المنصة المرجعية العالمية للسفر الفاخر في شمال إفريقيا، القائمة على الثقة والابتكار.',

    // -------- BOOKINGSVIEW --------
    bookingsSubtitle: 'متابعة حجوزاتك ودفعاتك',
    bookingsLoading: 'جاري تحميل رحلاتك...',
    bookingsLoadError: 'تعذر تحميل الحجوزات حالياً.',
    bookingsRefresh: 'تحديث',
    bookingsNoneSubtitle:
      'عند القيام بأي حجز، سيظهر هنا مع حالته ومعلومات الدفع.',

    proofUploadSuccess:
      'تم إرسال الوصل. سيتولى فريق لوكادز أو المضيف تأكيد الدفع يدوياً.',
    proofUploadFailed:
      'فشل إرسال الوصل. حاول مرة أخرى لاحقاً أو اتصل بالدعم.',
    proofUploadUnexpected:
      'حدث خطأ غير متوقع أثناء إرسال الوصل.',

    labelFrom: 'من',
    labelTo: 'إلى',
    labelAmount: 'المبلغ',
    labelPayment: 'طريقة الدفع',
    waitHostBeforeProof:
      'انتظر موافقة المضيف على طلبك قبل الدفع أو إرسال الوصل.',
    paidLabel: 'تم تأكيد الدفع',
    uploadReceiptCta: 'إرسال الوصل',
    uploadReceiptLoading: 'جاري الإرسال...',

    paymentInfoIntroBaridi: 'قم بتحويل عبر بريدي موب / CCP إلى:',
    paymentInfoIntroRib: 'قم بتحويل بنكي إلى:',
    paymentInfoIntroPaypal: 'ادفع عبر PayPal على هذا البريد:',
    paymentInfoThenUpload:
      'ثم قم بتحميل لقطة شاشة أو ملف PDF للوصل أعلاه.',
  },
};
