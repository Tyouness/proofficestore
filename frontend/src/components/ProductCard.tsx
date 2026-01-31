import Link from 'next/link';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import { getProductImagePath } from '@/lib/product-images';
import { getProductImageSEO } from '@/lib/image-seo';
import { getCurrencyFromLocale, getFormattedFinalPrice, type ProductWithPrices } from '@/lib/currency';

interface Product extends ProductWithPrices {
  id: string;
  slug: string;
  name: string;
  family: string;
  version?: string;
  edition?: string;
  delivery_type: string;
  description?: string;
  image_url?: string;
}

const DELIVERY_TYPE_LABELS: Record<string, string> = {
  digital_key: 'Clé Numérique',
  dvd: 'DVD',
  usb: 'Clé USB',
};

const FAMILY_LABELS: Record<string, string> = {
  windows: 'Windows',
  office: 'Office',
};

export default function ProductCard({ product }: { product: Product }) {
  const locale = useLocale();
  const currency = getCurrencyFromLocale(locale);
  
  const deliveryLabel = DELIVERY_TYPE_LABELS[product.delivery_type] || product.delivery_type;
  const familyLabel = FAMILY_LABELS[product.family] || product.family;
  
  // Obtenir le prix formaté selon la devise de la locale
  const {
    formattedNormalPrice,
    formattedSalePrice,
    formattedFinalPrice,
    hasDiscount,
    discountPercentage,
    promoLabel
  } = getFormattedFinalPrice(product, currency);

  return (
    <Link href={`/produit/${product.slug}`} className="group block">
      <div className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden h-full flex flex-col">
        {/* Image avec badge promo */}
        <div className="relative">
          {(() => {
          const localImage = getProductImagePath(product.slug);
          const imageMeta = getProductImageSEO(product.slug, {
            name: product.name,
            family: product.family as 'windows' | 'office',
            version: product.version,
            edition: product.edition,
            deliveryType: product.delivery_type as 'digital_key' | 'dvd' | 'usb',
          });
          return localImage ? (
            <div className="relative h-48 bg-gradient-to-br from-blue-50 to-gray-100">
              <Image 
                src={localImage}
                alt={imageMeta.alt}
                title={imageMeta.title}
                width={300}
                height={225}
                sizes="(max-width: 640px) 85vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="w-full h-full object-contain p-4"
                loading="lazy"
                quality={85}
              />
            </div>
          ) : product.image_url ? (
            <div className="relative h-48 bg-gradient-to-br from-blue-50 to-gray-100">
              <img 
                src={product.image_url} 
                alt={imageMeta.alt}
                title={imageMeta.title}
                className="w-full h-full object-contain p-4"
              />
            </div>
          ) : (
            <div className="relative h-48 bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
              <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          );
        })()}
        
        {/* Badge promotion flottant */}
        {hasDiscount && promoLabel && (
          <div className="absolute top-4 right-4 z-10">
            <div className="bg-red-500 text-white px-3 py-1.5 rounded-lg shadow-lg font-bold text-sm">
              {promoLabel}
            </div>
          </div>
        )}
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-grow">
          {/* Badge famille */}
          <div className="mb-2">
            <span className="inline-block px-2 py-1 text-xs font-semibold text-blue-600 bg-blue-50 rounded">
              {familyLabel}
            </span>
          </div>

          {/* Nom */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 flex-grow group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>

          {/* Description */}
          {product.description && (
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {product.description}
            </p>
          )}

          {/* Type de livraison */}
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            {deliveryLabel}
          </div>

          {/* Prix et CTA */}
          <div className="mt-auto">
            <div className="mb-4">
              {hasDiscount ? (
                <div className="flex flex-col">
                  <div className="text-2xl font-bold text-green-600">
                    {formattedSalePrice}
                  </div>
                  <div className="text-sm text-gray-500 line-through">
                    {formattedNormalPrice}
                  </div>
                </div>
              ) : (
                <div className="text-2xl font-bold text-gray-900">
                  {formattedNormalPrice}
                </div>
              )}
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
              Voir
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}