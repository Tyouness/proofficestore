// Configuration i18n pour AllKeyMasters
// Régions et devises supportées

export const locales = ['fr', 'en', 'de', 'es', 'it', 'au', 'ca', 'ch'] as const;
export const defaultLocale = 'fr' as const;

export type Locale = (typeof locales)[number];

// Mapping région -> devise
export const localeToCurrency: Record<Locale, string> = {
  fr: 'EUR',
  en: 'USD',
  de: 'EUR',
  es: 'EUR',
  it: 'EUR',
  au: 'AUD',
  ca: 'CAD',
  ch: 'CHF',
};

// Mapping région -> langue
export const localeToLanguage: Record<Locale, string> = {
  fr: 'fr-FR',
  en: 'en-US',
  de: 'de-DE',
  es: 'es-ES',
  it: 'it-IT',
  au: 'en-AU',
  ca: 'en-CA',
  ch: 'fr-CH', // Suisse multilingue, on choisit français par défaut
};

// Labels des devises
export const currencyLabels: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  CAD: 'CAD',
  AUD: 'AUD',
  CHF: 'CHF',
};

// Noms des régions pour le sélecteur
export const localeNames: Record<Locale, string> = {
  fr: 'France',
  en: 'United States',
  de: 'Deutschland',
  es: 'España',
  it: 'Italia',
  au: 'Australia',
  ca: 'Canada',
  ch: 'Schweiz',
};

// Drapeaux (emojis)
export const localeFlags: Record<Locale, string> = {
  fr: '🇫🇷',
  en: '🇺🇸',
  de: '🇩🇪',
  es: '🇪🇸',
  it: '🇮🇹',
  au: '🇦🇺',
  ca: '🇨🇦',
  ch: '🇨🇭',
};

// Helper pour obtenir le prix dans la bonne devise
export function getPriceForLocale(
  product: {
    price_eur?: number | null;
    price_usd?: number | null;
    price_gbp?: number | null;
    price_cad?: number | null;
    price_aud?: number | null;
    price_chf?: number | null;
  },
  locale: Locale
): number | null {
  const currency = localeToCurrency[locale];
  
  switch (currency) {
    case 'EUR':
      return product.price_eur ?? null;
    case 'USD':
      return product.price_usd ?? null;
    case 'GBP':
      return product.price_gbp ?? null;
    case 'CAD':
      return product.price_cad ?? null;
    case 'AUD':
      return product.price_aud ?? null;
    case 'CHF':
      return product.price_chf ?? null;
    default:
      return product.price_eur ?? null; // Fallback
  }
}

// Helper pour formater le prix avec la bonne devise
export function formatPrice(price: number | null, locale: Locale): string {
  if (price === null) return 'N/A';
  
  const currency = localeToCurrency[locale];
  const label = currencyLabels[currency];
  
  // Formatage selon la devise
  if (currency === 'USD' || currency === 'AUD' || currency === 'CAD') {
    return `${label}${price.toFixed(2)}`;
  } else if (currency === 'GBP') {
    return `${label}${price.toFixed(2)}`;
  } else if (currency === 'EUR') {
    return `${price.toFixed(2)} ${label}`;
  } else if (currency === 'CHF') {
    return `${price.toFixed(2)} ${label}`;
  }
  
  return `${price.toFixed(2)} ${currency}`;
}
