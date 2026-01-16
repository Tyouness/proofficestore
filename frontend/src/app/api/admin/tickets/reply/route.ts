import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { stripHtml } from '@/lib/sanitize';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('sb-hzptzuljmexfflefxwqy-auth-token');

    if (!authCookie) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    let session;
    try {
      session = JSON.parse(authCookie.value);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Session invalide' },
        { status: 401 }
      );
    }

    if (!session?.access_token) {
      return NextResponse.json(
        { success: false, error: 'Session invalide' },
        { status: 401 }
      );
    }

    // Vérifier l'utilisateur
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
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Vérifier que l'utilisateur est admin
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

    // Récupérer les données de la requête
    const body = await request.json();
    const { ticketId, adminId, content, attachment_url, file_type } = body;

    if (!ticketId || !adminId) {
      return NextResponse.json(
        { success: false, error: 'Données manquantes' },
        { status: 400 }
      );
    }

    // Vérifier qu'il y a au moins un contenu ou une pièce jointe
    if ((!content || content.trim().length === 0) && !attachment_url) {
      return NextResponse.json(
        { success: false, error: 'Message ou fichier requis' },
        { status: 400 }
      );
    }

    if (content && content.trim().length > 2000) {
      return NextResponse.json(
        { success: false, error: 'Message trop long' },
        { status: 400 }
      );
    }

    // Vérifier que adminId correspond à l'utilisateur connecté
    if (adminId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'ID admin invalide' },
        { status: 403 }
      );
    }

    // Insérer le message avec service_role
    const { data: newMessage, error: insertError } = await supabaseAdmin
      .from('support_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: adminId,
        sender_role: 'admin',
        content: content ? stripHtml(content.trim()) : '', // XSS protection SERVER
        attachment_url: attachment_url || null,
        file_type: file_type || null,
      })
      .select('id, sender_id, sender_role, content, attachment_url, file_type, created_at')
      .single();

    if (insertError) {
      console.error('[API ADMIN] Erreur d\'insertion:', insertError);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de l\'insertion du message' },
        { status: 500 }
      );
    }

    console.log('[API ADMIN] Message inséré avec succès:', newMessage);

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
