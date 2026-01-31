"use client";
import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
import { createStockRequest } from '@/actions/stock-request';
import { useLocale } from 'next-intl';
import { getCurrencyFromLocale, getFormattedFinalPrice, type ProductWithPrices } from '@/lib/currency';

interface ProductActionsProps {
  productId: string;
  productName: string;
  product: ProductWithPrices;
  inventory?: number;
  currentFormat?: 'digital' | 'dvd' | 'usb';
}

export default function ProductActions({ 
  productId, 
  productName, 
  product,
  inventory = 999,
  currentFormat = 'digital' 
}: ProductActionsProps) {
  const { addToCart } = useCart();
  const locale = useLocale();
  
  // État pour le formulaire de demande de stock
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [stockRequestEmail, setStockRequestEmail] = useState('');
  const [stockRequestQuantity, setStockRequestQuantity] = useState(1);

  const isInStock = inventory > 0;
  
  // Récupérer la currency selon la locale et formater les prix
  const currency = getCurrencyFromLocale(locale);
  const { formattedNormalPrice, formattedSalePrice, discountPercentage, hasDiscount, promoLabel, finalPrice } = getFormattedFinalPrice(product, currency);

  const handleAddToCart = () => {
    addToCart({
      id: productId,
      title: productName,
      price: finalPrice,
      format: currentFormat
    });
    
    toast.success(`${productName} ajouté au panier`, {
      description: hasDiscount ? formattedSalePrice : formattedNormalPrice,
      duration: 3000,
    });
  };

  const handleStockRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingRequest(true);

    try {
      const formData = new FormData();
      formData.append('productId', productId);
      formData.append('email', stockRequestEmail);
      formData.append('quantity', stockRequestQuantity.toString());
      formData.append('contact', ''); // Honeypot - doit rester vide

      const result = await createStockRequest(formData);

      if (result.success) {
        toast.success('Demande enregistrée !', {
          description: result.message,
          duration: 5000,
        });
        // Réinitialiser le formulaire
        setStockRequestEmail('');
        setStockRequestQuantity(1);
      } else {
        toast.error('Erreur', {
          description: result.message,
          duration: 4000,
        });
      }
    } catch (error) {
      toast.error('Erreur', {
        description: 'Une erreur est survenue. Veuillez réessayer.',
      });
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Badge de stock */}
      {!isInStock && (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⏳</span>
            <div>
              <p className="font-semibold text-orange-900">Indisponibilité temporaire</p>
              <p className="text-sm text-orange-700">Nous vérifions le stock disponible</p>
            </div>
          </div>
        </div>
      )}

      {/* Prix avec affichage promotion */}
      <div>
        {hasDiscount ? (
          <div>
            <div className="flex items-center gap-3">
              <p className="text-4xl font-bold text-green-600">
                {formattedSalePrice}
              </p>
              <span className="bg-red-500 text-white px-3 py-1 rounded-lg font-bold text-sm">
                {promoLabel || `-${discountPercentage}%`}
              </span>
            </div>
            <p className="mt-1 text-xl text-gray-500 line-through">
              {formattedNormalPrice}
            </p>
          </div>
        ) : (
          <p className="text-4xl font-bold text-gray-900">
            {formattedNormalPrice}
          </p>
        )}
      </div>

      {isInStock ? (
        <>
          {/* Bouton d'ajout au panier */}
          <button 
            onClick={handleAddToCart}
            className="
              w-full bg-blue-600 text-white py-5 rounded-3xl 
              font-bold text-lg
              hover:bg-blue-700 hover:shadow-xl
              transition-all duration-300
              transform hover:scale-[1.02]
              active:scale-[0.98]
            "
          >
            Ajouter au panier
          </button>
        </>
      ) : (
        <>
          {/* Formulaire de demande de stock - Mode rupture */}
          <div className="bg-white border-2 border-blue-200 rounded-2xl p-6 space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Vérifier la disponibilité
              </h3>
              <p className="text-sm text-gray-600">
                Un conseiller vérifie le stock et vous répond par mail <strong>sous 1h</strong>
              </p>
            </div>

            <form onSubmit={handleStockRequest} className="space-y-4">
              {/* Honeypot caché (anti-bot) */}
              <input
                type="text"
                name="contact"
                autoComplete="off"
                tabIndex={-1}
                className="absolute opacity-0 pointer-events-none"
                aria-hidden="true"
              />

              {/* Email */}
              <div>
                <label htmlFor="stock-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Votre email *
                </label>
                <input
                  id="stock-email"
                  type="email"
                  required
                  value={stockRequestEmail}
                  onChange={(e) => setStockRequestEmail(e.target.value)}
                  placeholder="votre@email.fr"
                  className="
                    w-full px-4 py-3 rounded-xl border-2 border-gray-200
                    focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                    transition-all duration-200 outline-none
                  "
                />
              </div>

              {/* Quantité */}
              <div>
                <label htmlFor="stock-quantity" className="block text-sm font-medium text-gray-700 mb-2">
                  Quantité souhaitée *
                </label>
                <input
                  id="stock-quantity"
                  type="number"
                  required
                  min="1"
                  max="100"
                  value={stockRequestQuantity}
                  onChange={(e) => setStockRequestQuantity(parseInt(e.target.value) || 1)}
                  className="
                    w-full px-4 py-3 rounded-xl border-2 border-gray-200
                    focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                    transition-all duration-200 outline-none
                  "
                />
              </div>

              {/* Bouton de soumission */}
              <button
                type="submit"
                disabled={isSubmittingRequest}
                className="
                  w-full bg-blue-600 text-white py-4 rounded-2xl 
                  font-bold text-base
                  hover:bg-blue-700 hover:shadow-xl
                  disabled:bg-gray-400 disabled:cursor-not-allowed
                  transition-all duration-300
                  transform hover:scale-[1.02]
                  active:scale-[0.98]
                "
              >
                {isSubmittingRequest ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Envoi en cours...
                  </span>
                ) : (
                  <>✉️ Vérifier la disponibilité sous 1h</>
                )}
              </button>
            </form>

            <p className="text-xs text-gray-500 text-center">
              📞 Besoin d&apos;aide immédiate ? Contactez-nous au <strong>01 23 45 67 89</strong>
            </p>
          </div>
        </>
      )}

      {/* Garanties */}
      <div className="pt-6 border-t border-gray-200">
        <ul className="space-y-3 text-sm text-gray-600">
          <li className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <span>Livraison instantanée par email</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <span>Licence authentique Microsoft</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <span>Support client 24/7</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
