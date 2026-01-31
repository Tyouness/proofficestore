import Hero from "@/components/Hero";
import ProductCarousel from "@/components/ProductCarousel";
import FeatureCarousel from "@/components/FeatureCarousel";
import { createClient } from '@supabase/supabase-js';

// ISR: Revalider la page toutes les heures
export const revalidate = 3600;

// Client Supabase simple (sans cookies SSR)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function Home() {
  
  // Debug: Vérifier que Supabase est bien initialisé
  console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + "...");
  
  // Charger uniquement les 4 produits vedettes (is_featured = true)
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_featured', true)
    .eq('is_active', true)
    .limit(4);

  if (error) {
    console.error("Erreur lors de la récupération des produits :", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      full: error
    });
  }
  
  console.log("Produits récupérés:", products?.length || 0);

  // Données des fonctionnalités pour le carrousel
  const features = [
    {
      icon: (
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: "Livraison Instantanée",
      description: "Recevez votre clé d'activation par email immédiatement après votre paiement.",
      color: "bg-blue-100"
    },
    {
      icon: (
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Licences Authentiques",
      description: "Toutes nos licences sont 100% légales et proviennent directement de Microsoft.",
      color: "bg-green-100"
    },
    {
      icon: (
        <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      title: "Support Client 7j/7",
      description: "Notre équipe est disponible pour vous aider à tout moment.",
      color: "bg-purple-100"
    }
  ];

  return (
    <main>
      <Hero />
      
      <section id="products" className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Nos Meilleures Ventes</h2>
            <a 
              href="/logiciels" 
              className="hidden sm:flex text-blue-600 hover:text-blue-700 font-medium items-center text-sm sm:text-base"
            >
              Voir tous
              <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
          
          {products && products.length > 0 ? (
            <ProductCarousel products={products} />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Aucun produit vedette pour le moment.</p>
              <a href="/logiciels" className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium">
                Voir tous nos produits
              </a>
            </div>
          )}

          {/* Lien mobile en bas */}
          <div className="sm:hidden text-center mt-6">
            <a 
              href="/logiciels" 
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              Voir tous les produits
              <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Pourquoi choisir AllKeyMasters */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-4">
              Pourquoi choisir AllKeyMasters ?
            </h2>
          </div>
          
          <FeatureCarousel features={features} />
        </div>
      </section>
    </main>
  );
}