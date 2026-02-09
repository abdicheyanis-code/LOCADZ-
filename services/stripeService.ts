export const PLATFORM_CLIENT_FEE_RATE = 0.08; // 8 % côté client
export const HOST_COMMISSION_RATE = 0.10;     // 10 % pris sur le prix hôte

// Taux approximatif : 1 DZD ≈ 0.0067 EUR (à ajuster si tu veux)
export const DZD_TO_EUR_RATE = 0.0067;

/**
 * Formate le prix en DZD
 */
export const formatCurrency = (amount: number) => {
  const safeAmount = Number.isFinite(amount) ? amount : 0;

  const formatted = new Intl.NumberFormat('fr-DZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(safeAmount);

  return formatted + ' DA';
};

/**
 * Formate l'équivalent en EUR à partir d'un montant en DZD
 */
export const formatCurrencyEURFromDZD = (amountDzd: number) => {
  const safeAmount = Number.isFinite(amountDzd) ? amountDzd : 0;
  const eur = safeAmount * DZD_TO_EUR_RATE;

  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(eur);
};

/**
 * Calcule tous les montants pour une réservation selon le modèle LOCADZ
 */
export const calculatePricing = (pricePerNight: number, nights: number) => {
  const safeNights = Math.max(1, nights || 1);
  const base = pricePerNight * safeNights; // base_price

  const serviceFeeClient = base * PLATFORM_CLIENT_FEE_RATE; // 8 % client
  const hostCommission = base * HOST_COMMISSION_RATE;       // 10 % hôte

  const totalClient = base + serviceFeeClient;              // ce que paie le client
  const payoutHost = base - hostCommission;                 // ce que tu verses à l’hôte

  const platformRevenue = serviceFeeClient + hostCommission; // ce que gagne LOCADZ

  // Champs de compatibilité avec l'ancien code
  const subtotal = base;
  const commission = serviceFeeClient;
  const total = totalClient;

  return {
    // Nouveau modèle détaillé
    base,             // base_price
    serviceFeeClient, // 8 % client
    hostCommission,   // 10 % hôte
    totalClient,      // montant à payer par le client
    payoutHost,       // montant net dû à l’hôte
    platformRevenue,  // revenu total LOCADZ

    // Ancien modèle utilisé dans ton UI
    subtotal,
    commission,
    total,
  };
};

/**
 * Simule la confirmation d'une réservation avec "paiement local"
 */
export const createLocalPaymentSession = async (
  propertyId: string,
  pricing: any
) => {
  console.log(
    `[LOCADZ Reserve] Confirmation de réservation pour ${propertyId}. Mode: paiement centralisé LOCADZ (simulé).`
  );

  return new Promise<{ success: boolean; transactionId: string }>(resolve => {
    setTimeout(() => {
      resolve({
        success: true,
        transactionId: `RES-DZ-${Math.random()
          .toString(36)
          .substr(2, 9)
          .toUpperCase()}`,
      });
    }, 1500);
  });
};

// Alias pour compatibilité descendante
export const createStripeCheckout = createLocalPaymentSession;
