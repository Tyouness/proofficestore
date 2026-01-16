interface RelatedProduct {
  slug: string;
  name: string;
  base_price: number;
}

interface ProductInternalLinksProps {
  currentProductFamily: string;
  currentProductSlug: string;
  relatedProducts?: RelatedProduct[];
}

export default function ProductInternalLinks({ 
  currentProductFamily,
  currentProductSlug,
  relatedProducts = []
}: ProductInternalLinksProps) {
  // Articles de blog pertinents par famille
  const blogArticles = currentProductFamily === 'office' ? [
    {
      title: 'Comment choisir entre Office 2019, 2021 et 2024 ?',
      url: '/blog/choisir-office-2019-2021-2024',
      description: 'Comparatif complet pour faire le bon choix'
    },
    {
      title: 'Comment installer et activer Office Professional Plus',
      url: '/blog/installer-activer-office-pro-plus',
      description: 'Guide pas à pas avec captures d\'écran'
    }
  ] : [
    {
      title: 'Windows 11 Pro vs Home : Quelle version choisir ?',
      url: '/blog/windows-11-pro-vs-home',
      description: 'Différences et recommandations'
    }
  ];

  return (
    <div className="my-12 space-y-8">
      {/* Produits similaires */}
      {relatedProducts && relatedProducts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Produits Similaires</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedProducts.slice(0, 3).map((product) => (
              <a
                key={product.slug}
                href={`/produit/${product.slug}`}
                className="block p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md hover:border-blue-400 transition-all"
              >
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                  {product.name}
                </h3>
                <p className="text-xl font-bold text-blue-600">
                  {product.base_price.toFixed(2)} €
                </p>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Articles de blog */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Articles Utiles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {blogArticles.map((article, index) => (
            <a
              key={index}
              href={article.url}
              className="block p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg hover:shadow-md transition-all group"
            >
              <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                {article.title}
              </h3>
              <p className="text-sm text-gray-600">{article.description}</p>
              <span className="inline-block mt-3 text-blue-600 text-sm font-medium">
                Lire l'article →
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* Lien catalogue */}
      <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
        <h3 className="font-semibold text-gray-900 mb-2">
          Découvrez toute notre gamme
        </h3>
        <a
          href="/logiciels"
          className="inline-block mt-3 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Voir tous les produits
        </a>
      </div>
    </div>
  );
}
