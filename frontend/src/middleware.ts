import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware Next.js pour maintenir la session Supabase
 * 
 * IMPORTANT :
 * - Rafraîchit automatiquement les tokens d'authentification
 * - Maintient la session lors du retour de Stripe
 * - Configure les cookies de manière sécurisée
 * - Supporte les domaines avec et sans "www"
 */

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            supabaseResponse.cookies.set(name, value, {
              ...options,
              // ⚠️ CRITIQUE pour maintenir la session entre le domaine et les sous-domaines
              domain: process.env.NODE_ENV === 'production' 
                ? '.allkeymasters.com' // Permet cookies sur www.allkeymasters.com et allkeymasters.com
                : undefined, // En local, pas de domain spécifique
              sameSite: 'lax', // Permet les cookies lors de redirections externes (Stripe)
              secure: process.env.NODE_ENV === 'production', // HTTPS obligatoire en production
            });
          });
        },
      },
    }
  );

  // Rafraîchir la session (si nécessaire)
  // Cela maintient l'utilisateur connecté même après un retour de Stripe
  await supabase.auth.getUser();

  return supabaseResponse;
}

/**
 * Configuration du matcher
 * 
 * Le middleware s'exécute sur toutes les routes SAUF :
 * - Les fichiers statiques (_next/static)
 * - Les images (_next/image)
 * - Les favicons (favicon.ico)
 * - Les API routes non-authentifiées
 */
export const config = {
  matcher: [
    /*
     * Match toutes les routes sauf :
     * - API routes (déjà gérées individuellement)
     * - Fichiers statiques
     * - Images Next.js
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
