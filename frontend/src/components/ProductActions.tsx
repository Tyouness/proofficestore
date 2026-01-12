"use client";
import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';

interface ProductActionsProps {
  productId: string;
  productName: string;
  basePrice: number;
}

export default function ProductActions({ productId, productName, basePrice }: ProductActionsProps) {
  const { addToCart } = useCart();
  const [format, setFormat] = useState<'digital' | 'dvd' | 'usb'>('digital');

  const getPrice = () => {
    if (format === 'usb') return basePrice + 15;
    if (format === 'dvd') return basePrice + 10;
    return basePrice;
  };

  const handleAddToCart = () => {
    const finalPrice = getPrice();
    addToCart({
      id: productId,
      title: productName,
      price: finalPrice,
      format: format
    });
    
    toast.success(`${productName} ajouté au panier`, {
      description: `Format: ${format.toUpperCase()} - ${finalPrice.toFixed(2)} €`,
      duration: 3000,
    });
  };

  const formats = [
    { value: 'digital' as const, label: '🚀 Digital', extra: 0 },
    { value: 'dvd' as const, label: '💿 DVD', extra: 10 },
    { value: 'usb' as const, label: '💾 USB', extra: 15 },
  ];

  return (
    <div className="space-y-8">
      {/* Prix */}
      <div>
        <p className="text-4xl font-bold text-gray-900">
          {getPrice().toFixed(2)} €
        </p>
        {format !== 'digital' && (
          <p className="mt-2 text-sm text-gray-500">
            +{format === 'usb' ? '15' : '10'}€ pour le support physique
          </p>
        )}
      </div>

      {/* Sélection du format */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Choisir le format de livraison
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {formats.map((f) => (
            <button
              key={f.value}
              onClick={() => setFormat(f.value)}
              className={`
                py-4 px-3 text-sm font-medium rounded-2xl border-2 
                transition-all duration-300 uppercase
                ${format === f.value 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105' 
                  : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:shadow-md'
                }
              `}
            >
              <span className="block">{f.label}</span>
            </button>
          ))}
        </div>
      </div>

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
