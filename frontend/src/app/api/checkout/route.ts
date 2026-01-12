/**
 * API Route : Création de session Stripe Checkout avec compte obligatoire
 * 
 * CONTRAINTES :
 * - Utilisateur authentifié obligatoire (via cookies SSR)
 * - Création de la commande (orders) AVANT Stripe
 * - user_id lié dès le checkout
 * - Pas de service_role pour l'auth
 * - Idempotence via cart_hash (éviter doublons)
 * - Rollback si échec Stripe
 * 
 * FLUX :
 * 1. Créer client Supabase server (SSR)
 * 2. Récupérer user via supabase.auth.getUser()
 * 3. Calculer cart_hash des items
 * 4. Vérifier commande pending existante (user_id + cart_hash + récent)
 * 5. Valider les inputs et produits
 * 6. Créer orders avec user_id + cart_hash
 * 7. Créer order_items
 * 8. Créer session Stripe avec metadata (order_id, user_id)
 * 9. Si échec Stripe => supprimer la commande créée
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import crypto from 'crypto';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

// Types
interface CheckoutItem {
  productId: string;
  variant: 'digital' | 'dvd' | 'usb';
  quantity: number;
}

interface CheckoutRequestBody {
  items: CheckoutItem[];
}

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

export async function POST(request: NextRequest) {
  let createdOrderId: string | null = null;

  try {
    // Créer le client Supabase server (SSR officiel)
    const cookieStore = await cookies();
    
    // Récupérer le token d'auth depuis les cookies
    const authCookie = cookieStore.get('sb-hzptzuljmexfflefxwqy-auth-token');
    
    if (!authCookie) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let session;
    try {
      session = JSON.parse(authCookie.value);
    } catch {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!session?.access_token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Créer le client Supabase avec le token utilisateur
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      }
    );

    // Récupérer l'utilisateur authentifié
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parser le body
    const body: CheckoutRequestBody = await request.json();
    const { items } = body;

    // Validation des inputs
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Panier vide' },
        { status: 400 }
      );
    }

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
      
      // Si une session Stripe existe déjà, la réutiliser
      if (recentOrder.stripe_session_id) {
        try {
          const existingSession = await stripe.checkout.sessions.retrieve(recentOrder.stripe_session_id);
          if (existingSession.url) {
            return NextResponse.json({
              url: existingSession.url,
              sessionId: existingSession.id,
            });
          }
        } catch (err) {
          // Session expirée, créer une nouvelle
        }
      }
    }

    // Récupérer les produits depuis Supabase pour validation et prix
    const productIds = [...new Set(items.map(item => item.productId))];
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, slug, base_price')
      .in('slug', productIds);

    if (productsError || !products || products.length === 0) {
      console.error('[CHECKOUT] Erreur produits:', productsError);
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

    // Créer un map des produits pour accès rapide
    const productMap = new Map<string, Product>(products.map((p: any) => [p.slug, p]));

    // Calculer le total et valider tous les items
    let totalAmount = 0;
    const validatedItems: Array<{
      productId: string;
      productName: string;
      variant: string;
      quantity: number;
      unitPrice: number;
    }> = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Produit ${item.productId} introuvable` },
          { status: 404 }
        );
      }

      // Calculer le prix avec surcharge variant
      let unitPrice = product.base_price;
      if (item.variant === 'usb') {
        unitPrice += 15;
      } else if (item.variant === 'dvd') {
        unitPrice += 10;
      }

      const lineTotal = unitPrice * item.quantity;
      totalAmount += lineTotal;

      validatedItems.push({
        productId: product.slug,
        productName: product.name,
        variant: item.variant,
        quantity: item.quantity,
        unitPrice,
      });
    }

    // Créer la commande dans orders
    const orderPayload = {
      user_id: user.id,
      email_client: user.email,
      status: 'pending' as const,
      total_amount: totalAmount * 100,
      cart_hash: cartHash,
    };

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderPayload)
      .select()
      .single();

    if (orderError || !order) {
      console.error('[CHECKOUT] ❌ Erreur création commande:', orderError);
      return NextResponse.json(
        { error: 'Erreur lors de la création de la commande' },
        { status: 500 }
      );
    }

    createdOrderId = order.id;

    // Créer les order_items
    const orderItems = validatedItems.map(item => ({
      order_id: order.id,
      product_id: item.productId,
      product_name: item.productName,
      variant: item.variant,
      quantity: item.quantity,
      unit_price: item.unitPrice * 100, // En centimes
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('[CHECKOUT] ❌ Erreur création items:', itemsError);
      
      // Rollback : supprimer la commande créée
      await supabase.from('orders').delete().eq('id', order.id);
      
      return NextResponse.json(
        { error: 'Erreur lors de la création des items' },
        { status: 500 }
      );
    }

    // Créer les line_items pour Stripe
    const stripeLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = validatedItems.map(item => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: `${item.productName} - ${item.variant}`,
        },
        unit_amount: item.unitPrice * 100, // En centimes
      },
      quantity: item.quantity,
    }));

    let stripeSession;
    try {
      stripeSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: stripeLineItems,
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/cancel`,
        customer_email: user.email!,
        metadata: {
          order_id: order.id,
          user_id: user.id,
        },
      });
    } catch (stripeError: any) {
      console.error('[CHECKOUT] Erreur Stripe:', stripeError);
      
      // Rollback : supprimer la commande et items créés
      await supabase.from('order_items').delete().eq('order_id', order.id);
      await supabase.from('orders').delete().eq('id', order.id);
      
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
    console.error('[CHECKOUT] Erreur:', error.message);
    
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
