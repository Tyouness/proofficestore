/**
 * 🔒 VALIDATION DES VARIABLES D'ENVIRONNEMENT
 * 
 * Valide TOUTES les variables d'env au démarrage de l'application.
 * Si une variable requise est manquante => CRASH IMMÉDIAT avec message clair.
 * 
 * Usage:
 * import { env } from '@/lib/env';
 * const apiKey = env.STRIPE_SECRET_KEY; // ✅ Typé et validé
 */

import { z } from 'zod';

// Schéma Zod pour TOUTES les variables d'environnement
const envSchema = z.object({
  // ── Node Environment ──
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // ── Next.js ──
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),

  // ── Supabase (Public - Safe pour client) ──
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),

  // ── Supabase (Serveur ONLY - Sensible) ──
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(100), // JWT long

  // ── Stripe (Serveur ONLY) ──
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),

  // ── Resend (Email) ──
  RESEND_API_KEY: z.string().startsWith('re_'),

  // ── Upstash Redis (Rate Limiting) ──
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // ── Sentry (Monitoring - Optionnel) ──
  SENTRY_DSN: z.string().url().optional(), // Server-side uniquement
  SENTRY_AUTH_TOKEN: z.string().optional(),
});

// Type TypeScript dérivé du schéma Zod
export type Env = z.infer<typeof envSchema>;

// Fonction de validation
function validateEnv(): Env {
  try {
    const validated = envSchema.parse(process.env);
    
    // Logs uniquement en dev
    if (validated.NODE_ENV !== 'production') {
      console.log('[ENV] Toutes les variables d environnement sont valides');
      console.log('[ENV] Mode:', validated.NODE_ENV);
      console.log('[ENV] Site URL:', validated.NEXT_PUBLIC_SITE_URL);
    }
    
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((e: z.ZodIssue) => `  - ${e.path.join('.')}: ${e.message}`).join('\n');
      const message = `[ENV] Variables d environnement invalides:\n${errors}\n\nVerifiez votre fichier .env.local`;
      
      // IMPORTANT: Always throw (never process.exit) 
      // Middleware runs on Edge Runtime which forbids process.exit
      if (process.env.NODE_ENV !== 'production') {
        console.error(message);
      }
      throw new Error(message);
    }
    throw error;
  }
}

// Validation au chargement du module
export const env = validateEnv();

// Helper: Vérifie si Redis est configuré
export const hasRedis = () => {
  return !!(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);
};

// Helper: Vérifie si Sentry est configuré
export const hasSentry = () => {
  return !!env.SENTRY_DSN;
};
