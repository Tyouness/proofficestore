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
  price_eur?: number | null;
  price_usd?: number | null;
  price_gbp?: number | null;
  price_cad?: number | null;
  price_aud?: number | null;
  price_chf?: number | null;
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
    priceEur: string;
    priceUsd: string;
    priceGbp: string;
    priceCad: string;
    priceAud: string;
    priceChf: string;
  }>({
    basePrice: '',
    salePrice: '',
    onSale: false,
    promoLabel: '',
    priceEur: '',
    priceUsd: '',
    priceGbp: '',
    priceCad: '',
    priceAud: '',
    priceChf: '',
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
      priceEur: product.price_eur?.toString() || '',
      priceUsd: product.price_usd?.toString() || '',
      priceGbp: product.price_gbp?.toString() || '',
      priceCad: product.price_cad?.toString() || '',
      priceAud: product.price_aud?.toString() || '',
      priceChf: product.price_chf?.toString() || '',
    });
  };

  // Annuler l'édition
  const cancelEditing = () => {
    setEditingId(null);
    setFormData({ 
      basePrice: '', 
      salePrice: '', 
      onSale: false, 
      promoLabel: '',
      priceEur: '',
      priceUsd: '',
      priceGbp: '',
      priceCad: '',
      priceAud: '',
      priceChf: '',
    });
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
      // Prix multi-devises
      if (formData.priceEur) formDataObj.append('priceEur', formData.priceEur);
      if (formData.priceUsd) formDataObj.append('priceUsd', formData.priceUsd);
      if (formData.priceGbp) formDataObj.append('priceGbp', formData.priceGbp);
      if (formData.priceCad) formDataObj.append('priceCad', formData.priceCad);
      if (formData.priceAud) formDataObj.append('priceAud', formData.priceAud);
      if (formData.priceChf) formDataObj.append('priceChf', formData.priceChf);

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
      <div className="space-y-4 p-6">
        {products.map((product) => (
          <div key={product.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            {editingId === product.id ? (
              // Mode édition
              <div className="space-y-6">
                {/* En-tête */}
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-500">{product.slug}</p>
                </div>

                {/* Prix de base et promotion */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prix de Base (EUR) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={formData.basePrice}
                        onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="absolute right-3 top-2 text-gray-400">€</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prix Réduit (EUR)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={formData.salePrice}
                        onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                        placeholder="Optionnel"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="absolute right-3 top-2 text-gray-400">€</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Réduction
                    </label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-center">
                      {calculatedDiscount > 0 ? (
                        <span className="text-red-600 font-semibold">-{calculatedDiscount}%</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Label Promo
                    </label>
                    <input
                      type="text"
                      value={formData.promoLabel}
                      onChange={(e) => setFormData({ ...formData, promoLabel: e.target.value })}
                      placeholder="Ex: -50%"
                      maxLength={50}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Prix multi-devises */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="mr-2">🌍</span> Prix par Marché (Multi-devises)
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        🇪🇺 EUR
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          value={formData.priceEur}
                          onChange={(e) => setFormData({ ...formData, priceEur: e.target.value })}
                          placeholder="Ex: 149.90"
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="absolute right-2 top-1.5 text-xs text-gray-400">€</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        🇺🇸 USD
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          value={formData.priceUsd}
                          onChange={(e) => setFormData({ ...formData, priceUsd: e.target.value })}
                          placeholder="Ex: 164.89"
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="absolute right-2 top-1.5 text-xs text-gray-400">$</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        🇬🇧 GBP
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          value={formData.priceGbp}
                          onChange={(e) => setFormData({ ...formData, priceGbp: e.target.value })}
                          placeholder="Ex: 127.42"
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="absolute right-2 top-1.5 text-xs text-gray-400">£</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        🇨🇦 CAD
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          value={formData.priceCad}
                          onChange={(e) => setFormData({ ...formData, priceCad: e.target.value })}
                          placeholder="Ex: 224.85"
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="absolute right-2 top-1.5 text-xs text-gray-400">CAD</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        🇦🇺 AUD
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          value={formData.priceAud}
                          onChange={(e) => setFormData({ ...formData, priceAud: e.target.value })}
                          placeholder="Ex: 254.83"
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="absolute right-2 top-1.5 text-xs text-gray-400">AUD</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        🇨🇭 CHF
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          value={formData.priceChf}
                          onChange={(e) => setFormData({ ...formData, priceChf: e.target.value })}
                          placeholder="Ex: 157.40"
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="absolute right-2 top-1.5 text-xs text-gray-400">CHF</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Statut et actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.onSale}
                      onChange={(e) => setFormData({ ...formData, onSale: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Promotion Active</span>
                  </label>

                  <div className="flex gap-2">
                    <button
                      onClick={cancelEditing}
                      disabled={updatingId === product.id}
                      className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => saveChanges(product.id)}
                      disabled={updatingId === product.id}
                      className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      {updatingId === product.id ? 'Sauvegarde...' : '💾 Sauvegarder'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Mode affichage
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{product.name}</h3>
                      <p className="text-xs text-gray-500">{product.slug}</p>
                    </div>
                    {product.group_id && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        🔗 Groupe
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-2 flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Prix: </span>
                      <span className="font-semibold text-gray-900">{product.base_price.toFixed(2)} €</span>
                    </div>
                    {product.sale_price && (
                      <>
                        <div>
                          <span className="text-gray-500">Réduit: </span>
                          <span className="font-semibold text-green-600">{product.sale_price.toFixed(2)} €</span>
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          -{product.discount_percentage}%
                        </span>
                      </>
                    )}
                    {product.promo_label && (
                      <span className="text-xs text-gray-600">Label: {product.promo_label}</span>
                    )}
                  </div>

                  {/* Affichage prix multi-devises si définis */}
                  {(product.price_eur || product.price_usd || product.price_gbp || product.price_cad || product.price_aud || product.price_chf) && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-gray-500">🌍 Multi-devises:</span>
                      {product.price_eur && <span className="px-2 py-0.5 bg-gray-100 rounded">EUR: {product.price_eur.toFixed(2)}€</span>}
                      {product.price_usd && <span className="px-2 py-0.5 bg-gray-100 rounded">USD: ${product.price_usd.toFixed(2)}</span>}
                      {product.price_gbp && <span className="px-2 py-0.5 bg-gray-100 rounded">GBP: £{product.price_gbp.toFixed(2)}</span>}
                      {product.price_cad && <span className="px-2 py-0.5 bg-gray-100 rounded">CAD: {product.price_cad.toFixed(2)}</span>}
                      {product.price_aud && <span className="px-2 py-0.5 bg-gray-100 rounded">AUD: {product.price_aud.toFixed(2)}</span>}
                      {product.price_chf && <span className="px-2 py-0.5 bg-gray-100 rounded">CHF: {product.price_chf.toFixed(2)}</span>}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleTogglePromotion(product.id, product.on_sale)}
                    disabled={updatingId === product.id}
                    className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium ${
                      product.on_sale
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    } hover:opacity-80 transition-opacity disabled:opacity-50`}
                  >
                    {product.on_sale ? '✓ Promo Active' : '✗ Promo Inactive'}
                  </button>
                  
                  <button
                    onClick={() => startEditing(product)}
                    disabled={updatingId === product.id}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    ✏️ Modifier
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          Aucun produit à afficher
        </div>
      )}
    </div>
  );
}
