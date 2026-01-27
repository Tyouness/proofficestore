import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase-server';
import ProfileClient from './ProfileClient';

export default async function ProfilePage() {
  const supabase = await createServerClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (!user || userError) {
    redirect('/login?redirect=/account/profile');
  }

  // Charger le profil (READ-ONLY, pas d'upsert ici)
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle();

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
