import { requireAdmin } from '@/lib/admin-auth';
import { createClient } from '@supabase/supabase-js';
import OrdersTable from './OrdersTable';
import OrdersFilters from './OrdersFilters';

interface SearchParams {
  search?: string;
  dateFilter?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface AdminOrdersPageProps {
  searchParams: Promise<SearchParams>;
}

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const { search, dateFilter, dateFrom, dateTo } = params;

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Construire la query avec filtres
  let query = supabaseAdmin
    .from('orders')
    .select(`
      *,
      licenses:licenses(key_code)
    `);

  // Filtre de recherche
  if (search && search.trim()) {
    const searchTerm = search.trim();

    if (searchTerm.toUpperCase().startsWith('AKM-')) {
      // Recherche par référence
      query = query.ilike('reference', `%${searchTerm}%`);
    } else if (isValidUUID(searchTerm)) {
      // Recherche par ID
      query = query.eq('id', searchTerm);
    } else if (searchTerm.includes('@')) {
      // Recherche par email (si colonne existe)
      query = query.ilike('email_client', `%${searchTerm}%`);
    }
  }

  // Filtre de dates
  const now = new Date();
  let startDate: Date | null = null;

  if (dateFilter === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (dateFilter === '7days') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (dateFilter === '30days') {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (dateFilter === 'custom' && dateFrom) {
    startDate = new Date(dateFrom);
  }

  if (startDate) {
    query = query.gte('created_at', startDate.toISOString());
  }

  if (dateFilter === 'custom' && dateTo) {
    const endDate = new Date(dateTo);
    endDate.setHours(23, 59, 59, 999);
    query = query.lte('created_at', endDate.toISOString());
  }

  // Trier par date décroissante
  query = query.order('created_at', { ascending: false });

  const { data: orders, error } = await query;

  const searchWarning =
    search &&
    search.includes('@') &&
    (!orders || orders.length === 0)
      ? 'La recherche par email nécessite que la colonne email_client existe.'
      : undefined;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Commandes</h1>
      
      <OrdersFilters searchWarning={searchWarning} />
      
      <div className="mt-6">
        <OrdersTable orders={orders || []} />
      </div>
    </div>
  );
}
