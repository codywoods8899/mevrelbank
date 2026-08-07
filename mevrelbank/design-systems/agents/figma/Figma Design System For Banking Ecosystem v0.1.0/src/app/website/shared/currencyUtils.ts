// ─── Currency formatting helpers ─────────────────────────────────────────────

/** ISO 4217 codes supported by MevrelBank accounts. */
export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'CHF', 'JPY', 'AUD'] as const;
export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];

/** Currency display metadata used in selectors and badges. */
export const CURRENCY_META: Record<SupportedCurrency, { symbol: string; name: string; flag: string }> = {
  USD: { symbol: '$',  name: 'US Dollar',        flag: '🇺🇸' },
  EUR: { symbol: '€',  name: 'Euro',              flag: '🇪🇺' },
  GBP: { symbol: '£',  name: 'British Pound',     flag: '🇬🇧' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar',   flag: '🇨🇦' },
  CHF: { symbol: 'Fr', name: 'Swiss Franc',        flag: '🇨🇭' },
  JPY: { symbol: '¥',  name: 'Japanese Yen',       flag: '🇯🇵' },
  AUD: { symbol: 'A$', name: 'Australian Dollar',  flag: '🇦🇺' },
};

/**
 * Formats an amount with the correct currency symbol using Intl.NumberFormat.
 * Falls back to USD formatting for unrecognised codes.
 */
export function formatAmount(amount: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: currency === 'JPY' ? 0 : 2,
      maximumFractionDigits: currency === 'JPY' ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/** Returns just the symbol (€, £, $, …) for a given currency code. */
export function currencySymbol(currency: string): string {
  return CURRENCY_META[currency as SupportedCurrency]?.symbol ?? currency;
}
