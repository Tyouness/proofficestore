'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

interface CatalogFiltersProps {
  families: string[];
  versions: string[];
  editions: string[];
  deliveryTypes: string[];
  currentFilters: {
    family?: string;
    delivery_type?: string;
    version?: string;
    edition?: string;
    search?: string;
  };
}

const DELIVERY_TYPE_LABELS: Record<string, string> = {
  digital_key: 'Clé Numérique',
  dvd: 'DVD',
  usb: 'Clé USB',
};

const FAMILY_LABELS: Record<string, string> = {
  windows: 'Windows',
  office: 'Office',
};

const EDITION_LABELS: Record<string, string> = {
  pro: 'Professionnel',
  professional_plus: 'Professional Plus',
  home_student: 'Famille et Étudiant',
  home_business: 'Famille et Petite Entreprise',
};

export default function CatalogFilters({
  families,
  versions,
  editions,
  deliveryTypes,
  currentFilters,
}: CatalogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(currentFilters.search || '');

  useEffect(() => {
    setSearchTerm(currentFilters.search || '');
  }, [currentFilters.search]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value === '') {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    router.push(`/logiciels?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter('search', searchTerm);
  };

  const clearFilters = () => {
    setSearchTerm('');
    router.push('/logiciels');
  };

  const hasActiveFilters = Object.values(currentFilters).some(v => v);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Filtres</h2>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* Barre de recherche */}
      <form onSubmit={handleSearchSubmit} className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un produit..."
            className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg 
            className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Famille */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Produit
          </label>
          <select
            value={currentFilters.family || ''}
            onChange={(e) => updateFilter('family', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tous les produits</option>
            {families.map((family) => (
              <option key={family} value={family}>
                {FAMILY_LABELS[family] || family}
              </option>
            ))}
          </select>
        </div>

        {/* Type de livraison */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type de livraison
          </label>
          <select
            value={currentFilters.delivery_type || ''}
            onChange={(e) => updateFilter('delivery_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tous les types</option>
            {deliveryTypes.map((type) => (
              <option key={type} value={type}>
                {DELIVERY_TYPE_LABELS[type] || type}
              </option>
            ))}
          </select>
        </div>

        {/* Version */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Version
          </label>
          <select
            value={currentFilters.version || ''}
            onChange={(e) => updateFilter('version', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Toutes les versions</option>
            {versions.sort((a, b) => b.localeCompare(a)).map((version) => (
              <option key={version} value={version}>
                {version}
              </option>
            ))}
          </select>
        </div>

        {/* Édition */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Édition
          </label>
          <select
            value={currentFilters.edition || ''}
            onChange={(e) => updateFilter('edition', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Toutes les éditions</option>
            {editions.map((edition) => (
              <option key={edition} value={edition}>
                {EDITION_LABELS[edition] || edition}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
