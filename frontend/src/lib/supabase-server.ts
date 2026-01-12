import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Client Supabase pour les Server Components et Server Actions
 * Récupère la session depuis les cookies pour authentification
 */
export async function createServerClient() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('sb-hzptzuljmexfflefxwqy-auth-token');

  if (!authCookie) {
    // Retourner client sans auth si pas de cookie
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    });
  }

  let session;
  try {
    session = JSON.parse(authCookie.value);
  } catch {
    // Cookie invalide, retourner client sans auth
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    });
  }

  if (!session?.access_token) {
    // Pas de token, retourner client sans auth
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    });
  }

  // Créer le client avec le token utilisateur
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    },
    auth: {
      persistSession: false,
    },
  });

  // Vérifier si le token est encore valide en testant getUser()
  try {
    const { error } = await client.auth.getUser();
    // Si le token est expiré (JWT expired), retourner un client sans auth
    if (error?.message?.includes('JWT expired') || error?.message?.includes('invalid')) {
      return createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
        },
      });
    }
  } catch {
    // En cas d'erreur, retourner client sans auth
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    });
  }

  return client;
}
