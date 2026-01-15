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
    </main>
  );
}