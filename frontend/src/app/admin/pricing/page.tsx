/**
 * 💰 ADMIN - GESTION DES PRIX ET PROMOTIONS
 * 
 * Page pour gérer les prix de base, prix réduits et promotions.
 */

import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin-auth';
import { getAllProductPricing } from '@/actions/pricing';
import PricingManager from './PricingManager';

export const metadata = {
  title: 'Gestion des Prix - Admin | AllKeyMasters',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function PricingAdminPage() {
  console.log('[PricingAdminPage] 🎯 Chargement de la page...');
  
  // Vérification admin
  console.log('[PricingAdminPage] 🔐 Appel requireAdmin()...');
  await requireAdmin();
  console.log('[PricingAdminPage] ✅ requireAdmin() passé');

  // Récupérer tous les produits avec leurs prix
  console.log('[PricingAdminPage] 📊 Appel getAllProductPricing()...');
  const result = await getAllProductPricing();
  console.log('[PricingAdminPage] 📊 Résultat getAllProductPricing:', { 
    success: result.success, 
    message: result.message,
    productsCount: result.data?.length || 0 
  });

  if (!result.success) {
    console.log('[PricingAdminPage] ❌ REDIRECTION vers / car success=false');
    redirect('/');
  }
  
  console.log('[PricingAdminPage] ✅ Rendu de la page avec', result.data.length, 'produits');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Prix</h1>
        <p className="mt-2 text-sm text-gray-600">
          Gérez les prix de base, les promotions et les labels pour tous vos produits.
        </p>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Produits</p>
              <p className="text-2xl font-semibold text-gray-900">{result.data.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">En Promotion</p>
              <p className="text-2xl font-semibold text-gray-900">
                {result.data.filter(p => p.on_sale).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Réduction Max</p>
              <p className="text-2xl font-semibold text-gray-900">
                {Math.max(...result.data.map(p => p.discount_percentage), 0)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table de gestion des prix */}
      <PricingManager products={result.data} />
    </div>
  );
}
