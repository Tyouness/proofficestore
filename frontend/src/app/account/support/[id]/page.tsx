import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase-server';
import TicketChatClient from '@/app/account/support/[id]/TicketChatClient';

interface TicketPageProps {
  params: Promise<{ id: string }>;
}

export default async function TicketPage({ params }: TicketPageProps) {
  const { id } = await params;
  
  // Utiliser createServerClient qui gère automatiquement les cookies
  const supabase = await createServerClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (!user || userError) {
    redirect('/login');
  }

  // Récupérer le ticket (RLS vérifie automatiquement que user_id = user.id)
  const { data: ticket, error: ticketError } = await supabase
    .from('support_tickets')
    .select('id, user_id, subject, message, status, created_at')
    .eq('id', id)
    .single();

  if (ticketError || !ticket) {
    redirect('/account/support');
  }

  // Vérification explicite d'appartenance (sécurité en profondeur)
  if (ticket.user_id !== user.id) {
    redirect('/account/support');
  }

  // Charger les messages du ticket (AVEC attachment_url et file_type)
  const { data: messages, error: messagesError } = await supabase
    .from('support_messages')
    .select('id, sender_role, content, attachment_url, file_type, created_at')
    .eq('ticket_id', id)
    .order('created_at', { ascending: true });

  if (messagesError) {
    redirect('/account/support');
  }

  // Réinitialiser le compteur de messages non lus
  await supabase.rpc('reset_ticket_unread_count', { p_ticket_id: id });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {ticket.subject}
            </h1>
            <p className="text-sm text-gray-500">
              Ticket #{id.slice(0, 8)} · Créé le{' '}
              {new Date(ticket.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <div>
            {ticket.status === 'open' ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                ● Ouvert
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600 border border-gray-200">
                ✓ Fermé
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Chat */}
      <TicketChatClient
        ticketId={id}
        userId={user.id}
        initialMessages={messages || []}
        initialTicketMessage={ticket.message || null}
        isClosed={ticket.status === 'closed'}
      />
    </div>
  );
}
