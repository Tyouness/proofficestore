import Link from 'next/link';
import { BUSINESS_INFO } from '@/config/business';

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
                (clés de licence logicielle) proposés par <strong>{BUSINESS_INFO.companyName}</strong> via le site {BUSINESS_INFO.website}.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Toute commande implique l'acceptation sans réserve des présentes CGV.
              </p>
              <p className="text-gray-700 leading-relaxed mt-3">
                <strong>Coordonnées du vendeur :</strong><br />
                {BUSINESS_INFO.companyName}<br />
                Email : <a href={`mailto:${BUSINESS_INFO.email}`} className="text-blue-600 hover:underline">{BUSINESS_INFO.email}</a><br />
                Téléphone : <a href={`tel:${BUSINESS_INFO.phone}`} className="text-blue-600 hover:underline">{BUSINESS_INFO.phone}</a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Produits</h2>
              <p className="text-gray-700 leading-relaxed">
                {BUSINESS_INFO.companyName} commercialise exclusivement des <strong>produits numériques</strong> : 
                clés de licence pour logiciels Microsoft (Windows, Office, serveurs, etc.).
              </p>
              <p className="text-gray-700 leading-relaxed">
                Les clés sont livrées de manière entièrement numérique et sont affichées dans votre espace client 
                (<code className="bg-gray-100 px-2 py-1 rounded">/account</code>) immédiatement après validation du paiement.
              </p>
              <p className="text-gray-700 leading-relaxed mt-3">
                <strong>Important :</strong> Aucun produit physique n'est envoyé. Il s'agit uniquement de licences numériques.
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
                La livraison est <strong>instantanée et numérique</strong>. Vos clés de licence sont disponibles 
                dans <strong>deux endroits</strong> :
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mt-3">
                <li>
                  <strong>Votre espace client</strong> (<Link href="/account" className="text-blue-600 hover:underline">/account</Link>) : 
                  vos clés sont affichées immédiatement après confirmation du paiement
                </li>
                <li>
                  <strong>Par email</strong> : un email de confirmation contenant vos clés et un guide d'installation 
                  est envoyé à l'adresse fournie lors de la commande
                </li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                💡 <strong>Astuce :</strong> Privilégiez votre espace client pour accéder à vos clés à tout moment.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Droit de rétractation (produits numériques)
              </h2>
              <p className="text-gray-700 leading-relaxed">
                <strong>Conformément à l'article L221-28 du Code de la Consommation français,</strong> le droit 
                de rétractation ne s'applique pas aux contenus numériques fournis de manière dématérialisée 
                dont l'exécution a commencé avec votre accord préalable exprès et votre renonciation expresse 
                au droit de rétractation.
              </p>
              <p className="text-gray-700 leading-relaxed mt-3 bg-blue-50 border-l-4 border-blue-600 p-4">
                <strong>📌 Clause importante :</strong> En passant commande sur {BUSINESS_INFO.companyName}, vous reconnaissez 
                que la fourniture immédiate de votre clé de licence constitue le début de l'exécution du contrat 
                et acceptez expressément de renoncer à votre droit de rétractation dès la livraison de la clé numérique.
              </p>
              <p className="text-gray-700 leading-relaxed mt-3">
                Cette renonciation est obligatoire pour les produits numériques livrés instantanément et ne peut 
                être révoquée une fois la clé affichée dans votre espace client.
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
                En cas de clé défectueuse ou invalide, veuillez contacter notre support :
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mt-3">
                <li>
                  <strong>Recommandé :</strong> Créez un ticket via <Link href="/account/support" className="text-blue-600 hover:underline">votre espace client</Link> (réponse rapide, suivi complet)
                </li>
                <li>
                  <strong>Cas urgents :</strong> Email à <a href="mailto:support@allkeymasters.com" className="text-blue-600 hover:underline">support@allkeymasters.com</a> (délai plus long)
                </li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                Nous procéderons à un remplacement ou à un remboursement selon le cas.<br />
                <strong>Horaires :</strong> {BUSINESS_INFO.support.hours}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Responsabilité</h2>
              <p className="text-gray-700 leading-relaxed">
                {BUSINESS_INFO.companyName} ne saurait être tenu responsable d'une mauvaise utilisation des clés de licence 
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
                Les présentes CGV sont régies par le droit français.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Tout litige sera soumis aux tribunaux compétents du ressort du siège social de {BUSINESS_INFO.companyName}.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Contact</h2>
              <p className="text-gray-700 leading-relaxed">
                Pour toute question relative aux présentes CGV, contactez-nous :
              </p>
              <ul className="list-none space-y-2 mt-3">
                <li>� <strong>Support prioritaire :</strong> <Link href="/account/support" className="text-blue-600 hover:underline">Tickets dans votre espace client</Link></li>
                <li>📧 Email : <a href={`mailto:${BUSINESS_INFO.email}`} className="text-blue-600 hover:underline">{BUSINESS_INFO.email}</a></li>
                <li>📞 Téléphone : <a href={`tel:${BUSINESS_INFO.phone}`} className="text-blue-600 hover:underline">{BUSINESS_INFO.phone}</a></li>
              </ul>
            </section>

            <p className="text-sm text-gray-500 mt-8">
              Dernière mise à jour : <strong>{new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
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
