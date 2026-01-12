import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import ProfileClient from './ProfileClient';

export default async function ProfilePage() {
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

  // Charger le profil
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle();

  // Si le profil n'existe pas, le créer
  if (!profile && !profileError) {
    await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: '',
        updated_at: new Date().toISOString(),
      });
  }

  return (
    <div className="space-y-6">
      <ProfileClient
        userId={user.id}
        userEmail={user.email || ''}
        initialFullName={profile?.full_name || ''}
      />
    </div>
  );
}
