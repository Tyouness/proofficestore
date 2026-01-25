/**
 * 💰 COMPOSANT CLIENT - GESTION DES PRIX
 * 
 * Table interactive pour modifier les prix et gérer les promotions.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { updateProductPricing, toggleProductPromotion } from '@/actions/pricing';

interface Product {
  id: string;
  slug: string;
  name: string;
  base_price: number;
  sale_price: number | null;
  on_sale: boolean;
  promo_label: string | null;
  final_price: number;
  discount_percentage: number;
  group_id?: string | null;
  delivery_format?: string | null;
}

interface PricingManagerProps {
  products: Product[];
}

export default function PricingManager({ products }: PricingManagerProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  // États du formulaire d'édition
  const [formData, setFormData] = useState<{
    basePrice: string;
    salePrice: string;
    onSale: boolean;
    promoLabel: string;
  }>({
    basePrice: '',
    salePrice: '',
    onSale: false,
    promoLabel: '',
  });

  // Calculer automatiquement le pourcentage de réduction
  const calculatedDiscount = (() => {
    const base = parseFloat(formData.basePrice);
    const sale = parseFloat(formData.salePrice);
    if (base > 0 && sale > 0 && sale < base) {
      return Math.round(((base - sale) / base) * 100);
    }
    return 0;
  })();

  // Synchroniser automatiquement le promo_label avec le pourcentage calculé
  useEffect(() => {
    if (calculatedDiscount > 0 && formData.salePrice) {
      setFormData(prev => ({
        ...prev,
        promoLabel: `-${calculatedDiscount}%`
      }));
    } else if (calculatedDiscount === 0 && formData.promoLabel.startsWith('-')) {
      // Réinitialiser si plus de réduction
      setFormData(prev => ({
        ...prev,
        promoLabel: ''
      }));
    }
  }, [calculatedDiscount, formData.salePrice]);

  // Démarrer l'édition d'un produit
  const startEditing = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      basePrice: product.base_price.toString(),
      salePrice: product.sale_price?.toString() || '',
      onSale: product.on_sale,
      promoLabel: product.promo_label || '',
    });
  };

  // Annuler l'édition
  const cancelEditing = () => {
    setEditingId(null);
    setFormData({ basePrice: '', salePrice: '', onSale: false, promoLabel: '' });
  };

  // Sauvegarder les modifications
  const saveChanges = async (productId: string) => {
    setUpdatingId(productId);

    try {
      const formDataObj = new FormData();
      formDataObj.append('productId', productId);
      formDataObj.append('basePrice', formData.basePrice);
      if (formData.salePrice) {
        formDataObj.append('salePrice', formData.salePrice);
      }
      formDataObj.append('onSale', formData.onSale.toString());
      if (formData.promoLabel) {
        formDataObj.append('promoLabel', formData.promoLabel);
      }

      const result = await updateProductPricing(formDataObj);

      if (result.success) {
        toast.success(result.message);
        setEditingId(null);
        // Forcer le rechargement des données avec router.refresh()
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
      console.error('Erreur saveChanges:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  // Toggle rapide de la promotion
  const handleTogglePromotion = async (productId: string, currentState: boolean) => {
    setUpdatingId(productId);

    try {
      const result = await toggleProductPromotion(productId, !currentState);

      if (result.success) {
        toast.success(result.message);
        // Forcer le rechargement des données
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Erreur lors du toggle');
      console.error('Erreur toggle:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Produit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prix de Base
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prix Réduit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Réduction
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Label Promo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                {editingId === product.id ? (
                  // Mode édition
                  <>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-xs text-gray-500">{product.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        step="0.01"
                        value={formData.basePrice}
                        onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                        className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        step="0.01"
                        value={formData.salePrice}
                        onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                        placeholder="Optionnel"
                        className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      {calculatedDiscount > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          -{calculatedDiscount}%
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={formData.promoLabel}
                        onChange={(e) => setFormData({ ...formData, promoLabel: e.target.value })}
                        placeholder="Ex: -50%"
                        maxLength={50}
                        className="w-32 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.onSale}
                          onChange={(e) => setFormData({ ...formData, onSale: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">En promo</span>
                      </label>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => saveChanges(product.id)}
                        disabled={updatingId === product.id}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                      >
                        Sauvegarder
                      </button>
                      <button
                        onClick={cancelEditing}
                        disabled={updatingId === product.id}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                      >
                        Annuler
                      </button>
                    </td>
                  </>
                ) : (
                  // Mode affichage
                  <>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-xs text-gray-500">{product.slug}</div>
                        </div>
                        {product.group_id && (
                          <span 
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800"
                            title={`Groupe: ${product.group_id.substring(0, 8)}... | Format: ${product.delivery_format || 'N/A'}`}
                          >
                            🔗 Groupe
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {product.base_price.toFixed(2)} €
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-600">
                      {product.sale_price ? `${product.sale_price.toFixed(2)} €` : '—'}
                    </td>
                    <td className="px-6 py-4">
                      {product.discount_percentage > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          -{product.discount_percentage}%
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {product.promo_label || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleTogglePromotion(product.id, product.on_sale)}
                        disabled={updatingId === product.id}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.on_sale
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        } hover:opacity-80 transition-opacity disabled:opacity-50`}
                      >
                        {product.on_sale ? '✓ Active' : '✗ Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => startEditing(product)}
                        disabled={updatingId === product.id}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        Modifier
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {products.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          Aucun produit à afficher
        </div>
      )}
    </div>
  );
}
