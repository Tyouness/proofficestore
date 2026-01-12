"use client";

/**
 * Page Panier - UI Apple-like Premium
 * 
 * RÈGLES :
 * - Affichage uniquement (pas de logique métier)
 * - Pas d'appel Stripe ou Supabase
 * - Calculs pour UI seulement
 * - Design minimaliste inspiré Apple
 */

import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';

export default function CartPage() {
  const router = useRouter();
  const { items, totalPrice, updateQuantity, removeFromCart, isLoaded } = useCart();

  const handleQuantityChange = (id: string, format: string, newQuantity: number) => {
    if (newQuantity < 1 || newQuantity > 100) {
      toast.error('La quantité doit être entre 1 et 100');
      return;
    }
    updateQuantity(id, format, newQuantity);
  };

  const handleRemove = (id: string, format: string, title: string) => {
    removeFromCart(id, format);
    toast.success(`${title} retiré du panier`);
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error('Votre panier est vide');
      return;
    }
    router.push('/checkout');
  };

  // Loading state pendant chargement localStorage
  if (!isLoaded) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-gray-200 border-t-black rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Chargement du panier...</p>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────
  // État : Panier vide
  // ──────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-7xl mb-6">🛒</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Votre panier est vide
          </h1>
          <p className="text-gray-600 mb-8">
            Découvrez nos licences Microsoft authentiques et ajoutez-les à votre panier
          </p>
          <button
            onClick={() => router.push('/')}
            className="
              inline-block px-8 py-4 
              bg-black text-white 
              rounded-3xl font-semibold text-lg
              hover:bg-gray-800 
              transition-all duration-300
              hover:shadow-xl
            "
          >
            Découvrir nos produits
          </button>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────
  // État : Panier avec items
  // ──────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Votre panier
        </h1>
        <p className="text-gray-600">
          {items.length} article{items.length > 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-12">
        {/* ──────────────────────────────────────────
            COLONNE GAUCHE : Liste des articles
        ────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {items.map((item) => (
            <div 
              key={`${item.id}-${item.format}`}
              className="
                bg-white border-2 border-gray-200 
                rounded-3xl p-6
                hover:border-gray-300 hover:shadow-lg
                transition-all duration-300
              "
            >
              <div className="flex items-start gap-6">
                {/* Image placeholder */}
                <div className="flex-shrink-0 w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                  <span className="text-3xl">🔑</span>
                </div>

                {/* Infos produit */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Format : <span className="font-semibold">{item.format.toUpperCase()}</span>
                  </p>

                  {/* Contrôles quantité */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleQuantityChange(item.id, item.format, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="
                          w-10 h-10 rounded-full bg-gray-100 
                          hover:bg-gray-200 disabled:bg-gray-50
                          flex items-center justify-center
                          transition-colors
                          disabled:cursor-not-allowed disabled:opacity-50
                        "
                        aria-label="Diminuer la quantité"
                      >
                        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>

                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={item.quantity}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (!isNaN(value)) {
                            handleQuantityChange(item.id, item.format, value);
                          }
                        }}
                        className="
                          w-16 text-center font-semibold text-gray-900
                          border-2 border-gray-200 rounded-xl
                          focus:border-black focus:outline-none
                          py-2
                        "
                      />

                      <button
                        onClick={() => handleQuantityChange(item.id, item.format, item.quantity + 1)}
                        disabled={item.quantity >= 100}
                        className="
                          w-10 h-10 rounded-full bg-gray-100 
                          hover:bg-gray-200 disabled:bg-gray-50
                          flex items-center justify-center
                          transition-colors
                          disabled:cursor-not-allowed disabled:opacity-50
                        "
                        aria-label="Augmenter la quantité"
                      >
                        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>

                    {/* Bouton supprimer */}
                    <button
                      onClick={() => handleRemove(item.id, item.format, item.title)}
                      className="
                        ml-auto text-red-600 hover:text-red-700
                        font-medium text-sm
                        flex items-center gap-2
                        transition-colors
                      "
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Supprimer
                    </button>
                  </div>
                </div>

                {/* Prix */}
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    {(item.price * item.quantity).toFixed(2)} €
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {item.price.toFixed(2)} € × {item.quantity}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ──────────────────────────────────────────
            COLONNE DROITE : Résumé et CTA
        ────────────────────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-3xl p-8 sticky top-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Résumé
            </h2>

            {/* Sous-total */}
            <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
              <div className="flex justify-between text-gray-700">
                <span>Sous-total</span>
                <span className="font-semibold">{totalPrice.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>TVA incluse</span>
                <span>—</span>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center mb-8 pb-8 border-b border-gray-200">
              <span className="text-xl font-bold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-gray-900">
                {totalPrice.toFixed(2)} €
              </span>
            </div>

            {/* CTA Paiement */}
            <button
              onClick={handleCheckout}
              className="
                w-full bg-black text-white py-5 rounded-3xl 
                font-bold text-lg
                hover:bg-gray-800 hover:shadow-2xl
                transition-all duration-300
                mb-4
              "
            >
              Passer au paiement
            </button>

            {/* Lien continuer achats */}
            <button
              onClick={() => router.push('/')}
              className="
                w-full text-gray-700 py-4
                font-semibold text-sm
                hover:text-gray-900
                transition-colors
              "
            >
              Continuer mes achats
            </button>

            {/* Garanties */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 flex-shrink-0">✓</span>
                  <span>Paiement 100% sécurisé</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 flex-shrink-0">✓</span>
                  <span>Livraison instantanée</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 flex-shrink-0">✓</span>
                  <span>Licence authentique Microsoft</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 flex-shrink-0">✓</span>
                  <span>Support 24/7</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
