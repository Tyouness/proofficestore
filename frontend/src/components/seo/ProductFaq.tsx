interface Faq {
  question: string;
  answer: string;
}

interface ProductFaqProps {
  productName: string;
  productFamily?: string;
  deliveryType?: string;
}

export default function ProductFaq({ productName, productFamily = 'office', deliveryType = 'digital_key' }: ProductFaqProps) {
  const isOffice = productFamily === 'office';
  const isWindows = productFamily === 'windows';
  const isDigital = deliveryType === 'digital_key';

  const faqs: Faq[] = [
    {
      question: 'La licence est-elle perpétuelle ?',
      answer: `Oui, ${productName} est une licence perpétuelle. Vous effectuez un paiement unique et conservez le logiciel à vie, sans frais d'abonnement.`
    },
    {
      question: isDigital ? 'Combien de temps pour recevoir ma clé ?' : 'Quel est le délai de livraison ?',
      answer: isDigital 
        ? 'Votre clé d\'activation est envoyée par email dans les 5 minutes suivant la confirmation de paiement. Vérifiez également vos spams.'
        : 'La livraison du support physique prend généralement 3 à 5 jours ouvrés en France métropolitaine.'
    },
    {
      question: isWindows ? 'Compatible avec quel PC ?' : 'Compatible Windows 11 ?',
      answer: isWindows
        ? `${productName} est compatible avec les PC répondant aux exigences minimales de Microsoft. Vérifiez la configuration requise sur la page produit.`
        : `Oui, ${productName} est compatible avec Windows 10 et Windows 11 (64-bit recommandé).`
    },
    {
      question: 'Puis-je réinstaller le logiciel ?',
      answer: 'Oui, vous pouvez désactiver la licence sur un ancien PC et la réactiver sur un nouveau. La clé reste valide à vie.'
    },
    {
      question: 'Le support Microsoft est-il inclus ?',
      answer: isOffice
        ? 'Oui, vous bénéficiez des mises à jour de sécurité Microsoft pour cette version. Notre support technique vous assiste pour l\'installation et l\'activation.'
        : 'Oui, vous recevez les mises à jour de sécurité Windows. Notre équipe vous assiste pour l\'activation et les problèmes techniques.'
    }
  ];

  return (
    <div className="my-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Questions Fréquentes</h2>
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <details 
            key={index}
            className="bg-white rounded-lg border border-gray-200 overflow-hidden group"
          >
            <summary className="px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors font-medium text-gray-900 flex items-center justify-between">
              <span>{faq.question}</span>
              <svg 
                className="w-5 h-5 text-gray-500 transform group-open:rotate-180 transition-transform" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="px-6 pb-4 pt-2 text-gray-600 leading-relaxed">
              {faq.answer}
            </div>
          </details>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-gray-700">
          <strong>Besoin d'aide ?</strong> Contactez notre support technique gratuit à{' '}
          <a href="mailto:support@allkeymasters.com" className="text-blue-600 hover:underline">
            support@allkeymasters.com
          </a>
        </p>
      </div>
    </div>
  );
}
