'use client';

import { useState, useEffect } from 'react';
import { 
  SUPPORTED_COUNTRIES, 
  getPhonePrefixForCountry,
  type SupportedCountryCode 
} from '@/lib/shipping-validation';

export interface ShippingFormData {
  shipping_name: string;
  shipping_address: string;
  shipping_zip: string;
  shipping_city: string;
  shipping_country: SupportedCountryCode;
  shipping_phone_prefix: string;
  shipping_phone_number: string;
}

interface ShippingAddressFormProps {
  value: ShippingFormData;
  onChange: (data: ShippingFormData) => void;
  errors?: Partial<Record<keyof ShippingFormData, string>>;
}

export default function ShippingAddressForm({ value, onChange, errors = {} }: ShippingAddressFormProps) {
  // Auto-update phone prefix when country changes
  useEffect(() => {
    const newPrefix = getPhonePrefixForCountry(value.shipping_country);
    if (value.shipping_phone_prefix !== newPrefix) {
      onChange({ ...value, shipping_phone_prefix: newPrefix });
    }
  }, [value.shipping_country]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (field: keyof ShippingFormData, newValue: string) => {
    onChange({ ...value, [field]: newValue });
  };

  return (
    <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">📦</span>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Adresse de livraison</h3>
          <p className="text-sm text-gray-600">
            Votre commande contient des produits physiques
          </p>
        </div>
      </div>

      {/* Free shipping badge */}
      <div className="bg-green-100 border-2 border-green-300 rounded-xl p-4">
        <div className="flex items-center gap-2">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <div>
            <p className="font-bold text-green-900">Livraison Standard Gratuite Incluse</p>
            <p className="text-sm text-green-700 mt-1">
              📅 Expédition le jour même si commandé avant 14h (jours ouvrés)
            </p>
            <p className="text-sm text-green-700">
              ⚡ Livraison estimée : 48h (France) / 5–7 jours (International)
            </p>
          </div>
        </div>
      </div>

      {/* Form fields */}
      <div className="grid grid-cols-1 gap-4">
        {/* Name */}
        <div>
          <label htmlFor="shipping_name" className="block text-sm font-semibold text-gray-900 mb-2">
            Nom complet *
          </label>
          <input
            id="shipping_name"
            type="text"
            required
            value={value.shipping_name}
            onChange={(e) => handleChange('shipping_name', e.target.value)}
            placeholder="Jean Dupont"
            className={`
              w-full px-4 py-3 rounded-xl border-2 
              ${errors.shipping_name ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'}
              focus:border-blue-500 focus:ring-2 focus:ring-blue-200
              transition-all duration-200 outline-none
            `}
          />
          {errors.shipping_name && (
            <p className="mt-1 text-sm text-red-600">{errors.shipping_name}</p>
          )}
        </div>

        {/* Address */}
        <div>
          <label htmlFor="shipping_address" className="block text-sm font-semibold text-gray-900 mb-2">
            Adresse complète *
          </label>
          <input
            id="shipping_address"
            type="text"
            required
            value={value.shipping_address}
            onChange={(e) => handleChange('shipping_address', e.target.value)}
            placeholder="12 Rue de la Paix, Apt 5B"
            className={`
              w-full px-4 py-3 rounded-xl border-2 
              ${errors.shipping_address ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'}
              focus:border-blue-500 focus:ring-2 focus:ring-blue-200
              transition-all duration-200 outline-none
            `}
          />
          {errors.shipping_address && (
            <p className="mt-1 text-sm text-red-600">{errors.shipping_address}</p>
          )}
        </div>

        {/* City and Zip in 2 columns */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="shipping_city" className="block text-sm font-semibold text-gray-900 mb-2">
              Ville *
            </label>
            <input
              id="shipping_city"
              type="text"
              required
              value={value.shipping_city}
              onChange={(e) => handleChange('shipping_city', e.target.value)}
              placeholder="Paris"
              className={`
                w-full px-4 py-3 rounded-xl border-2 
                ${errors.shipping_city ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'}
                focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                transition-all duration-200 outline-none
              `}
            />
            {errors.shipping_city && (
              <p className="mt-1 text-sm text-red-600">{errors.shipping_city}</p>
            )}
          </div>

          <div>
            <label htmlFor="shipping_zip" className="block text-sm font-semibold text-gray-900 mb-2">
              Code postal *
            </label>
            <input
              id="shipping_zip"
              type="text"
              required
              value={value.shipping_zip}
              onChange={(e) => handleChange('shipping_zip', e.target.value)}
              placeholder="75001"
              className={`
                w-full px-4 py-3 rounded-xl border-2 
                ${errors.shipping_zip ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'}
                focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                transition-all duration-200 outline-none
              `}
            />
            {errors.shipping_zip && (
              <p className="mt-1 text-sm text-red-600">{errors.shipping_zip}</p>
            )}
          </div>
        </div>

        {/* Country */}
        <div>
          <label htmlFor="shipping_country" className="block text-sm font-semibold text-gray-900 mb-2">
            Pays *
          </label>
          <select
            id="shipping_country"
            required
            value={value.shipping_country}
            onChange={(e) => handleChange('shipping_country', e.target.value as SupportedCountryCode)}
            className={`
              w-full px-4 py-3 rounded-xl border-2 
              ${errors.shipping_country ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'}
              focus:border-blue-500 focus:ring-2 focus:ring-blue-200
              transition-all duration-200 outline-none
            `}
          >
            {SUPPORTED_COUNTRIES.map(country => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
          {errors.shipping_country && (
            <p className="mt-1 text-sm text-red-600">{errors.shipping_country}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="shipping_phone" className="block text-sm font-semibold text-gray-900 mb-2">
            Téléphone *
          </label>
          <div className="flex gap-2">
            {/* Phone prefix (readonly, auto-updated) */}
            <input
              type="text"
              readOnly
              value={value.shipping_phone_prefix}
              className="
                w-24 px-4 py-3 rounded-xl border-2 border-gray-300 bg-gray-100
                text-center font-mono text-gray-700
              "
            />
            {/* Phone number */}
            <input
              id="shipping_phone"
              type="tel"
              required
              value={value.shipping_phone_number}
              onChange={(e) => handleChange('shipping_phone_number', e.target.value.replace(/[^0-9\s]/g, ''))}
              placeholder="6 12 34 56 78"
              className={`
                flex-1 px-4 py-3 rounded-xl border-2 
                ${errors.shipping_phone_number ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'}
                focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                transition-all duration-200 outline-none
              `}
            />
          </div>
          {errors.shipping_phone_number && (
            <p className="mt-1 text-sm text-red-600">{errors.shipping_phone_number}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            L'indicatif est automatiquement défini selon le pays sélectionné
          </p>
        </div>
      </div>

      {/* Info supplémentaire */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <div className="flex items-start gap-2 text-sm text-gray-700">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>
            <strong>Vos données sont sécurisées.</strong> Nous ne partageons jamais vos informations avec des tiers.
            L'adresse sera utilisée uniquement pour l'expédition de votre commande.
          </p>
        </div>
      </div>
    </div>
  );
}
