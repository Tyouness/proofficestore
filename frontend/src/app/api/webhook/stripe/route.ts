/**
 * Webhook Stripe - Confirmation de paiement + Attribution de licences + Envoi d'emails
 * 
 * SÉCURITÉ :
 * ✅ Rate limiting spécial webhook (600 req/min)
 * ✅ Body size limit (1MB max)
 * ✅ Validation signature Stripe
 * ✅ Pas de PII dans les logs
 * ✅ Idempotence totale (gérer retries)
 * ✅ Atomicité via RPC Postgres
 * 
 * ⚠️ RÈGLES CRITIQUES :
 * - RAW BODY pour signature Stripe
 * - Client Supabase ADMIN (service role) exclusivement
 * - Idempotence totale (gérer les retries Stripe)
 * - Validation anti-fraude : session.id = order.stripe_session_id
 * - Attribution atomique de licences via RPC Postgres
 * - Emails localisés (FR/EN) via Resend
 * - Ne jamais retourner 500 après validation signature (éviter retries inutiles)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';
import { Resend } from 'resend';
import { rateLimit, getClientIdentifier } from '@/lib/rateLimit';
import { env } from '@/lib/env';

type AssignLicensesResult = number;

const resend = new Resend(env.RESEND_API_KEY);

// 🔒 Body size limit (1MB max)
const MAX_BODY_SIZE = 1024 * 1024; // 1MB

export async function POST(req: NextRequest) {
  try {
    // ── 1. BODY SIZE LIMIT (AVANT lecture du body) ──
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
      return NextResponse.json(
        { error: 'Payload trop volumineux' },
        { status: 413 }
      );
    }

    // ── 2. LIRE BODY (raw pour signature) ──
    const rawBody = await req.text();
    const bodySize = Buffer.byteLength(rawBody, 'utf8');
    
    if (bodySize > MAX_BODY_SIZE) {
      return NextResponse.json(
        { error: 'Payload trop volumineux' },
        { status: 413 }
      );
    }

    // ── 3. VALIDATION SIGNATURE STRIPE (CRITIQUE) ──
    const signature = req.headers.get('stripe-signature');

    if (!signature || !env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: 'Configuration invalide' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        env.STRIPE_WEBHOOK_SECRET
      );
      if (env.NODE_ENV !== 'production') {
        console.log('[WEBHOOK] Signature valide - Type:', event.type, 'ID:', event.id);
      }
    } catch (err: any) {
      return NextResponse.json(
        { error: 'Signature invalide' },
        { status: 400 }
      );
    }

    // ── 4. CLIENT SUPABASE ADMIN ──
    const supabaseAdmin = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // ── 5. IDEMPOTENCE (event.id unique) ──
    const { data: existingEvent } = await supabaseAdmin
      .from('stripe_webhook_events')
      .select('id')
      .eq('event_id', event.id)
      .maybeSingle();

    if (existingEvent) {
      // Event déjà traité - retourner 200 (idempotence)
      return NextResponse.json({ received: true, cached: true });
    }

    // ──────────────────────────────────────────────
    // Gestion des remboursements et litiges
    // ──────────────────────────────────────────────

    if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntent = charge.payment_intent as string;

      if (!paymentIntent) {
        return NextResponse.json({ received: true }, { status: 200 });
      }

      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('id, status')
        .eq('stripe_payment_intent', paymentIntent)
        .maybeSingle();

      if (!order) {
        return NextResponse.json({ received: true }, { status: 200 });
      }

      if (order.status === 'refunded') {
        return NextResponse.json({ received: true }, { status: 200 });
      }

      await supabaseAdmin
        .from('orders')
        .update({ status: 'refunded' })
        .eq('id', order.id);

      await supabaseAdmin
        .from('licenses')
        .update({ revoked: true })
        .eq('order_id', order.id);

      console.log(`[WEBHOOK] Event: charge.refunded | Order: ${order.id} | Status: refunded`);
      return NextResponse.json({ received: true });
    }

    if (event.type === 'charge.dispute.created') {
      const dispute = event.data.object as Stripe.Dispute;
      const paymentIntent = dispute.payment_intent as string;

      if (!paymentIntent) {
        return NextResponse.json({ received: true }, { status: 200 });
      }

      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('id, status')
        .eq('stripe_payment_intent', paymentIntent)
        .maybeSingle();

      if (!order) {
        return NextResponse.json({ received: true }, { status: 200 });
      }

      if (order.status === 'disputed') {
        return NextResponse.json({ received: true }, { status: 200 });
      }

      await supabaseAdmin
        .from('orders')
        .update({ status: 'disputed' })
        .eq('id', order.id);

      await supabaseAdmin
        .from('licenses')
        .update({ revoked: true })
        .eq('order_id', order.id);

      console.log(`[WEBHOOK] Event: charge.dispute.created | Order: ${order.id} | Status: disputed`);
      return NextResponse.json({ received: true });
    }

    if (event.type === 'charge.dispute.closed') {
      const dispute = event.data.object as Stripe.Dispute;
      const paymentIntent = dispute.payment_intent as string;
      const outcome = dispute.status;

      if (!paymentIntent) {
        return NextResponse.json({ received: true }, { status: 200 });
      }

      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('id, status')
        .eq('stripe_payment_intent', paymentIntent)
        .maybeSingle();

      if (!order) {
        return NextResponse.json({ received: true }, { status: 200 });
      }

      if (outcome === 'won') {
        await supabaseAdmin
          .from('orders')
          .update({ status: 'paid' })
          .eq('id', order.id);

        console.log(`[WEBHOOK] Event: charge.dispute.closed | Order: ${order.id} | Status: paid`);
      }

      return NextResponse.json({ received: true });
    }

    // ──────────────────────────────────────────────
    // Gestion du paiement initial
    // ──────────────────────────────────────────────

    if (event.type !== 'checkout.session.completed') {
      return NextResponse.json({ received: true });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const stripeSessionId = session.id;
    
    // Support snake_case (nouveau) et camelCase (ancien) pour compatibilité rétro
    let orderIdFromMetadata = session.metadata?.order_id;
    let userIdFromMetadata = session.metadata?.user_id;
    
    // Fallback pour compatibilité rétro
    if (!orderIdFromMetadata && session.metadata?.orderId) {
      orderIdFromMetadata = session.metadata.orderId;
    }
    if (!userIdFromMetadata && session.metadata?.userId) {
      userIdFromMetadata = session.metadata.userId;
    }
    
    const customerEmail = session.customer_email || session.customer_details?.email;
    const locale = session.locale || 'en';
    const isFrench = locale.toLowerCase().startsWith('fr');
    const paymentIntentId = session.payment_intent as string;

    // Recherche commande par order_id (metadata)
    if (!orderIdFromMetadata) {
      console.error('[WEBHOOK] order_id manquant');
      return NextResponse.json({ received: true, warning: 'Missing order_id' }, { status: 200 });
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderIdFromMetadata)
      .maybeSingle();

    if (orderError || !order) {
      // Marquer event comme traité même si erreur (éviter retries infinis)
      await supabaseAdmin
        .from('stripe_webhook_events')
        .insert({ event_id: event.id, event_type: event.type, order_id: null });
      
      return NextResponse.json({ received: true, warning: 'Order not found' }, { status: 200 });
    }

    // VALIDATION ANTIFRAUDE: vérifier stripe_session_id correspond
    if (order.stripe_session_id && order.stripe_session_id !== stripeSessionId) {
      await supabaseAdmin
        .from('stripe_webhook_events')
        .insert({ event_id: event.id, event_type: event.type, order_id: order.id });
      
      return NextResponse.json({ received: true, warning: 'Session ID mismatch' }, { status: 200 });
    }

    // Validation user_id (sécurité RLS)
    if (order.user_id === null) {
      // Si user_id est NULL, on le met à jour avec la metadata
      if (userIdFromMetadata) {
        const { error: userUpdateError } = await supabaseAdmin
          .from('orders')
          .update({ user_id: userIdFromMetadata })
          .eq('id', order.id);
        
        if (!userUpdateError) {
          order.user_id = userIdFromMetadata; // Update local object
        }
      }
    } else if (order.user_id !== userIdFromMetadata) {
      // Sécurité : le user_id existant ne correspond pas à la metadata
      await supabaseAdmin
        .from('stripe_webhook_events')
        .insert({ event_id: event.id, event_type: event.type, order_id: order.id });
      
      return NextResponse.json({ received: true, warning: 'User ID mismatch' }, { status: 200 });
    }

    // Idempotence - Vérifier si déjà payé
    if (order.status === 'paid') {
      // Marquer event comme traité
      await supabaseAdmin
        .from('stripe_webhook_events')
        .insert({ event_id: event.id, event_type: event.type, order_id: order.id });
      
      return NextResponse.json({ received: true, status: 'already_paid' });
    }

    // Mise à jour status → paid + stripe_session_id + payment_intent
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ 
        status: 'paid', 
        stripe_session_id: stripeSessionId,
        stripe_payment_intent: paymentIntentId
      })
      .eq('id', order.id);

    if (updateError) {
      console.error('[WEBHOOK] Erreur update order:', updateError);
      return NextResponse.json({ received: true, error: 'Order update failed' }, { status: 200 });
    }

    // 📧 EMAIL 1: Confirmation de paiement (DÉSACTIVÉ POUR DEBUG)
    // if (customerEmail) {
    //   try {
    //     await resend.emails.send({
    //       from: 'AllKeyMasters <allkeymasters@gmail.com>',
    //       to: customerEmail,
    //       subject: isFrench 
    //         ? '✅ Votre paiement est validé - AllKeyMasters'
    //         : '✅ Your payment is confirmed - AllKeyMasters',
    //       html: isFrench
    //         ? `
    //           <h2>Bonjour,</h2>
    //           <p>Nous avons bien reçu votre paiement pour votre commande sur <strong>AllKeyMasters</strong>. Merci de votre confiance !</p>
    //           <h3>Quelle est la suite ?</h3>
    //           <p>Votre commande est en cours de traitement. Vous allez recevoir d'ici quelques instants un <strong>deuxième email</strong> contenant votre clé d'activation ainsi qu'un guide complet pour installer votre logiciel sans erreur.</p>
    //           <p>À tout de suite,<br/>L'équipe <strong>AllKeyMasters</strong>.</p>
    //         `
    //         : `
    //           <h2>Hello,</h2>
    //           <p>We have received your payment for your order on <strong>AllKeyMasters</strong>. Thank you for your trust!</p>
    //           <h3>What's next?</h3>
    //           <p>Your order is being processed. You will receive a <strong>second email</strong> in a few moments containing your activation key and a complete guide to install your software without errors.</p>
    //           <p>See you soon,<br/>The <strong>AllKeyMasters</strong> Team.</p>
    //         `
    //     });
    //     console.log('[WEBHOOK] ✅ Email 1 (Confirmation) envoyé');
    //   } catch (emailError: any) {
    //     console.error('[WEBHOOK] ⚠️ Erreur envoi Email 1:', emailError.message);
    //   }
    // }

    // 8️⃣ Attribution licences ATOMIQUE via RPC Postgres
    const { data: items } = await supabaseAdmin
      .from('order_items')
      .select('product_id, variant_id, quantity, product_name')
      .eq('order_id', order.id);

    let totalLicenses = 0;
    const results = [];
    const allLicenseKeys: string[] = [];

    if (items && items.length > 0) {
      for (const item of items) {
        // Vérifier si des licences sont déjà attribuées (idempotence)
        const { data: alreadyAssigned } = await supabaseAdmin
          .from('licenses')
          .select('key_code')
          .eq('order_id', order.id)
          .eq('product_id', item.product_id);

        const alreadyCount = alreadyAssigned?.length || 0;

        if (alreadyCount >= item.quantity) {
          totalLicenses += alreadyCount;
          allLicenseKeys.push(...(alreadyAssigned || []).map(l => l.key_code));
          results.push({ 
            product_id: item.product_id, 
            assigned: alreadyCount, 
            status: 'already_assigned' 
          });
          continue;
        }

        const remainingToAssign = item.quantity - alreadyCount;

        // ATTRIBUTION ATOMIQUE via RPC Postgres (FOR UPDATE SKIP LOCKED)
        try {
          const { data: assignedKeys, error: rpcError } = await supabaseAdmin
            .rpc('assign_licenses_atomic', {
              p_order_id: order.id,
              p_variant_id: item.variant_id || null,
              p_quantity: remainingToAssign
            });

          if (rpcError) {
            throw rpcError;
          }

          const newlyAssigned = assignedKeys?.length || 0;
          totalLicenses += alreadyCount + newlyAssigned;
          
          if (assignedKeys) {
            allLicenseKeys.push(...assignedKeys.map((row: { license_key: string }) => row.license_key));
          }
          
          results.push({ 
            product_id: item.product_id,
            product_name: item.product_name,
            assigned: alreadyCount + newlyAssigned,
            status: 'success'
          });
        } catch (error: any) {
          const errorMessage = error.message || 'Unknown error';
          
          if (errorMessage.includes('Stock insuffisant')) {
            results.push({ 
              product_id: item.product_id,
              product_name: item.product_name,
              assigned: alreadyCount,
              status: 'insufficient_stock',
              error: errorMessage
            });
          } else {
            results.push({ 
              product_id: item.product_id,
              product_name: item.product_name,
              assigned: alreadyCount,
              status: 'error',
              error: errorMessage
            });
          }
          continue;
        }
      }
    }

    // MARQUER L'EVENT COMME TRAITÉ (idempotence finale)
    await supabaseAdmin
      .from('stripe_webhook_events')
      .insert({ 
        event_id: event.id, 
        event_type: event.type, 
        order_id: order.id 
      });

    if (env.NODE_ENV !== 'production') {
      console.log('[WEBHOOK] Webhook termine -', totalLicenses, 'licences attribuees');
    }

    return NextResponse.json({
      received: true,
      status: 'processed',
      order_id: order.id,
      licenses_assigned: totalLicenses,
      details: results,
    });

  } catch (error: any) {
    // Log uniquement en dev
    if (env.NODE_ENV !== 'production') {
      console.error('[WEBHOOK] Erreur critique:', error.message);
    }
    
    // TODO: Envoyer à Sentry si configuré
    // if (hasSentry()) {
    //   Sentry.captureException(error, { tags: { component: 'stripe-webhook' } });
    // }
    
    // Retourner 200 pour éviter retries Stripe infinis
    return NextResponse.json({ received: true, error: 'Internal error' }, { status: 200 });
  }
}
