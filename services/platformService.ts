// services/platformService.ts
import { supabase } from '../supabaseClient';

export interface PlatformSettings {
  id: string;
  baridimob_number: string | null;
  baridimob_name: string | null;
  rib_account_number: string | null;
  rib_account_name: string | null;
  rib_bank_name: string | null;
  ccp_account_number: string | null;
  ccp_account_name: string | null;
  paypal_email: string | null;
  commission_percentage: number;
  created_at: string;
  updated_at: string;
}

export const platformService = {
  /**
   * Récupère les coordonnées de paiement de la plateforme
   */
  async getPlatformSettings(): Promise<PlatformSettings | null> {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('❌ getPlatformSettings error:', error);
      return null;
    }
    return (data as PlatformSettings) || null;
  },

  /**
   * Calcule le montant que recevra le host après commission
   */
  calculateHostPayout(totalPrice: number, commissionPercentage: number): {
    hostPayout: number;
    platformCommission: number;
  } {
    const platformCommission = (totalPrice * commissionPercentage) / 100;
    const hostPayout = totalPrice - platformCommission;

    return {
      hostPayout: Math.round(hostPayout * 100) / 100,
      platformCommission: Math.round(platformCommission * 100) / 100
    };
  }
};
