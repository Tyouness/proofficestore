import Link from 'next/link';

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-xl">
        {/* Icône */}
        <div className="mb-8 inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full">
          <svg 
            className="w-12 h-12 text-gray-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M6 18L18 6M6 6l12 12" 
            />
          </svg>
        </div>

        {/* Titre */}
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          Paiement annulé
        </h1>

        {/* Message */}
        <div className="space-y-4 text-gray-600 mb-8">
          <p className="text-lg">
            Vous avez annulé le processus de paiement.
          </p>
          <p>
            Aucun montant n'a été débité de votre compte.
          </p>
        </div>

        {/* Informations */}
        <div className="bg-gray-50 rounded-3xl p-6 mb-8">
          <p className="text-gray-700">
            Vos produits sont toujours dans votre panier. 
            Vous pouvez finaliser votre commande à tout moment.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/checkout"
            className="
              inline-block px-8 py-4 
              bg-black text-white 
              rounded-3xl font-semibold
              hover:bg-gray-800 
              transition-all duration-300
              hover:shadow-xl
            "
          >
            Retour au panier
          </Link>
          <Link 
            href="/"
            className="
              inline-block px-8 py-4 
              bg-white text-gray-900
              border-2 border-gray-200
              rounded-3xl font-semibold
              hover:border-gray-300 hover:shadow-lg
              transition-all duration-300
            "
          >
            Continuer mes achats
          </Link>
        </div>

        {/* Support */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-3">
            Une question ou un problème ?
          </p>
          <a 
            href="mailto:support@allkeymasters.com"
            className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
          >
            Contactez notre support client
          </a>
        </div>
      </div>
    </div>
  );
}
