import Link from 'next/link';

export default function ImprintPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Mentions Légales
          </h1>

          <div className="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Éditeur du site</h2>
              <p className="text-gray-700 leading-relaxed">
                <strong>Nom de l'entreprise :</strong> [NOM_ENTREPRISE]<br />
                <strong>Forme juridique :</strong> [FORME_JURIDIQUE]<br />
                <strong>Capital social :</strong> [CAPITAL_SOCIAL]<br />
                <strong>SIRET :</strong> [SIRET]<br />
                <strong>Numéro de TVA intracommunautaire :</strong> [TVA_INTRA]<br />
                <strong>Adresse du siège social :</strong> [ADRESSE]<br />
                <strong>Email :</strong> [EMAIL_CONTACT]<br />
                <strong>Téléphone :</strong> [TELEPHONE]
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Directeur de la publication</h2>
              <p className="text-gray-700 leading-relaxed">
                <strong>Nom :</strong> [NOM_DIRECTEUR]<br />
                <strong>Qualité :</strong> [QUALITE_DIRECTEUR] (Gérant, Président, etc.)
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Hébergement</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Le site AllKeyMasters est hébergé par :
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>Nom de l'hébergeur :</strong> [HEBERGEUR]<br />
                <strong>Adresse :</strong> [ADRESSE_HEBERGEUR]<br />
                <strong>Site web :</strong> <a href="[URL_HEBERGEUR]" target="_blank" rel="noopener noreferrer" 
                className="text-blue-600 hover:underline">[URL_HEBERGEUR]</a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Propriété intellectuelle</h2>
              <p className="text-gray-700 leading-relaxed">
                L'ensemble du contenu de ce site (textes, images, logos, graphismes, etc.) est la propriété 
                exclusive de <strong>[NOM_ENTREPRISE]</strong>, sauf mention contraire.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Toute reproduction, distribution ou utilisation non autorisée de ce contenu est strictement 
                interdite et peut entraîner des poursuites judiciaires.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Services tiers</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Le site utilise les services suivants :
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>
                  <strong>Stripe :</strong> Traitement des paiements sécurisés. 
                  <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" 
                  className="text-blue-600 hover:underline ml-1">stripe.com</a>
                </li>
                <li>
                  <strong>Supabase :</strong> Hébergement de la base de données et authentification. 
                  <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" 
                  className="text-blue-600 hover:underline ml-1">supabase.com</a>
                </li>
                <li>
                  <strong>Resend :</strong> Envoi d'emails transactionnels. 
                  <a href="https://resend.com" target="_blank" rel="noopener noreferrer" 
                  className="text-blue-600 hover:underline ml-1">resend.com</a>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Cookies</h2>
              <p className="text-gray-700 leading-relaxed">
                Le site utilise uniquement des cookies essentiels au fonctionnement (authentification, panier). 
                Aucun cookie publicitaire ou de tracking n'est utilisé.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Pour plus d'informations, consultez notre 
                <Link href="/legal/privacy" className="text-blue-600 hover:underline ml-1">
                  politique de confidentialité
                </Link>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Données personnelles</h2>
              <p className="text-gray-700 leading-relaxed">
                Les données personnelles collectées sur ce site sont traitées conformément au RGPD (Règlement 
                Général sur la Protection des Données).
              </p>
              <p className="text-gray-700 leading-relaxed">
                Pour en savoir plus, consultez notre 
                <Link href="/legal/privacy" className="text-blue-600 hover:underline ml-1">
                  politique de confidentialité
                </Link>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Responsabilité</h2>
              <p className="text-gray-700 leading-relaxed">
                <strong>[NOM_ENTREPRISE]</strong> s'efforce d'assurer l'exactitude et la mise à jour des 
                informations diffusées sur ce site.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Toutefois, nous ne pouvons garantir l'absence d'erreurs ou d'omissions. Les informations 
                fournies le sont à titre indicatif et ne sauraient engager notre responsabilité.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Nous déclinons toute responsabilité en cas d'interruption du site, de problèmes techniques 
                ou de dommages indirects résultant de l'utilisation du site.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Liens externes</h2>
              <p className="text-gray-700 leading-relaxed">
                Le site peut contenir des liens vers des sites externes. Nous ne sommes pas responsables du 
                contenu de ces sites ni de leur politique de confidentialité.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Droit applicable</h2>
              <p className="text-gray-700 leading-relaxed">
                Les présentes mentions légales sont régies par le droit <strong>[PAYS_APPLICABLE]</strong>.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Tout litige relatif à l'utilisation du site sera soumis aux tribunaux compétents de 
                <strong> [JURIDICTION_COMPETENTE]</strong>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact</h2>
              <p className="text-gray-700 leading-relaxed">
                Pour toute question relative aux présentes mentions légales, vous pouvez nous contacter :
              </p>
              <p className="text-gray-700 leading-relaxed mt-2">
                <strong>Email :</strong> [EMAIL_CONTACT]<br />
                <strong>Adresse postale :</strong> [ADRESSE]<br />
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
