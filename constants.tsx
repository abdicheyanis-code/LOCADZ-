import { Category } from './types';

// 🎨 Couleurs par catégorie - utilisées dans toute l'app
export const CATEGORY_COLORS: Record<string, { primary: string; secondary: string; gradient: string }> = {
  trending: {
    primary: '#ef4444',
    secondary: '#f97316',
    gradient: 'from-red-500 via-orange-500 to-amber-500',
  },
  beachfront: {
    primary: '#06b6d4',
    secondary: '#0ea5e9',
    gradient: 'from-cyan-400 via-sky-500 to-blue-500',
  },
  cabins: {
    primary: '#10b981',
    secondary: '#059669',
    gradient: 'from-emerald-400 via-green-500 to-teal-600',
  },
  sahara: {
    primary: '#f59e0b',
    secondary: '#d97706',
    gradient: 'from-amber-400 via-orange-500 to-yellow-600',
  },
  city: {
    primary: '#8b5cf6',
    secondary: '#a855f7',
    gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
  },
};

export const CATEGORIES: Category[] = [
  {
    id: 'trending',
    label: 'Tendances',
    icon: '🔥',
    background_image:
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: 'beachfront',
    label: 'Bord de mer',
    icon: '🌊',
    background_image:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: 'cabins',
    label: 'Montagne',
    icon: '🏔️',
    background_image:
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: 'sahara',
    label: 'Sahara',
    icon: '🏜️',
    background_image:
      'https://images.unsplash.com/photo-1509316785289-025f5b846b35?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: 'city',
    label: 'Ville',
    icon: '🌃',
    background_image:
      'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=1200&auto=format&fit=crop',
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

export const PLATFORM_PAYOUT = {
  ccp: {
    accountName: 'TON NOM COMPLET',
    accountNumber: '00000000000000000000',
  },
  rib: {
    accountName: 'TON NOM COMPLET',
    bankName: "Banque Extérieure d'Algérie (BEA)",
    accountNumber: '00000000000000000000',
  },
  paypal: {
    email: 'loca.dz@hotmail.com',
  },
} as const;
