import { requireAdmin } from '@/lib/admin-auth';
import { createClient } from '@supabase/supabase-js';
import TicketsClient from './TicketsClient';

export default async function AdminTicketsPage() {
  await requireAdmin();

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Récupérer les tickets
  const { data: tickets, error } = await supabaseAdmin
    .from('support_tickets')
    .select('*')
    .order('created_at', { ascending: false });

  // Enrichir avec les emails et références
  let enrichedTickets = tickets || [];
  
  if (tickets && tickets.length > 0) {
    // Récupérer les emails depuis auth.users
    const userIds = [...new Set(tickets.map(t => t.user_id))];
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const userEmailMap = new Map(
      users?.users?.map(u => [u.id, u.email]) || []
    );

    // Récupérer les références de commandes
    const orderIds = tickets.map(t => t.order_id).filter(Boolean);
    const { data: orders } = orderIds.length > 0
      ? await supabaseAdmin
          .from('orders')
          .select('id, reference')
          .in('id', orderIds)
      : { data: [] };
    const orderRefMap = new Map(
      orders?.map(o => [o.id, o.reference]) || []
    );

    // Enrichir les tickets
    enrichedTickets = tickets.map(ticket => ({
      ...ticket,
      user_email: userEmailMap.get(ticket.user_id) || null,
      order_reference: ticket.order_id ? orderRefMap.get(ticket.order_id) : null,
    }));
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Support - Tickets</h1>
      <TicketsClient initialTickets={enrichedTickets} />
    </div>
  );
}
