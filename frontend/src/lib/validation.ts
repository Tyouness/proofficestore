/**
 * 🛡️ SCHÉMAS DE VALIDATION ZOD
 * 
 * Tous les inputs utilisateur DOIVENT passer par ces schémas.
 * .strict() rejette les champs inconnus (attaque injection).
 * 
 * Usage:
 * import { reviewIdSchema } from '@/lib/validation';
 * const id = reviewIdSchema.parse(input); // Throw si invalide
 */

import { z } from 'zod';

// ── UUID Validation ──
export const uuidSchema = z.string().uuid({
  message: 'Format UUID invalide'
});

// ── Review ID (alias pour clarté) ──
export const reviewIdSchema = uuidSchema;

// ── Product ID ──
export const productIdSchema = uuidSchema;

// ── Order ID ──
export const orderIdSchema = uuidSchema;

// ── Ticket ID ──
export const ticketIdSchema = uuidSchema;

// ── Email Validation (STRICT) ──
export const emailSchema = z
  .string()
  .min(3, 'Email trop court')
  .max(254, 'Email trop long (RFC 5321)') // Limite RFC
  .email('Format email invalide')
  .refine(
    (email) => {
      // Regex stricte pour email RFC 5322
      const strictEmailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      return strictEmailRegex.test(email);
    },
    { message: 'Format email invalide' }
  )
  .refine(
    (email) => {
      // Bloque les emails jetables connus
      const disposableDomains = [
        'tempmail.com',
        '10minutemail.com',
        'guerrillamail.com',
        'mailinator.com',
        'throwaway.email',
        'temp-mail.org',
        'fakeinbox.com',
        'yopmail.com',
      ];
      const domain = email.split('@')[1]?.toLowerCase();
      return !disposableDomains.includes(domain);
    },
    { message: 'Les emails jetables ne sont pas autorisés' }
  );

// ── Nom (utilisateur, produit) ──
export const nameSchema = z
  .string()
  .min(1, 'Nom requis')
  .max(100, 'Nom trop long')
  .regex(/^[\p{L}\p{N}\s\-'.]+$/u, 'Caractères invalides dans le nom');

// ── Téléphone (format international) ──
export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Format téléphone invalide (E.164)')
  .optional();

// ── Montant (prix en centimes) ──
export const amountSchema = z
  .number()
  .int('Le montant doit être un entier')
  .positive('Le montant doit être positif')
  .max(999999999, 'Montant trop élevé'); // 9.999.999,99€ max

// ── Quantité ──
export const quantitySchema = z
  .number()
  .int('La quantité doit être un entier')
  .min(1, 'Quantité minimale: 1')
  .max(100, 'Quantité maximale: 100');

// ── Rating (1-5 étoiles) ──
export const ratingSchema = z
  .number()
  .int('Le rating doit être un entier')
  .min(1, 'Rating minimum: 1')
  .max(5, 'Rating maximum: 5');

// ── Review Title ──
export const reviewTitleSchema = z
  .string()
  .min(5, 'Titre trop court (min 5 caractères)')
  .max(100, 'Titre trop long (max 100 caractères)')
  .regex(/^[\p{L}\p{N}\s\-?!,.]+$/u, 'Caractères invalides dans le titre');

// ── Review Comment (avec HTML sanitization prévue) ──
export const reviewCommentSchema = z
  .string()
  .min(10, 'Commentaire trop court (min 10 caractères)')
  .max(2000, 'Commentaire trop long (max 2000 caractères)');
  // ⚠️ Sanitize HTML avec DOMPurify avant stockage DB

// ── Checkout Items (panier complet) ──
export const checkoutItemSchema = z.object({
  product_id: productIdSchema,
  variant_id: uuidSchema,
  quantity: quantitySchema,
}).strict(); // Rejette champs inconnus

export const checkoutItemsSchema = z
  .array(checkoutItemSchema)
  .min(1, 'Panier vide')
  .max(50, 'Trop de produits dans le panier');

// ── Checkout Form (données client) ──
export const checkoutFormSchema = z.object({
  email: emailSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  company: z.string().max(100).optional(),
  phone: phoneSchema,
  // Adresse si nécessaire
}).strict();

// ── Admin: Delete Review Input ──
export const deleteReviewInputSchema = z.object({
  reviewId: reviewIdSchema,
}).strict();

// ── Support Ticket Title ──
export const ticketTitleSchema = z
  .string()
  .min(5, 'Titre trop court')
  .max(200, 'Titre trop long');

// ── Support Ticket Message ──
export const ticketMessageSchema = z
  .string()
  .min(20, 'Message trop court (min 20 caractères)')
  .max(5000, 'Message trop long (max 5000 caractères)');

// ── License Key Import (admin) ──
export const licenseKeySchema = z
  .string()
  .min(5, 'Clé de licence trop courte')
  .max(255, 'Clé de licence trop longue')
  .regex(/^[A-Z0-9\-]+$/, 'Format clé invalide (A-Z, 0-9, -)');

export const importLicensesSchema = z.object({
  product_id: productIdSchema,
  variant_id: uuidSchema,
  license_keys: z.array(licenseKeySchema).min(1).max(1000),
}).strict();

// ── Pagination ──
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
}).strict();

