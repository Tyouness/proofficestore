import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';
import { Metadata } from 'next';
import ProductActions from '@/components/ProductActions';
import { type ProductWithPrices } from '@/lib/currency';

// ISR: Revalider la page toutes les heures
export const revalidate = 3600;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

interface Product extends ProductWithPrices {
  id: string;
  slug: string;
  name: string;
  family: string;
  version: string;
  edition: string;
  delivery_type: string;
  description: string;
  long_description: string;
  base_price: number;
  image_url: string;
  is_featured: boolean;
  is_active: boolean;
}

interface PageProps {
  params: Promise<{
    slug: string;
  }> | {
    slug: string;
  };
}

async function getProduct(slug: string): Promise<Product | null> {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error || !data) return null;
  return data as Product;
}

const DELIVERY_TYPE_LABELS: Record<string, { label: string; icon: string; description: string }> = {
  digital_key: {
    label: 'Clé Numérique',
    icon: '⚡',
    description: 'Livraison instantanée par email'
  },
  dvd: {
    label: 'DVD',
    icon: '💿',
    description: 'Support physique livré sous 3-5 jours'
  },
  usb: {
    label: 'Clé USB',
    icon: '🔌',
    description: 'Support USB bootable livré sous 3-5 jours'
  },
};

const FAMILY_LABELS: Record<string, string> = {
  windows: 'Windows',
  office: 'Microsoft Office',
};

const EDITION_LABELS: Record<string, string> = {
  pro: 'Professionnel',
  professional_plus: 'Professional Plus',
  home_student: 'Famille et Étudiant',
  home_business: 'Famille et Petite Entreprise',
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = params instanceof Promise ? await params : params;
  const product = await getProduct(resolvedParams.slug);

  if (!product) {
    return {
      title: 'Produit introuvable',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const productUrl = `https://www.allkeymasters.com/produit/${product.slug}`;
  
  // Description SEO optimisée (160 caractères max)
  const seoDescription = product.delivery_type === 'digital_key'
    ? `${product.name} - Clé d'activation officielle. Licence perpétuelle, activation immédiate, prix compétitif. Livraison instantanée.`
    : `${product.name} - Licence perpétuelle Microsoft. Support physique ${DELIVERY_TYPE_LABELS[product.delivery_type]?.label}. Livraison rapide.`;

  return {
    title: `${product.name} – ${DELIVERY_TYPE_LABELS[product.delivery_type]?.label || 'Licence'}`,
    description: seoDescription.slice(0, 160),
    openGraph: {
      title: `${product.name} | AllKeyMasters`,
      description: seoDescription.slice(0, 160),
      url: productUrl,
      siteName: 'AllKeyMasters',
      images: product.image_url ? [
        {
          url: product.image_url,
          width: 1200,
          height: 630,
          alt: `${product.name} - Licence Microsoft Officielle`,
        },
      ] : [],
      type: 'website',
    },
    alternates: {
      canonical: productUrl,
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const product = await getProduct(resolvedParams.slug);

  if (!product) {
    notFound();
  }

  const deliveryInfo = DELIVERY_TYPE_LABELS[product.delivery_type] || {
    label: product.delivery_type,
    icon: '📦',
    description: 'Livraison standard'
  };

  // JSON-LD Schema pour SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image_url || 'https://www.allkeymasters.com/images/default-product.jpg',
    sku: product.slug,
    category: FAMILY_LABELS[product.family] || product.family,
    brand: {
      '@type': 'Brand',
      name: 'Microsoft',
    },
    offers: {
      '@type': 'Offer',
      url: `https://www.allkeymasters.com/produit/${product.slug}`,
      priceCurrency: 'EUR',
      price: product.base_price.toFixed(2),
      availability: 'https://schema.org/InStock',
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      seller: {
        '@type': 'Organization',
        name: 'AllKeyMasters',
        url: 'https://www.allkeymasters.com',
      },
    },
  };

  return (
    <>
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-8 text-sm" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-gray-600">
              <li>
                <a href="/" className="hover:text-blue-600">Accueil</a>
              </li>
              <li>/</li>
              <li>
                <a href="/logiciels" className="hover:text-blue-600">Logiciels</a>
              </li>
              <li>/</li>
              <li className="text-gray-900 font-medium">{product.name}</li>
            </ol>
          </nav>

          {/* Product Section */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="grid md:grid-cols-2 gap-8 p-8">
              {/* Image */}
              <div className="relative aspect-square bg-gradient-to-br from-blue-50 to-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={product.image_url || '/images/placeholder-product.jpg'}
                  alt={`${product.name} - Licence Microsoft Officielle`}
                  fill
                  className="object-contain p-8"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>

              {/* Product Info */}
              <div className="flex flex-col">
                <div className="mb-2">
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                    {FAMILY_LABELS[product.family] || product.family}
                  </span>
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {product.name}
                </h1>

                <p className="text-gray-600 mb-6 text-lg">
                  {product.description}
                </p>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-gray-900">
                      {product.base_price.toFixed(2)} €
                    </span>
                    <span className="ml-2 text-gray-500">TTC</span>
                  </div>
                </div>

                {/* Delivery Type */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{deliveryInfo.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-900">{deliveryInfo.label}</p>
                      <p className="text-sm text-gray-600">{deliveryInfo.description}</p>
                    </div>
                  </div>
                </div>

                {/* Specifications */}
                <div className="mb-6 border-t border-b border-gray-200 py-4">
                  <h2 className="font-semibold text-gray-900 mb-3">Caractéristiques</h2>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Version:</dt>
                      <dd className="font-medium text-gray-900">{product.version}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Édition:</dt>
                      <dd className="font-medium text-gray-900">
                        {EDITION_LABELS[product.edition] || product.edition}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Type de licence:</dt>
                      <dd className="font-medium text-gray-900">Perpétuelle</dd>
                    </div>
                  </dl>
                </div>

                {/* Add to Cart Button */}
                <ProductActions 
                  productId={product.id} 
                  productName={product.name} 
                  product={product}
                />

                {/* Réassurance sous le CTA */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-sm text-gray-700">
                    <svg className="w-5 h-5 mr-2 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span><span className="font-medium">Licence perpétuelle</span> - À vie, sans abonnement</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <svg className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span><span className="font-medium">Accès immédiat</span> après validation du paiement</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <svg className="w-5 h-5 mr-2 text-purple-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span><span className="font-medium">Support client</span> dédié 7j/7</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rest of sections will be added in next message due to length */}
        </div>
      </div>
    </>
  );
}
