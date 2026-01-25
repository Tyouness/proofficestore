/**
 * 📊 TABLE INTERACTIVE - DEMANDES DE STOCK (Client Component)
 * 
 * Table avec filtres, tri et actions pour gérer les demandes.
 */

'use client';

import React, { useState } from 'react';
import { updateStockRequest } from '@/actions/stock-request';
import { toast } from 'sonner';

interface StockRequest {
  id: string;
  created_at: string;
  updated_at: string;
  user_email: string;
  quantity: number;
  status: 'pending' | 'contacted' | 'completed' | 'cancelled';
  ip_address: string | null;
  admin_notes: string | null;
  product_id: string;
  product_name: string;
  product_slug: string;
  current_inventory: number;
  product_price: number;
}

interface StockRequestsTableProps {
  requests: StockRequest[];
}

const statusColors = {
  pending: 'bg-orange-100 text-orange-800 border-orange-300',
  contacted: 'bg-blue-100 text-blue-800 border-blue-300',
  completed: 'bg-green-100 text-green-800 border-green-300',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-300',
};

const statusLabels = {
  pending: '⏳ En attente',
  contacted: '✉️ Contacté',
  completed: '✅ Complété',
  cancelled: '❌ Annulé',
};

export default function StockRequestsTable({ requests }: StockRequestsTableProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'contacted' | 'completed' | 'cancelled'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  // Filtrer les demandes
  const filteredRequests = requests.filter(req => 
    filter === 'all' ? true : req.status === filter
  );

  // Changer le statut d'une demande
  const handleStatusChange = async (requestId: string, newStatus: string) => {
    setUpdatingId(requestId);

    try {
      const formData = new FormData();
      formData.append('requestId', requestId);
      formData.append('status', newStatus);

      const result = await updateStockRequest(formData);

      if (result.success) {
        toast.success('Statut mis à jour');
        // Recharger la page pour voir les changements
        window.location.reload();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setUpdatingId(null);
    }
  };

  // Ajouter/mettre à jour des notes
  const handleNotesUpdate = async (requestId: string, notes: string) => {
    const formData = new FormData();
    formData.append('requestId', requestId);
    formData.append('adminNotes', notes);

    const result = await updateStockRequest(formData);

    if (result.success) {
      toast.success('Notes enregistrées');
      window.location.reload();
    } else {
      toast.error('Erreur');
    }
  };

  const toggleNotes = (id: string) => {
    const newExpanded = new Set(expandedNotes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNotes(newExpanded);
  };

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <p className="text-gray-500 text-lg">Aucune demande de stock pour le moment</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Filtres */}
      <div className="p-4 border-b border-gray-200 flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Tous ({requests.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'pending' 
              ? 'bg-orange-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          En attente ({requests.filter(r => r.status === 'pending').length})
        </button>
        <button
          onClick={() => setFilter('contacted')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'contacted' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Contactés ({requests.filter(r => r.status === 'contacted').length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'completed' 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Complétés ({requests.filter(r => r.status === 'completed').length})
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email Client</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Produit</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Qté</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Stock actuel</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Statut</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredRequests.map((request) => (
              <React.Fragment key={request.id}>
                <tr className="hover:bg-gray-50 transition-colors">
                  {/* Date */}
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {new Date(request.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>

                  {/* Email */}
                  <td className="px-4 py-4">
                    <a 
                      href={`mailto:${request.user_email}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {request.user_email}
                    </a>
                  </td>

                  {/* Produit */}
                  <td className="px-4 py-4">
                    <a
                      href={`/produit/${request.product_slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-gray-900 hover:text-blue-600"
                    >
                      {request.product_name}
                    </a>
                    <p className="text-xs text-gray-500 mt-1">
                      Prix: {request.product_price.toFixed(2)} €
                    </p>
                  </td>

                  {/* Quantité demandée */}
                  <td className="px-4 py-4 text-center">
                    <span className="text-sm font-bold text-gray-900">
                      {request.quantity}
                    </span>
                  </td>

                  {/* Stock actuel */}
                  <td className="px-4 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      request.current_inventory > 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {request.current_inventory}
                    </span>
                  </td>

                  {/* Statut */}
                  <td className="px-4 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[request.status]}`}>
                      {statusLabels[request.status]}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <select
                        value={request.status}
                        onChange={(e) => handleStatusChange(request.id, e.target.value)}
                        disabled={updatingId === request.id}
                        className="text-xs border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        <option value="pending">En attente</option>
                        <option value="contacted">Contacté</option>
                        <option value="completed">Complété</option>
                        <option value="cancelled">Annulé</option>
                      </select>
                      <button
                        onClick={() => toggleNotes(request.id)}
                        className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg"
                        title="Notes"
                      >
                        📝
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Ligne extensible pour les notes */}
                {expandedNotes.has(request.id) && (
                  <tr className="bg-gray-50">
                    <td colSpan={7} className="px-4 py-4">
                      <div className="max-w-2xl">
                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                          Notes administratives
                        </label>
                        <textarea
                          defaultValue={request.admin_notes || ''}
                          onBlur={(e) => handleNotesUpdate(request.id, e.target.value)}
                          placeholder="Ajouter des notes internes..."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          IP: {request.ip_address || 'N/A'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {filteredRequests.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          Aucune demande avec ce filtre
        </div>
      )}
    </div>
  );
}
