import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase-server';
import ProfileClient from './ProfileClient';

export default async function ProfilePage() {
  const supabase = await createServerClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (!user || userError) {
    redirect('/login?redirect=/account/profile');
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
