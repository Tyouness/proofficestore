'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface OrdersFiltersProps {
  searchWarning?: string;
}

export default function OrdersFilters({ searchWarning }: OrdersFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [dateFilter, setDateFilter] = useState(searchParams.get('dateFilter') || 'all');
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || '');

  const applyFilters = () => {
    const params = new URLSearchParams();

    if (search.trim()) {
      params.set('search', search.trim());
    }

    if (dateFilter !== 'all') {
      params.set('dateFilter', dateFilter);
    }

    if (dateFilter === 'custom') {
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
    }

    router.push(`/admin/orders?${params.toString()}`);
  };

  const resetFilters = () => {
    setSearch('');
    setDateFilter('all');
    setDateFrom('');
    setDateTo('');
    router.push('/admin/orders');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      applyFilters();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
      {/* Ligne 1 : Recherche */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
            Recherche
          </label>
          <input
            type="text"
            id="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Référence AKM-..., ID, email..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500">
            Tapez AKM- pour référence, UUID pour ID, ou email avec @
          </p>
        </div>

        {/* Filtres de dates */}
        <div>
          <label htmlFor="dateFilter" className="block text-sm font-medium text-gray-700 mb-2">
            Période
          </label>
          <select
            id="dateFilter"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Toutes les dates</option>
            <option value="today">Aujourd'hui</option>
            <option value="7days">7 derniers jours</option>
            <option value="30days">30 derniers jours</option>
            <option value="custom">Personnalisé</option>
          </select>
        </div>
      </div>

      {/* Ligne 2 : Dates custom (conditionnel) */}
      {dateFilter === 'custom' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
          <div>
            <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-2">
              Du
            </label>
            <input
              type="date"
              id="dateFrom"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-2">
              Au
            </label>
            <input
              type="date"
              id="dateTo"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Warning message si email non disponible */}
      {searchWarning && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <span className="text-yellow-600 text-xl mr-3">⚠️</span>
            <p className="text-yellow-800 text-sm">{searchWarning}</p>
          </div>
        </div>
      )}

      {/* Boutons d'action */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={applyFilters}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Appliquer les filtres
        </button>
        <button
          onClick={resetFilters}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Réinitialiser
        </button>
      </div>

      {/* Indicateur de filtres actifs */}
      {(search || dateFilter !== 'all') && (
        <div className="pt-2 border-t">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Filtres actifs :</span>{' '}
            {search && <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2 text-xs">Recherche: {search}</span>}
            {dateFilter !== 'all' && (
              <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                {dateFilter === 'today' && 'Aujourd\'hui'}
                {dateFilter === '7days' && '7 derniers jours'}
                {dateFilter === '30days' && '30 derniers jours'}
                {dateFilter === 'custom' && 'Période personnalisée'}
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
