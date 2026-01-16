'use client';

import { useState, useMemo } from 'react';

interface Review {
  id: string;
  product_id: string;
  user_id: string;
  order_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
  products: {
    name: string;
    slug: string;
  } | null;
  orders: {
    reference: string;
    status: string;
  } | null;
}

interface ReviewsClientProps {
  initialReviews: Review[];
  adminUserId: string;
}

export default function ReviewsClient({ initialReviews, adminUserId }: ReviewsClientProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'deleted'>('all');
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Filtrage côté client (pour simplicité - peut être migré côté serveur avec API route)
  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      // Filtre statut
      if (filterStatus === 'active' && review.is_deleted) return false;
      if (filterStatus === 'deleted' && !review.is_deleted) return false;

      // Filtre rating
      if (filterRating !== 'all' && review.rating !== filterRating) return false;

      // Recherche (produit, order ref, user_id)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesProduct = review.products?.name.toLowerCase().includes(term) || 
                              review.products?.slug.toLowerCase().includes(term);
        const matchesOrder = review.orders?.reference.toLowerCase().includes(term);
        const matchesUser = review.user_id.toLowerCase().includes(term);
        
        if (!matchesProduct && !matchesOrder && !matchesUser) return false;
      }

      return true;
    });
  }, [reviews, searchTerm, filterStatus, filterRating]);

  const handleDelete = async (reviewId: string) => {
    setIsDeleting(true);
    
    try {
      const response = await fetch('/api/admin/reviews/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reviewId }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        console.log('[ADMIN] Delete error:', data.error);
        setToast({ message: data.error || 'Erreur lors de la suppression', type: 'error' });
        return;
      }

      // Mise à jour optimiste
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? {
                ...r,
                is_deleted: true,
                deleted_at: new Date().toISOString(),
                deleted_by: adminUserId,
              }
            : r
        )
      );

      setToast({ message: 'Avis supprimé avec succès', type: 'success' });
      setDeleteModalId(null);
    } catch (err) {
      console.log('[ADMIN] Exception:', err);
      setToast({ message: 'Erreur inattendue', type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white z-50 ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Modal de confirmation */}
      {deleteModalId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Confirmer la suppression
            </h3>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer cet avis ? Cette action effectuera un soft delete (l&apos;avis sera marqué comme supprimé mais restera dans la base).
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModalId(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(deleteModalId)}
                disabled={isDeleting}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {isDeleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Recherche */}
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Rechercher par produit, référence commande, ou user ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtre statut */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'deleted')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actifs uniquement</option>
            <option value="deleted">Supprimés uniquement</option>
          </select>
        </div>

        {/* Filtre rating */}
        <div className="flex gap-2 items-center">
          <span className="text-sm text-gray-600 font-medium">Note :</span>
          <button
            onClick={() => setFilterRating('all')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
              filterRating === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Toutes
          </button>
          {[5, 4, 3, 2, 1].map((rating) => (
            <button
              key={rating}
              onClick={() => setFilterRating(rating)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                filterRating === rating
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {rating} ⭐
            </button>
          ))}
        </div>
      </div>

      {/* Résultats */}
      <div className="mb-4 text-sm text-gray-600">
        {filteredReviews.length} avis trouvé{filteredReviews.length > 1 ? 's' : ''}
      </div>

      {/* Tableau desktop / Cards mobile */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b-2 border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Produit</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Commande</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Note</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Commentaire</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Statut</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredReviews.map((review) => (
              <tr key={review.id} className={review.is_deleted ? 'bg-red-50' : 'hover:bg-gray-50'}>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {new Date(review.created_at).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-gray-900">
                    {review.products?.name || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {review.products?.slug || review.product_id}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-900">
                    {review.orders?.reference || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {review.orders?.status || ''}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                    {review.rating} ⭐
                  </span>
                </td>
                <td className="px-4 py-3 max-w-xs">
                  {review.comment ? (
                    <div className="text-sm text-gray-700 truncate" title={review.comment}>
                      {review.comment.length > 100
                        ? `${review.comment.slice(0, 100)}...`
                        : review.comment}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 italic">Pas de commentaire</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {review.is_deleted ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                      Supprimé
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                      Actif
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {!review.is_deleted && (
                    <button
                      onClick={() => setDeleteModalId(review.id)}
                      className="text-sm text-red-600 hover:text-red-800 font-medium transition"
                    >
                      Supprimer
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards mobile */}
      <div className="md:hidden space-y-4">
        {filteredReviews.map((review) => (
          <div
            key={review.id}
            className={`border rounded-lg p-4 ${
              review.is_deleted ? 'bg-red-50 border-red-200' : 'border-gray-200'
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="font-semibold text-gray-900">
                  {review.products?.name || 'N/A'}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(review.created_at).toLocaleDateString('fr-FR')}
                </div>
              </div>
              <div className="flex gap-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                  {review.rating} ⭐
                </span>
                {review.is_deleted ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                    Supprimé
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                    Actif
                  </span>
                )}
              </div>
            </div>

            <div className="text-sm text-gray-600 mb-2">
              <strong>Commande :</strong> {review.orders?.reference || 'N/A'}
            </div>

            {review.comment && (
              <div className="text-sm text-gray-700 mb-3">
                {review.comment.length > 150
                  ? `${review.comment.slice(0, 150)}...`
                  : review.comment}
              </div>
            )}

            {!review.is_deleted && (
              <button
                onClick={() => setDeleteModalId(review.id)}
                className="w-full mt-2 px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
              >
                Supprimer
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Empty state */}
      {filteredReviews.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">📭</div>
          <p className="text-lg font-medium">Aucun avis trouvé</p>
          <p className="text-sm">Essayez de modifier vos filtres de recherche</p>
        </div>
      )}
    </div>
  );
}
