'use client';

import { useState } from 'react';

interface License {
  id: string;
  product_id: string;
  key_code: string;
  is_used: boolean;
}

export default function LicensesClient({ allLicenses }: { allLicenses: License[] }) {
  const [productId, setProductId] = useState('');
  const [keys, setKeys] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [viewingProduct, setViewingProduct] = useState<string | null>(null);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Nettoyer et séparer les clés
    const keyList = keys
      .split('\n')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    if (keyList.length === 0) {
      setMessage('Veuillez entrer au moins une clé');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/licenses/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, keys: keyList }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ ${data.count} licences importées avec succès`);
        setProductId('');
        setKeys('');
        // Recharger la page après 1 seconde pour voir le nouveau stock
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setMessage(`❌ Erreur: ${data.error}`);
      }
    } catch (error) {
      console.error('Error importing licenses:', error);
      setMessage('❌ Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
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
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto">
              {allLicenses
                .filter((l) => l.product_id === viewingProduct)
                .map((license, idx) => (
                  <div key={license.id} className="p-3 bg-gray-50 rounded mb-2 font-mono text-sm">
                    {idx + 1}. {license.key_code}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      <h2 className="text-xl font-semibold text-gray-900 mb-4">Importer des licences</h2>

      <form onSubmit={handleImport} className="space-y-4">
        <div>
          <label htmlFor="productId" className="block text-sm font-medium text-gray-700 mb-2">
            Produit <span className="text-red-500">*</span>
          </label>
          <select
            id="productId"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Sélectionner un produit --</option>
            <option value="windows-10-pro">Windows 10 Pro</option>
            <option value="windows-11-pro">Windows 11 Pro</option>
            <option value="office-2021-pro">Office 2021 Pro</option>
            <option value="windows-server-2022">Windows Server 2022</option>
          </select>
        </div>

        <div>
          <label htmlFor="keys" className="block text-sm font-medium text-gray-700 mb-2">
            Clés de licence <span className="text-red-500">*</span>
            <span className="text-gray-500 font-normal ml-2">(une par ligne)</span>
          </label>
          <textarea
            id="keys"
            value={keys}
            onChange={(e) => setKeys(e.target.value)}
            required
            rows={10}
            placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX&#10;YYYYY-YYYYY-YYYYY-YYYYY-YYYYY&#10;..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
        </div>

        {message && (
          <div className={`p-3 rounded ${
            message.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Import en cours...' : 'Importer les licences'}
        </button>
      </form>
    </div>
  );
}
