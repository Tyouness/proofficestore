"use client";

/**
 * Page Checkout - UI UNIQUEMENT (aucune logique métier)
 * 
 * ⚠️ RÈGLES STRICTES :
 * - Affichage du panier depuis CartContext
 * - Collecte de l'email utilisateur
 * - Appel de la Server Action uniquement
 * - AUCUN calcul de prix côté client
 * - AUCUN accès direct à Supabase
 * - AUCUNE logique Stripe côté client
 * 
 * DESIGN :
 * - Style Apple-like minimaliste
 * - Police Geist
 * - Boutons rounded-3xl
 * - Bouton noir avec spinner durant le chargement
 */

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { createStripeCheckoutSession } from '@/actions/checkout';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, isLoaded } = useCart();
  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // ──────────────────────────────────────────────
  // Détection de l'utilisateur connecté
  // ──────────────────────────────────────────────
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          setEmail(session.user.email);
          setIsAuthenticated(true);
        }
      } catch (error) {
        // Silencieux - l'utilisateur peut continuer sans être connecté
      } finally {
        setIsAuthChecking(false);
      }
    }
    checkAuth();
  }, []);

  // ──────────────────────────────────────────────
  // Protection de route : redirection si panier vide
  // ──────────────────────────────────────────────
  useEffect(() => {
    if (isLoaded && items.length === 0) {
      toast.error('Votre panier est vide');
      router.push('/cart');
    }
  }, [isLoaded, items.length, router]);

  /**
   * Gestion de la soumission du formulaire
   * Appelle uniquement la Server Action
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validation basique côté client (UX uniquement)
    if (!email.trim()) {
      toast.error('Veuillez saisir votre adresse email');
      return;
    }

    if (items.length === 0) {
      toast.error('Votre panier est vide');
      return;
    }

    setIsProcessing(true);

    try {
      // Appel de la Server Action (qui fait TOUTE la logique)
      const result = await createStripeCheckoutSession({
        items: items.map(item => ({
          productId: item.id,
          variant: item.format as 'digital' | 'dvd' | 'usb',
          quantity: item.quantity,
        })),
        email: email.trim(),
      });

      if (!result.success) {
        toast.error(result.error || 'Une erreur est survenue');
        setIsProcessing(false);
        return;
      }

      // Redirection vers Stripe Checkout
      if (result.sessionUrl) {
        toast.success('Redirection vers le paiement sécurisé...');
        window.location.href = result.sessionUrl;
      } else {
        toast.error('URL de paiement manquante');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('[CHECKOUT UI] Erreur:', error);
      toast.error('Erreur lors de la création de la session de paiement');
      setIsProcessing(false);
    }
  };

  // ──────────────────────────────────────────────
  // État : Panier vide
  // ──────────────────────────────────────────────
  if (!isLoaded || items.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-gray-200 border-t-black rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────
  // État : Formulaire de paiement
  // ──────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">
        Finaliser votre commande
      </h1>
      <p className="text-gray-600 mb-12">
        Paiement 100% sécurisé par Stripe
      </p>

      <div className="grid lg:grid-cols-5 gap-12">
        {/* ──────────────────────────────────────────
            COLONNE GAUCHE : Formulaire
        ────────────────────────────────────────── */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Email */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-semibold text-gray-900 mb-3"
              >
                Adresse email *
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="votre@email.com"
                  disabled={isProcessing || isAuthenticated}
                  readOnly={isAuthenticated}
                  className="
                    w-full px-5 py-4 
                    border-2 border-gray-200 
                    rounded-2xl
                    focus:border-black focus:outline-none
                    transition-colors
                    text-gray-900
                    disabled:bg-gray-50 disabled:cursor-not-allowed
                    read-only:bg-green-50 read-only:border-green-300
                  "
                />
                {isAuthenticated && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <span className="text-green-600 text-sm font-medium flex items-center gap-1">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Connecté
                    </span>
                  </div>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-500">
                {isAuthenticated 
                  ? 'Email de votre compte - La clé sera envoyée ici'
                  : 'Votre clé de licence sera envoyée à cette adresse'
                }
              </p>
            </div>

            {/* Bouton de paiement */}
            <button
              type="submit"
              disabled={isProcessing}
              className="
                w-full bg-black text-white py-5 rounded-3xl 
                font-bold text-lg
                hover:bg-gray-800 hover:shadow-2xl
                transition-all duration-300
                disabled:bg-gray-400 disabled:cursor-not-allowed
                flex items-center justify-center gap-3
              "
            >
              {isProcessing ? (
                <>
                  <svg 
                    className="animate-spin h-6 w-6 text-white" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24"
                  >
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    />
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Redirection en cours...</span>
                </>
              ) : (
                'Procéder au paiement'
              )}
            </button>

            {/* Garanties */}
            <div className="flex items-center gap-3 text-sm text-gray-500 pt-4 border-t border-gray-200">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span>Paiement sécurisé SSL. Aucune donnée bancaire n'est stockée sur nos serveurs.</span>
            </div>
          </form>
        </div>

        {/* ──────────────────────────────────────────
            COLONNE DROITE : Résumé commande
        ────────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <div className="bg-gray-50 rounded-3xl p-8 sticky top-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Résumé
            </h2>

            {/* Liste des produits */}
            <div className="space-y-4 mb-6">
              {items.map((item) => (
                <div 
                  key={`${item.id}-${item.format}`} 
                  className="flex justify-between items-start gap-4 pb-4 border-b border-gray-200 last:border-0"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Format : {item.format.toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-500">
                      Quantité : {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900 text-sm">
                    {(item.price * item.quantity).toFixed(2)} €
                  </p>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="border-t border-gray-300 pt-6">
              <div className="flex justify-between items-center text-xl font-bold">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">
                  {totalPrice.toFixed(2)} €
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                TVA incluse
              </p>
            </div>

            {/* Garanties */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 flex-shrink-0">✓</span>
                  <span>Livraison instantanée par email</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 flex-shrink-0">✓</span>
                  <span>Licence authentique Microsoft</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 flex-shrink-0">✓</span>
                  <span>Support client 24/7</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 flex-shrink-0">✓</span>
                  <span>Garantie satisfait ou remboursé 30 jours</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
