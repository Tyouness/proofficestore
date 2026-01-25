'use client';

import { useState } from 'react';

interface DeliveryTrackerProps {
  trackingNumber: string;
  shippingStatus: string;
  shippingName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
  shippingCountry: string;
}

export default function DeliveryTracker({
  trackingNumber,
  shippingStatus,
  shippingName,
  shippingAddress,
  shippingCity,
  shippingPostalCode,
  shippingCountry,
}: DeliveryTrackerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyTracking = async () => {
    await navigator.clipboard.writeText(trackingNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-4">
      <h3 className="text-lg font-semibold mb-4 text-blue-900">
        📦 Suivi de livraison
      </h3>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className={`text-sm font-medium ${
            shippingStatus === 'pending' || shippingStatus === 'shipped' 
              ? 'text-green-600' 
              : 'text-gray-400'
          }`}>
            ✓ Payé
          </span>
          <span className={`text-sm font-medium ${
            shippingStatus === 'shipped' 
              ? 'text-green-600' 
              : 'text-gray-400'
          }`}>
            {shippingStatus === 'shipped' ? '✓' : '○'} Expédié
          </span>
          <span className="text-sm font-medium text-gray-400">
            ○ Livré
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ 
              width: shippingStatus === 'shipped' ? '66%' : '33%' 
            }}
          />
        </div>
      </div>

      {/* Tracking number */}
      {trackingNumber && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-1">
            Numéro de suivi :
          </p>
          <div className="flex items-center gap-2">
            <code className="bg-white px-3 py-2 rounded border border-gray-300 font-mono text-sm flex-1">
              {trackingNumber}
            </code>
            <button
              onClick={handleCopyTracking}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
              title="Copier le numéro de suivi"
            >
              {copied ? '✓ Copié' : 'Copier'}
            </button>
          </div>
        </div>
      )}

      {/* Shipping address */}
      <div className="text-sm text-gray-700">
        <p className="font-medium mb-1">Adresse de livraison :</p>
        <p>{shippingName}</p>
        <p>{shippingAddress}</p>
        <p>{shippingPostalCode} {shippingCity}</p>
        <p>{shippingCountry}</p>
      </div>

      {!trackingNumber && shippingStatus === 'pending' && (
        <p className="text-sm text-gray-600 italic mt-4">
          ⏳ Votre colis est en cours de préparation. Le numéro de suivi sera disponible sous peu.
        </p>
      )}
    </div>
  );
}
