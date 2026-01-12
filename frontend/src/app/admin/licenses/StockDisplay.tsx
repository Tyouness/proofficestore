'use client';

import { useState } from 'react';

interface License {
  id: string;
  product_id: string;
  key_code: string;
  is_used: boolean;
}

export default function StockDisplay({
  stockByProduct,
  allLicenses,
}: {
  stockByProduct: Record<string, number>;
  allLicenses: License[];
}) {
  const [viewingProduct, setViewingProduct] = useState<string | null>(null);

  const productKeys = viewingProduct
    ? allLicenses.filter((l) => l.product_id === viewingProduct)
    : [];

  return (
    <>
      {/* Modal de détail des clés */}
      {viewingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">
                  Clés disponibles - {viewingProduct}
                </h3>
                <button
                  onClick={() => setViewingProduct(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto">
              {productKeys.length === 0 ? (
                <p className="text-gray-500">Aucune clé disponible</p>
              ) : (
                productKeys.map((license, idx) => (
                  <div key={license.id} className="p-3 bg-gray-50 rounded mb-2 font-mono text-sm">
                    {idx + 1}. {license.key_code}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grille de stock */}
      {Object.keys(stockByProduct).length === 0 ? (
        <p className="text-gray-500">Aucune licence en stock</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(stockByProduct).map(([productId, count]) => (
            <div key={productId} className="p-4 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">{productId}</p>
              <p
                className={`text-2xl font-bold mt-2 ${
                  count < 10 ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {count}
              </p>
              <p className="text-sm text-gray-500 mb-3">licences disponibles</p>
              <button
                onClick={() => setViewingProduct(productId)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Voir les clés →
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
