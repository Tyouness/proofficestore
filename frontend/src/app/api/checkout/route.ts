/**
 * API Route : Création de session Stripe Checkout avec compte obligatoire
 * 
 * SÉCURITÉ :
 * ✅ Rate limiting (write: 30 req/min)
 * ✅ Validation stricte Zod
 * ✅ Authentification SSR Supabase
 * ✅ Idempotence via cart_hash (session Stripe réutilisée si open+unpaid)
 * ✅ Rollback si échec Stripe
 * ✅ 1 requête products + 1 requête variants (pas de N+1)
 * ✅ Montants en centimes (integers, pas de floats)
 * 
 * FLUX :
 * 1. Rate limit check (IP + user)
 * 2. Créer client Supabase server (SSR)
 * 3. Récupérer user via supabase.auth.getUser()
 * 4. Validation stricte inputs (Zod)
 * 5. Calculer cart_hash des items
 * 6. Vérifier commande pending existante (idempotence)
 * 7. Valider produits + variants en DB (2 queries batch)
 * 8. Créer orders avec user_id + cart_hash
 * 9. Créer order_items
 * 10. Créer session Stripe avec metadata
 * 11. Rollback si échec Stripe
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import crypto from 'crypto';
import { z } from 'zod';
import { rateLimit, getClientIdentifier, getUserIdentifier } from '@/lib/rateLimit';
import { checkoutItemsSchema, parseOrThrow } from '@/lib/validation';
import { env } from '@/lib/env';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover',
  timeout: 10000, // 10s timeout
  maxNetworkRetries: 2,
});

// Types Zod (inféré depuis schema validation)
type CheckoutItem = z.infer<typeof checkoutItemsSchema>[number];

/**
 * Vérifier si une session Stripe est réutilisable
 * Conditions: open + unpaid + non expirée
 */
function isStripeSessionReusable(session: Stripe.Checkout.Session): boolean {
  const now = Math.floor(Date.now() / 1000);
  
  return (
    session.status === 'open' &&
    session.payment_status === 'unpaid' &&
    typeof session.expires_at === 'number' &&
    session.expires_at > now &&
    typeof session.url === 'string' &&
    session.url.length > 0
  );
}

/**
 * Créer un hash stable du panier pour l'idempotence
 */
