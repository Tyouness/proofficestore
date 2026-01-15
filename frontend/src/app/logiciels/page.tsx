import { Suspense } from 'react';
import { createClient } from '@supabase/supabase-js';
import ProductCard from '@/components/ProductCard';
import CatalogFilters from './CatalogFilters';

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
  searchParams: {
    family?: string;
    delivery_type?: string;
    version?: string;
    edition?: string;
  };
}

export const metadata = {
  title: 'Catalogue Logiciels - Windows & Office | AllKeyMasters',
  description: 'Découvrez notre catalogue complet de licences Windows et Office. Livraison instantanée, prix compétitifs.',
};

async function getProducts(filters: PageProps['searchParams']) {
  let query = supabaseAdmin
    .from('products')
    .select('*')
    .eq('is_active', true);

  if (filters.family) {
    query = query.eq('family', filters.family);
  }
  if (filters.delivery_type) {
    query = query.eq('delivery_type', filters.delivery_type);
  }
  if (filters.version) {
    query = query.eq('version', filters.version);
  }
  if (filters.edition) {
    query = query.eq('edition', filters.edition);
  }

  const { data, error } = await query.order('family', { ascending: true })
    .order('version', { ascending: false })
    .order('edition', { ascending: true })
    .order('delivery_type', { ascending: true });

  if (error) {
    throw new Error('Erreur lors du chargement des produits');
  }

  return data as Product[];
}

async function getFilterOptions() {
  const { data: products } = await supabaseAdmin
    .from('products')
    .select('family, version, edition, delivery_type')
    .eq('is_active', true);

  if (!products) return { families: [], versions: [], editions: [], deliveryTypes: [] };

  const families = [...new Set(products.map(p => p.family).filter(Boolean))];
  const versions = [...new Set(products.map(p => p.version).filter(Boolean))];
  const editions = [...new Set(products.map(p => p.edition).filter(Boolean))];
  const deliveryTypes = [...new Set(products.map(p => p.delivery_type).filter(Boolean))];

  return { families, versions, editions, deliveryTypes };
}

export default async function LogicielsPage({ searchParams }: PageProps) {
  const products = await getProducts(searchParams);
  const filterOptions = await getFilterOptions();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Catalogue Logiciels
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Licences authentiques Windows et Office. Livraison instantanée pour les clés numériques.
          </p>
        </div>

        {/* Filtres */}
        <Suspense fallback={<div className="mb-8 h-20 bg-white rounded-lg animate-pulse" />}>
          <CatalogFilters
            families={filterOptions.families}
            versions={filterOptions.versions}
            editions={filterOptions.editions}
            deliveryTypes={filterOptions.deliveryTypes}
            currentFilters={searchParams}
          />
        </Suspense>

        {/* Stats */}
        <div className="mb-8 text-center">
          <p className="text-gray-600">
            <span className="font-semibold text-gray-900">{products.length}</span> produit{products.length > 1 ? 's' : ''} trouvé{products.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Grille de produits */}
        {products.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-200 rounded-full mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Aucun produit trouvé
            </h3>
            <p className="text-gray-600 mb-6">
              Essayez de modifier vos filtres pour voir plus de résultats.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Info section */}
        <div className="mt-16 bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Pourquoi choisir AllKeyMasters ?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">Livraison Instantanée</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Recevez votre clé d'activation par email immédiatement après votre paiement.
              </p>
            </div>
            <div>
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">Licences Authentiques</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Toutes nos licences sont 100% légales et proviennent directement de Microsoft.
              </p>
            </div>
            <div>
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">Support Client 7j/7</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Notre équipe est disponible pour vous aider à tout moment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
