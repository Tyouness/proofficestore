/**
 * 💰 HELPERS - GESTION DES PRIX MULTI-DEVISES
 * 
 * Fonctions utilitaires pour :
 * - Récupérer le bon prix selon la locale
 * - Formater les prix selon la devise
 * - Calculer les réductions
 * 
 * @module lib/currency
 */

export type Currency = 'EUR' | 'USD' | 'GBP' | 'CAD' | 'AUD' | 'CHF';
export type Locale = 'fr' | 'en' | 'de' | 'es' | 'it';

/**
 * Mapping locale → devise
 * Base sur la localisation géographique la plus probable
 */
export const LOCALE_TO_CURRENCY: Record<Locale, Currency> = {
  fr: 'EUR',  // France, Belgique, Suisse FR
  en: 'USD',  // USA, Canada EN (par défaut)
  de: 'EUR',  // Allemagne, Autriche, Suisse DE
  es: 'EUR',  // Espagne
  it: 'EUR',  // Italie
};

/**
 * Configuration du formatage par devise
 */
export const CURRENCY_CONFIG: Record<Currency, {
  symbol: string;
  position: 'before' | 'after';
  decimals: number;
  separator: '.' | ',';
  thousandSeparator: ',' | ' ' | '.' | "'";
}> = {
  EUR: {
    symbol: '€',
    position: 'after',
    decimals: 2,
    separator: ',',
    thousandSeparator: ' ',
  },
  USD: {
    symbol: '$',
    position: 'before',
    decimals: 2,
    separator: '.',
    thousandSeparator: ',',
  },
  GBP: {
    symbol: '£',
    position: 'before',
    decimals: 2,
    separator: '.',
    thousandSeparator: ',',
  },
  CAD: {
    symbol: 'CAD',
    position: 'after',
    decimals: 2,
    separator: '.',
    thousandSeparator: ',',
  },
  AUD: {
    symbol: 'AUD',
    position: 'after',
    decimals: 2,
    separator: '.',
    thousandSeparator: ',',
  },
  CHF: {
    symbol: 'CHF',
    position: 'after',
    decimals: 2,
    separator: '.',
    thousandSeparator: "'",
  },
};

/**
 * Interface produit avec prix multi-devises
 */
export interface ProductWithPrices {
  base_price: number;
  sale_price?: number | null;
  on_sale?: boolean;
  promo_label?: string | null;
  price_eur?: number | null;
  price_usd?: number | null;
  price_gbp?: number | null;
  price_cad?: number | null;
  price_aud?: number | null;
  price_chf?: number | null;
  sale_price_eur?: number | null;
  sale_price_usd?: number | null;
  sale_price_gbp?: number | null;
  sale_price_cad?: number | null;
  sale_price_aud?: number | null;
  sale_price_chf?: number | null;
  promo_label_eur?: string | null;
  promo_label_usd?: string | null;
  promo_label_gbp?: string | null;
  promo_label_cad?: string | null;
  promo_label_aud?: string | null;
  promo_label_chf?: string | null;
}

/**
 * Obtenir la devise selon la locale
 */
export function getCurrencyFromLocale(locale: string): Currency {
  const normalizedLocale = locale.split('-')[0] as Locale;
  return LOCALE_TO_CURRENCY[normalizedLocale] || 'EUR';
}

/**
 * Récupérer le prix normal d'un produit selon la devise
 */
export function getProductPrice(product: ProductWithPrices, currency: Currency): number {
  const priceMap: Record<Currency, number | null | undefined> = {
    EUR: product.price_eur ?? product.base_price,
    USD: product.price_usd,
    GBP: product.price_gbp,
    CAD: product.price_cad,
    AUD: product.price_aud,
    CHF: product.price_chf,
  };

  const price = priceMap[currency];
  
  // Fallback sur EUR si la devise n'est pas définie
  if (price === null || price === undefined) {
    return product.price_eur ?? product.base_price;
  }
  
  return price;
}

/**
 * Récupérer le prix promotionnel d'un produit selon la devise
 */
export function getProductSalePrice(product: ProductWithPrices, currency: Currency): number | null {
  if (!product.on_sale) return null;

  const salePriceMap: Record<Currency, number | null | undefined> = {
    EUR: product.sale_price_eur ?? product.sale_price,
    USD: product.sale_price_usd,
    GBP: product.sale_price_gbp,
    CAD: product.sale_price_cad,
    AUD: product.sale_price_aud,
    CHF: product.sale_price_chf,
  };

  const salePrice = salePriceMap[currency];
  
  // Fallback sur EUR si la devise n'est pas définie
  if (salePrice === null || salePrice === undefined) {
    return (product.sale_price_eur ?? product.sale_price) ?? null;
  }
  
  return salePrice;
}

/**
 * Récupérer le label promo selon la devise
 */
export function getPromoLabel(product: ProductWithPrices, currency: Currency): string | null {
  if (!product.on_sale) return null;

  const labelMap: Record<Currency, string | null | undefined> = {
    EUR: product.promo_label_eur ?? product.promo_label,
    USD: product.promo_label_usd,
    GBP: product.promo_label_gbp,
    CAD: product.promo_label_cad,
    AUD: product.promo_label_aud,
    CHF: product.promo_label_chf,
  };

  const label = labelMap[currency];
  
  // Fallback sur EUR si pas défini
  if (!label) {
    return (product.promo_label_eur ?? product.promo_label) ?? null;
  }
  
  return label;
}

/**
 * Calculer le pourcentage de réduction
 */
export function getDiscountPercentage(normalPrice: number, salePrice: number | null): number {
  if (!salePrice || salePrice >= normalPrice) return 0;
  return Math.round(((normalPrice - salePrice) / normalPrice) * 100);
}

/**
 * Formater un prix selon la devise
 */
export function formatPrice(amount: number, currency: Currency): string {
  const config = CURRENCY_CONFIG[currency];
  
  // Formater le nombre avec séparateurs
  const parts = amount.toFixed(config.decimals).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, config.thousandSeparator);
  const decimalPart = parts[1];
  
  const formattedNumber = `${integerPart}${config.separator}${decimalPart}`;
  
  // Positionner le symbole
  if (config.position === 'before') {
    return `${config.symbol}${formattedNumber}`;
  } else {
    return `${formattedNumber} ${config.symbol}`;
  }
}

/**
 * Obtenir le prix final (avec promo si applicable) et le formater
 */
export function getFormattedFinalPrice(product: ProductWithPrices, currency: Currency): {
  normalPrice: number;
  salePrice: number | null;
  finalPrice: number;
  formattedNormalPrice: string;
  formattedSalePrice: string | null;
  formattedFinalPrice: string;
  discountPercentage: number;
  hasDiscount: boolean;
  promoLabel: string | null;
} {
  const normalPrice = getProductPrice(product, currency);
  const salePrice = getProductSalePrice(product, currency);
  const finalPrice = salePrice ?? normalPrice;
  const discountPercentage = getDiscountPercentage(normalPrice, salePrice);
  const promoLabel = getPromoLabel(product, currency);

  return {
    normalPrice,
    salePrice,
    finalPrice,
    formattedNormalPrice: formatPrice(normalPrice, currency),
    formattedSalePrice: salePrice ? formatPrice(salePrice, currency) : null,
    formattedFinalPrice: formatPrice(finalPrice, currency),
    discountPercentage,
    hasDiscount: discountPercentage > 0,
    promoLabel,
  };
}
