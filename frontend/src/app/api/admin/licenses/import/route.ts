import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    // Vérifier que l'utilisateur est admin
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('sb-hzptzuljmexfflefxwqy-auth-token');

    if (!authCookie) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const session = JSON.parse(authCookie.value);
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${session.access_token}` } },
        auth: { persistSession: false },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
    }

    // Vérifier le rôle admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!userRole || userRole.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Récupérer les données du body
    const { productId, keys } = await req.json();

    if (!productId || !keys || !Array.isArray(keys) || keys.length === 0) {
      return NextResponse.json(
        { error: 'productId et keys (array) sont requis' },
        { status: 400 }
      );
    }

    // Utiliser le client admin pour insérer les licences
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const licensesToInsert = keys.map((keyCode) => ({
      product_id: productId,
      key_code: keyCode,
      is_used: false,
    }));

    const { data, error: insertError } = await supabaseAdmin
      .from('licenses')
      .insert(licensesToInsert)
      .select();

    if (insertError) {
      console.error('Error importing licenses:', insertError);
      return NextResponse.json(
        { error: 'Erreur lors de l\'import des licences' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
    });
  } catch (error) {
    console.error('Error in /api/admin/licenses/import:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
