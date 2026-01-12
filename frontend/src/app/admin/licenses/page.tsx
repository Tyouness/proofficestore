import { requireAdmin } from '@/lib/admin-auth';
import { createClient } from '@supabase/supabase-js';
import LicensesClient from '@/app/admin/licenses/LicensesClient';
import StockDisplay from '@/app/admin/licenses/StockDisplay';

export default async function AdminLicensesPage() {
  await requireAdmin();

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: licenses } = await supabaseAdmin
    .from('licenses')
    .select('id, product_id, key_code, is_used')
    .eq('is_used', false)
    .order('product_id')
    .order('created_at', { ascending: false });

  // Compter le stock par produit
  const stockByProduct = licenses?.reduce((acc, license) => {
    acc[license.product_id] = (acc[license.product_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Gestion des licences</h1>

      {/* Stock actuel */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Stock actuel</h2>
        <StockDisplay stockByProduct={stockByProduct} allLicenses={licenses || []} />
      </div>

      {/* Formulaire d'import */}
      <LicensesClient allLicenses={licenses || []} />
    </div>
  );
}
