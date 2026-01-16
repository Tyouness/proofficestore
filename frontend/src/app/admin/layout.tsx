import { requireAdmin } from '@/lib/admin-auth';
import Link from 'next/link';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Protection admin
  await requireAdmin();

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-900 min-h-screen p-6">
          <div className="mb-8">
            <h1 className="text-white text-2xl font-bold">Admin Panel</h1>
            <p className="text-gray-400 text-sm mt-1">AllKeyMasters</p>
          </div>

          <nav className="space-y-2">
            <NavLink href="/admin" icon="📊">
              Dashboard
            </NavLink>
            <NavLink href="/admin/orders" icon="🛒">
              Commandes
            </NavLink>
            <NavLink href="/admin/tickets" icon="🎫">
              Support
            </NavLink>
            <NavLink href="/admin/licenses" icon="🔑">
              Licences
            </NavLink>
            <NavLink href="/admin/reviews" icon="⭐">
              Avis Clients
            </NavLink>
            
            <div className="pt-4 mt-4 border-t border-gray-700">
              <NavLink href="/" icon="🏠">
                Retour au site
              </NavLink>
              <form action="/api/auth/signout" method="post">
                <button
                  type="submit"
                  className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
                >
                  <span>🚪</span>
                  <span>Déconnexion</span>
                </button>
              </form>
            </div>
          </nav>
        </aside>

        {/* Contenu principal */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function NavLink({ href, icon, children }: { href: string; icon: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
    >
      <span>{icon}</span>
      <span>{children}</span>
    </Link>
  );
}
