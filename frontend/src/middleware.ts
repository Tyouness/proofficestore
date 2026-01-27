import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/lib/env';

/**
 * Middleware Next.js pour maintenir la session Supabase
 * 
 * SÉCURITÉ :
 * ✅ sameSite: 'strict' (CSRF protection)
 * ✅ Secure cookies en production
 * ✅ HttpOnly géré par Supabase
 * ✅ Domain configuré pour multi-sous-domaines
 * ✅ Rafraîchissement automatique des tokens
 * 
 * NOTE :
 * - 'sameSite: strict' bloque cookies sur redirections tierces (Stripe)
 * - Stripe redirige vers /checkout/success avec session_id en query
 * - On récupère l'info via query params, pas cookies
 */

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
              domain: env.NODE_ENV === 'production' 
                ? '.allkeymasters.com' // Permet cookies sur www + root domain
                : undefined, // Local: pas de domain spécifique
              sameSite: 'strict', // 🔒 CSRF protection (bloque cross-site)
              secure: env.NODE_ENV === 'production', // HTTPS obligatoire en prod
            });
          });
        },
      },
    }
  );

  // Rafraîchir la session
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
 * - Les fichiers publics (images, fonts, etc.)
 */
export const config = {
  matcher: [
    /*
     * Match toutes les routes sauf :
     * - API routes (déjà gérées individuellement)
     * - Fichiers statiques
     * - Images Next.js
     * - Tous les fichiers du dossier public (images, fonts, manifests, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot|json|xml|txt|pdf)$).*)',
  ],
};
