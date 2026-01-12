import Link from 'next/link';

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Politique de Remboursement
          </h1>

          <div className="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Principe général</h2>
              <p className="text-gray-700 leading-relaxed">
                AllKeyMasters commercialise des produits numériques (clés de licence logicielle) livrés 
                instantanément de manière dématérialisée.
              </p>
              <p className="text-gray-700 leading-relaxed">
                En raison de la nature numérique des produits et de leur livraison immédiate, les remboursements 
                ne sont accordés que dans des circonstances spécifiques détaillées ci-dessous.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Cas de remboursement acceptés</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Nous procédons à un remboursement dans les situations suivantes :
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>
                  <strong>Clé invalide ou erronée :</strong> Si la clé fournie est invalide, déjà utilisée 
                  (sans faute de votre part) ou ne correspond pas au produit commandé, après vérification de notre équipe.
                </li>
                <li>
                  <strong>Double paiement :</strong> Si vous avez été facturé deux fois pour la même commande 
                  en raison d'une erreur technique.
                </li>
                <li>
                  <strong>Erreur de notre part :</strong> Si nous avons commis une erreur dans le traitement 
                  de votre commande (mauvais produit livré, etc.).
                </li>
                <li>
                  <strong>Problème technique majeur :</strong> Si la clé ne peut être activée pour des raisons 
                  techniques indépendantes de votre configuration, et qu'aucune solution de remplacement n'est possible.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Cas de remboursement refusés</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Nous ne pouvons pas accorder de remboursement dans les situations suivantes :
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>
                  <strong>Clé déjà activée :</strong> Si vous avez utilisé ou activé la clé de licence 
                  (sauf en cas de défaut avéré de notre part).
                </li>
                <li>
                  <strong>Incompatibilité système :</strong> Si votre système ne répond pas aux exigences 
                  du logiciel (version de Windows non compatible, etc.). Ces informations sont disponibles 
                  sur la page produit avant l'achat.
                </li>
                <li>
                  <strong>Changement d'avis :</strong> Les produits numériques ne permettent généralement pas 
                  l'exercice du droit de rétractation une fois la livraison effectuée (voir nos 
                  <Link href="/legal/terms" className="text-blue-600 hover:underline"> CGV</Link>).
                </li>
                <li>
                  <strong>Mauvaise utilisation :</strong> Si la clé ne fonctionne pas en raison d'une erreur 
                  de manipulation de votre part (mauvaise procédure d'activation, etc.), sauf si notre support 
                  ne parvient pas à vous aider.
                </li>
                <li>
                  <strong>Abus ou fraude :</strong> Toute tentative de remboursement frauduleuse ou abusive 
                  sera refusée et pourra entraîner le blocage de votre compte.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Procédure de demande</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Pour demander un remboursement, veuillez suivre ces étapes :
              </p>
              <ol className="list-decimal pl-6 space-y-2 text-gray-700">
                <li>
                  Connectez-vous à votre <Link href="/account" className="text-blue-600 hover:underline">espace client</Link>
                </li>
                <li>
                  Accédez à la section <Link href="/account/support" className="text-blue-600 hover:underline">Support</Link>
                </li>
                <li>
                  Créez un ticket en sélectionnant le sujet <strong>"Demande de remboursement"</strong>
                </li>
                <li>
                  Fournissez les informations suivantes :
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Numéro de commande</li>
                    <li>Clé de licence concernée</li>
                    <li>Description détaillée du problème</li>
                    <li>Captures d'écran si applicable (message d'erreur, etc.)</li>
                  </ul>
                </li>
              </ol>
              <p className="text-gray-700 leading-relaxed mt-3">
                Notre équipe examinera votre demande et vous répondra sous <strong>[DELAI_REPONSE]</strong> jours ouvrables.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Support avant remboursement</h2>
              <p className="text-gray-700 leading-relaxed">
                Avant de procéder à un remboursement, notre équipe support fera tout son possible pour résoudre 
                votre problème :
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mt-3">
                <li>Assistance à l'activation (activation par téléphone Microsoft, etc.)</li>
                <li>Remplacement de la clé si elle est défectueuse</li>
                <li>Guide d'installation détaillé</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                Le remboursement n'est envisagé qu'en dernier recours, si aucune solution technique n'est possible.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Délais de remboursement</h2>
              <p className="text-gray-700 leading-relaxed">
                Si votre demande de remboursement est acceptée :
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mt-3">
                <li>
                  Nous procédons au remboursement dans un délai de <strong>[DELAI_REMBOURSEMENT]</strong> jours 
                  ouvrables après validation
                </li>
                <li>
                  Le remboursement est effectué sur le même moyen de paiement que celui utilisé pour l'achat
                </li>
                <li>
                  Selon votre banque, le crédit peut prendre <strong>3 à 10 jours ouvrables</strong> supplémentaires 
                  pour apparaître sur votre compte
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Révocation de la clé</h2>
              <p className="text-gray-700 leading-relaxed">
                En cas de remboursement accepté, la clé de licence fournie sera <strong>révoquée</strong> et 
                ne pourra plus être utilisée.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Toute utilisation de la clé après remboursement constitue une fraude et pourra entraîner 
                des poursuites.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Litiges Stripe (chargebacks)</h2>
              <p className="text-gray-700 leading-relaxed">
                Si vous initiez un litige de paiement (chargeback) directement auprès de votre banque sans 
                nous avoir contactés au préalable :
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mt-3">
                <li>Votre clé de licence sera <strong>immédiatement révoquée</strong></li>
                <li>Votre compte sera <strong>suspendu</strong> pendant la durée de l'enquête</li>
                <li>Nous conservons le droit de fournir à Stripe toutes les preuves de livraison et d'utilisation</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                Nous vous encourageons vivement à nous contacter <strong>avant</strong> d'initier un chargeback. 
                La plupart des problèmes peuvent être résolus rapidement et à l'amiable.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Contact</h2>
              <p className="text-gray-700 leading-relaxed">
                Pour toute question relative à notre politique de remboursement, contactez notre support :
              </p>
              <p className="text-gray-700 leading-relaxed mt-2">
                <strong>Email :</strong> [EMAIL_CONTACT]<br />
                <strong>Support :</strong> <Link href="/account/support" className="text-blue-600 hover:underline">
                  Système de tickets
                </Link>
              </p>
            </section>

            <p className="text-sm text-gray-500 mt-8">
              Dernière mise à jour : <strong>[DATE_MAJ]</strong>
            </p>
          </div>

          <div className="mt-8">
            <Link 
              href="/" 
              className="text-blue-600 hover:underline font-medium"
            >
              ← Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
