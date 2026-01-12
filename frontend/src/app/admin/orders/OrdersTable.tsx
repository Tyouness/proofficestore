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
}

export default function OrdersTable({ orders }: { orders: Order[] }) {
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  return (
    <>
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
                  User
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {(order.total_amount / 100).toFixed(2)} €
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {order.status === 'paid' && (
                      <button
                        onClick={() => setViewingOrder(order)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Voir clés
                      </button>
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
