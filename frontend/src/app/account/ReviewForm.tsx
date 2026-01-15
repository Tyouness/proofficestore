'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

interface ReviewFormProps {
  orderId: string;
  productId: string;
  productName: string;
  existingReview?: {
    rating: number;
    comment: string;
    created_at: string;
  } | null;
}

export default function ReviewForm({
  orderId,
  productId,
  productName,
  existingReview,
}: ReviewFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Veuillez sélectionner une note');
      return;
    }

    setIsSubmitting(true);
    setError('');

    // Log de debug (sans données sensibles)
    console.log('[Review Submit] Starting', { 
      product_id: productId, 
      order_id: orderId, 
      rating,
      has_comment: !!comment.trim()
    });

    try {
      const { data, error: insertError } = await supabase
        .from('reviews')
        .insert({
          product_id: productId,
          order_id: orderId,
          rating,
          comment: comment.trim() || null,
        })
        .select();

      if (insertError) {
        // Log technique (pas affiché à l'utilisateur)
        console.error('[Review Submit] Insert failed', {
          code: insertError.code,
          message: insertError.message,
          hint: insertError.hint,
        });

        // Messages user-friendly basés sur le code d'erreur
        if (insertError.code === '23505') {
          // Contrainte unique violée
          setError('Vous avez déjà laissé un avis pour cette commande.');
        } else if (insertError.code === '42501' || insertError.message?.includes('policy')) {
          // Erreur RLS / unauthorized
          setError('Vous devez avoir acheté ce produit pour laisser un avis.');
        } else if (insertError.code === '23503') {
          // Foreign key violation
          setError('Produit ou commande invalide. Contactez le support.');
        } else {
          // Erreur générique
          setError('Une erreur est survenue. Réessayez dans quelques instants.');
        }
      } else {
        // Succès
        console.log('[Review Submit] Success', { review_id: data?.[0]?.id });
        setSuccess(true);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (err) {
      // Erreur réseau ou autre erreur non Supabase
      console.error('[Review Submit] Unexpected error', err);
      setError('Une erreur est survenue. Vérifiez votre connexion et réessayez.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Si avis déjà envoyé
  if (existingReview) {
    return (
      <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <p className="font-semibold text-green-900 mb-2">
              ✓ Merci, votre avis a été envoyé !
            </p>
            <div className="flex items-center mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`w-5 h-5 ${star <= existingReview.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            {existingReview.comment && (
              <p className="text-sm text-gray-700 italic">"{existingReview.comment}"</p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Posté le {new Date(existingReview.created_at).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Formulaire d'avis
  return (
    <div className="mt-4">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          Noter ce produit
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Votre note pour "{productName}" *
            </label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:outline-none transition transform hover:scale-110"
                >
                  <svg
                    className={`w-8 h-8 ${
                      star <= (hoveredRating || rating)
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
              <span className="ml-2 text-sm font-medium text-gray-700">
                {rating > 0 && `${rating}/5`}
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
              Votre commentaire (optionnel)
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder="Partagez votre expérience avec ce produit..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">{comment.length}/500 caractères</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-800 text-sm">
              ✓ Avis envoyé avec succès ! Rechargement...
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isSubmitting ? 'Envoi...' : 'Envoyer mon avis'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setRating(0);
                setComment('');
                setError('');
              }}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 transition"
            >
              Annuler
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
