import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase-server';
import ReviewForm from './ReviewForm';
import DeliveryTracker from './DeliveryTracker';

export default async function AccountPage() {
  const supabase = await createServerClient();
  
  // Récupérer l'utilisateur authentifié
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  // Redirection si non authentifié
  if (!user || userError) {
    redirect('/login');
  }

  // Récupérer les commandes de l'utilisateur via user_id (RLS appliqué automatiquement)
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id,
      created_at,
      status,
      total_amount,
      user_id,
      shipping_name,
      shipping_address,
      shipping_city,
      shipping_country,
      shipping_status,
      tracking_number,
      order_items (
        product_id,
        product_name,
        quantity
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[ACCOUNT] Erreur commandes:', error);
  }

  // Filtrer seulement les commandes payées pour affichage
  const paidOrders = orders?.filter((o: any) => o.status === 'paid') || [];

  // Récupérer les UUIDs réels des produits à partir des slugs
  const productSlugs = new Set<string>();
  paidOrders.forEach((order: any) => {
    order.order_items?.forEach((item: any) => {
      productSlugs.add(item.product_id);
    });
  });

  const { data: products } = productSlugs.size > 0
    ? await supabase
        .from('products')
        .select('id, slug')
        .in('slug', Array.from(productSlugs))
    : { data: [] };

  // Créer un mapping slug → UUID
  const slugToUuidMap = new Map<string, string>();
  products?.forEach((product: any) => {
    slugToUuidMap.set(product.slug, product.id);
  });

  // Récupérer les licences pour toutes les commandes payées (RLS appliqué automatiquement)
  const orderIds = paidOrders.map((o: any) => o.id);
  
  const { data: licenses, error: licensesError } = orderIds.length > 0
    ? await supabase
        .from('licenses')
        .select('order_id, product_id, key_code, is_used')
        .in('order_id', orderIds)
        .eq('is_used', true)
    : { data: [], error: null };

  if (licensesError) {
    console.error('[ACCOUNT] Erreur licenses:', licensesError);
  }

  // Récupérer les avis existants pour cet utilisateur (uniquement actifs)
  const { data: existingReviews, error: reviewsError } = orderIds.length > 0
    ? await supabase
        .from('reviews')
        .select('order_id, product_id, rating, comment, created_at')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .in('order_id', orderIds)
    : { data: [], error: null };

  if (reviewsError) {
    console.error('[ACCOUNT] Erreur reviews:', reviewsError);
  }

  // Créer un mapping order_id + product_id → review
  const reviewMap = new Map<string, any>();
  existingReviews?.forEach((review: any) => {
    const key = `${review.order_id}-${review.product_id}`;
    reviewMap.set(key, review);
  });

  // Créer un mapping order_id + product_id → ARRAY de license_keys (supporter quantity > 1)
  const licenseMap = new Map<string, string[]>();
  licenses?.forEach((license: any) => {
    const key = `${license.order_id}-${license.product_id}`;
    if (!licenseMap.has(key)) {
      licenseMap.set(key, []);
    }
    licenseMap.get(key)!.push(license.key_code);
  });

  // Récupérer les tickets récents (les 3 derniers)
  const { data: recentTickets } = await supabase
    .from('support_tickets')
    .select('id, subject, status, created_at, unread_count')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Mes commandes & licences</h1>
        <p className="text-gray-600">
          Retrouvez toutes vos licences et commandes ci-dessous
        </p>
      </div>

      {/* Tickets récents */}
      {recentTickets && recentTickets.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              💬 Tickets récents
              {recentTickets.filter(t => t.unread_count && t.unread_count > 0).length > 0 && (
                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                  {recentTickets.reduce((sum, t) => sum + (t.unread_count || 0), 0)}
                </span>
              )}
            </h2>
            <a
              href="/account/support"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Voir tous les tickets →
            </a>
          </div>
          <div className="space-y-3">
            {recentTickets.map((ticket: any) => (
              <a
                key={ticket.id}
                href={`/account/support/${ticket.id}`}
                className="block border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-400 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      {ticket.subject}
                      {ticket.unread_count && ticket.unread_count > 0 && (
                        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                          {ticket.unread_count}
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(ticket.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      ticket.status === 'open'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {ticket.status === 'open' ? '● Ouvert' : '✓ Fermé'}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Liste des commandes */}
      {!paidOrders || paidOrders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            Aucun achat pour le moment
          </h2>
          <p className="text-gray-500 mb-6">
            Vous n'avez encore effectué aucun achat.
          </p>
          <a
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Découvrir nos produits
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          {paidOrders.map((order: any) => (
            <div
              key={order.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
                {/* En-tête de commande */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold">
                        Commande du{' '}
                        {new Date(order.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </h3>
                      <p className="text-blue-100 text-sm">
                        Total : {(order.total_amount / 100).toFixed(2)} €
                      </p>
                    </div>
                    <div className="bg-green-500 px-3 py-1 rounded-full text-sm font-medium">
                      ✓ Payé
                    </div>
                  </div>
                </div>

                {/* Produits et licences */}
                <div className="p-6 space-y-4">
                  {order.order_items?.map((item: any, idx: number) => {
                    // Convertir le slug en UUID réel
                    const realProductId = slugToUuidMap.get(item.product_id) || item.product_id;
                    const licenseKeys = licenseMap.get(`${order.id}-${item.product_id}`) || [];
                    const existingReview = reviewMap.get(`${order.id}-${realProductId}`);
                    
                    return (
                      <div
                        key={idx}
                        className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">
                              {item.product_name}
                            </h4>
                            <p className="text-sm text-gray-500">
                              Quantité : {item.quantity}
                            </p>
                            {/* Debug: afficher les UUIDs en dev */}
                            {process.env.NODE_ENV === 'development' && (
                              <p className="text-xs text-gray-400 mt-1 font-mono">
                                Slug: {item.product_id} | UUID: {realProductId} | Order: {order.id}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Clé(s) de licence */}
                        {licenseKeys.length > 0 ? (
                          <div className="mt-4 space-y-3">
                            <label className="block text-sm font-medium text-gray-700">
                              🔑 {licenseKeys.length > 1 ? 'Vos clés d\'activation :' : 'Votre clé d\'activation :'}
                            </label>
                            {licenseKeys.map((key, keyIdx) => (
                              <div
                                key={keyIdx}
                                className="bg-white border-2 border-blue-500 rounded-lg p-4 font-mono text-lg text-center tracking-wider text-blue-900 font-bold select-all"
                              >
                                {key}
                              </div>
                            ))}
                            <p className="text-xs text-gray-500">
                              💡 Cliquez sur une clé pour la sélectionner et la copier
                            </p>

                            {/* Guide d'installation */}
                            <details className="mt-4 bg-blue-50 border border-blue-200 rounded-lg">
                              <summary className="px-4 py-3 cursor-pointer text-blue-900 font-semibold hover:bg-blue-100 transition">
                                📖 Guide d'installation
                              </summary>
                              <div className="px-4 py-3 text-sm text-gray-700 space-y-3 border-t border-blue-200">
                                <div>
                                  <h5 className="font-semibold text-gray-900 mb-2">
                                    🚀 Activation Standard
                                  </h5>
                                  <ol className="list-decimal list-inside space-y-1 ml-2">
                                    <li>
                                      Rendez-vous sur{' '}
                                      <a
                                        href="https://setup.office.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 underline"
                                      >
                                        setup.office.com
                                      </a>
                                    </li>
                                    <li>Connectez-vous avec votre compte Microsoft</li>
                                    <li>Entrez la clé fournie ci-dessus</li>
                                    <li>Téléchargez et installez votre logiciel</li>
                                  </ol>
                                </div>

                                <div className="border-t border-blue-200 pt-3">
                                  <h5 className="font-semibold text-gray-900 mb-2">
                                    🛠️ En cas d'erreur
                                  </h5>
                                  <p className="mb-2">
                                    <strong>Étape A :</strong> Créez un{' '}
                                    <strong>NOUVEAU</strong> compte Microsoft et
                                    réessayez (résout 90% des bugs).
                                  </p>
                                  <p className="mb-2">
                                    <strong>Étape B :</strong> Utilisez l'activation
                                    par téléphone dans l'assistant d'activation
                                    (Installation ID → Confirmation ID).
                                  </p>
                                  <p>
                                    <strong>Étape C :</strong> Contactez notre support
                                    à{' '}
                                    <a
                                      href="mailto:allkeymasters@gmail.com"
                                      className="text-blue-600 underline"
                                    >
                                      allkeymasters@gmail.com
                                    </a>
                                  </p>
                                </div>
                              </div>
                            </details>

                            {/* Formulaire d'avis */}
                            <ReviewForm
                              orderId={order.id}
                              productId={realProductId}
                              productName={item.product_name}
                              existingReview={existingReview}
                            />
                          </div>
                        ) : (
                          // Commande physique - Afficher le statut de livraison
                          order.shipping_name ? (
                            <DeliveryTracker
                              trackingNumber={order.tracking_number || ''}
                              shippingStatus={order.shipping_status || 'pending'}
                              shippingName={order.shipping_name}
                              shippingAddress={order.shipping_address || ''}
                              shippingCity={order.shipping_city || ''}
                              shippingPostalCode={order.shipping_postal_code || ''}
                              shippingCountry={order.shipping_country || ''}
                            />
                          ) : item.product_id.endsWith('-digital-key') ? (
                            // Produit digital sans licence encore attribuée
                            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
                              ⚠️ Licence en cours d'attribution. Veuillez actualiser la page dans quelques instants.
                            </div>
                          ) : (
                            // Produit physique sans information de livraison (en cours de traitement)
                            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800">
                              📦 Votre commande est en cours de traitement. Les informations de livraison seront mises à jour très prochainement.
                            </div>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}


