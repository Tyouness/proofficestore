import Link from 'next/link';

export default function ProductNotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">🔍</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Produit introuvable
        </h1>
        <p className="text-gray-600 mb-8">
          Désolé, ce produit n'existe pas ou n'est plus disponible.
        </p>
        <Link 
          href="/"
          className="
            inline-block px-8 py-4 
            bg-blue-600 text-white 
            rounded-3xl font-semibold
            hover:bg-blue-700 
            transition-all duration-300
            hover:shadow-lg
          "
        >
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
