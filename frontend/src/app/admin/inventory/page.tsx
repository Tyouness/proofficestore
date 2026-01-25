/**
 * 📦 ADMIN - GESTION DE L'INVENTAIRE
 * 
 * Page pour gérer le stock des produits.
 */

import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase-server';
import InventoryManager from './InventoryManager';

export const metadata = {
  title: 'Gestion du Stock - Admin | AllKeyMasters',
  robots: {
    index: false,
    follow: false,
  },
};

async function getProducts() {
  const supabase = await createServerClient();

  // Récupérer tous les produits avec inventaire
  const { data: products, error } = await supabase
    .from('products')
    .select('id, slug, name, family, version, edition, base_price, inventory, is_active')
    .order('name', { ascending: true });

  if (error) {
    console.error('Erreur récupération produits:', error);
    return [];
  }

  return products || [];
}

export default async function InventoryAdminPage() {
  const products = await getProducts();

  const lowStockCount = products.filter(p => p.inventory <= 10 && p.inventory > 0).length;
  const outOfStockCount = products.filter(p => p.inventory === 0).length;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📦 Gestion de l&apos;Inventaire
        </h1>
        <p className="text-gray-600">
          Gérer le stock de tous les produits
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <p className="text-sm text-gray-600 mb-1">Total produits</p>
          <p className="text-3xl font-bold text-gray-900">{products.length}</p>
        </div>
        <div className="bg-orange-50 rounded-xl shadow-sm p-5 border border-orange-200">
          <p className="text-sm text-orange-700 mb-1">Stock bas (≤10)</p>
          <p className="text-3xl font-bold text-orange-900">{lowStockCount}</p>
        </div>
        <div className="bg-red-50 rounded-xl shadow-sm p-5 border border-red-200">
          <p className="text-sm text-red-700 mb-1">Rupture (0)</p>
          <p className="text-3xl font-bold text-red-900">{outOfStockCount}</p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Guide d&apos;utilisation</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li><strong>Stock &gt; 0</strong> : Le bouton d&apos;achat classique est affiché</li>
          <li><strong>Stock = 0</strong> : Le formulaire de demande de stock est affiché automatiquement</li>
          <li>Vous recevez les demandes dans la page &quot;Demandes de Stock&quot;</li>
          <li>Mettez le stock à 0 pour activer la capture de leads B2B/B2C</li>
        </ul>
      </div>

      {/* Gestionnaire d'inventaire */}
      <InventoryManager products={products} />
    </div>
  );
}
