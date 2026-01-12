import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import AccountSidebar from '@/app/account/AccountSidebar';

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('sb-hzptzuljmexfflefxwqy-auth-token');

  if (!authCookie) {
    redirect('/login');
  }

  let session;
  try {
    session = JSON.parse(authCookie.value);
  } catch {
    redirect('/login');
  }

  if (!session?.access_token) {
    redirect('/login');
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      },
    }
  );

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (!user || userError) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Layout 2 colonnes : desktop */}
        <div className="lg:flex lg:gap-8">
          {/* Sidebar - desktop */}
          <aside className="hidden lg:block lg:w-64 flex-shrink-0">
            <div className="sticky top-8">
              <AccountSidebar userEmail={user.email || ''} />
            </div>
          </aside>

          {/* Navigation mobile - horizontal en haut */}
          <div className="lg:hidden mb-6">
            <AccountSidebar userEmail={user.email || ''} isMobile />
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
