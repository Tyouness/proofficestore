/**
 * Configuration Stripe - SERVER SIDE UNIQUEMENT
 * 
 * ⚠️ RÈGLES ABSOLUES :
 * - Ce fichier ne doit JAMAIS être importé dans un composant client
 * - Utilise uniquement la clé secrète Stripe (sk_test_...)
 * - Réservé aux Server Actions et API Routes
 */

import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY manquante dans les variables d\'environnement');
}

/**
 * Instance Stripe server-side
 * @private - Ne jamais exporter vers le client
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover',
  typescript: true,
});

/**
 * Surcharges de prix selon les variantes de produit (en euros)
 */
export const VARIANT_SURCHARGES: Record<'digital' | 'dvd' | 'usb', number> = {
  digital: 0,
  dvd: 10,
  usb: 15,
} as const;

/**
 * Variantes autorisées
 */
export const ALLOWED_VARIANTS = ['digital', 'dvd', 'usb'] as const;
export type ProductVariant = typeof ALLOWED_VARIANTS[number];

/**
 * Calcule le prix final d'un produit selon sa variante
 * @param basePrice Prix de base du produit (en euros)
 * @param variant Variante choisie
 * @returns Prix final en euros
 */
export function calculateProductPrice(basePrice: number, variant: ProductVariant): number {
  if (!ALLOWED_VARIANTS.includes(variant)) {
    throw new Error(`Variante invalide: ${variant}`);
  }
  return basePrice + VARIANT_SURCHARGES[variant];
}

/**
 * Convertit un montant en euros vers des centimes
 * @param euros Montant en euros
 * @returns Montant en centimes (arrondi)
 */
export function eurosToCents(euros: number): number {
  return Math.round(euros * 100);
}

/**
 * Convertit un montant en centimes vers des euros
 * @param cents Montant en centimes
 * @returns Montant en euros
 */
export function centsToEuros(cents: number): number {
  return cents / 100;
}