// ── Sort Order ──
export const sortOrderSchema = z.enum(['asc', 'desc']).default('desc');

// ── Search Query ──
export const searchQuerySchema = z
  .string()
  .max(200, 'Recherche trop longue')
  .optional();

// ── Stock Request (demande de notification de disponibilité) ──
export const stockRequestSchema = z.object({
  productId: z.string().min(1, 'Product ID requis'), // Slug du produit (text), pas UUID
  email: emailSchema,
  quantity: quantitySchema,
  honeypot: z.string().max(0, 'Bot détecté').default(''), // Anti-spam: doit rester vide
}).strict();

// ── Stock Request Status ──
export const stockRequestStatusSchema = z.enum(['pending', 'contacted', 'completed', 'cancelled']);

// ── Update Stock Request (admin) ──
export const updateStockRequestSchema = z.object({
  requestId: uuidSchema,
  status: stockRequestStatusSchema.optional(),
  adminNotes: z.string().max(1000).optional(),
}).strict();

// ── Pricing & Promotions Validation ──
export const updateProductPricingSchema = z.object({
  productId: uuidSchema,
  basePrice: z.number()
    .positive('Le prix de base doit être positif')
    .max(99999, 'Prix de base trop élevé')
    .multipleOf(0.01, 'Prix invalide (maximum 2 décimales)'),
  salePrice: z.number()
    .positive('Le prix réduit doit être positif')
    .max(99999, 'Prix réduit trop élevé')
    .multipleOf(0.01, 'Prix invalide (maximum 2 décimales)')
    .optional()
    .nullable(),
  onSale: z.boolean(),
  promoLabel: z.string()
    .max(50, 'Label promo trop long (max 50 caractères)')
    .optional()
    .nullable(),
}).strict().refine(
  (data) => {
    // Si sale_price existe, il doit être inférieur à base_price
    if (data.salePrice !== null && data.salePrice !== undefined) {
      return data.salePrice < data.basePrice;
    }
    return true;
  },
  {
    message: 'Le prix réduit doit être inférieur au prix de base',
    path: ['salePrice'],
  }
);

// Helper: Parse with fallback
export function safeParse<T>(schema: z.ZodSchema<T>, data: unknown): T | null {
  const result = schema.safeParse(data);
  return result.success ? result.data : null;
}

// Helper: Parse or throw readable error
export function parseOrThrow<T>(schema: z.ZodSchema<T>, data: unknown, context?: string): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`);
      throw new Error(`Validation failed${context ? ` (${context})` : ''}: ${messages.join(', ')}`);
    }
    throw error;
  }
}
