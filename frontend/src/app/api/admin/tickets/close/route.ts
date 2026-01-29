import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    // Utiliser createServerClient qui gère automatiquement les cookies
    const supabase = await createServerClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Vérifier le rôle admin avec service_role
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data: userRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || !userRole || userRole.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Accès refusé' },
        { status: 403 }
      );
    }

    // Récupérer le ticketId du body
    const { ticketId } = await req.json();

    if (!ticketId) {
      return NextResponse.json(
        { success: false, error: 'ticketId manquant' },
        { status: 400 }
      );
    }

    // Fermer le ticket avec service_role (supabaseAdmin déjà créé)
    const { error: updateError } = await supabaseAdmin
      .from('support_tickets')
      .update({ status: 'closed' })
      .eq('id', ticketId);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la fermeture du ticket' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
