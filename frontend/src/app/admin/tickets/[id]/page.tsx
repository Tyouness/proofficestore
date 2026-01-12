import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import AdminTicketClient from './AdminTicketClient';

interface AdminTicketPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminTicketPage({ params }: AdminTicketPageProps) {
  const { id } = await params;
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

  // Client avec token utilisateur pour vérifier l'auth
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

  // Vérifier que l'utilisateur est admin via service_role (inviolable)
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
    redirect('/');
  }

  // Récupérer le ticket avec service_role
  const { data: ticket, error: ticketError } = await supabaseAdmin
    .from('support_tickets')
    .select('id, user_id, subject, message, status, created_at')
    .eq('id', id)
    .single();

  if (ticketError || !ticket) {
    redirect('/admin/tickets');
  }

  // Récupérer l'email du client depuis auth.users
  const { data: userData } = await supabaseAdmin.auth.admin.getUserById(ticket.user_id);
  const userEmail = userData?.user?.email || null;

  // Récupérer les messages avec service_role (AVEC attachment_url et file_type)
  const { data: messages, error: messagesError } = await supabaseAdmin
    .from('support_messages')
    .select('id, sender_role, content, attachment_url, file_type, created_at')
    .eq('ticket_id', id)
    .order('created_at', { ascending: true });

  if (messagesError) {
    redirect('/admin/tickets');
  }

  // Masquer partiellement l'UUID du user
  const maskedUserId = ticket.user_id
    ? `${ticket.user_id.slice(0, 8)}...${ticket.user_id.slice(-4)}`
    : 'Inconnu';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {ticket.subject}
            </h1>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span className="font-medium">Ticket #{id.slice(0, 8)}</span>
              <span>•</span>
              {userEmail && (
                <>
                  <span className="text-blue-600 font-medium">📧 {userEmail}</span>
                  <span>•</span>
                </>
              )}
              <span className="text-gray-500">ID : {maskedUserId}</span>
              <span>•</span>
              <span>
                Créé le{' '}
                {new Date(ticket.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
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

      {/* Chat & Actions */}
      <AdminTicketClient
        ticketId={id}
        adminId={user.id}
        initialMessages={messages || []}
        initialTicketMessage={ticket.message || null}
        isClosed={ticket.status === 'closed'}
      />
    </div>
  );
}
