'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useState } from 'react';
import { toast } from 'sonner';

export default function CheckoutCancelPage() {
  const router = useRouter();
  const { items } = useCart();
  const [isResuming, setIsResuming] = useState(false);

  /**
   * Reprendre le paiement en réutilisant la session existante
   */
  const handleResumePayment = async () => {
    if (items.length === 0) {
      toast.error('Votre panier est vide');
      router.push('/cart');
      return;
    }

    setIsResuming(true);

    try {
      // Appeler l'API de reprise
      const response = await fetch('/api/checkout/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.id,
            variant: item.format as 'digital' | 'dvd' | 'usb',
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json();

      if (data.success && data.sessionUrl) {
        // Rediriger vers la session Stripe existante
        console.log('[CANCEL] ✅ Session réutilisée, redirection');
        window.location.href = data.sessionUrl;
        return;
      }

      // Si shouldRetry = true, créer une nouvelle session
      if (data.shouldRetry) {
        console.log('[CANCEL] 🔄 Session expirée, redirection vers nouveau checkout');
        toast.info('Création d\'une nouvelle session de paiement...');
        window.location.href = '/checkout';
        return;
      }

      // Erreur inattendue
      toast.error(data.error || 'Impossible de reprendre le paiement');
      setIsResuming(false);

    } catch (error) {
      console.error('[CANCEL] ❌ Erreur:', error);
      toast.error('Une erreur est survenue');
      setIsResuming(false);
    }
  };

  const handleReturnToCart = () => {
    router.push('/cart');
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-xl">
        {/* Icône */}
        <div className="mb-8 inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full">
          <svg 
            className="w-12 h-12 text-gray-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M6 18L18 6M6 6l12 12" 
            />
          </svg>
        </div>

        {/* Titre */}
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          Paiement annulé
        </h1>

        {/* Message */}
        <div className="space-y-4 text-gray-600 mb-8">
          <p className="text-lg">
            Vous avez annulé le processus de paiement.
          </p>
          <p>
            Aucun montant n'a été débité de votre compte.
          </p>
        </div>

        {/* Informations */}
        <div className="bg-gray-50 rounded-3xl p-6 mb-8">
          <p className="text-gray-700">
            Vos produits sont toujours dans votre panier. 
            Vous pouvez finaliser votre commande à tout moment.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={handleResumePayment}
            disabled={isResuming}
            className="
              inline-block px-8 py-4 
              bg-black text-white 
              rounded-3xl font-semibold
              hover:bg-gray-800 
              transition-all duration-300
              hover:shadow-xl
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center gap-2
            "
          >
            {isResuming ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                    fill="none"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Chargement...</span>
              </>
            ) : (
              'Reprendre le paiement'
            )}
          </button>
          
          <button
            onClick={handleReturnToCart}
            disabled={isResuming}
            className="
              inline-block px-8 py-4 
              bg-white text-gray-900
              border-2 border-gray-200
              rounded-3xl font-semibold
              hover:border-gray-300 hover:shadow-lg
              transition-all duration-300
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            Retour au panier
          </button>
          
          <Link 
            href="/"
            className="
              inline-block px-8 py-4 
              bg-white text-gray-900
              border-2 border-gray-200
              rounded-3xl font-semibold
              hover:border-gray-300 hover:shadow-lg
              transition-all duration-300
            "
          >
            Retour à l'accueil
          </Link>
        </div>

        {/* Support */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-3">
            Une question ou un problème ?
          </p>
          <a 
            href="mailto:support@allkeymasters.com"
            className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
          >
            Contactez notre support client
          </a>
        </div>
      </div>
    </div>
  );
}
