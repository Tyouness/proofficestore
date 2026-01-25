/**
 * 📊 ADMIN - GESTION DES DEMANDES DE STOCK
 * 
 * Page d'administration pour traiter les demandes de notification de stock.
 * 
 * Fonctionnalités:
 * - Liste des demandes avec filtres (statut)
 * - Mise à jour du statut
 * - Notes administratives
 * - Statistiques
 */

import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase-server';
import StockRequestsTable from './StockRequestsTable';

export const metadata = {
  title: 'Demandes de Stock - Admin | AllKeyMasters',
  robots: {
    index: false,
    follow: false,
  },
};

async function getStockRequests() {
  const supabase = await createServerClient();

  // Récupérer les demandes via la vue enrichie
  const { data: requests, error } = await supabase
    .from('stock_requests_with_product')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur récupération demandes:', error);
    return [];
  }

  return requests || [];
}

async function getStats() {
  const supabase = await createServerClient();
  
  const { data: requests } = await supabase
    .from('stock_requests')
    .select('status');

  if (!requests) return null;

  return {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    contacted: requests.filter(r => r.status === 'contacted').length,
    completed: requests.filter(r => r.status === 'completed').length,
    cancelled: requests.filter(r => r.status === 'cancelled').length,
  };
}

export default async function StockRequestsAdminPage() {
  const requests = await getStockRequests();
  const stats = await getStats();

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📋 Demandes de Stock
        </h1>
        <p className="text-gray-600">
          Gérer les demandes de notification pour produits en rupture de stock
        </p>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Total</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-orange-50 rounded-xl shadow-sm p-5 border border-orange-200">
            <p className="text-sm text-orange-700 mb-1">En attente</p>
            <p className="text-3xl font-bold text-orange-900">{stats.pending}</p>
          </div>
          <div className="bg-blue-50 rounded-xl shadow-sm p-5 border border-blue-200">
            <p className="text-sm text-blue-700 mb-1">Contactés</p>
            <p className="text-3xl font-bold text-blue-900">{stats.contacted}</p>
          </div>
          <div className="bg-green-50 rounded-xl shadow-sm p-5 border border-green-200">
            <p className="text-sm text-green-700 mb-1">Complétés</p>
            <p className="text-3xl font-bold text-green-900">{stats.completed}</p>
          </div>
          <div className="bg-gray-50 rounded-xl shadow-sm p-5 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Annulés</p>
            <p className="text-3xl font-bold text-gray-700">{stats.cancelled}</p>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Comment traiter une demande</h3>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Vérifier le stock réel du produit demandé</li>
          <li>Contacter le client par email avec la disponibilité</li>
          <li>Mettre à jour le statut en &quot;Contacté&quot; une fois l&apos;email envoyé</li>
          <li>Mettre &quot;Complété&quot; si le client a commandé</li>
          <li>Mettre &quot;Annulé&quot; si le client ne répond pas ou n&apos;est plus intéressé</li>
        </ol>
      </div>

      {/* Table des demandes */}
      <StockRequestsTable requests={requests} />
    </div>
  );
}
