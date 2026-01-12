/**
 * Supabase Browser Client - Singleton
 * 
 * CRITICAL: N'instancier qu'UNE SEULE FOIS pour éviter
 * "Multiple GoTrueClient instances detected in the same browser context"
 * 
 * Usage:
 * import { supabase } from "@/lib/supabase/client";
 * 
 * DO NOT create new instances in components!
 */

import { createClient } from '@supabase/supabase-js';

// Custom cookie storage pour Next.js
const cookieStorage = {
  getItem: (key: string) => {
    if (typeof document === 'undefined') return null;
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === key) {
        return decodeURIComponent(value);
      }
    }
    return null;
  },
  setItem: (key: string, value: string) => {
    if (typeof document === 'undefined') return;
    document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax`;
  },
  removeItem: (key: string) => {
    if (typeof document === 'undefined') return;
    document.cookie = `${key}=; path=/; max-age=0`;
  },
};

// Instance unique (module-level singleton)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'sb-hzptzuljmexfflefxwqy-auth-token',
      storage: cookieStorage,
    },
  }
);
