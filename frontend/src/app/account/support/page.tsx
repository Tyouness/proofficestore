import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import SupportClient from '@/app/account/support/SupportClient';

export default async function SupportPage() {
  const cookieStore = await cookies();
  
  // Récupérer le token d'auth depuis les cookies
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

  // Créer le client Supabase avec le token
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

  // Récupérer l'utilisateur authentifié
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  // Redirection si non authentifié
  if (!user || userError) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <SupportClient userId={user.id} userEmail={user.email || ''} />
      </div>
    </div>
  );
}
