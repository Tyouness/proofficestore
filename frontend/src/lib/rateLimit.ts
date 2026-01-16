/**
 * Rate Limiting - Upstash Redis
 * Fail-mode configuré par type de route (closed/open)
 */

import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { env, hasRedis } from './env';

export const RATE_LIMITS = {
  auth: { requests: 5, window: '1 m', failMode: 'closed' as const },
  write: { requests: 30, window: '1 m', failMode: 'closed' as const },
  read: { requests: 120, window: '1 m', failMode: 'open' as const },
  webhook: { requests: 1000, window: '1 m', failMode: 'open' as const },
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

export async function resetRateLimit(identifier: string, config: RateLimitConfig): Promise<void> {
  console.warn('[RATE_LIMIT] resetRateLimit() non fonctionnel');
}
