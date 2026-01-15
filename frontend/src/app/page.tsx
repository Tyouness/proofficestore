import Hero from "@/components/Hero";
import ProductCard from "@/components/ProductCard";
import { createServerClient } from '@/lib/supabase-server';

export default async function Home() {
  const supabase = await createServerClient();
  
  // Charger uniquement les 4 produits vedettes (is_featured = true)
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_featured', true)
    .eq('is_active', true)
    .limit(4);

  if (error) {
    console.error("Erreur lors de la récupération des produits :", error);
  }

  return (
    <main>
      <Hero />
      
      <section id="products" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900">Nos Meilleures Ventes</h2>
            <a 
              href="/logiciels" 
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
            >
              Voir tous les produits
              <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
          
          <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
            {products && products.length > 0 ? (
              products.map((product) => (
                <ProductCard 
                  key={product.id}
                  product={product}
                />
              ))
            ) : (
              <div className="col-span-4 text-center py-12">
                <p className="text-gray-500">Aucun produit vedette pour le moment.</p>
                <a href="/logiciels" className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium">
                  Voir tous nos produits
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Pourquoi choisir AllKeyMasters */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Pourquoi choisir AllKeyMasters ?
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Livraison Instantanée</h3>
              <p className="text-gray-600">
                Recevez votre clé d'activation par email immédiatement après votre paiement.
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Licences Authentiques</h3>
              <p className="text-gray-600">
                Toutes nos licences sont 100% légales et proviennent directement de Microsoft.
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Support Client 7j/7</h3>
              <p className="text-gray-600">
                Notre équipe est disponible pour vous aider à tout moment.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}