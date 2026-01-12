/**
 * Page de succès après paiement Stripe
 * 
 * WORKFLOW :
 * 1. Récupère session_id depuis l'URL
 * 2. Polling de /api/orders/status toutes les 2s (max 10s)
 * 3. Si status = 'paid' → clearCart() et afficher succès
 * 4. Si timeout → afficher message de vérification différée
 * 
 * ⚠️ NE VIDE LE PANIER QUE SI PAIEMENT CONFIRMÉ CÔTÉ SERVEUR
 */

import { Suspense } from 'react';
import CheckoutSuccessClient from './CheckoutSuccessClient';

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center px-4">
          <div className="text-center max-w-2xl">
            <div className="mb-8 inline-flex items-center justify-center w-24 h-24">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Chargement...
            </h1>
          </div>
        </div>
      }
    >
      <CheckoutSuccessClient />
    </Suspense>
  );
}
