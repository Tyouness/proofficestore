import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Blog AllKeyMasters – Guides Office & Windows',
  description: 'Guides complets Office et Windows : comparatifs, installation, activation, licences ESD. Conseils experts et tutoriels détaillés.',
  openGraph: {
    title: 'Blog AllKeyMasters – Guides Office & Windows',
    description: 'Guides complets Office et Windows : comparatifs, installation, activation, licences ESD. Conseils experts et tutoriels détaillés.',
    url: 'https://www.allkeymasters.com/blog',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog AllKeyMasters – Guides Office & Windows',
    description: 'Guides complets Office et Windows : comparatifs, installation, activation, licences ESD.',
  },
};

const blogArticles = [
  {
    slug: 'choisir-office-2019-2021-2024',
    title: 'Comment choisir entre Office 2019, 2021 et 2024 ?',
    excerpt: 'Comparatif complet des 3 versions d\'Office : fonctionnalités, prix, compatibilité. Quel Office choisir pour vos besoins en 2026 ?',
    date: '2026-01-15',
    category: 'Guides d\'achat',
    readTime: '8 min',
  },
  {
    slug: 'installer-activer-office-professional-plus',
    title: 'Comment installer et activer Office Professional Plus',
    excerpt: 'Guide pas à pas pour télécharger, installer et activer Office Professional Plus. Résolution des erreurs d\'activation courantes.',
    date: '2026-01-14',
    category: 'Tutoriels',
    readTime: '6 min',
  },
  {
    slug: 'licence-numerique-esd-vs-version-boite',
    title: 'Licence numérique (ESD) vs version boîte : quelles différences ?',
    excerpt: 'ESD, OEM, Retail : comprendre les types de licences Microsoft. Avantages et inconvénients de chaque format.',
    date: '2026-01-13',
    category: 'Guides d\'achat',
    readTime: '7 min',
  },
  {
    slug: 'top-5-fonctionnalites-office-2024',
    title: 'Top 5 des nouvelles fonctionnalités d\'Office 2024',
    excerpt: 'Découvrez les 5 innovations majeures d\'Office 2024 : IA Copilot, collaboration temps réel, nouvelles formules Excel.',
    date: '2026-01-12',
    category: 'Nouveautés',
    readTime: '5 min',
  },
  {
    slug: 'problemes-activation-office-solutions',
    title: 'Problème d\'activation Office : solutions rapides',
    excerpt: 'Erreurs 0x8007000D, 0xC004F074, clé invalide ? Diagnostics et solutions pour activer Office sans prise de tête.',
    date: '2026-01-11',
    category: 'Dépannage',
    readTime: '10 min',
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Blog AllKeyMasters – Guides et Conseils Logiciels
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Guides d'achat, tutoriels d'installation et conseils d'activation pour vos licences Microsoft Office et Windows
          </p>
        </div>

        {/* Articles Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogArticles.map((article) => (
            <Link
              key={article.slug}
              href={`/blog/${article.slug}`}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-block px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-100 rounded-full">
                    {article.category}
                  </span>
                  <span className="text-sm text-gray-500">{article.readTime}</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                  {article.title}
                </h2>
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {article.excerpt}
                </p>
                <div className="flex items-center text-sm text-gray-500">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(article.date).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">
            Besoin d'aide pour choisir votre licence ?
          </h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Notre équipe d'experts est disponible 7j/7 pour vous conseiller et vous aider à choisir la licence Microsoft adaptée à vos besoins.
          </p>
          <Link
            href="/support"
            className="inline-block bg-white text-blue-600 font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Contacter le support
          </Link>
        </div>
      </div>
    </div>
  );
}
