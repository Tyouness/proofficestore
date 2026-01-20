'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type DeliveryFormat = 'digital' | 'dvd' | 'usb';

interface FormatOption {
  value: DeliveryFormat;
  label: string;
  icon: string;
  description: string;
  priceModifier: number; // +0€, +20€, +25€
  badge?: string;
}

const FORMAT_OPTIONS: FormatOption[] = [
  {
    value: 'digital',
    label: 'Clé Numérique',
    icon: '⚡',
    description: 'Livraison instantanée par email',
    priceModifier: 0,
    badge: 'Le moins cher',
  },
  {
    value: 'dvd',
    label: 'DVD',
    icon: '💿',
    description: 'Support physique livré sous 3-5 jours',
    priceModifier: 20,
  },
  {
    value: 'usb',
    label: 'Clé USB',
    icon: '🔌',
    description: 'Support USB bootable livré sous 3-5 jours',
    priceModifier: 25,
    badge: '3x plus rapide',
  },
];

interface FormatSelectorProps {
  currentFormat: DeliveryFormat;
  baseSlug: string;
  basePrice: number;
  className?: string;
}

export default function FormatSelector({
  currentFormat,
  baseSlug,
  basePrice,
  className = '',
}: FormatSelectorProps) {
  const router = useRouter();
  const [isChanging, setIsChanging] = useState(false);

  const handleFormatChange = async (newFormat: DeliveryFormat) => {
    if (newFormat === currentFormat || isChanging) return;

    setIsChanging(true);

    // Générer le nouveau slug selon le format
    let newSlug = baseSlug;
    if (newFormat === 'digital') {
      newSlug = `${baseSlug}-digital-key`;
    } else if (newFormat === 'dvd') {
      newSlug = `${baseSlug}-dvd`;
    } else if (newFormat === 'usb') {
      newSlug = `${baseSlug}-usb`;
    }

    // Naviguer vers la nouvelle URL
    router.push(`/produit/${newSlug}`);
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Choisissez votre format de livraison
      </h3>

      <div className="space-y-3">
        {FORMAT_OPTIONS.map((option) => {
          const isSelected = option.value === currentFormat;
          const finalPrice = basePrice + option.priceModifier;

          return (
            <button
              key={option.value}
              onClick={() => handleFormatChange(option.value)}
              disabled={isChanging}
              className={`
                w-full text-left p-4 rounded-lg border-2 transition-all
                ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50 shadow-sm'
                    : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'
                }
                ${isChanging ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start flex-1">
                  {/* Icône */}
                  <span className="text-2xl mr-3 mt-0.5">{option.icon}</span>

                  {/* Contenu */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-semibold ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                        {option.label}
                      </span>
                      {option.badge && (
                        <span className="text-xs font-medium px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
                          {option.badge}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                      {option.description}
                    </p>
                  </div>
                </div>

                {/* Prix */}
                <div className="text-right ml-4">
                  <div className={`text-lg font-bold ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                    {finalPrice.toFixed(2)} €
                  </div>
                  {option.priceModifier > 0 && (
                    <div className="text-xs text-gray-500">
                      +{option.priceModifier} €
                    </div>
                  )}
                  {option.priceModifier === 0 && (
                    <div className="text-xs text-green-600 font-medium">
                      Prix de base
                    </div>
                  )}
                </div>

                {/* Radio indicator */}
                <div className="ml-3 mt-1">
                  <div
                    className={`
                      w-5 h-5 rounded-full border-2 flex items-center justify-center
                      ${isSelected ? 'border-blue-600' : 'border-gray-300'}
                    `}
                  >
                    {isSelected && (
                      <div className="w-3 h-3 rounded-full bg-blue-600" />
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Info supplémentaire */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-start text-sm text-gray-700">
          <svg className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-medium mb-1">Contenu identique</p>
            <p className="text-gray-600">
              Tous les formats incluent la même clé d'activation Microsoft authentique.
              Seul le support de livraison change.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