function generateCartHash(items: CheckoutItem[]): string {
  // Trier les items pour avoir un hash déterministe
  const sortedItems = [...items].sort((a, b) => {
    const keyA = `${a.product_id}-${a.variant_id}`;
    const keyB = `${b.product_id}-${b.variant_id}`;
    return keyA.localeCompare(keyB);
  });

  // Créer une représentation stable
  const cartString = sortedItems
    .map(item => `${item.product_id}:${item.variant_id}:${item.quantity}`)
    .join('|');

  // Générer le hash SHA256
  return crypto.createHash('sha256').update(cartString).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    // ── 1. RATE LIMITING (IP-based) ──
    const ipIdentifier = getClientIdentifier(request);
    const ipLimit = await rateLimit(ipIdentifier, 'write');
    
    if (!ipLimit.success) {
      return NextResponse.json(
        { 
          error: 'Trop de requêtes', 
          retryAfter: ipLimit.retryAfter 
        },
        { 
          status: 429,
          headers: ipLimit.headers
        }
      );
    }

    // ── 2. AUTHENTIFICATION (SSR Supabase) ──
    const { createServerClient } = await import('@/lib/supabase-server');
    const supabase = await createServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // ── 3. RATE LIMITING (User-based en plus) ──
    const userIdentifier = getUserIdentifier(user.id);
    const userLimit = await rateLimit(userIdentifier, 'write');
    
    if (!userLimit.success) {
      return NextResponse.json(
        { 
          error: 'Trop de requêtes pour cet utilisateur', 
          retryAfter: userLimit.retryAfter 
        },
        { 
          status: 429,
          headers: userLimit.headers
        }
      );
    }

    // ── 4. VALIDATION STRICTE DES INPUTS (ZOD) ──
    let rawBody;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'JSON invalide' },
        { status: 400 }
      );
    }

    // Valider avec Zod
    const items = parseOrThrow(
      checkoutItemsSchema,
      rawBody.items,
      'checkout items'
    );

    // Calculer le hash du panier pour l'idempotence
    const cartHash = generateCartHash(items);

    // IDEMPOTENCE : Vérifier s'il existe déjà une commande pending identique
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data: existingOrders } = await supabase
      .from('orders')
      .select('id, stripe_session_id, created_at')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .eq('cart_hash', cartHash)
      .gte('created_at', fifteenMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(1);

    if (existingOrders && existingOrders.length > 0) {
      const recentOrder = existingOrders[0];
      
      // Si une session Stripe existe déjà, la réutiliser SI ELLE EST VALIDE
      if (recentOrder.stripe_session_id) {
        try {
          const existingSession = await stripe.checkout.sessions.retrieve(recentOrder.stripe_session_id);
          
          // Vérifier que la session est réutilisable (open + unpaid + non expirée)
          if (isStripeSessionReusable(existingSession)) {
            return NextResponse.json({
              url: existingSession.url,
              sessionId: existingSession.id,
            });
          }
        } catch (err) {
          // Session invalide/expirée, continuer pour créer une nouvelle
        }
      }
    }

    // ── 5. VALIDATION PRODUITS (1 query batch) ──
    const productIds = [...new Set(items.map(item => item.product_id))];
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, slug, base_price')
      .in('id', productIds);

    if (productsError || !products || products.length === 0) {
      return NextResponse.json(
        { error: 'Produits introuvables' },
        { status: 404 }
      );
    }

    // Typage des produits
    type Product = {
      id: string;
      name: string;
      slug: string;
      base_price: number;
    };

    type Variant = {
      id: string;
      product_id: string;
      variant_type: string;
      price_modifier: number | null;
    };

    // Map produits par ID
    const productMap = new Map<string, Product>(products.map((p: any) => [p.id, p]));

    // ── 6. VALIDATION VARIANTS (1 query batch - FIX N+1) ──
    const variantIds = [...new Set(items.map(item => item.variant_id))];
    const { data: variants, error: variantsError } = await supabase
      .from('product_variants')
      .select('id, product_id, variant_type, price_modifier')
      .in('id', variantIds);

    if (variantsError || !variants || variants.length === 0) {
      return NextResponse.json(
        { error: 'Variants introuvables' },
        { status: 404 }
      );
    }

    // Map variants par ID
    const variantMap = new Map<string, Variant>(variants.map((v: any) => [v.id, v]));

    // ── 7. CALCULER TOTAL + ENRICHIR ITEMS (MONTANTS EN CENTIMES) ──
    let totalAmountCents = 0;
    const enrichedItems: Array<{
      product_id: string;
      variant_id: string;
      product_name: string;
      variant_type: string;
      quantity: number;
      unit_price_cents: number;
    }> = [];

    for (const item of items) {
      const product = productMap.get(item.product_id);
      if (!product) {
        return NextResponse.json(
          { error: `Produit ${item.product_id} introuvable` },
          { status: 404 }
        );
      }

      const variant = variantMap.get(item.variant_id);
      if (!variant) {
        return NextResponse.json(
          { error: `Variant ${item.variant_id} introuvable` },
          { status: 404 }
        );
      }

      // VALIDATION ANTI-FRAUDE: variant appartient bien au produit
      if (variant.product_id !== product.id) {
        return NextResponse.json(
          { error: `Variant ${item.variant_id} incompatible avec produit ${item.product_id}` },
          { status: 400 }
        );
      }

      // MONTANTS EN CENTIMES (integers) - pas de floats
      const basePriceCents = Math.round(product.base_price * 100);
      const priceModifierCents = Math.round((variant.price_modifier || 0) * 100);
      const unitPriceCents = basePriceCents + priceModifierCents;
      const lineTotalCents = unitPriceCents * item.quantity;
      
      totalAmountCents += lineTotalCents;

      enrichedItems.push({
        product_id: product.id,
        variant_id: variant.id,
        product_name: product.name,
        variant_type: variant.variant_type,
        quantity: item.quantity,
        unit_price_cents: unitPriceCents,
      });
    }

    // ── 8. CRÉER COMMANDE (avec handling 23505 idempotent) ──
    const orderPayload = {
      user_id: user.id,
      email_client: user.email,
      status: 'pending' as const,
      total_amount: totalAmountCents, // Déjà en centimes
      cart_hash: cartHash,
    };

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderPayload)
      .select()
      .single();

    if (orderError) {
      // GESTION IDEMPOTENTE unique violation (code 23505)
      if (orderError.code === '23505') {
        if (env.NODE_ENV !== 'production') {
          console.log('[CHECKOUT] ⚠️ Unique constraint violation - tentative récupération session existante');
        }
        
        // Chercher la commande pending existante
        const { data: existingPendingOrder } = await supabase
          .from('orders')
          .select('id, stripe_session_id, created_at')
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .eq('cart_hash', cartHash)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Si session Stripe existe, tenter de la récupérer
        if (existingPendingOrder?.stripe_session_id) {
          try {
            const existingSession = await stripe.checkout.sessions.retrieve(existingPendingOrder.stripe_session_id);
            
            // Vérifier que la session est réutilisable
            if (isStripeSessionReusable(existingSession)) {
              if (env.NODE_ENV !== 'production') {
                console.log('[CHECKOUT] ✓ Session Stripe existante récupérée');
              }
              return NextResponse.json({
                url: existingSession.url,
                sessionId: existingSession.id,
              });
            }
          } catch (stripeErr) {
            if (env.NODE_ENV !== 'production') {
              console.log('[CHECKOUT] Session Stripe expirée ou invalide');
            }
          }
        }

        // Session invalide ou inexistante
        return NextResponse.json(
          { error: 'Une commande est déjà en cours, rafraîchissez la page et réessayez.' },
          { status: 409 }
        );
      }
      
      // Autre erreur DB
      if (env.NODE_ENV === 'production') {
        console.error('[CHECKOUT] error:', orderError.code || 'DB_ERROR');
      } else {
        console.error('[CHECKOUT] ❌ Erreur création commande:', orderError);
      }
      
      return NextResponse.json(
        { error: 'Erreur lors de la création de la commande' },
        { status: 500 }
      );
    }

    if (!order) {
      return NextResponse.json(
        { error: 'Erreur lors de la création de la commande' },
        { status: 500 }
      );
    }

    // ── 9. CRÉER ORDER ITEMS ──
    const orderItems = enrichedItems.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price_cents, // Déjà en centimes
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      // Rollback : marquer commande comme failed (audit trail)
      await supabase
        .from('orders')
        .update({ status: 'failed' })
        .eq('id', order.id);
      
      if (env.NODE_ENV === 'production') {
        console.error('[CHECKOUT] error:', itemsError.code || 'ORDER_ITEMS_ERROR');
      } else {
        console.error('[CHECKOUT] Erreur insertion order_items:', itemsError);
      }
      
      return NextResponse.json(
        { error: 'Erreur lors de la création des items' },
        { status: 500 }
      );
    }

    // ── 10. CRÉER SESSION STRIPE ──
    const stripeLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = enrichedItems.map(item => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: `${item.product_name} - ${item.variant_type}`, // Description propre
        },
        unit_amount: item.unit_price_cents, // Déjà en centimes
      },
      quantity: item.quantity,
    }));

    let stripeSession;
    try {
      stripeSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: stripeLineItems,
        mode: 'payment',
        success_url: `${env.NEXT_PUBLIC_SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${env.NEXT_PUBLIC_SITE_URL}/checkout/cancel`,
        customer_email: user.email!,
        metadata: {
          order_id: order.id,
          user_id: user.id,
        },
      });
    } catch (stripeError: any) {
      // Rollback : marquer commande comme failed
      await supabase
        .from('orders')
        .update({ status: 'failed' })
        .eq('id', order.id);
      
      if (env.NODE_ENV === 'production') {
        console.error('[CHECKOUT] error:', stripeError.code || 'STRIPE_ERROR');
      } else {
        console.error('[CHECKOUT] Erreur création session Stripe:', stripeError);
      }
      
      return NextResponse.json(
        { error: 'Erreur lors de la création de la session de paiement' },
        { status: 500 }
      );
    }

    // Mettre à jour la commande avec le session_id
    await supabase
      .from('orders')
      .update({ stripe_session_id: stripeSession.id })
      .eq('id', order.id);

    return NextResponse.json({
      url: stripeSession.url,
      sessionId: stripeSession.id,
    });

  } catch (error: any) {
    // Logging minimal en prod
    if (env.NODE_ENV === 'production') {
      console.error('[CHECKOUT] error:', error.code || error.name || 'UNKNOWN_ERROR');
    } else {
      console.error('[CHECKOUT] Erreur:', error.message, error.stack);
    }
    
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
