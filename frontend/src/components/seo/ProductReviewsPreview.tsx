interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface ProductReviewsPreviewProps {
  reviews?: Review[];
  averageRating?: number;
  reviewCount?: number;
  productSlug: string;
}

export default function ProductReviewsPreview({ 
  reviews, 
  averageRating, 
  reviewCount,
  productSlug 
}: ProductReviewsPreviewProps) {
  const hasReviews = reviews && reviews.length > 0;

  if (!hasReviews) {
    return (
      <div className="my-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-xl font-bold text-gray-900 mb-3">Avis Clients Vérifiés</h3>
        <p className="text-gray-700 mb-4">
          Soyez le premier à partager votre expérience avec ce produit après votre achat.
        </p>
        <p className="text-sm text-gray-600">
          Seuls les clients ayant acheté ce produit peuvent laisser un avis.
        </p>
      </div>
    );
  }

  const displayedReviews = reviews.slice(0, 3);

  return (
    <div className="my-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Avis Clients Vérifiés</h2>
        {averageRating && reviewCount && (
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-yellow-50 px-4 py-2 rounded-lg border border-yellow-200">
              <span className="text-2xl font-bold text-yellow-600">{averageRating.toFixed(1)}</span>
              <span className="text-gray-600 ml-2">/5</span>
            </div>
            <span className="text-gray-600 text-sm">{reviewCount} avis</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {displayedReviews.map((review) => (
          <div key={review.id} className="bg-white p-5 rounded-lg border border-gray-200">
            <div className="flex items-center mb-2">
              {/* Étoiles */}
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-5 h-5 ${
                      i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="ml-3 text-sm text-gray-500">
                {new Date(review.created_at).toLocaleDateString('fr-FR')}
              </span>
            </div>
            {review.comment && (
              <p className="text-gray-700 mt-2 leading-relaxed">{review.comment}</p>
            )}
            <p className="text-sm text-gray-500 mt-3">
              <strong>Client vérifié</strong>
            </p>
          </div>
        ))}
      </div>

      {reviews.length > 3 && (
        <div className="mt-6 text-center">
          <a
            href={`/produit/${productSlug}#avis`}
            className="inline-block px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
            Voir tous les {reviewCount} avis
          </a>
        </div>
      )}
    </div>
  );
}
