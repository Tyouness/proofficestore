import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase-server';
import ProductActions from '@/components/ProductActions';
import type { Metadata } from 'next';

interface Product {
  id: string;
  slug: string;
  name: string;
  category: string;
  base_price: number;
  description: string;
  features: string[];
}

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

// Récupération du produit depuis Supabase
async function getProduct(slug: string): Promise<Product | null> {
  const supabase = await createServerClient();
  
  const { data, error } = await supabase
    .from('products')
    .select('id, slug, name, category, base_price, description, features')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Product;
}

// SEO dynamique
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return {
      title: 'Produit introuvable | AllKeyMasters',
      description: 'Ce produit n\'existe pas ou n\'est plus disponible.',
    };
  }

  return {
    title: `Acheter ${product.name} | AllKeyMasters`,
    description: `${product.description.substring(0, 150)}... Licence authentique Microsoft avec mise à jour sécurisée et clé 25 chiffres. Livraison instantanée.`,
    openGraph: {
      title: `${product.name} - Licence Authentique`,
      description: product.description,
      type: 'website',
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProduct(id);

  // Gestion produit introuvable
  if (!product) {
    notFound();
  }

  return (
    <article className="max-w-7xl mx-auto px-4 py-16">
      <div className="lg:grid lg:grid-cols-2 lg:gap-x-16 lg:gap-y-8">
        {/* Colonne Gauche : Image */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl h-[500px] flex items-center justify-center overflow-hidden">
          <div className="text-center p-8">
            <div className="text-6xl mb-4">🔑</div>
            <span className="text-gray-400 text-sm font-medium">
              {product.name}
            </span>
          </div>
        </div>

        {/* Colonne Droite : Actions */}
        <div className="mt-10 lg:mt-0">
          <div className="mb-8">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">
              {product.category}
            </p>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              {product.name}
            </h1>
          </div>

          <ProductActions 
            productId={product.slug}
            productName={product.name}
            basePrice={product.base_price}
          />
        </div>
      </div>

      {/* Section Description SEO */}
      <section className="mt-20 max-w-4xl">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          À propos de {product.name}
        </h2>
        <div className="prose prose-lg text-gray-600 leading-relaxed">
          <p>{product.description}</p>
        </div>
      </section>

      {/* Section Caractéristiques Techniques */}
      <section className="mt-16 max-w-4xl">
        <h3 className="text-2xl font-bold text-gray-900 mb-8">
          Caractéristiques techniques
        </h3>
        <ul className="grid md:grid-cols-2 gap-6">
          {product.features && product.features.length > 0 ? (
            product.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-4">
                <span className="text-blue-600 font-bold text-2xl flex-shrink-0">✓</span>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">
                    {typeof feature === 'string' ? feature : feature}
                  </p>
                </div>
              </li>
            ))
          ) : (
            <>
              <li className="flex items-start gap-4">
                <span className="text-blue-600 font-bold text-2xl flex-shrink-0">✓</span>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Licence authentique</p>
                  <p className="text-gray-600 text-sm">
                    Clé 25 chiffres vérifiée Microsoft avec activation immédiate
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-blue-600 font-bold text-2xl flex-shrink-0">✓</span>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Compatibilité universelle</p>
                  <p className="text-gray-600 text-sm">
                    Compatible avec tous les appareils Windows modernes
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-blue-600 font-bold text-2xl flex-shrink-0">✓</span>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Sécurité renforcée</p>
                  <p className="text-gray-600 text-sm">
                    Mise à jour sécurisée automatique avec protection complète
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-blue-600 font-bold text-2xl flex-shrink-0">✓</span>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Mises à jour permanentes</p>
                  <p className="text-gray-600 text-sm">
                    Accès gratuit à tous les updates de sécurité
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-blue-600 font-bold text-2xl flex-shrink-0">✓</span>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Support client prioritaire</p>
                  <p className="text-gray-600 text-sm">
                    Assistance technique disponible 24/7
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-blue-600 font-bold text-2xl flex-shrink-0">✓</span>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Garantie satisfaction</p>
                  <p className="text-gray-600 text-sm">
                    Remboursement intégral sous 30 jours
                  </p>
                </div>
              </li>
            </>
          )}
        </ul>
      </section>
    </article>
  );
}
