import { Metadata } from 'next';
import ShippingManager from './ShippingManager';

export const metadata: Metadata = {
  title: 'Gestion des Expéditions - Admin',
  robots: { index: false, follow: false },
};

export default function AdminShippingPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📦 Gestion des Expéditions
        </h1>
        <p className="text-gray-600">
          Gérez les commandes physiques (DVD/USB) en attente d'expédition
        </p>
      </div>

      <ShippingManager />
    </div>
  );
}
