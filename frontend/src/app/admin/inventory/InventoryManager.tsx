/**
 * 📦 COMPOSANT CLIENT - GESTION D'INVENTAIRE
 * 
 * Table interactive pour modifier le stock des produits.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { updateProductInventory } from '@/actions/inventory';

interface Product {
  id: string;
  slug: string;
  name: string;
  family: string;
  version: string;
  edition: string;
  base_price: number;
  inventory: number;
  is_active: boolean;
}

interface InventoryManagerProps {
  products: Product[];
}

export default function InventoryManager({ products }: InventoryManagerProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Filtrer les produits
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) ||
                         product.family.toLowerCase().includes(search.toLowerCase());
    
    if (!matchesSearch) return false;

    if (filter === 'all') return true;
    if (filter === 'low') return product.inventory > 0 && product.inventory <= 10;
    if (filter === 'out') return product.inventory === 0;
    
    return true;
  });

  // Mettre à jour le stock d'un produit
  const handleUpdateInventory = async (productId: string, newInventory: number) => {
    setUpdatingId(productId);

    try {
      const result = await updateProductInventory(productId, newInventory);

      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur serveur');
    } finally {
      setUpdatingId(null);
    }
  };

  // Raccourcis pour mettre à zéro ou réapprovisionner
  const handleQuickAction = async (productId: string, action: 'zero' | 'restock') => {
    const newValue = action === 'zero' ? 0 : 999;
    await handleUpdateInventory(productId, newValue);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Barre de recherche et filtres */}
      <div className="p-4 border-b border-gray-200 flex gap-4 items-center">
        <input
          type="text"
          placeholder="Rechercher un produit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
        
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tous
          </button>
          <button
            onClick={() => setFilter('low')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'low' 
                ? 'bg-orange-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Stock bas
          </button>
          <button
            onClick={() => setFilter('out')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'out' 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Rupture
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Produit</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Famille</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Prix</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Stock actuel</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                {/* Produit */}
                <td className="px-4 py-4">
                  <div>
                    <a
                      href={`/produit/${product.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-gray-900 hover:text-blue-600"
                    >
                      {product.name}
                    </a>
                    {!product.is_active && (
                      <span className="ml-2 px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">
                        Inactif
                      </span>
                    )}
                  </div>
                </td>

                {/* Famille */}
                <td className="px-4 py-4">
                  <span className="text-sm text-gray-600">
                    {product.family} {product.version}
                  </span>
                </td>

                {/* Prix */}
                <td className="px-4 py-4 text-center">
                  <span className="text-sm font-medium text-gray-900">
                    {product.base_price.toFixed(2)} €
                  </span>
                </td>

                {/* Stock actuel */}
                <td className="px-4 py-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    product.inventory === 0 
                      ? 'bg-red-100 text-red-800' 
                      : product.inventory <= 10
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {product.inventory}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-4 py-4">
                  <div className="flex gap-2 items-center">
                    {/* Input pour modifier le stock */}
                    <input
                      type="number"
                      min="0"
                      defaultValue={product.inventory}
                      onBlur={(e) => {
                        const newValue = parseInt(e.target.value) || 0;
                        if (newValue !== product.inventory) {
                          handleUpdateInventory(product.id, newValue);
                        }
                      }}
                      disabled={updatingId === product.id}
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />

                    {/* Boutons rapides */}
                    <button
                      onClick={() => handleQuickAction(product.id, 'zero')}
                      disabled={updatingId === product.id}
                      className="px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded text-xs font-medium disabled:opacity-50"
                      title="Mettre à 0 (activer capture de leads)"
                    >
                      Rupture
                    </button>
                    <button
                      onClick={() => handleQuickAction(product.id, 'restock')}
                      disabled={updatingId === product.id}
                      className="px-2 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded text-xs font-medium disabled:opacity-50"
                      title="Réapprovisionner (999 unités)"
                    >
                      Réappro
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredProducts.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          Aucun produit trouvé
        </div>
      )}
    </div>
  );
}
