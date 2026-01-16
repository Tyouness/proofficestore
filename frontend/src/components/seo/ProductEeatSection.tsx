interface ProductEeatSectionProps {
  productName: string;
  isPerpetual?: boolean;
}

export default function ProductEeatSection({ productName, isPerpetual = true }: ProductEeatSectionProps) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 my-8 border border-blue-100">
      <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
        <svg className="w-7 h-7 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        Garantie Authenticité Microsoft
      </h2>
      
      <ul className="space-y-3">
        <li className="flex items-start">
          <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-gray-700">
            <strong>Clés d'activation officielles Microsoft</strong> - Garantie d'authenticité
          </span>
        </li>
        
        {isPerpetual && (
          <li className="flex items-start">
            <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-gray-700">
              <strong>Licence perpétuelle</strong> - Aucun abonnement, paiement unique
            </span>
          </li>
        )}
        
        <li className="flex items-start">
          <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-gray-700">
            <strong>Activation sur 1 PC</strong> - Réutilisable après réinstallation
          </span>
        </li>
        
        <li className="flex items-start">
          <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-gray-700">
            <strong>Support technique gratuit en français</strong> - Assistance par email
          </span>
        </li>
        
        <li className="flex items-start">
          <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-gray-700">
            <strong>Garantie satisfait ou remboursé 30 jours</strong>
          </span>
        </li>
      </ul>
    </div>
  );
}
