import { requireAdmin } from '@/lib/admin-auth';
import { createClient } from '@supabase/supabase-js';
import UsersTable from './UsersTable';

interface User {
  id: string;
  email: string;
  created_at: string;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
}

interface UserProfile {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
}

export default async function AdminUsersPage() {
  await requireAdmin();

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Récupérer tous les utilisateurs
  const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

  if (authError) {
    console.error('[Admin Users Error]', authError);
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Utilisateurs</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Erreur lors du chargement des utilisateurs</p>
          <p className="text-red-600 text-sm mt-1">{authError.message}</p>
        </div>
      </div>
    );
  }

  // Récupérer les profils utilisateurs (nom complet depuis la table 'profiles')
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name');

  // Créer un map pour accès rapide aux profils
  const profilesMap = new Map<string, string>();
  if (profiles) {
    profiles.forEach((profile: { id: string; full_name: string | null }) => {
      if (profile.full_name) {
        profilesMap.set(profile.id, profile.full_name);
      }
    });
  }

  // Enrichir les données utilisateurs avec les profils
  const enrichedUsers = authUsers.users.map((user) => {
    const fullName = profilesMap.get(user.id);
    return {
      id: user.id,
      email: user.email || 'N/A',
      first_name: fullName || null, // On garde la structure pour compatibilité
      last_name: null,
      created_at: user.created_at,
      email_confirmed_at: user.email_confirmed_at || null,
      last_sign_in_at: user.last_sign_in_at || null,
    };
  });

  // Trier par date de création décroissante
  enrichedUsers.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Utilisateurs</h1>
        <p className="text-gray-600 mt-2">
          {enrichedUsers.length} compte{enrichedUsers.length > 1 ? 's' : ''} enregistré{enrichedUsers.length > 1 ? 's' : ''}
        </p>
      </div>

      <UsersTable users={enrichedUsers} />
    </div>
  );
}
