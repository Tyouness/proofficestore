'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getPendingShippingOrders, 
  markOrderAsShipped,
  getShippedOrders,
  type ShippingOrder 
} from '@/actions/shipping';
import { toast } from 'sonner';

export default function ShippingManager() {
  const router = useRouter();
  const [pendingOrders, setPendingOrders] = useState<ShippingOrder[]>([]);
  const [shippedOrders, setShippedOrders] = useState<ShippingOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'shipped'>('pending');
  
  // État pour le tracking number de chaque commande
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});
  const [updatingOrders, setUpdatingOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setIsLoading(true);
    
    const [pendingResult, shippedResult] = await Promise.all([
      getPendingShippingOrders(),
      getShippedOrders(),
    ]);

    if (pendingResult.success && pendingResult.orders) {
      setPendingOrders(pendingResult.orders);
    } else {
      toast.error(pendingResult.error || 'Erreur lors du chargement des commandes en attente');
    }

    if (shippedResult.success && shippedResult.orders) {
      setShippedOrders(shippedResult.orders);
    }

    setIsLoading(false);
  };

  const handleMarkAsShipped = async (orderId: string) => {
    const trackingNumber = trackingInputs[orderId]?.trim();
    
    if (!trackingNumber) {
      toast.error('Veuillez saisir un numéro de suivi');
      return;
    }

    setUpdatingOrders(prev => new Set(prev).add(orderId));

    const result = await markOrderAsShipped(orderId, trackingNumber);

    if (result.success) {
      toast.success('Commande marquée comme expédiée !');
      setTrackingInputs(prev => {
        const newInputs = { ...prev };
        delete newInputs[orderId];
        return newInputs;
      });
      router.refresh();
      loadOrders();
    } else {
      toast.error(result.error || 'Erreur lors de la mise à jour');
    }

    setUpdatingOrders(prev => {
      const newSet = new Set(prev);
      newSet.delete(orderId);
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('pending')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'pending' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            En attente ({pendingOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('shipped')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'shipped' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            Expédiées ({shippedOrders.length})
          </button>
        </nav>
      </div>

      {/* Pending Orders */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingOrders.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Aucune commande en attente d'expédition</p>
            </div>
          ) : (
            pendingOrders.map(order => (
              <div key={order.id} className="bg-white border-2 border-gray-200 rounded-xl p-6 space-y-4">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      Commande #{order.id.substring(0, 8)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                    En attente
                  </span>
                </div>

                {/* Products */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-1">Produits:</p>
                  <p className="text-sm text-gray-600">{order.products_summary}</p>
                  <p className="text-sm text-gray-500 mt-1">Total: {(order.total_amount / 100).toFixed(2)} €</p>
                </div>

                {/* Shipping Address */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Adresse de livraison:</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Destinataire:</p>
                      <p className="font-medium text-gray-900">{order.shipping_name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Email:</p>
                      <p className="font-medium text-gray-900">{order.email_client}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-500">Adresse:</p>
                      <p className="font-medium text-gray-900">{order.shipping_address}</p>
                      <p className="font-medium text-gray-900">
                        {order.shipping_zip} {order.shipping_city}, {order.shipping_country}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Téléphone:</p>
                      <p className="font-medium text-gray-900">
                        {order.shipping_phone_prefix} {order.shipping_phone_number}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tracking input */}
                <div className="border-t border-gray-200 pt-4">
                  <label htmlFor={`tracking-${order.id}`} className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro de suivi:
                  </label>
                  <div className="flex gap-3">
                    <input
                      id={`tracking-${order.id}`}
                      type="text"
                      value={trackingInputs[order.id] || ''}
                      onChange={(e) => setTrackingInputs(prev => ({
                        ...prev,
                        [order.id]: e.target.value,
                      }))}
                      placeholder="Ex: FR123456789"
                      className="
                        flex-1 px-4 py-3 rounded-xl border-2 border-gray-300
                        focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                        transition-all duration-200 outline-none
                      "
                      disabled={updatingOrders.has(order.id)}
                    />
                    <button
                      onClick={() => handleMarkAsShipped(order.id)}
                      disabled={updatingOrders.has(order.id) || !trackingInputs[order.id]?.trim()}
                      className="
                        px-6 py-3 bg-green-600 text-white rounded-xl font-medium
                        hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed
                        transition-all duration-200
                        flex items-center gap-2
                      "
                    >
                      {updatingOrders.has(order.id) ? (
                        <>
                          <span className="animate-spin">⏳</span>
                          Envoi...
                        </>
                      ) : (
                        <>
                          ✓ Marquer comme expédié
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Shipped Orders */}
      {activeTab === 'shipped' && (
        <div className="space-y-4">
          {shippedOrders.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Aucune commande expédiée</p>
            </div>
          ) : (
            shippedOrders.map(order => (
              <div key={order.id} className="bg-white border-2 border-green-200 rounded-xl p-6 space-y-4">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      Commande #{order.id.substring(0, 8)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    Expédiée
                  </span>
                </div>

                {/* Tracking number */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-1">Numéro de suivi:</p>
                  <p className="font-mono text-lg font-bold text-green-900">{order.tracking_number}</p>
                </div>

                {/* Shipping Info */}
                <div className="grid grid-cols-2 gap-3 text-sm border-t border-gray-200 pt-4">
                  <div>
                    <p className="text-gray-500">Destinataire:</p>
                    <p className="font-medium text-gray-900">{order.shipping_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Ville:</p>
                    <p className="font-medium text-gray-900">{order.shipping_city}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
