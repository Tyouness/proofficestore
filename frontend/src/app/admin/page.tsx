import { requireAdmin } from '@/lib/admin-auth';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

export default async function AdminDashboard() {
  await requireAdmin();

  // Client admin pour les statistiques
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Statistiques
  const { count: totalOrders } = await supabaseAdmin
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'paid');

  const { count: openTickets } = await supabaseAdmin
    .from('support_tickets')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'open');

  const { data: stockData } = await supabaseAdmin
    .from('licenses')
    .select('product_id')
    .eq('is_used', false);

  // Compter le stock par produit
  const stockByProduct = stockData?.reduce((acc, license) => {
    acc[license.product_id] = (acc[license.product_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Commandes payées"
          value={totalOrders || 0}
          icon="💰"
          color="blue"
          href="/admin/orders"
        />
        <StatCard
          title="Tickets ouverts"
          value={openTickets || 0}
          icon="🎫"
          color="yellow"
          href="/admin/tickets"
        />
        <StatCard
          title="Produits en stock"
          value={Object.keys(stockByProduct).length}
          icon="📦"
          color="green"
          href="/admin/licenses"
        />
      </div>

      {/* Stock par produit */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Stock de licences</h2>
        {Object.keys(stockByProduct).length === 0 ? (
          <p className="text-gray-500">Aucune licence en stock</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(stockByProduct).map(([productId, count]) => (
              <div key={productId} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-medium text-gray-700">{productId}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  count < 10 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                  {count} {count === 1 ? 'licence' : 'licences'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, href }: { 
  title: string; 
  value: number; 
  icon: string; 
  color: 'blue' | 'yellow' | 'green';
  href: string;
}) {
  const colors = {
    blue: 'bg-blue-100 text-blue-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    green: 'bg-green-100 text-green-700',
  };

  return (
    <Link 
      href={href}
      className="bg-white rounded-lg shadow p-6 transition-all duration-200 hover:shadow-lg hover:scale-[1.01] cursor-pointer block"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`text-4xl ${colors[color]} w-16 h-16 rounded-full flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </Link>
  );
}
