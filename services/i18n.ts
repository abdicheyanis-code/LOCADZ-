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
