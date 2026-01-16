import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase-server';
import SupportClient from '@/app/account/support/SupportClient';

export default async function SupportPage() {
  const supabase = await createServerClient();

  // Récupérer l'utilisateur authentifié
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  // Redirection si non authentifié
  if (!user || userError) {
    redirect('/login?redirect=/account/support');
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <SupportClient userId={user.id} userEmail={user.email || ''} />
      </div>
    </div>
  );
}
