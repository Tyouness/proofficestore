'use server';

/**
 * Server Action : Création de session Stripe Checkout sécurisée
 * 
 * ⚠️ RÈGLES DE SÉCURITÉ STRICTES :
 * - Ne JAMAIS faire confiance aux données client
 * - Recalculer TOUS les prix depuis Supabase
 * - Valider TOUS les inputs
 * - Aucune logique métier côté client
 * 
 * FLUX :
 * 1. Validation stricte des inputs
 * 2. Récupération des produits depuis Supabase
 * 3. Calcul serveur des prix (base_price + surcharge variant)
 * 4. Création commande (orders + order_items)
 * 5. Création session Stripe
 * 6. Retour URL de redirection uniquement
 */

import { createServerClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import { 
  stripe, 
  calculateProductPrice, 
  eurosToCents, 
  ALLOWED_VARIANTS,
  type ProductVariant 
} from '@/lib/stripe';
import type { 
  CheckoutItem, 
  CreateCheckoutSessionInput, 
  CreateCheckoutSessionResult 
} from '@/types/checkout';
import { shippingAddressSchema, cartHasPhysicalItems } from '@/lib/shipping-validation';
import crypto from 'crypto';

/**
 * Créer un hash stable du panier pour l'idempotence
 */
function generateCartHash(items: CheckoutItem[]): string {
  // Trier les items pour avoir un hash déterministe
  const sortedItems = [...items].sort((a, b) => {
    const keyA = `${a.productId}-${a.variant}`;
    const keyB = `${b.productId}-${b.variant}`;
    return keyA.localeCompare(keyB);
  });

  // Créer une représentation stable
  const cartString = sortedItems
    .map(item => `${item.productId}:${item.variant}:${item.quantity}`)
    .join('|');

  // Générer le hash SHA256
  return crypto.createHash('sha256').update(cartString).digest('hex');
}

/**
 * Valide un email de manière stricte
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Valide une variante de produit
 */
function isValidVariant(variant: string): variant is ProductVariant {
  return ALLOWED_VARIANTS.includes(variant as ProductVariant);
}

/**
 * Valide strictement tous les inputs
 */
function validateCheckoutInput(input: CreateCheckoutSessionInput): string | null {
  // Validation email
  if (!input.email || typeof input.email !== 'string') {
    return 'Email manquant';
  }
  
  if (!isValidEmail(input.email)) {
    return 'Format d\'email invalide';
  }

  // Validation items
  if (!input.items || !Array.isArray(input.items) || input.items.length === 0) {
    return 'Panier vide ou invalide';
  }

  if (input.items.length > 50) {
    return 'Trop d\'articles dans le panier (max 50)';
  }

  // Validation de chaque item
  for (const item of input.items) {
    if (!item.productId || typeof item.productId !== 'string') {
      return 'ID produit manquant ou invalide';
    }

    if (!isValidVariant(item.variant)) {
      return `Variante invalide: ${item.variant}. Valeurs autorisées: ${ALLOWED_VARIANTS.join(', ')}`;
    }

    if (typeof item.quantity !== 'number' || item.quantity < 1 || item.quantity > 100) {
      return 'Quantité invalide (doit être entre 1 et 100)';
    }

    if (!Number.isInteger(item.quantity)) {
      return 'La quantité doit être un nombre entier';
    }
  }

  // Validation de l'adresse si produits physiques
  const hasPhysical = cartHasPhysicalItems(input.items);
  if (hasPhysical) {
    if (!input.shippingAddress) {
      return 'Adresse de livraison requise pour les produits physiques';
    }
    
    const shippingValidation = shippingAddressSchema.safeParse(input.shippingAddress);
    if (!shippingValidation.success) {
      const firstError = shippingValidation.error.issues[0];
      return `Adresse invalide: ${firstError.message}`;
    }
  }

  return null;
}

/**
 * Server Action : Créer une session Stripe Checkout sécurisée
 * 
 * @param input - Items du panier + email client
 * @returns URL de redirection Stripe ou erreur
 */
export async function createStripeCheckoutSession(
  input: CreateCheckoutSessionInput
): Promise<CreateCheckoutSessionResult> {
  try {
    console.log('[CHECKOUT] 🚀 Début de création de session checkout');
    console.log('[CHECKOUT] 📧 Email reçu:', input.email);
    console.log('[CHECKOUT] 🛒 Items reçus:', JSON.stringify(input.items, null, 2));
    
    // ──────────────────────────────────────────────
    // DEBUG: Vérifier si les productId sont des slugs ou des UUID
    // ──────────────────────────────────────────────
    if (process.env.NODE_ENV === 'development') {
      input.items.forEach(item => {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.productId);
        const isSlug = /^[a-z0-9-]+$/.test(item.productId);
        console.log('[CHECKOUT] 🔍 Item debug:', {
          productId: item.productId,
          variant: item.variant,
          isUUID,
          isSlug,
          type: isUUID ? 'UUID' : isSlug ? 'SLUG' : 'UNKNOWN'
        });
      });
    }

    // ──────────────────────────────────────────────
    // 1️⃣ VALIDATION STRICTE DES INPUTS
    // ──────────────────────────────────────────────
    const validationError = validateCheckoutInput(input);
    if (validationError) {
      console.error('[CHECKOUT] ❌ Validation échouée:', validationError);
      return { success: false, error: validationError };
    }

    const { items, email } = input;
    const supabase = await createServerClient();

    // ──────────────────────────────────────────────
    // RÉCUPÉRATION UTILISATEUR AUTHENTIFIÉ
    // ──────────────────────────────────────────────
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('[CHECKOUT] DEBUG user:', user?.id, user?.email, 'error:', userError?.message);

    if (!user?.id) {
      console.error('[CHECKOUT] ❌ Utilisateur non authentifié');
      return { success: false, error: 'Unauthorized - Vous devez être connecté' };
    }

    // ──────────────────────────────────────────────
    // RATE LIMITING - Protection anti-spam
    // ──────────────────────────────────────────────
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    
    const { count: pendingCount } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .gt('created_at', tenMinutesAgo);

    if (pendingCount !== null && pendingCount >= 5) {
      return { 
        success: false, 
        error: 'Trop de tentatives de paiement. Réessayez dans 10 minutes.' 
      };
    }

    // ──────────────────────────────────────────────
    // Client Supabase ADMIN pour les opérations d'écriture
    // ⚠️ UTILISATION STRICTEMENT LIMITÉE aux INSERT dans orders et order_items
    // ──────────────────────────────────────────────
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[CHECKOUT] ❌ SUPABASE_SERVICE_ROLE_KEY manquante');
      return { success: false, error: 'Configuration serveur manquante' };
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    console.log('[CHECKOUT] ✅ Client Supabase admin créé pour les opérations d\'écriture');

    // ──────────────────────────────────────────────
    // 2️⃣ VÉRIFIER SI UNE COMMANDE EXISTE DÉJÀ (IDEMPOTENCE)
    // ⚠️ PRIORITAIRE: Vérifier AVANT de chercher les produits!
    // Si session valide existe → retour immédiat, pas besoin des produits
    // ──────────────────────────────────────────────
    const cartHash = generateCartHash(items);
    console.log('[CHECKOUT] 🔐 Cart hash généré:', cartHash);

    // Chercher une commande pending existante avec le même panier
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, stripe_session_id')
      .eq('user_id', user.id)
      .eq('cart_hash', cartHash)
      .eq('status', 'pending')
      .single();

    if (existingOrder?.stripe_session_id) {
      console.log('[CHECKOUT] ♻️ Commande pending existante trouvée:', existingOrder.id);
      
      // Vérifier si la session Stripe est encore valide
      try {
        const existingSession = await stripe.checkout.sessions.retrieve(existingOrder.stripe_session_id);
        
        // Vérifier si la session est ouverte ET récente (moins de 30 minutes)
        const sessionAge = Date.now() - (existingSession.created * 1000);
        const isRecent = sessionAge < 30 * 60 * 1000; // 30 minutes
        
        if (existingSession.status === 'open' && existingSession.url && isRecent) {
          console.log('[CHECKOUT] ✅ Session Stripe existante toujours valide, réutilisation');
          return {
            success: true,
            sessionUrl: existingSession.url,
          };
        } else {
          console.log('[CHECKOUT] ⏰ Session Stripe expirée/annulée (status:', existingSession.status, ', age:', Math.round(sessionAge / 60000), 'min), suppression de l\'ancienne commande');
          
          // Supprimer l'ancienne commande et ses items
          await supabaseAdmin.from('order_items').delete().eq('order_id', existingOrder.id);
          await supabaseAdmin.from('orders').delete().eq('id', existingOrder.id);
          
          console.log('[CHECKOUT] 🗑️ Ancienne commande supprimée, création d\'une nouvelle');
        }
      } catch (error) {
        console.log('[CHECKOUT] ⚠️ Erreur lors de la récupération de la session existante, suppression de l\'ancienne commande');
        
        // Supprimer l'ancienne commande en cas d'erreur
        await supabaseAdmin.from('order_items').delete().eq('order_id', existingOrder.id);
        await supabaseAdmin.from('orders').delete().eq('id', existingOrder.id);
        
        console.log('[CHECKOUT] 🗑️ Ancienne commande supprimée, création d\'une nouvelle');
      }
    }

    // ──────────────────────────────────────────────
    // 3️⃣ RÉCUPÉRATION DES PRODUITS DEPUIS SUPABASE
    // ──────────────────────────────────────────────
    // Le productId reçu EST DÉJÀ le slug complet (ex: 'office-2019-professional-plus-digital-key')
    const uniqueProductSlugs = [...new Set(items.map(item => item.productId))];
    
    console.log('[CHECKOUT] 🔍 Recherche des produits avec slugs complets:', uniqueProductSlugs);

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('slug, name, base_price, price')
      .in('slug', uniqueProductSlugs);

    if (productsError) {
      console.error('[CHECKOUT] ❌ Erreur Supabase lors de la récupération des produits:');
      console.error('[CHECKOUT] Error object:', JSON.stringify(productsError, null, 2));
      console.error('[CHECKOUT] Error details:', productsError);
      return { success: false, error: 'Erreur lors de la récupération des produits' };
    }

    console.log('[CHECKOUT] ✅ Produits trouvés:', products?.length || 0);
    console.log('[CHECKOUT] 📦 Données produits:', JSON.stringify(products, null, 2));

    if (!products || products.length === 0) {
      console.error('[CHECKOUT] ❌ Aucun produit trouvé dans Supabase');
      console.error('[CHECKOUT] Slugs recherchés:', uniqueProductSlugs);
      return { success: false, error: 'Aucun produit trouvé' };
    }

    // Vérifier que tous les produits existent
    if (products.length !== uniqueProductSlugs.length) {
      console.error('[CHECKOUT] ❌ Produits manquants');
      console.error('[CHECKOUT] Attendus:', uniqueProductSlugs.length);
      console.error('[CHECKOUT] Trouvés:', products.length);
      console.error('[CHECKOUT] Slugs attendus:', uniqueProductSlugs);
      console.error('[CHECKOUT] Slugs trouvés:', products.map(p => p.slug));
      return { success: false, error: 'Certains produits sont introuvables' };
    }

    // ──────────────────────────────────────────────
    // 4️⃣ CALCUL SERVEUR DES PRIX (NEVER TRUST CLIENT)
    // ──────────────────────────────────────────────
    const productsMap = new Map(
      products.map(p => [p.slug, { name: p.name, basePrice: p.base_price, price: p.price }])
    );

    let totalAmountEuros = 0;
    const orderItems: Array<{
      product_id: string;
      product_name: string;
      variant: ProductVariant;
      unit_price: number;
      quantity: number;
    }> = [];

    for (const item of items) {
      // Le productId est déjà le slug complet (ex: 'office-2024-professional-plus-digital-key')
      const product = productsMap.get(item.productId);
      
      if (!product) {
        console.error('[CHECKOUT] ❌ Produit introuvable dans la map:', item.productId);
        return { success: false, error: `Produit ${item.productId} introuvable` };
      }

      // Utiliser le prix promotionnel si disponible, sinon le prix de base
      // ⚠️ CRITIQUE : toujours prendre le prix le plus bas pour éviter surcharge client
      const unitPriceEuros = product.price && product.price < product.basePrice
        ? product.price
        : product.basePrice;
      const lineTotalEuros = unitPriceEuros * item.quantity;
      
      console.log('[CHECKOUT] 💰 Prix produit:', product.name, '- Base:', product.basePrice, '- Prix actuel:', product.price, '- Utilisé:', unitPriceEuros);
      
      totalAmountEuros += lineTotalEuros;

      orderItems.push({
        product_id: item.productId,  // Utiliser le slug complet directement
        product_name: product.name,
        variant: item.variant,
        unit_price: eurosToCents(unitPriceEuros),
        quantity: item.quantity,
      });
    }

    const totalAmountCents = eurosToCents(totalAmountEuros);
    console.log('[CHECKOUT] 💰 Total calculé:', totalAmountEuros, '€ (', totalAmountCents, 'centimes)');
    console.log('[CHECKOUT] 📋 Order items préparés:', JSON.stringify(orderItems, null, 2));

    // ──────────────────────────────────────────────
    // 5️⃣ CRÉATION DE LA COMMANDE (status: pending)
    // ⚠️ Utilisation du client ADMIN pour contourner le RLS
    // ──────────────────────────────────────────────
    console.log('[CHECKOUT] 💾 Tentative de création de commande dans Supabase...');
    
    const orderData: Record<string, any> = {
      user_id: user.id,
      email_client: email.toLowerCase().trim(),
      status: 'pending' as const,
      total_amount: totalAmountCents,
      stripe_session_id: null,
      cart_hash: cartHash,
    };

    // Ajouter l'adresse de livraison si produits physiques
    if (input.shippingAddress) {
      orderData.shipping_name = input.shippingAddress.shipping_name;
      orderData.shipping_address = input.shippingAddress.shipping_address;
      orderData.shipping_zip = input.shippingAddress.shipping_zip;
      orderData.shipping_city = input.shippingAddress.shipping_city;
      orderData.shipping_country = input.shippingAddress.shipping_country;
      orderData.shipping_phone_prefix = input.shippingAddress.shipping_phone_prefix;
      orderData.shipping_phone_number = input.shippingAddress.shipping_phone_number;
      // shipping_status sera auto-set à 'pending' par le trigger SQL
      console.log('[CHECKOUT] 📦 Commande physique détectée, adresse ajoutée');
    }

    console.log('[CHECKOUT] 📝 Données commande:', JSON.stringify(orderData, null, 2));

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error('[CHECKOUT] ❌ ERREUR lors de la création de la commande');
      console.error('[CHECKOUT] Error object:', JSON.stringify(orderError, null, 2));
      console.error('[CHECKOUT] Error details:', orderError);
      console.error('[CHECKOUT] Error code:', orderError.code);
      console.error('[CHECKOUT] Error message:', orderError.message);
      console.error('[CHECKOUT] Error details:', orderError.details);
      console.error('[CHECKOUT] Error hint:', orderError.hint);
      return { success: false, error: 'Impossible de créer la commande' };
    }

    if (!order) {
      console.error('[CHECKOUT] ❌ Commande créée mais aucune donnée retournée');
      return { success: false, error: 'Impossible de créer la commande' };
    }

    console.log('[CHECKOUT] ✅ Commande créée avec succès, ID:', order.id);

    // Insertion des lignes de commande
    // ⚠️ Utilisation du client ADMIN pour contourner le RLS
    console.log('[CHECKOUT] 💾 Insertion des lignes de commande...');
    const orderItemsToInsert = orderItems.map(item => ({
      order_id: order.id,
      ...item,
    }));
    console.log('[CHECKOUT] 📋 Order items à insérer:', JSON.stringify(orderItemsToInsert, null, 2));

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItemsToInsert);

    if (itemsError) {
      console.error('[CHECKOUT] ❌ Erreur lors de la création des lignes de commande');
      console.error('[CHECKOUT] Error object:', JSON.stringify(itemsError, null, 2));
      console.error('[CHECKOUT] Error details:', itemsError);
      
      // Rollback : supprimer la commande
      console.log('[CHECKOUT] 🔄 Rollback: suppression de la commande...');
      await supabaseAdmin.from('orders').delete().eq('id', order.id);
      return { success: false, error: 'Erreur lors de la création des lignes de commande' };
    }

    console.log('[CHECKOUT] ✅ Lignes de commande créées avec succès');

    // ──────────────────────────────────────────────
    // 6️⃣ CRÉATION SESSION STRIPE CHECKOUT
    // ──────────────────────────────────────────────
    console.log('[CHECKOUT] 💳 Création de la session Stripe...');
    const lineItems = orderItems.map(item => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: `${item.product_name} (${item.variant.toUpperCase()})`,
          description: `Licence Microsoft ${item.product_name}`,
        },
        unit_amount: item.unit_price,
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      customer_email: email.toLowerCase().trim(),
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL}/checkout/cancel`,
      metadata: {
        order_id: order.id,  // snake_case pour cohérence webhook
        user_id: user.id,
      },
      expires_at: Math.floor(Date.now() / 1000) + (60 * 60), // Expire après 1 heure (sécurité)
    });

    console.log('[CHECKOUT] ✅ Session Stripe créée, ID:', session.id);
    console.log('[CHECKOUT] 🔗 URL de checkout:', session.url);
    console.log('[CHECKOUT] 📦 Metadata envoyée:', { order_id: order.id, user_id: user.id });

    // Mise à jour de la commande avec le session_id
    // ⚠️ Utilisation du client ADMIN pour contourner le RLS
    console.log('[CHECKOUT] 💾 Mise à jour de la commande avec session_id...');
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ stripe_session_id: session.id })
      .eq('id', order.id);

    if (updateError) {
      console.error('[CHECKOUT] ❌ Erreur lors de la mise à jour de la commande');
      console.error('[CHECKOUT] Error object:', JSON.stringify(updateError, null, 2));
      console.error('[CHECKOUT] Error details:', updateError);
      return { success: false, error: 'Erreur lors de la mise à jour de la commande' };
    }

    console.log('[CHECKOUT] ✅ Commande mise à jour avec session_id');

    // ──────────────────────────────────────────────
    // 7️⃣ RETOUR URL UNIQUEMENT (aucune donnée sensible)
    // ──────────────────────────────────────────────
    console.log('[CHECKOUT] 🎉 Session checkout créée avec succès!');
    return {
      success: true,
      sessionUrl: session.url!,
    };

  } catch (error) {
    // Log serveur détaillé
    console.error('[CHECKOUT] ❌ ❌ ❌ ERREUR CRITIQUE ❌ ❌ ❌');
    console.error('[CHECKOUT] Error object complet:', error);
    console.error('[CHECKOUT] Error stringifié:', JSON.stringify(error, null, 2));
    
    if (error instanceof Error) {
      console.error('[CHECKOUT] Error name:', error.name);
      console.error('[CHECKOUT] Error message:', error.message);
      console.error('[CHECKOUT] Error stack:', error.stack);
    }
    
    return {
      success: false,
      error: 'Une erreur est survenue lors de la création de la session de paiement',
    };
  }
}
