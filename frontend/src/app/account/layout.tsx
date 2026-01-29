import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase-server';
import AccountSidebar from '@/app/account/AccountSidebar';

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log('[ACCOUNT LAYOUT] 🔍 Vérification authentification...');
  
  const supabase = await createServerClient();
  
  // Forcer un refresh de la session pour éviter le cache
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  console.log('[ACCOUNT LAYOUT] User:', user?.id || 'null', 'Email:', user?.email || 'null');
  console.log('[ACCOUNT LAYOUT] Error:', userError?.message || 'null');

  // Rediriger vers login si pas d'utilisateur ou erreur
  if (!user || userError) {
    console.log('[ACCOUNT LAYOUT] ❌ Pas d\'utilisateur, redirection vers /login');
    redirect('/login?reason=unauthorized');
  }
  
  console.log('[ACCOUNT LAYOUT] ✅ Utilisateur authentifié, accès autorisé');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Layout 2 colonnes : desktop */}
        <div className="lg:flex lg:gap-8">
          {/* Sidebar - desktop */}
          <aside className="hidden lg:block lg:w-64 flex-shrink-0">
            <div className="sticky top-8">
              <AccountSidebar userEmail={user.email || ''} userId={user.id} />
            </div>
          </aside>

          {/* Navigation mobile - horizontal en haut */}
          <div className="lg:hidden mb-6">
            <AccountSidebar userEmail={user.email || ''} userId={user.id} isMobile />
          </div>

          {/* Contenu principal */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
