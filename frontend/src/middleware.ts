import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/lib/env';
// import createIntlMiddleware from 'next-intl/middleware';
// import { locales, defaultLocale } from '@/config/i18n';

/**
 * Middleware Next.js pour :
 * 1. Gérer l'internationalisation (routing /fr/, /en/, etc.) - TEMPORAIREMENT DÉSACTIVÉ
 * 2. Maintenir la session Supabase
 * 
 * SÉCURITÉ :
 * ✅ sameSite: 'strict' (CSRF protection)
 * ✅ Secure cookies en production
 * ✅ HttpOnly géré par Supabase
 * ✅ Domain configuré pour multi-sous-domaines
 * ✅ Rafraîchissement automatique des tokens
 * 
 * I18N :
 * ⏸️ TEMPORAIREMENT DÉSACTIVÉ - En attente de restructuration app/[locale]/
 * ⏸️ Détection automatique de la langue du navigateur
 * ⏸️ Routing par segments (/fr/, /en/, /de/, etc.)
 * ⏸️ SEO hreflang automatique
 */

// Créer le middleware i18n (DÉSACTIVÉ TEMPORAIREMENT)
// const intlMiddleware = createIntlMiddleware({
//   locales,
//   defaultLocale,
//   localePrefix: 'always', // Force toujours /fr/, /en/, etc.
// });

export async function middleware(request: NextRequest) {
  // 1. Créer la réponse de base (sans i18n pour l'instant)
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
  
  // 2. Gérer Supabase
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
            response.cookies.set(name, value, {
              ...options,
              domain: env.NODE_ENV === 'production' 
                ? '.allkeymasters.com'
                : undefined,
              sameSite: 'strict',
              secure: env.NODE_ENV === 'production',
            });
          });
        },
      },
    }
  );

  // Rafraîchir la session
  await supabase.auth.getUser();

  return response;
}

/**
 * Configuration du matcher
 * 
 * Le middleware s'exécute sur toutes les routes SAUF :
 * - Les fichiers statiques (_next/static)
 * - Les images (_next/image)
 * - Les favicons (favicon.ico)
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
