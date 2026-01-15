/**
 * Supabase Browser Client - Singleton
 * 
 * Utilise @supabase/ssr pour une gestion cohérente des cookies
 * entre client et serveur
 * 
 * Usage:
 * import { supabase } from "@/lib/supabase/client";
 */

import { createBrowserClient } from '@supabase/ssr';

// Instance unique (module-level singleton)
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
