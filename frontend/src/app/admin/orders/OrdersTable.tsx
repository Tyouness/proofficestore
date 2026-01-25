'use client';

import { useState } from 'react';

interface Order {
  id: string;
  reference?: string;
  user_id?: string;
  email_client?: string;
  status: string;
  total_amount: number;
  created_at: string;
  licenses?: Array<{ key_code: string }>;
  shipping_name?: string;
  shipping_address?: string;
  shipping_zip?: string;
  shipping_city?: string;
  shipping_country?: string;
  shipping_phone_prefix?: string;
  shipping_phone_number?: string;
  shipping_status?: string;
  tracking_number?: string;
}

export default function OrdersTable({ orders }: { orders: Order[] }) {
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [downloadingProofId, setDownloadingProofId] = useState<string | null>(null);
  const [shippingDetailsOrder, setShippingDetailsOrder] = useState<Order | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isUpdatingTracking, setIsUpdatingTracking] = useState(false);

  // Fonction pour mettre à jour le numéro de suivi
  const handleUpdateTracking = async (orderId: string) => {
    if (!trackingNumber.trim()) {
      alert('Veuillez saisir un numéro de suivi');
      return;
    }

    setIsUpdatingTracking(true);
    try {
      const response = await fetch('/api/admin/update-shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          trackingNumber: trackingNumber.trim(),
          shippingStatus: 'shipped'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert('✅ Numéro de suivi enregistré ! La commande est marquée comme expédiée.');
        window.location.reload(); // Recharger la page pour afficher les changements
      } else {
        alert('❌ Erreur: ' + result.message);
      }
    } catch (error) {
      console.error('[Admin Update Tracking Error]', error);
      alert('Erreur lors de la mise à jour. Veuillez réessayer.');
    } finally {
      setIsUpdatingTracking(false);
    }
  };

  // Fonction pour télécharger la preuve d'achat
  const handleDownloadProof = async (orderId: string) => {
    setDownloadingProofId(orderId);
    try {
      const response = await fetch(`/api/documents/proof-of-purchase/${orderId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || 'Impossible de générer la preuve d\'achat');
        return;
      }

      // Récupérer le blob PDF
      const blob = await response.blob();
      
      // Créer un lien de téléchargement temporaire
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `preuve-achat-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error('[Admin PDF Download Error]', error);
      alert('Erreur lors du téléchargement. Veuillez réessayer.');
    } finally {
      setDownloadingProofId(null);
    }
  };

  return (
    <>
      {/* Modal des détails de livraison */}
      {shippingDetailsOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full overflow-hidden">
            <div className="p-6 border-b bg-blue-50">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">
                  📦 Informations de Livraison
                </h3>
                <button
                  onClick={() => {
                    setShippingDetailsOrder(null);
                    setTrackingNumber('');
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Commande: {shippingDetailsOrder.reference || shippingDetailsOrder.id.slice(0, 8)}
              </p>
            </div>
            <div className="p-6 space-y-4">
              {/* Informations client */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span>👤</span> Destinataire
                </h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Nom:</strong> {shippingDetailsOrder.shipping_name}</p>
                  <p><strong>Adresse:</strong> {shippingDetailsOrder.shipping_address}</p>
                  <p><strong>Code postal:</strong> {shippingDetailsOrder.shipping_zip}</p>
                  <p><strong>Ville:</strong> {shippingDetailsOrder.shipping_city}</p>
                  <p><strong>Pays:</strong> {shippingDetailsOrder.shipping_country}</p>
                  {(shippingDetailsOrder.shipping_phone_prefix && shippingDetailsOrder.shipping_phone_number) && (
                    <p><strong>Téléphone:</strong> {shippingDetailsOrder.shipping_phone_prefix}{shippingDetailsOrder.shipping_phone_number}</p>
                  )}
                </div>
              </div>

              {/* Status actuel */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span>📨</span> Status d'expédition
                </h4>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  shippingDetailsOrder.shipping_status === 'shipped' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  {shippingDetailsOrder.shipping_status === 'shipped' ? '📦 Expédié' : '⏳ En attente d\'expédition'}
                </span>
                {shippingDetailsOrder.tracking_number && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-1">Numéro de suivi:</p>
                    <p className="font-mono text-blue-600 font-semibold">{shippingDetailsOrder.tracking_number}</p>
                  </div>
                )}
              </div>

              {/* Formulaire de mise à jour du tracking */}
              {shippingDetailsOrder.shipping_status !== 'shipped' && (
                <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    🚚 Marquer comme expédié
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Numéro de suivi
                      </label>
                      <input
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="Ex: FR123456789"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <button
                      onClick={() => handleUpdateTracking(shippingDetailsOrder.id)}
                      disabled={isUpdatingTracking || !trackingNumber.trim()}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isUpdatingTracking ? 'Mise à jour...' : '✅ Enregistrer et marquer comme expédié'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de détail des clés */}
      {viewingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">
                  Clés attribuées - Commande {viewingOrder.id.slice(0, 8)}
                </h3>
                <button
                  onClick={() => setViewingOrder(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6">
              {!viewingOrder.licenses || viewingOrder.licenses.length === 0 ? (
                <p className="text-gray-500">Aucune clé attribuée</p>
              ) : (
                <div className="space-y-2">
                  {viewingOrder.licenses.map((license, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded font-mono text-sm">
                      {license.key_code}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tableau */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500">Aucune commande trouvée</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Référence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Livraison
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.reference || `ID: ${order.id.slice(0, 8)}...`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        order.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {order.email_client || (order.user_id ? `${order.user_id.slice(0, 6)}...${order.user_id.slice(-4)}` : 'N/A')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {order.shipping_name ? (
                      <button
                        onClick={() => {
                          setShippingDetailsOrder(order);
                          setTrackingNumber(order.tracking_number || '');
                        }}
                        className="text-left hover:bg-blue-50 p-2 rounded-lg transition-colors w-full"
                      >
                        <div className="space-y-1">
                          <div className="font-medium text-blue-600 hover:text-blue-800">{order.shipping_name}</div>
                          <div className="text-xs text-gray-500">
                            {order.shipping_city}, {order.shipping_country}
                          </div>
                          {order.shipping_status && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              order.shipping_status === 'shipped' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                            }`}>
                              {order.shipping_status === 'shipped' ? '📦 Expédié' : '⏳ En attente'}
                            </span>
                          )}
                          <div className="text-xs text-blue-500 font-medium mt-1">
                            👁️ Voir détails
                          </div>
                        </div>
                      </button>
                    ) : (
                      <span className="text-gray-400 text-xs">Digital</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {(order.total_amount / 100).toFixed(2)} €
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {order.status === 'paid' && (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setViewingOrder(order)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Voir clés
                        </button>
                        <button
                          onClick={() => handleDownloadProof(order.id)}
                          disabled={downloadingProofId === order.id}
                          className="text-green-600 hover:text-green-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Télécharger la preuve d'achat PDF"
                        >
                          {downloadingProofId === order.id ? (
                            <span className="flex items-center gap-1">
                              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              PDF...
                            </span>
                          ) : (
                            '📄 Preuve'
                          )}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
