/**
 * Rate Limiting - Upstash Redis
 * 
 * Fail modes par type de route :
 * - 'closed' : Si Redis down → bloquer (sécurité maximale pour auth/write/admin)
 * - 'open'   : Si Redis down → laisser passer (disponibilité pour read/webhook)
 * 
 * ⚠️ WEBHOOK FAIL MODE = 'open' :
 * Protection principale = idempotence DB (stripe_webhook_events.event_id UNIQUE)
 * Si Redis down et on bloque → Stripe retry infini → pire que laisser passer
 * La signature Stripe + barrière DB garantissent la sécurité même si rate limit bypass
 */

import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { env, hasRedis } from './env';

export const RATE_LIMITS = {
  auth: { requests: 5, window: '1 m', failMode: 'closed' as const },
  write: { requests: 30, window: '1 m', failMode: 'closed' as const },
  read: { requests: 120, window: '1 m', failMode: 'open' as const },
  webhook: { requests: 600, window: '1 m', failMode: 'open' as const }, // Stripe webhook limit
  admin: { requests: 60, window: '1 m', failMode: 'closed' as const },
} as const;

export type RateLimitConfig = keyof typeof RATE_LIMITS;

let redis: Redis | null = null;
let rateLimiters: Partial<Record<RateLimitConfig, Ratelimit>> = {};

function getRedis(): Redis | null {
  if (!hasRedis()) return null;
  if (!redis) {
    redis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL!,
      token: env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return redis;
}

function getRateLimiter(config: RateLimitConfig): Ratelimit | null {
  const redisInstance = getRedis();
  if (!redisInstance) return null;
  if (!rateLimiters[config]) {
    const { requests, window } = RATE_LIMITS[config];
    rateLimiters[config] = new Ratelimit({
      redis: redisInstance,
      limiter: Ratelimit.slidingWindow(requests, window),
      analytics: true,
      prefix: `ratelimit:${config}`,
    });
  }
  return rateLimiters[config]!;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
  headers: Record<string, string>;
}

export async function rateLimit(
  identifier: string,
  config: RateLimitConfig = 'write'
): Promise<RateLimitResult> {
  const limiter = getRateLimiter(config);
  const { failMode } = RATE_LIMITS[config];

  if (!limiter) {
    if (env.NODE_ENV === 'production' && failMode === 'closed') {
      return {
        success: false,
        limit: 0,
        remaining: 0,
        reset: Date.now() + 60000,
        retryAfter: 60,
        headers: { 'Retry-After': '60' },
      };
    }
    return {
      success: true,
      limit: 9999,
      remaining: 9999,
      reset: Date.now() + 60000,
      headers: {},
    };
  }

  try {
    const result = await limiter.limit(identifier);
    const headers = {
      'X-RateLimit-Limit': result.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': new Date(result.reset).toISOString(),
    };

    if (!result.success) {
      const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
      return {
        success: false,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
        retryAfter,
        headers: { ...headers, 'Retry-After': retryAfter.toString() },
      };
    }

    return {
      success: true,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      headers,
    };
  } catch (error) {
    if (failMode === 'closed') {
      return {
        success: false,
        limit: 0,
        remaining: 0,
        reset: Date.now() + 60000,
        retryAfter: 60,
        headers: { 'Retry-After': '60' },
      };
    }
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: Date.now(),
      headers: {},
    };
  }
}

export function getClientIdentifier(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  
  let ip = 'unknown';
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map(s => s.trim());
    ip = ips[0] || 'unknown';
  } else if (realIp) {
    ip = realIp;
  }
  
  ip = ip.replace(/^::ffff:/, '');
  return `ip:${ip}`;
}

export function getUserIdentifier(userId: string): string {
  return `user:${userId}`;
}

/**
 * ⚠️ RESET RATE LIMIT NON SUPPORTÉ
 * 
 * Cette fonction est une no-op pour éviter les crashes si appelée par erreur.
 * La bibliothèque @upstash/ratelimit ne fournit pas d'API publique pour reset.
 * Le format interne des clés (sliding window) utilise des structures Redis complexes
 * (hashes, sorted sets) qui changent entre versions.
 * 
 * Alternative fiable : attendre l'expiration naturelle de la fenêtre (1 minute max).
 * Pour déblocage admin urgent : utiliser directement l'UI Upstash Redis.
 * 
 * @param identifier - L'identifier à reset (ignoré)
 * @param config - Le type de rate limit (utilisé pour logging seulement)
 * @returns Promise<void> - Ne fait rien, log un warning en dev
 */
export async function resetRateLimit(identifier: string, config: RateLimitConfig): Promise<void> {
  if (env.NODE_ENV !== 'production') {
    console.warn(
      `[RATE_LIMIT] resetRateLimit() appelé mais NON SUPPORTÉ.\n` +
      `  Config: ${config}\n` +
      `  Identifier: ${identifier}\n` +
      `  → La lib @upstash/ratelimit n'expose pas d'API reset.\n` +
      `  → Attendez ${RATE_LIMITS[config].window} (expiration naturelle) ou utilisez l'UI Upstash Redis.`
    );
  }
  // No-op en production : pas de throw pour éviter crash si appelé par erreur
}
