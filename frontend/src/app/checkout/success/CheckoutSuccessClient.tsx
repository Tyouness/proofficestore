"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

type OrderStatus = 'pending' | 'paid' | 'canceled';

export default function CheckoutSuccessClient() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();

  const [status, setStatus] = useState<OrderStatus>('pending');
  const [isVerifying, setIsVerifying] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      console.error('[SUCCESS] ❌ session_id manquant dans l\'URL');
      setErrorMessage('Identifiant de session manquant');
      setIsVerifying(false);
      return;
    }

    console.log('[SUCCESS] 🔍 Démarrage du polling pour session:', sessionId);

    let attempts = 0;
    const maxAttempts = 5; // 5 tentatives × 2s = 10s max
    const pollInterval = 2000; // 2 secondes

    const checkOrderStatus = async () => {
      try {
        console.log(`[SUCCESS] 📊 Tentative ${attempts + 1}/${maxAttempts}`);

        const response = await fetch(`/api/orders/status?session_id=${sessionId}`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log('[SUCCESS] 📦 Réponse:', data);

        if (data.status === 'paid') {
          console.log('[SUCCESS] ✅ Paiement confirmé !');
          setStatus('paid');
          setOrderId(data.order_id); // Stocker l'ID de la commande
          setIsVerifying(false);
          
          // ⚠️ Vider le panier UNIQUEMENT si paiement confirmé
          clearCart();
          return true; // Stop polling
        }

        if (data.status === 'canceled') {
          console.log('[SUCCESS] ❌ Paiement annulé');
          setStatus('canceled');
          setIsVerifying(false);
          return true; // Stop polling
        }

        // Status toujours 'pending'
        console.log('[SUCCESS] ⏳ Status toujours pending, retry...');
        return false; // Continue polling

      } catch (error) {
        console.error('[SUCCESS] ❌ Erreur lors de la vérification:', error);
        
        // En cas d'erreur, continuer à essayer
        if (attempts >= maxAttempts - 1) {
          setErrorMessage('Impossible de vérifier le paiement pour le moment');
          setIsVerifying(false);
          return true; // Stop polling
        }
        return false; // Retry
      }
    };

    // Polling toutes les 2 secondes
    const intervalId = setInterval(async () => {
      attempts++;
      
      const shouldStop = await checkOrderStatus();
      
      if (shouldStop || attempts >= maxAttempts) {
        clearInterval(intervalId);
        
        if (attempts >= maxAttempts && status === 'pending') {
          console.log('[SUCCESS] ⏰ Timeout atteint, paiement toujours en attente');
          setIsVerifying(false);
        }
      }
    }, pollInterval);

    // Premier check immédiat
    checkOrderStatus().then((shouldStop) => {
      if (shouldStop) {
        clearInterval(intervalId);
      }
    });

    // Cleanup
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ──────────────────────────────────────────────
  // FONCTION : Télécharger la preuve d'achat PDF
  // ──────────────────────────────────────────────
  const handleDownloadProof = async () => {
    if (!orderId) return;

    setIsDownloadingPdf(true);
    try {
      const response = await fetch(`/api/documents/proof-of-purchase/${orderId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || 'Impossible de générer la preuve d\'achat');
        return;
      }

      // Récupérer le blob PDF
      const blob = await response.blob();
      
      // Créer un lien de téléchargement temporaire
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `preuve-achat-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error('[PDF Download Error]', error);
      alert('Erreur lors du téléchargement. Veuillez réessayer.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // ──────────────────────────────────────────────
  // ÉTAT : Vérification en cours
  // ──────────────────────────────────────────────
  if (isVerifying) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-2xl">
          {/* Spinner */}
          <div className="mb-8 inline-flex items-center justify-center w-24 h-24">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
          </div>

          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Vérification du paiement...
          </h1>
          <p className="text-gray-600">
            Nous confirmons votre transaction auprès de notre serveur sécurisé.
          </p>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────
  // ÉTAT : Erreur
  // ──────────────────────────────────────────────
  if (errorMessage) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-2xl">
          <div className="mb-8 inline-flex items-center justify-center w-24 h-24 bg-red-100 rounded-full">
            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Erreur
          </h1>
          <p className="text-gray-600 mb-8">{errorMessage}</p>

          <Link 
            href="/"
            className="inline-block px-8 py-4 bg-black text-white rounded-3xl font-semibold hover:bg-gray-800 transition-all"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────
  // ÉTAT : Paiement confirmé (paid)
  // ──────────────────────────────────────────────
  if (status === 'paid') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-2xl">
          {/* Icône de succès */}
          <div className="mb-8 inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full">
            <svg 
              className="w-12 h-12 text-green-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 13l4 4L19 7" 
              />
            </svg>
          </div>

          {/* Titre */}
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Paiement confirmé !
          </h1>

          {/* Message */}
          <div className="space-y-4 text-gray-600 mb-8">
            <p className="text-lg">
              Votre commande a été traitée avec succès.
            </p>
            <p>
              Vous allez recevoir votre clé de licence par email dans quelques instants.
            </p>
            <p className="text-sm">
              Pensez à vérifier vos spams si vous ne recevez rien dans les prochaines minutes.
            </p>
          </div>

          {/* Informations supplémentaires */}
          <div className="bg-blue-50 rounded-3xl p-8 mb-8 text-left">
            <h2 className="font-bold text-gray-900 mb-4 text-lg">
              Prochaines étapes
            </h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">1.</span>
                <span>Vérifiez votre boîte email pour recevoir votre clé d'activation</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">2.</span>
                <span>Suivez les instructions d'installation fournies dans l'email</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">3.</span>
                <span>Contactez notre support si vous rencontrez le moindre problème</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* Bouton principal : Télécharger la preuve d'achat */}
            <button
              onClick={handleDownloadProof}
              disabled={isDownloadingPdf || !orderId}
              className="
                inline-flex items-center justify-center gap-2
                px-8 py-4 
                bg-blue-600 text-white 
                rounded-3xl font-semibold
                hover:bg-blue-700 
                disabled:bg-gray-300 disabled:cursor-not-allowed
                transition-all duration-300
                hover:shadow-xl
              "
            >
              {isDownloadingPdf ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Génération...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Télécharger ma preuve d'achat</span>
                </>
              )}
            </button>

            <Link 
              href="/"
              className="
                inline-block px-8 py-4 
                bg-black text-white 
                rounded-3xl font-semibold
                hover:bg-gray-800 
                transition-all duration-300
                hover:shadow-xl
              "
            >
              Retour à l'accueil
            </Link>
            <a 
              href="mailto:support@allkeymasters.com"
              className="
                inline-block px-8 py-4 
                bg-white text-gray-900
                border-2 border-gray-200
                rounded-3xl font-semibold
                hover:border-gray-300 hover:shadow-lg
                transition-all duration-300
              "
            >
              Contacter le support
            </a>
          </div>

          {/* Note de sécurité */}
          <p className="mt-8 text-sm text-gray-500">
            Un email de confirmation contenant tous les détails de votre commande 
            vous a également été envoyé.
          </p>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────
  // ÉTAT : Timeout (paiement toujours 'pending')
  // ──────────────────────────────────────────────
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        <div className="mb-8 inline-flex items-center justify-center w-24 h-24 bg-yellow-100 rounded-full">
          <svg className="w-12 h-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
          Paiement en cours de traitement
        </h1>

        <div className="space-y-4 text-gray-600 mb-8">
          <p className="text-lg">
            Votre paiement est en cours de vérification.
          </p>
          <p>
            Vous recevrez un email de confirmation dès que votre transaction sera validée (généralement sous quelques minutes).
          </p>
        </div>

        <div className="bg-yellow-50 rounded-3xl p-8 mb-8 text-left">
          <h2 className="font-bold text-gray-900 mb-4">
            Que faire maintenant ?
          </h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <span>✓</span>
              <span>Surveillez votre boîte email (et vos spams)</span>
            </li>
            <li className="flex items-start gap-3">
              <span>✓</span>
              <span>Votre clé vous sera envoyée dès validation du paiement</span>
            </li>
            <li className="flex items-start gap-3">
              <span>✓</span>
              <span>En cas de problème, contactez notre support avec votre numéro de commande</span>
            </li>
          </ul>
        </div>

        <Link 
          href="/"
          className="inline-block px-8 py-4 bg-black text-white rounded-3xl font-semibold hover:bg-gray-800 transition-all"
        >
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
