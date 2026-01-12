import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* À propos */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">AllKeyMasters</h3>
            <p className="text-sm leading-relaxed">
              Licences Microsoft officielles au meilleur prix avec livraison instantanée.
            </p>
          </div>

          {/* Produits */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Produits</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/#products" className="hover:text-white transition-colors">
                  Windows
                </Link>
              </li>
              <li>
                <Link href="/#products" className="hover:text-white transition-colors">
                  Office
                </Link>
              </li>
              <li>
                <Link href="/#products" className="hover:text-white transition-colors">
                  Serveurs
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/account/support" className="hover:text-white transition-colors">
                  Aide & Contact
                </Link>
              </li>
              <li>
                <Link href="/account" className="hover:text-white transition-colors">
                  Mon Compte
                </Link>
              </li>
              <li>
                <Link href="/legal/refund" className="hover:text-white transition-colors">
                  Remboursements
                </Link>
              </li>
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Légal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/legal/terms" className="hover:text-white transition-colors">
                  CGV
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="hover:text-white transition-colors">
                  Confidentialité
                </Link>
              </li>
              <li>
                <Link href="/legal/refund" className="hover:text-white transition-colors">
                  Remboursement
                </Link>
              </li>
              <li>
                <Link href="/legal/imprint" className="hover:text-white transition-colors">
                  Mentions légales
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bas du footer */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>
            © {new Date().getFullYear()} AllKeyMasters. Tous droits réservés.
          </p>
          <p className="text-gray-500 mt-2">
            Paiement sécurisé par Stripe • Livraison instantanée
          </p>
        </div>
      </div>
    </footer>
  );
}
