import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase-server';
import { stripHtml } from '@/lib/sanitize';
import { sendSupportReplyNotificationEmail, sendAdminReplySelfNotificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    // Utiliser createServerClient qui gère automatiquement les cookies
    const supabase = await createServerClient();

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

    // Récupérer les infos du ticket et du client pour l'email
    const { data: ticket } = await supabaseAdmin
      .from('support_tickets')
      .select('user_id, subject')
      .eq('id', ticketId)
      .single();

    if (ticket) {
      // Récupérer l'email du client
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(ticket.user_id);
      const customerEmail = userData?.user?.email;

      if (customerEmail) {
        // Envoyer l'email de notification au client (non-bloquant)
        try {
          await sendSupportReplyNotificationEmail(
            customerEmail,
            ticketId,
            ticket.subject,
            newMessage.id
          );
          console.log('[API ADMIN] Email de notification envoyé au client:', customerEmail);
        } catch (emailError) {
          console.error('[API ADMIN] Erreur envoi email notification client:', emailError);
          // Ne pas bloquer si l'email échoue
        }

        // Envoyer une confirmation à l'admin (non-bloquant)
        try {
          await sendAdminReplySelfNotificationEmail(
            ticketId,
            ticket.subject,
            customerEmail,
            content || '[Pièce jointe]'
          );
          console.log('[API ADMIN] Email de confirmation envoyé à l\'admin');
        } catch (emailError) {
          console.error('[API ADMIN] Erreur envoi email confirmation admin:', emailError);
          // Ne pas bloquer si l'email échoue
        }
      }
    }

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
