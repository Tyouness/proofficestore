import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';
import { Metadata } from 'next';
import ProductActions from '@/components/ProductActions';
import { getProductImagePath } from '@/lib/product-images';

// ISR: Revalider la page toutes les heures
export const revalidate = 3600;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

interface Product {
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

  // Récupérer les avis du produit (uniquement les actifs)
  const { data: reviews, error: reviewsError } = await supabaseAdmin
    .from('reviews')
    .select('id, rating, comment, created_at')
    .eq('product_id', product.id)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(10);

  if (reviewsError) {
    console.error('[PRODUCT] Erreur reviews:', reviewsError);
  }

  // Calculer la moyenne et le nombre total d'avis
  const reviewCount = reviews?.length || 0;
  const averageRating = reviewCount > 0
    ? reviews!.reduce((sum, r) => sum + r.rating, 0) / reviewCount
    : 0;

  // JSON-LD Schema pour SEO (optimisé Google Rich Results)
  const jsonLd: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image_url?.startsWith('http') 
      ? product.image_url 
      : `https://www.allkeymasters.com${product.image_url || '/images/default-product.jpg'}`,
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
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: '0',
          currency: 'EUR',
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'FR',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 0,
            maxValue: 0,
            unitCode: 'DAY',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 0,
            maxValue: 0,
            unitCode: 'DAY',
          },
        },
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'FR',
        returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted',
        merchantReturnDays: 0,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/ReturnFeesCustomerResponsibility',
      },
    },
  };

  // Ajouter aggregateRating et reviews si des avis existent
  if (reviewCount > 0) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: averageRating.toFixed(1),
      reviewCount: reviewCount,
      bestRating: '5',
      worstRating: '1',
    };

    // Inclure les 5 premiers avis dans le JSON-LD
    jsonLd.review = reviews!.slice(0, 5).map((review) => ({
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: review.rating.toString(),
        bestRating: '5',
        worstRating: '1',
      },
      author: {
        '@type': 'Person',
        name: 'Client vérifié',
      },
      reviewBody: review.comment || '',
      datePublished: new Date(review.created_at).toISOString(),
    }));
  }

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
        <nav className="mb-8 text-sm">
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
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src={getProductImagePath(product.slug) || product.image_url || '/images/placeholder-product.jpg'}
                alt={product.name}
                fill
                className="object-cover"
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

              <p className="text-gray-600 mb-6">
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
                <h3 className="font-semibold text-gray-900 mb-3">Caractéristiques</h3>
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
                productId={product.slug.replace(/-digital-key$|-dvd$|-usb$/, '')} 
                productName={product.name} 
                basePrice={product.base_price} 
              />

              {/* Réassurance sous le CTA */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center text-sm text-gray-700">
                  <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium">Licence perpétuelle</span> - À vie, sans abonnement
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="font-medium">Accès immédiat</span> après validation du paiement
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span className="font-medium">Support client</span> dédié 7j/7
                </div>
              </div>
            </div>
          </div>

          {/* Long Description */}
          <div className="border-t border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Description détaillée</h2>
            <div className="prose max-w-none text-gray-600">
              <p>{product.long_description}</p>
            </div>
          </div>
        </div>

        {/* Ce que vous recevez */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Ce que vous recevez</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Clé d'activation officielle Microsoft</h3>
                <p className="text-sm text-gray-600">Licence authentique vérifiable sur le site Microsoft. Garantie d'activation.</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Accès immédiat dans votre espace client</h3>
                <p className="text-sm text-gray-600">Retrouvez votre licence instantanément après validation du paiement.</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Facture disponible</h3>
                <p className="text-sm text-gray-600">Téléchargez votre facture PDF depuis votre compte.</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Support client dédié</h3>
                <p className="text-sm text-gray-600">Notre équipe vous accompagne pour l'installation et l'activation.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Compatibilité & Prérequis */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Compatibilité & Prérequis</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Configuration système
              </h3>
              <ul className="space-y-2 text-gray-700">
                {product.family === 'windows' ? (
                  <>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>Processeur 1 GHz ou plus rapide</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>RAM : 1 Go (32 bits) ou 2 Go (64 bits)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>Espace disque : 20 Go minimum</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>Carte graphique DirectX 9 ou ultérieure</span>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>Windows 10 ou Windows 11</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>Processeur 1 GHz ou plus rapide</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>RAM : 2 Go minimum</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>Espace disque : 4 Go disponible</span>
                    </li>
                  </>
                )}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Conditions d'utilisation
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Licence valable pour <strong>1 PC uniquement</strong></span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Connexion Internet requise pour l'activation</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Utilisation hors ligne possible après activation</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Réinstallation possible sur le même PC</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Activation en 5 étapes */}
        <div className="mt-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Activation en 5 étapes</h2>
          <p className="text-gray-600 mb-6">Simple et rapide, suivez notre guide pas à pas</p>
          
          <div className="space-y-4">
            {[
              {
                step: 1,
                title: 'Commandez votre licence',
                description: 'Sélectionnez votre format de livraison et finalisez votre achat en toute sécurité.',
              },
              {
                step: 2,
                title: 'Accédez à votre espace client',
                description: 'Connectez-vous à votre compte AllKeyMasters pour récupérer votre clé d\'activation.',
              },
              {
                step: 3,
                title: product.family === 'windows' ? 'Téléchargez Windows' : 'Téléchargez Office',
                description: product.family === 'windows' 
                  ? 'Obtenez l\'ISO officiel depuis le site Microsoft ou utilisez l\'outil Media Creation Tool.'
                  : 'Téléchargez Office directement depuis le site officiel Microsoft.',
              },
              {
                step: 4,
                title: 'Installez le logiciel',
                description: `Lancez l'installation de ${product.name} sur votre ordinateur.`,
              },
              {
                step: 5,
                title: 'Activez avec votre clé',
                description: 'Saisissez la clé d\'activation fournie. Votre licence est activée à vie !',
              },
            ].map((item) => (
              <div key={item.step} className="flex items-start bg-white rounded-lg p-4 shadow-sm">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
                  {item.step}
                </div>
                <div className="flex-grow">
                  <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Types de livraison */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Comparatif des formats de livraison</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Format</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Délai</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Support physique</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Recommandé pour</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className={product.delivery_type === 'digital_key' ? 'bg-blue-50' : ''}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">Clé Numérique ⚡</td>
                  <td className="px-4 py-3 text-sm text-gray-700">Instantané</td>
                  <td className="px-4 py-3 text-sm text-gray-700">Non</td>
                  <td className="px-4 py-3 text-sm text-gray-700">Activation rapide, installation via téléchargement</td>
                </tr>
                <tr className={product.delivery_type === 'dvd' ? 'bg-blue-50' : ''}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">DVD 💿</td>
                  <td className="px-4 py-3 text-sm text-gray-700">3-5 jours ouvrés</td>
                  <td className="px-4 py-3 text-sm text-gray-700">Oui</td>
                  <td className="px-4 py-3 text-sm text-gray-700">Installation sans connexion Internet, collection physique</td>
                </tr>
                <tr className={product.delivery_type === 'usb' ? 'bg-blue-50' : ''}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">Clé USB 🔌</td>
                  <td className="px-4 py-3 text-sm text-gray-700">3-5 jours ouvrés</td>
                  <td className="px-4 py-3 text-sm text-gray-700">Oui (Bootable)</td>
                  <td className="px-4 py-3 text-sm text-gray-700">Installation système, réparation, réinstallation facile</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Questions Fréquentes</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                💬 Comment vais-je recevoir ma licence {product.name} ?
              </h3>
              <p className="text-gray-600">
                {product.delivery_type === 'digital_key'
                  ? 'Votre clé d\'activation vous sera envoyée par email immédiatement après validation du paiement. Vous pourrez également la retrouver dans votre compte client sous "Mes Licences".'
                  : `Votre ${deliveryInfo.label} sera expédié sous 24h ouvrées. Vous recevrez un email de confirmation avec le numéro de suivi. Le délai de livraison est de 3 à 5 jours ouvrés.`}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                💻 Sur combien d'appareils puis-je installer cette licence ?
              </h3>
              <p className="text-gray-600">
                Cette licence {product.name} est valable pour <strong>1 PC uniquement</strong>. Si vous souhaitez équiper plusieurs ordinateurs, vous devrez acheter une licence pour chaque appareil.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                ⏰ La licence est-elle perpétuelle ou un abonnement ?
              </h3>
              <p className="text-gray-600">
                Toutes nos licences sont <strong>perpétuelles</strong>. Vous ne payez qu'une seule fois et pouvez utiliser le logiciel indéfiniment, sans frais mensuels ni annuels.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                🔄 Puis-je réinstaller le logiciel sur le même PC ?
              </h3>
              <p className="text-gray-600">
                Oui, absolument. Vous pouvez réinstaller {product.name} sur le même ordinateur autant de fois que nécessaire (en cas de formatage, changement de disque dur, etc.). La clé reste valide à vie.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                💰 Puis-je obtenir un remboursement ?
              </h3>
              <p className="text-gray-600">
                Les clés d'activation numériques ne peuvent pas être remboursées une fois livrées, sauf en cas de clé défectueuse non activable. Consultez nos{' '}
                <a href="/legal/refund" className="text-blue-600 hover:text-blue-700 underline">conditions de remboursement</a> pour plus de détails.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                🌐 Dois-je avoir une connexion Internet pour activer la licence ?
              </h3>
              <p className="text-gray-600">
                Oui, une connexion Internet est nécessaire <strong>uniquement lors de l'activation</strong> initiale de votre licence Microsoft. Après activation, vous pourrez utiliser {product.name} hors ligne sans problème.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                🔒 Les licences vendues sont-elles authentiques ?
              </h3>
              <p className="text-gray-600">
                Oui, nous vendons uniquement des <strong>licences Microsoft officielles</strong> vérifiables sur le site de Microsoft. Chaque clé est authentique et garantie fonctionnelle.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                📞 Que faire si j'ai un problème d'activation ?
              </h3>
              <p className="text-gray-600">
                Notre équipe support est disponible 7j/7 pour vous aider. Contactez-nous via votre <a href="/account/support" className="text-blue-600 hover:text-blue-700 underline">espace client</a> ou par email. Nous répondons généralement sous 2h.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                📥 Où télécharger le fichier d'installation de {product.name.split(' ')[0]} ?
              </h3>
              <p className="text-gray-600">
                {product.family === 'windows'
                  ? 'Téléchargez l\'ISO officiel Windows directement depuis le site Microsoft via l\'outil Media Creation Tool. Nous vous fournissons le lien dans votre espace client.'
                  : 'Téléchargez Office directement depuis le portail officiel Microsoft Office. Le lien est fourni dans votre espace client avec votre clé d\'activation.'}
              </p>
            </div>
          </div>
        </div>

        {/* Avis Clients Section */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Avis Clients</h2>
              {reviewCount > 0 && (
                <div className="flex items-center mt-2">
                  <div className="flex items-center mr-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-5 h-5 ${
                          star <= Math.round(averageRating)
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-lg font-semibold text-gray-900">
                    {averageRating.toFixed(1)}/5
                  </span>
                  <span className="text-gray-500 ml-2">
                    ({reviewCount} avis)
                  </span>
                </div>
              )}
            </div>
          </div>

          {reviewCount === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Pas encore d'avis
              </h3>
              <p className="text-gray-500">
                Soyez le premier à partager votre expérience avec ce produit après votre achat.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews!.map((review) => (
                <div
                  key={review.id}
                  className="border-b border-gray-200 pb-6 last:border-0 last:pb-0"
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="font-semibold text-gray-900 mr-3">
                          Client vérifié
                        </span>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className={`w-4 h-4 ${
                                star <= review.rating
                                  ? 'text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-gray-700 mb-2">{review.comment}</p>
                      )}
                      <p className="text-sm text-gray-500">
                        Publié le{' '}
                        {new Date(review.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
