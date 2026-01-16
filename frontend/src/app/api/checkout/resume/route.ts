import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { stripe } from '@/lib/stripe';
import crypto from 'crypto';
import type { CheckoutItem } from '@/types/checkout';

/**
 * API Route: Reprendre une session de paiement existante
 * 
 * FLUX:
 * 1. Authentification obligatoire
 * 2. Recalcule le cart_hash depuis le panier actuel
 * 3. Cherche la dernière commande pending avec ce cart_hash
 * 4. Si session Stripe existe et est réutilisable → retourne l'URL
 * 5. Sinon → retourne 409 (client doit relancer /api/checkout)
 */

/**
 * Créer un hash stable du panier (identique à checkout.ts)
 */
function generateCartHash(items: CheckoutItem[]): string {
  const sortedItems = [...items].sort((a, b) => {
    const keyA = `${a.productId}-${a.variant}`;
    const keyB = `${b.productId}-${b.variant}`;
    return keyA.localeCompare(keyB);
  });

  const cartString = sortedItems
    .map(item => `${item.productId}:${item.variant}:${item.quantity}`)
    .join('|');

  return crypto.createHash('sha256').update(cartString).digest('hex');
}

/**
 * Vérifier si une session Stripe est réutilisable
 */
function isSessionReusable(session: any): boolean {
  if (!session.url) return false;
  if (session.status !== 'open') return false;
  if (session.payment_status !== 'unpaid') return false;
  
  // Vérifier l'âge de la session (max 30 minutes)
  const sessionAge = Date.now() - (session.created * 1000);
  const maxAge = 30 * 60 * 1000; // 30 minutes
  
  return sessionAge < maxAge;
}

export async function POST(request: NextRequest) {
  try {
    console.log('[RESUME] 🔄 Demande de reprise de paiement');

    // ────────────────────────────────────────────
    // 1️⃣ AUTHENTIFICATION SSR
    // ────────────────────────────────────────────
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      console.error('[RESUME] ❌ Non authentifié');
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    console.log('[RESUME] ✅ Utilisateur:', user.id);

    // ────────────────────────────────────────────
    // 2️⃣ RÉCUPÉRATION ET VALIDATION DU PANIER
    // ────────────────────────────────────────────
    const body = await request.json();
    const { items } = body as { items: CheckoutItem[] };

    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error('[RESUME] ❌ Panier vide ou invalide');
      return NextResponse.json(
        { success: false, error: 'Panier vide' },
        { status: 400 }
      );
    }

    console.log('[RESUME] 🛒 Items reçus:', items.length);

    // ────────────────────────────────────────────
    // 3️⃣ CALCUL DU CART_HASH
    // ────────────────────────────────────────────
    const cartHash = generateCartHash(items);
    console.log('[RESUME] 🔐 Cart hash:', cartHash);

    // ────────────────────────────────────────────
    // 4️⃣ RECHERCHE COMMANDE PENDING
    // ────────────────────────────────────────────
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    const { data: existingOrder, error: orderError } = await supabase
      .from('orders')
      .select('id, stripe_session_id, created_at')
      .eq('user_id', user.id)
      .eq('cart_hash', cartHash)
      .eq('status', 'pending')
      .gte('created_at', fifteenMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (orderError || !existingOrder) {
      console.log('[RESUME] ℹ️ Aucune commande pending récente trouvée');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Aucune session active',
          shouldRetry: true 
        },
        { status: 409 }
      );
    }

    console.log('[RESUME] ✅ Commande trouvée:', existingOrder.id);

    // ────────────────────────────────────────────
    // 5️⃣ VÉRIFICATION SESSION STRIPE
    // ────────────────────────────────────────────
    if (!existingOrder.stripe_session_id) {
      console.log('[RESUME] ℹ️ Pas de session Stripe attachée');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Aucune session active',
          shouldRetry: true 
        },
        { status: 409 }
      );
    }

    try {
      const session = await stripe.checkout.sessions.retrieve(
        existingOrder.stripe_session_id
      );

      console.log('[RESUME] 📊 Session Stripe:', {
        id: session.id,
        status: session.status,
        payment_status: session.payment_status,
        url: !!session.url,
      });

      if (isSessionReusable(session)) {
        console.log('[RESUME] ✅ Session réutilisable, retour URL');
        return NextResponse.json({
          success: true,
          sessionUrl: session.url,
          sessionId: session.id,
        });
      }

      console.log('[RESUME] ⏰ Session expirée/invalide');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Session expirée, veuillez relancer le paiement',
          shouldRetry: true 
        },
        { status: 409 }
      );

    } catch (stripeError) {
      console.error('[RESUME] ❌ Erreur Stripe:', stripeError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erreur lors de la récupération de la session',
          shouldRetry: true 
        },
        { status: 409 }
      );
    }

  } catch (error) {
    console.error('[RESUME] ❌ Erreur critique:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
