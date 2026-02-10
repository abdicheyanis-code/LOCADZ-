import { Category } from './types';

export const CATEGORIES: Category[] = [
  {
    id: 'trending',
    label: 'Tendances',
    icon: '🔥',
    background_image:
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200&auto=format&fit=crop',
    background_video:
      'https://cdn.pixabay.com/video/2021/04/12/70796-537442111_tiny.mp4',
  },
  {
    id: 'beachfront',
    label: 'Bord de mer',
    icon: '🏖️',
    background_image:
      'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=1200&auto=format&fit=crop',
    background_video:
      'https://cdn.pixabay.com/video/2023/05/29/164923-831416801_tiny.mp4',
  },
  {
    id: 'cabins',
    label: 'Montagne',
    icon: '🏔️',
    background_image:
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop',
    background_video:
      'https://cdn.pixabay.com/video/2021/09/01/87102-595306351_tiny.mp4',
  },
  {
    id: 'sahara',
    label: 'Sahara',
    icon: '🏜️',
    background_image:
      'https://images.unsplash.com/photo-1506371301032-db63542267ad?auto=format&fit=crop&q=80&w=1200',
    background_video:
      'https://cdn.pixabay.com/video/2020/07/04/44122-438905202_tiny.mp4',
  },
];

export const ALGERIAN_BANKS = [
  { id: 'BEA', name: "Banque Extérieure d'Algérie (BEA)" },
  { id: 'BNA', name: "Banque Nationale d'Algérie (BNA)" },
  { id: 'CPA', name: "Crédit Populaire d'Algérie (CPA)" },
  { id: 'BADR', name: "Banque de l'Agriculture et du Dév. Rural (BADR)" },
  { id: 'BDL', name: 'Banque du Développement Local (BDL)' },
  { id: 'CNEP', name: 'CNEP-Banque' },
  { id: 'AGB', name: 'Gulf Bank Algeria (AGB)' },
  { id: 'BNP', name: 'BNP Paribas El Djazaïr' },
  { id: 'SGA', name: 'Société Générale Algérie' },
  { id: 'NATIXIS', name: 'Natixis Algérie' },
  { id: 'AL_BARAKA', name: 'Al Baraka Bank Algeria' },
  { id: 'ABC', name: 'Arab Banking Corporation (ABC)' },
];

/**
 * Coordonnées de paiement de la PLATEFORME LOCA DZ
 * → Ce sont tes comptes personnels / business où les voyageurs envoient l'argent.
 * Remplace les valeurs ci‑dessous par tes vrais numéros.
 */
export const PLATFORM_PAYOUT = {
  ccp: {
    accountName: 'TON NOM COMPLET',
    accountNumber: '00000000000000000000', // 20 chiffres RIP CCP
  },
  rib: {
    accountName: 'TON NOM COMPLET',
    bankName: "Banque Extérieure d'Algérie (BEA)", // par ex.
    accountNumber: '00000000000000000000', // 20 chiffres RIB
  },
  paypal: {
    // Adresse PayPal vers laquelle les voyageurs envoient l’argent
    email: 'loca.dz@hotmail.com',
  },
} as const;
