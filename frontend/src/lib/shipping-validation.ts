import { z } from 'zod';
import { parsePhoneNumber, CountryCode } from 'libphonenumber-js';

/**
 * Liste des pays supportés avec métadonnées
 */
export const SUPPORTED_COUNTRIES = [
  { code: 'FR', name: 'France', phonePrefix: '+33', zipRegex: /^[0-9]{5}$/ },
  { code: 'BE', name: 'Belgique', phonePrefix: '+32', zipRegex: /^[0-9]{4}$/ },
  { code: 'CH', name: 'Suisse', phonePrefix: '+41', zipRegex: /^[0-9]{4}$/ },
  { code: 'MA', name: 'Maroc', phonePrefix: '+212', zipRegex: /^[0-9]{5}$/ },
  { code: 'LU', name: 'Luxembourg', phonePrefix: '+352', zipRegex: /^[0-9]{4}$/ },
  { code: 'DE', name: 'Allemagne', phonePrefix: '+49', zipRegex: /^[0-9]{5}$/ },
  { code: 'ES', name: 'Espagne', phonePrefix: '+34', zipRegex: /^[0-9]{5}$/ },
  { code: 'IT', name: 'Italie', phonePrefix: '+39', zipRegex: /^[0-9]{5}$/ },
  { code: 'PT', name: 'Portugal', phonePrefix: '+351', zipRegex: /^[0-9]{4}-[0-9]{3}$/ },
  { code: 'NL', name: 'Pays-Bas', phonePrefix: '+31', zipRegex: /^[0-9]{4}\s?[A-Z]{2}$/i },
  { code: 'GB', name: 'Royaume-Uni', phonePrefix: '+44', zipRegex: /^[A-Z]{1,2}[0-9]{1,2}\s?[0-9][A-Z]{2}$/i },
  { code: 'CA', name: 'Canada', phonePrefix: '+1', zipRegex: /^[A-Z][0-9][A-Z]\s?[0-9][A-Z][0-9]$/i },
  { code: 'US', name: 'États-Unis', phonePrefix: '+1', zipRegex: /^[0-9]{5}(-[0-9]{4})?$/ },
] as const;

export type SupportedCountryCode = typeof SUPPORTED_COUNTRIES[number]['code'];

/**
 * Validation custom pour code postal selon le pays
 */
function validateZipCode(zip: string, country: SupportedCountryCode): boolean {
  const countryData = SUPPORTED_COUNTRIES.find(c => c.code === country);
  if (!countryData) return false;
  return countryData.zipRegex.test(zip.trim());
}

/**
 * Validation custom pour numéro de téléphone
 */
function validatePhoneNumber(phoneNumber: string, phonePrefix: string, country: SupportedCountryCode): boolean {
  try {
    // Nettoyer le numéro
    const cleanNumber = phoneNumber.replace(/\s/g, '');
    
    // Construire le numéro complet avec indicatif
    const fullNumber = `${phonePrefix}${cleanNumber}`;
    
    // Parser avec libphonenumber-js
    const parsed = parsePhoneNumber(fullNumber, country as CountryCode);
    
    // Vérifier que le numéro est valide
    return parsed?.isValid() ?? false;
  } catch {
    return false;
  }
}

/**
 * Schema Zod pour une adresse de livraison complète
 */
export const shippingAddressSchema = z.object({
  shipping_name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Le nom contient des caractères invalides'),
  
  shipping_address: z.string()
    .min(5, 'L\'adresse doit contenir au moins 5 caractères')
    .max(200, 'L\'adresse ne peut pas dépasser 200 caractères'),
  
  shipping_city: z.string()
    .min(2, 'La ville doit contenir au moins 2 caractères')
    .max(100, 'La ville ne peut pas dépasser 100 caractères')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'La ville contient des caractères invalides'),
  
  shipping_country: z.enum(
    SUPPORTED_COUNTRIES.map(c => c.code) as [SupportedCountryCode, ...SupportedCountryCode[]],
    { message: 'Pays non supporté' }
  ),
  
  shipping_zip: z.string()
    .min(4, 'Code postal invalide')
    .max(10, 'Code postal invalide'),
  
  shipping_phone_prefix: z.string()
    .regex(/^\+[0-9]{1,4}$/, 'Indicatif invalide'),
  
  shipping_phone_number: z.string()
    .min(8, 'Numéro de téléphone invalide')
    .max(15, 'Numéro de téléphone invalide')
    .regex(/^[0-9\s]+$/, 'Le numéro ne doit contenir que des chiffres'),
}).superRefine((data, ctx) => {
  // Validation croisée du code postal selon le pays
  if (!validateZipCode(data.shipping_zip, data.shipping_country)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['shipping_zip'],
      message: `Format de code postal invalide pour ${SUPPORTED_COUNTRIES.find(c => c.code === data.shipping_country)?.name}`,
    });
  }
  
  // Validation du numéro de téléphone complet
  if (!validatePhoneNumber(data.shipping_phone_number, data.shipping_phone_prefix, data.shipping_country)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['shipping_phone_number'],
      message: 'Numéro de téléphone invalide pour ce pays',
    });
  }
});

export type ShippingAddress = z.infer<typeof shippingAddressSchema>;

/**
 * Déterminer si un panier contient des produits physiques
 */
export function cartHasPhysicalItems(
  items: Array<{ variant: 'digital' | 'dvd' | 'usb' }>
): boolean {
  return items.some(item => item.variant === 'dvd' || item.variant === 'usb');
}

/**
 * Obtenir l'indicatif téléphonique par défaut pour un pays
 */
export function getPhonePrefixForCountry(country: SupportedCountryCode): string {
  return SUPPORTED_COUNTRIES.find(c => c.code === country)?.phonePrefix ?? '+33';
}

/**
 * Obtenir le nom d'un pays à partir de son code
 */
export function getCountryName(country: SupportedCountryCode): string {
  return SUPPORTED_COUNTRIES.find(c => c.code === country)?.name ?? country;
}
