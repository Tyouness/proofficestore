import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import NewTicketClient from './NewTicketClient';

interface Order {
  id: string;
  reference: string;
  created_at: string;
}

export default async function NewTicketPage() {
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

  // Charger les commandes payées de l'utilisateur
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('id, reference, created_at')
    .eq('user_id', user.id)
    .eq('status', 'paid')
    .order('created_at', { ascending: false });

  if (ordersError) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="text-center">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Erreur de chargement
          </h2>
          <p className="text-gray-600 mb-6">
            Impossible de charger vos commandes. Veuillez réessayer.
          </p>
        </div>
      </div>
    );
  }

  return <NewTicketClient orders={orders || []} userId={user.id} />;
}
