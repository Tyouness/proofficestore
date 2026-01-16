interface ProductTrustBadgesProps {
  deliveryType?: string;
}

export default function ProductTrustBadges({ deliveryType = 'digital_key' }: ProductTrustBadgesProps) {
  const isInstantDelivery = deliveryType === 'digital_key';

  return (
    <div className="flex flex-wrap gap-3 my-6">
      {isInstantDelivery && (
        <div className="flex items-center bg-green-50 text-green-700 px-4 py-2.5 rounded-lg border border-green-200">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="font-medium text-sm">Livraison en 5 minutes</span>
        </div>
      )}
      
      <div className="flex items-center bg-blue-50 text-blue-700 px-4 py-2.5 rounded-lg border border-blue-200">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span className="font-medium text-sm">Paiement 100% sécurisé</span>
      </div>

      <div className="flex items-center bg-purple-50 text-purple-700 px-4 py-2.5 rounded-lg border border-purple-200">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <span className="font-medium text-sm">Support français gratuit</span>
      </div>
    </div>
  );
}
