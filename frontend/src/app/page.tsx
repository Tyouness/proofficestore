import Hero from "@/components/Hero";
import ProductCard from "@/components/ProductCard";
import { createServerClient } from '@/lib/supabase-server';

export default async function Home() {
  const supabase = await createServerClient();
  
  // On demande à Supabase de nous donner tous les produits de la table 'products'
  const { data: products, error } = await supabase
    .from('products')
    .select('*');

  if (error) {
    console.error("Erreur lors de la récupération des produits :", error);
  }

  return (
    <main>
      <Hero />
      
      <section id="products" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-8">Nos Meilleures Ventes</h2>
          
          <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
            {/* Si on a des produits, on les affiche, sinon on affiche un message */}
            {products && products.length > 0 ? (
              products.map((product) => (
                <ProductCard 
                  key={product.id}
                  id={product.slug} // On utilise le slug pour l'URL
                  title={product.name}
                  price={product.base_price.toString()}
                  category={product.category}
                />
              ))
            ) : (
              <p className="text-gray-500">Aucun produit trouvé dans la base de données.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}