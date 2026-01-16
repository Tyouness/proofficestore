import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from './supabase-server';

/**
 * Vérifier si l'utilisateur connecté a le rôle admin
 * À utiliser dans les Server Components admin
 * Retourne l'user_id si admin, sinon redirige vers /
 */
export async function requireAdmin(): Promise<string> {
  const supabase = await createServerClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (!user || userError) {
    redirect('/login');
  }

  // Vérifier le rôle admin avec service_role (inviolable)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: userRole, error: roleError } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (roleError || !userRole || userRole.role !== 'admin') {
    redirect('/');
  }

  return user.id;
}
