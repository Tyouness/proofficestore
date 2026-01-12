import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Conditions Générales de Vente
          </h1>

          <div className="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Objet</h2>
              <p className="text-gray-700 leading-relaxed">
                Les présentes Conditions Générales de Vente (CGV) régissent la vente de produits numériques 
                (clés de licence logicielle) proposés par <strong>[NOM_ENTREPRISE]</strong> via le site AllKeyMasters.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Toute commande implique l'acceptation sans réserve des présentes CGV.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Produits</h2>
              <p className="text-gray-700 leading-relaxed">
                AllKeyMasters commercialise des clés de licence pour logiciels Microsoft (Windows, Office, etc.).
              </p>
              <p className="text-gray-700 leading-relaxed">
                Les clés sont livrées de manière entièrement numérique et sont affichées dans votre espace client 
                (<code className="bg-gray-100 px-2 py-1 rounded">/account</code>) immédiatement après validation du paiement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Prix et paiement</h2>
              <p className="text-gray-700 leading-relaxed">
                Les prix sont affichés en euros (€), toutes taxes comprises (TTC).
              </p>
              <p className="text-gray-700 leading-relaxed">
                Le paiement est sécurisé via <strong>Stripe</strong>. Nous acceptons les cartes bancaires 
                (Visa, Mastercard, American Express).
              </p>
              <p className="text-gray-700 leading-relaxed">
                La commande est validée après confirmation du paiement par Stripe.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Livraison</h2>
              <p className="text-gray-700 leading-relaxed">
                La livraison est <strong>instantanée et numérique</strong>. Vous recevez votre clé de licence 
                dans votre espace client dès que le paiement est confirmé (généralement sous quelques minutes).
              </p>
              <p className="text-gray-700 leading-relaxed">
                Un email de confirmation contenant votre clé et un guide d'installation est également envoyé 
                à l'adresse email fournie lors de la commande.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Droit de rétractation (produits numériques)
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Conformément à la réglementation européenne en vigueur, le droit de rétractation ne s'applique 
                généralement pas aux contenus numériques fournis de manière dématérialisée dont l'exécution a 
                commencé avec votre accord préalable exprès et votre renonciation expresse au droit de rétractation.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong className="text-blue-600">[CLAUSE_RETRACTATION_NUMERIQUE]</strong>
              </p>
              <p className="text-gray-700 leading-relaxed">
                En passant commande, vous reconnaissez que la fourniture immédiate de votre clé de licence 
                constitue le début de l'exécution du contrat et acceptez expressément de renoncer à votre 
                droit de rétractation dans les conditions prévues par la loi applicable.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Pour toute question relative au droit de rétractation applicable dans votre pays, veuillez 
                consulter notre <Link href="/legal/refund" className="text-blue-600 hover:underline">politique de remboursement</Link>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Garanties</h2>
              <p className="text-gray-700 leading-relaxed">
                Nous garantissons que les clés de licence fournies sont valides et fonctionnelles au moment 
                de la livraison.
              </p>
              <p className="text-gray-700 leading-relaxed">
                En cas de clé défectueuse ou invalide, veuillez contacter notre support via 
                <Link href="/account/support" className="text-blue-600 hover:underline"> l'espace client</Link> 
                dans les plus brefs délais. Nous procéderons à un remplacement ou à un remboursement selon le cas.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Responsabilité</h2>
              <p className="text-gray-700 leading-relaxed">
                AllKeyMasters ne saurait être tenu responsable d'une mauvaise utilisation des clés de licence 
                ou d'une incompatibilité avec votre système.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Nous déclinons toute responsabilité en cas d'interruption de service due à un cas de force majeure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Données personnelles</h2>
              <p className="text-gray-700 leading-relaxed">
                Vos données personnelles sont traitées conformément à notre 
                <Link href="/legal/privacy" className="text-blue-600 hover:underline"> politique de confidentialité</Link>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Droit applicable</h2>
              <p className="text-gray-700 leading-relaxed">
                Les présentes CGV sont régies par le droit <strong>[PAYS_APPLICABLE]</strong>.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Tout litige sera soumis aux tribunaux compétents de <strong>[JURIDICTION_COMPETENTE]</strong>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Contact</h2>
              <p className="text-gray-700 leading-relaxed">
                Pour toute question relative aux présentes CGV, contactez-nous à : 
                <strong> [EMAIL_CONTACT]</strong>
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
