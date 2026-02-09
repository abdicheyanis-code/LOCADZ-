export type UserRole = 'TRAVELER' | 'HOST' | 'ADMIN';
export type VerificationStatus = 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED';
export type AppLanguage = 'fr' | 'en' | 'ar';
export type BookingStatus =
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'PAID'
  | 'CANCELLED'
  | 'REJECTED';

// ✅ Ajout de 'PAYPAL' ici
export type PaymentMethod = 'ON_ARRIVAL' | 'BARIDIMOB' | 'RIB' | 'PAYPAL';

export interface Category {
  id: string;
  label: string;
  icon: string;
  background_image?: string;
  background_video?: string;
}

export interface Review {
  id: string;
  property_id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface PropertyImage {
  id: string;
  property_id: string;
  image_url: string;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  property_id?: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
  sender_avatar?: string;
}

export interface PayoutDetails {
  method: 'CCP' | 'RIB' | 'NONE';
  accountName: string;
  accountNumber: string;
  bankName?: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  avatar_url: string;
  role: UserRole;
  is_verified: boolean;
  is_phone_verified?: boolean;
  id_verification_status: VerificationStatus;
  id_document_url?: string;
  payout_details: PayoutDetails;
  created_at: string;
}

/**
 * Coordonnées bancaires d’un hôte (ancien système, encore utilisé dans certains écrans)
 */
export interface Payout {
  id: string;
  host_id: string;
  method: 'CCP' | 'RIB';
  account_name: string;
  account_number: string;
  bank_name?: string;
  created_at: string;
}

/**
 * Suivi des virements effectués vers les hôtes (HostDashboard)
 */
export interface PayoutRecord {
  id: string;
  amount: number;
  date: string;
  method: 'CCP' | 'RIB';
  status: 'COMPLETED' | 'PROCESSING';
}

/**
 * Preuve de paiement envoyée par un voyageur
 */
export interface PaymentProof {
  id: string;
  booking_id: string;
  user_id: string;
  payment_method: PaymentMethod;
  amount: number;
  proof_url: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
}

export interface Property {
  id: string;
  host_id: string;
  title: string;
  description: string;
  location: string;
  price: number;
  category: string;
  rating: number;
  reviews_count: number;
  images: PropertyImage[];
  created_at: string;
  latitude: number;
  longitude: number;

  // Nouveau : lien Google Maps optionnel
  maps_url?: string;

  amenities?: string[];
  isFavorite?: boolean;
  hostName?: string;
  isHostVerified?: boolean;
}

export interface Booking {
  id: string;
  property_id: string;
  traveler_id: string;
  start_date: string;
  end_date: string;

  // Prix total payé par le client (base + 8 %)
  total_price: number;

  // Revenu plateforme total (8 % + 10 %)
  commission_fee: number;

  // Nouveau modèle détaillé (optionnel pour rétrocompatibilité)
  base_price?: number;
  service_fee_client?: number;
  host_commission?: number;
  payout_host?: number;

  status: BookingStatus;
  payment_method: PaymentMethod;
  payment_id?: string;
  receipt_url?: string;
  created_at: string;
  property_title?: string;
  traveler_name?: string;
}

export interface Favorite {
  id: string;
  traveler_id: string;
  property_id: string;
  created_at: string;
}

// -------------------- NOTIFICATIONS --------------------

export type NotificationType =
  | 'booking_created'
  | 'booking_accepted'
  | 'booking_rejected'
  | 'verification_approved'
  | 'verification_rejected';

export interface Notification {
  id: string;
  recipient_id: string;
  actor_id: string | null;
  type: NotificationType;
  title: string;
  body: string | null;
  data: Record<string, any>;
  created_at: string; // ISO string
  read_at: string | null;
}
