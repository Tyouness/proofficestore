import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Politique de Confidentialité
          </h1>

          <div className="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                <strong>[NOM_ENTREPRISE]</strong> (ci-après "nous", "notre", "AllKeyMasters") s'engage à 
                protéger la confidentialité de vos données personnelles.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Cette politique décrit les types de données que nous collectons, comment nous les utilisons, 
                et vos droits concernant ces données.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Responsable du traitement</h2>
              <p className="text-gray-700 leading-relaxed">
                <strong>Nom de l'entreprise :</strong> [NOM_ENTREPRISE]<br />
                <strong>Adresse :</strong> [ADRESSE_ENTREPRISE]<br />
                <strong>Email :</strong> [EMAIL_CONTACT]<br />
                <strong>DPO (Délégué à la Protection des Données) :</strong> [CONTACT_DPO]
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Données collectées</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Nous collectons les types de données suivants :
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>
                  <strong>Données d'identification :</strong> Adresse email (pour la création de compte et 
                  la livraison des clés)
                </li>
                <li>
                  <strong>Données de commande :</strong> Historique des achats, clés de licence attribuées, 
                  montants payés
                </li>
                <li>
                  <strong>Données de support :</strong> Messages envoyés via le système de tickets support, 
                  sujet des demandes
                </li>
                <li>
                  <strong>Données de paiement :</strong> Traitées par <strong>Stripe</strong> (voir section 5). 
                  Nous ne stockons jamais vos informations bancaires complètes.
                </li>
                <li>
                  <strong>Données techniques :</strong> Adresse IP, type de navigateur, horodatage des connexions 
                  (pour la sécurité et la prévention de la fraude)
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Finalités du traitement</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Vos données sont utilisées pour :
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Créer et gérer votre compte utilisateur</li>
                <li>Traiter vos commandes et livrer vos clés de licence</li>
                <li>Fournir un support client via notre système de tickets</li>
                <li>Prévenir la fraude et assurer la sécurité du site</li>
                <li>Respecter nos obligations légales (comptabilité, facturation)</li>
                <li>Améliorer nos services (analyse anonymisée du comportement utilisateur)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Services tiers</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Nous faisons appel aux services tiers suivants :
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>
                  <strong>Supabase :</strong> Hébergement de la base de données (authentification, commandes, 
                  licences, tickets support). Localisation : [REGION_SUPABASE]
                </li>
                <li>
                  <strong>Stripe :</strong> Traitement des paiements sécurisés. Stripe est conforme PCI-DSS. 
                  Consultez leur <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" 
                  className="text-blue-600 hover:underline">politique de confidentialité</a>.
                </li>
                <li>
                  <strong>Resend :</strong> Envoi d'emails transactionnels (confirmation de commande, livraison de clés)
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Durée de conservation</h2>
              <p className="text-gray-700 leading-relaxed">
                Vos données sont conservées pendant la durée nécessaire aux finalités pour lesquelles elles 
                ont été collectées :
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mt-3">
                <li><strong>Données de compte :</strong> Tant que votre compte est actif</li>
                <li><strong>Données de commande :</strong> [DUREE_CONSERVATION_COMMANDES] (obligations comptables)</li>
                <li><strong>Tickets support :</strong> [DUREE_CONSERVATION_SUPPORT]</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                Passé ces délais, vos données sont supprimées ou anonymisées.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Vos droits (RGPD)</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Droit d'accès :</strong> Obtenir une copie de vos données personnelles</li>
                <li><strong>Droit de rectification :</strong> Corriger vos données inexactes</li>
                <li><strong>Droit à l'effacement :</strong> Demander la suppression de vos données</li>
                <li><strong>Droit à la limitation du traitement :</strong> Suspendre temporairement le traitement</li>
                <li><strong>Droit à la portabilité :</strong> Recevoir vos données dans un format structuré</li>
                <li><strong>Droit d'opposition :</strong> Vous opposer au traitement de vos données</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                Pour exercer ces droits, contactez-nous à : <strong>[CONTACT_DPO]</strong>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Sécurité</h2>
              <p className="text-gray-700 leading-relaxed">
                Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger 
                vos données contre tout accès non autorisé, perte ou divulgation :
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mt-3">
                <li>Chiffrement HTTPS (TLS) pour toutes les communications</li>
                <li>Authentification sécurisée via Supabase</li>
                <li>Accès restreint aux données (principe du moindre privilège)</li>
                <li>Surveillance et logs de sécurité</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Cookies</h2>
              <p className="text-gray-700 leading-relaxed">
                Nous utilisons des cookies essentiels pour :
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mt-3">
                <li>Maintenir votre session utilisateur (authentification)</li>
                <li>Mémoriser votre panier d'achat</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                Aucun cookie de tracking publicitaire n'est utilisé.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Modifications</h2>
              <p className="text-gray-700 leading-relaxed">
                Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. 
                Les modifications seront publiées sur cette page avec une date de mise à jour.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact</h2>
              <p className="text-gray-700 leading-relaxed">
                Pour toute question relative à cette politique ou à vos données personnelles, contactez-nous :
              </p>
              <p className="text-gray-700 leading-relaxed mt-2">
                <strong>Email :</strong> [EMAIL_CONTACT]<br />
                <strong>DPO :</strong> [CONTACT_DPO]
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
