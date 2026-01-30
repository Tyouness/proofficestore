/**
 * Webhook Stripe - Paiement / Refund / Dispute
 *
 * SÉCURITÉ :
 * ✅ Rate limiting webhook (600 req/min, après signature)
 * ✅ Body size limit (1MB max, avant signature)
 * ✅ Validation signature Stripe
 * ✅ Pas de PII dans les logs production
 * ✅ Idempotence atomique via INSERT direct stripe_webhook_events
 * ✅ Processing status tracking (processing → processed/failed/dropped)
 * ✅ Révocation licences lors refunds/disputes
 *
 * RÈGLES CRITIQUES :
 * - Après signature valide: TOUJOURS return 200 (jamais 500 → évite retry storm Stripe)
 * - Idempotence: INSERT stripe_webhook_events AVANT side-effects (23505 = dedupe)
 * - Rate limit APRÈS signature+insert (ne jamais "consommer" event sans trace)
 * - Fail hard sur RPC critiques (assign_licenses, inventory) → marque failed
 * - Refunds/Disputes: révoque/restaure licences via revoked flag
 * - Email licences: groupé après attribution, filtre revoked !== true
 * - Inventaire: décrémenter pour TOUS les produits (digital + physical)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { rateLimit, getClientIdentifier } from '@/lib/rateLimit';
import { env } from '@/lib/env';
import {
  sendPaymentConfirmationEmail,
  sendLicenseDeliveryEmail,
  sendAdminNewSaleEmail,
} from '@/lib/email';

const MAX_BODY_SIZE = 1024 * 1024; // 1MB

// Import dynamique du PDF pour éviter crash au démarrage
let generateInvoicePdf: any = null;
try {
  const pdfModule = require('@/lib/pdf/generateInvoicePdf');
  console.log('[WEBHOOK] 📦 pdfModule keys:', Object.keys(pdfModule));
  console.log('[WEBHOOK] 📦 pdfModule.generateInvoicePdf type:', typeof pdfModule.generateInvoicePdf);
  console.log('[WEBHOOK] 📦 pdfModule.default type:', typeof pdfModule.default);
  
  // Essayer export nommé puis default
  generateInvoicePdf = pdfModule.generateInvoicePdf || pdfModule.default?.generateInvoicePdf || pdfModule.default;
  
  console.log('[WEBHOOK] ✅ Module PDF importé avec succès, fonction:', typeof generateInvoicePdf);
} catch (importError) {
  console.error('[WEBHOOK] ❌ ERREUR IMPORT MODULE PDF:', importError);
  console.error('[WEBHOOK] 📍 Le module @react-pdf/renderer n\'est probablement pas compatible avec Vercel');
}

type ProcessingStatus = 'processing' | 'processed' | 'failed' | 'dropped';

function safeErrorString(err: unknown): string {
  try {
    if (err instanceof Error) return `${err.name}: ${err.message}\n${err.stack ?? ''}`.slice(0, 4000);
    return JSON.stringify(err).slice(0, 4000);
  } catch {
    return 'Unknown error (stringify_failed)';
  }
}

export async function POST(req: NextRequest) {
  console.log('[WEBHOOK] 🎯 Webhook Stripe reçu');
  
  // 1) Quick reject on declared size (no body read, no signature possible)
  const contentLength = req.headers.get('content-length');
  const contentLengthNum = parseInt(contentLength || '', 10);
  if (!isNaN(contentLengthNum) && contentLengthNum > MAX_BODY_SIZE) {
    console.log('[WEBHOOK] ❌ Payload trop volumineux (content-length):', contentLengthNum);
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  // 2) Read raw body and enforce actual size
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch (e) {
    console.error('[WEBHOOK] ❌ Erreur lecture body:', e);
    return NextResponse.json({ error: 'Body read failed' }, { status: 400 });
  }

  const bodySize = Buffer.byteLength(rawBody, 'utf8');
  if (bodySize > MAX_BODY_SIZE) {
    console.log('[WEBHOOK] ❌ Body trop volumineux (mesuré):', bodySize);
    return NextResponse.json({ error: 'Body too large' }, { status: 413 });
  }

  // 3) Validate Stripe signature
  const signature = req.headers.get('stripe-signature');
  if (!signature || !env.STRIPE_WEBHOOK_SECRET) {
    console.log('[WEBHOOK] ❌ Signature ou secret manquant');
    return NextResponse.json({ error: 'Configuration invalide' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
    console.log('[WEBHOOK] ✅ Signature valide, event type:', event.type, 'id:', event.id);
  } catch (err) {
    console.error('[WEBHOOK] ❌ Signature invalide:', err);
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 });
  }

  // 4) Supabase admin client
  const supabaseAdmin = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Helper to update event status safely (always best-effort)
  async function markEvent(params: {
    status: ProcessingStatus;
    orderId?: string | null;
    error?: string | null;
  }) {
    try {
      const payload: any = {
        processing_status: params.status,
        processed_at: params.status === 'dropped' ? null : new Date().toISOString(),
      };
      if (typeof params.orderId !== 'undefined') payload.order_id = params.orderId;
      if (typeof params.error !== 'undefined') payload.error = params.error;

      await supabaseAdmin
        .from('stripe_webhook_events')
        .update(payload)
        .eq('event_id', event.id);
    } catch {
      // Best-effort: don't throw
    }
  }

  try {
    // 5) Idempotence insert FIRST (atomic dedupe)
    console.log('[WEBHOOK] 📝 Tentative INSERT idempotence pour event:', event.id);
    const { error: insertEventError } = await supabaseAdmin
      .from('stripe_webhook_events')
      .insert({
        event_id: event.id,
        event_type: event.type,
        order_id: null,
        // processing_status defaults to 'processing'
      });

    if (insertEventError) {
      if (insertEventError.code === '23505') {
        console.log('[WEBHOOK] ♻️ Event déjà traité (23505):', event.id);
        return NextResponse.json({ received: true, cached: true }, { status: 200 });
      }

      // If idempotence table is broken, we ACK 200 (signature is valid) but log failure
      console.error('[WEBHOOK] ❌ Erreur INSERT idempotence:', insertEventError);
      return NextResponse.json({ received: true, error: 'idempotence_failed' }, { status: 200 });
    }

    console.log('[WEBHOOK] ✅ Event inséré, processing_status=processing');

    // 6) Rate limit AFTER signature+insert. Never block Stripe, but may drop processing.
    const identifier = getClientIdentifier(req);
    const rl = await rateLimit(identifier, 'webhook');
    if (!rl.success) {
      console.warn('[WEBHOOK] ⚠️ Rate limit dépassé => dropped');
      await markEvent({ status: 'dropped', error: 'throttled' });
      return NextResponse.json({ received: true, throttled: true }, { status: 200 });
    }

    // ──────────────────────────────────────────────
    // REFUNDS
    // ──────────────────────────────────────────────
    if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntent = charge.payment_intent as string;

      if (!paymentIntent) {
        await markEvent({ status: 'processed', error: null });
        return NextResponse.json({ received: true }, { status: 200 });
      }

      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('id, status')
        .eq('stripe_payment_intent', paymentIntent)
        .maybeSingle();

      if (order) {
        if (order.status !== 'refunded') {
          await supabaseAdmin
            .from('orders')
            .update({
              status: 'refunded',
              refunded_at: new Date().toISOString(),
              refund_reason: charge.refunds?.data?.[0]?.reason || 'requested_by_customer',
            })
            .eq('id', order.id);
        }

        // Revoke licenses (idempotent)
        await supabaseAdmin
          .from('licenses')
          .update({ revoked: true })
          .eq('order_id', order.id);

        await markEvent({ status: 'processed', orderId: order.id, error: null });
      } else {
        await markEvent({ status: 'processed', orderId: null, error: 'order_not_found_for_refund' });
      }

      return NextResponse.json({ received: true }, { status: 200 });
    }

    // ──────────────────────────────────────────────
    // DISPUTES
    // ──────────────────────────────────────────────
    if (event.type === 'charge.dispute.created') {
      const dispute = event.data.object as Stripe.Dispute;
      const chargeId = dispute.charge as string;

      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('id')
        .eq('stripe_charge_id', chargeId)
        .maybeSingle();

      if (order) {
        await supabaseAdmin
          .from('orders')
          .update({
            status: 'disputed',
            dispute_reason: dispute.reason,
            dispute_status: dispute.status,
          })
          .eq('id', order.id);

        // Conservative: revoke immediately
        await supabaseAdmin
          .from('licenses')
          .update({ revoked: true })
          .eq('order_id', order.id);

        await markEvent({ status: 'processed', orderId: order.id, error: null });
      } else {
        await markEvent({ status: 'processed', orderId: null, error: 'order_not_found_for_dispute_created' });
      }

      return NextResponse.json({ received: true }, { status: 200 });
    }

    if (event.type === 'charge.dispute.closed') {
      const dispute = event.data.object as Stripe.Dispute;
      const chargeId = dispute.charge as string;

      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('id')
        .eq('stripe_charge_id', chargeId)
        .maybeSingle();

      if (order) {
        if (dispute.status === 'won') {
          await supabaseAdmin
            .from('orders')
            .update({ status: 'paid', dispute_status: dispute.status })
            .eq('id', order.id);

          await supabaseAdmin
            .from('licenses')
            .update({ revoked: false })
            .eq('order_id', order.id);
        } else {
          await supabaseAdmin
            .from('orders')
            .update({ status: 'refunded', dispute_status: dispute.status })
            .eq('id', order.id);

          await supabaseAdmin
            .from('licenses')
            .update({ revoked: true })
            .eq('order_id', order.id);
        }

        await markEvent({ status: 'processed', orderId: order.id, error: null });
      } else {
        await markEvent({ status: 'processed', orderId: null, error: 'order_not_found_for_dispute_closed' });
      }

      return NextResponse.json({ received: true }, { status: 200 });
    }

    // ──────────────────────────────────────────────
    // Only handle checkout.session.completed
    // ──────────────────────────────────────────────
    if (event.type !== 'checkout.session.completed') {
      await markEvent({ status: 'processed', orderId: null, error: null });
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const stripeSessionId = session.id;

    const orderIdFromMetadata = session.metadata?.order_id || session.metadata?.orderId;
    const userIdFromMetadata = session.metadata?.user_id || session.metadata?.userId;

    const customerEmail = session.customer_email || session.customer_details?.email;
    const locale = session.locale || 'en';
    const paymentIntentId = session.payment_intent as string;

    if (!orderIdFromMetadata) {
      await markEvent({ status: 'failed', orderId: null, error: 'missing_order_id_metadata' });
      return NextResponse.json({ received: true, error: 'missing_order_id' }, { status: 200 });
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderIdFromMetadata)
      .maybeSingle();

    if (orderError || !order) {
      await markEvent({ status: 'failed', orderId: null, error: 'order_not_found' });
      return NextResponse.json({ received: true, error: 'order_not_found' }, { status: 200 });
    }

    // Anti-fraud: session id mismatch
    if (order.stripe_session_id && order.stripe_session_id !== stripeSessionId) {
      await markEvent({ status: 'failed', orderId: order.id, error: 'stripe_session_id_mismatch' });
      return NextResponse.json({ received: true, error: 'session_id_mismatch' }, { status: 200 });
    }

    // user_id validation/update
    // Ignorer si user_id = 'guest' (commande sans compte)
    if (userIdFromMetadata && userIdFromMetadata !== 'guest') {
      if (order.user_id === null) {
        const { error: userUpdateError } = await supabaseAdmin
          .from('orders')
          .update({ user_id: userIdFromMetadata })
          .eq('id', order.id);

        if (userUpdateError) {
          await markEvent({ status: 'failed', orderId: order.id, error: 'user_id_update_failed' });
          return NextResponse.json({ received: true, error: 'user_update_failed' }, { status: 200 });
        }
      } else if (order.user_id !== userIdFromMetadata) {
        await markEvent({ status: 'failed', orderId: order.id, error: 'user_id_mismatch' });
        return NextResponse.json({ received: true, error: 'user_id_mismatch' }, { status: 200 });
      }
    }

    // Already paid -> idempotent protection
    if (order.status === 'paid') {
      await markEvent({ status: 'processed', orderId: order.id, error: null });
      return NextResponse.json({ received: true, status: 'already_paid' }, { status: 200 });
    }

    // Mark order paid
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'paid',
        stripe_session_id: stripeSessionId,
        stripe_payment_intent: paymentIntentId,
        paid_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    if (updateError) {
      await markEvent({ status: 'failed', orderId: order.id, error: 'order_update_failed' });
      return NextResponse.json({ received: true, error: 'order_update_failed' }, { status: 200 });
    }

    // Email payment confirmation
    if (customerEmail) {
      console.log('[WEBHOOK] 📧 Envoi email confirmation paiement à:', customerEmail);
      await sendPaymentConfirmationEmail(customerEmail, order.id, event.id, locale);
      console.log('[WEBHOOK] ✅ Email confirmation envoyé');
    }

    // Fetch items
    const { data: items, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .select('product_id, variant, quantity, product_name')
      .eq('order_id', order.id);

    if (itemsError) {
      await markEvent({ status: 'failed', orderId: order.id, error: 'order_items_fetch_failed' });
      return NextResponse.json({ received: true, error: 'order_items_fetch_failed' }, { status: 200 });
    }

    // Assign licenses + decrement inventory (strict)
    console.log('[WEBHOOK] 📦 Traitement de', items?.length || 0, 'produits');
    if (items && items.length > 0) {
      for (const item of items) {
        const productId = item.product_id as string;
        const isDigitalProduct = productId.endsWith('-digital-key');

        if (isDigitalProduct) {
          console.log('[WEBHOOK] 🔑 Attribution licences pour:', productId, 'quantité:', item.quantity);
          const { error: rpcError } = await supabaseAdmin.rpc('assign_licenses_by_product', {
            p_order_id: order.id,
            p_product_id: productId,
            p_quantity: item.quantity,
          });

          if (rpcError) {
            console.error('[WEBHOOK] ❌ Erreur attribution licences:', rpcError);
            await markEvent({ status: 'failed', orderId: order.id, error: `assign_licenses_failed:${rpcError.code ?? 'unknown'}` });
            return NextResponse.json({ received: true, error: 'assign_licenses_failed' }, { status: 200 });
          }
          console.log('[WEBHOOK] ✅ Licences attribuées pour:', productId);
        }

        const { error: invErr } = await supabaseAdmin.rpc('decrement_product_inventory', {
          product_id: productId,
          quantity: item.quantity,
        });

        if (invErr) {
          await markEvent({ status: 'failed', orderId: order.id, error: `inventory_decrement_failed:${invErr.code ?? 'unknown'}` });
          return NextResponse.json({ received: true, error: 'inventory_decrement_failed' }, { status: 200 });
        }
      }
    }

    // Grouped license email (filter revoked)
    if (customerEmail) {
      console.log('[WEBHOOK] 📧 Récupération licences pour envoi email');
      const { data: allLicenses } = await supabaseAdmin
        .from('licenses')
        .select('key_code, product_id, revoked')
        .eq('order_id', order.id);

      const activeLicenses = (allLicenses ?? []).filter((l: any) => l.revoked !== true);
      console.log('[WEBHOOK] 🔑 Licences actives trouvées:', activeLicenses.length);

      if (activeLicenses.length > 0) {
        const licensesForEmail = activeLicenses.map((l: any) => ({
          productName: items?.find(i => i.product_id === l.product_id)?.product_name || 'Produit',
          keyCode: l.key_code,
          productId: l.product_id,
        }));

        // Générer le PDF preuve d'achat
        console.log('[WEBHOOK] 📄 Génération PDF preuve d\'achat');
        let proofPdfBuffer: Buffer | undefined;
        
        // Vérifier si le module PDF est disponible
        if (!generateInvoicePdf) {
          console.error('[WEBHOOK] ⚠️ Module PDF non disponible (échec import), email sans preuve');
          proofPdfBuffer = undefined;
        } else {
          try {
            const totalAmount = session.amount_total ? session.amount_total / 100 : 0;
            console.log('[WEBHOOK] 📄 Données pour PDF:', {
              orderNumber: order.id,
              customerEmail,
              itemsCount: items?.length || 0,
              totalAmount
            });
            
            proofPdfBuffer = await generateInvoicePdf({
            orderNumber: order.id,
            orderDate: order.created_at,
            customerEmail: customerEmail,
            paymentMethod: 'Carte bancaire (Stripe)',
            items: (items ?? []).map((item: any) => ({
              product_name: item.product_name,
              variant_name: item.variant || null,
              quantity: item.quantity,
              unit_price: item.total_price / item.quantity,
              total_price: item.total_price,
            })),
            totalAmount,
          });
          console.log('[WEBHOOK] ✅ PDF preuve d\'achat généré avec succès, taille:', proofPdfBuffer?.length || 0, 'bytes');
          } catch (pdfError) {
            console.error('[WEBHOOK] ⚠️ Erreur génération PDF (continuons sans):', pdfError);
            console.error('[WEBHOOK] 📍 Stack trace:', (pdfError as Error)?.stack);
            console.error('[WEBHOOK] 📍 Error name:', (pdfError as Error)?.name);
            console.error('[WEBHOOK] 📍 Error message:', (pdfError as Error)?.message);
            proofPdfBuffer = undefined;
          }
        }

        console.log('[WEBHOOK] 📧 Envoi email licences à:', customerEmail);
        await sendLicenseDeliveryEmail(customerEmail, order.id, event.id, licensesForEmail, locale, proofPdfBuffer);
        console.log('[WEBHOOK] ✅ Email licences envoyé');
      } else {
        console.log('[WEBHOOK] ⚠️ Aucune licence active à envoyer');
      }
    }

    // Admin email
    const totalAmount = session.amount_total ? session.amount_total / 100 : 0;
    const currency = session.currency?.toUpperCase() || 'EUR';
    const productsForAdmin = (items ?? []).map((item: any) => ({
      name: item.product_name,
      quantity: item.quantity,
      type: (String(item.product_id).endsWith('-digital-key') ? 'DIGITAL' : 'PHYSICAL') as 'DIGITAL' | 'PHYSICAL',
    }));

    await sendAdminNewSaleEmail(
      order.id,
      event.id,
      totalAmount,
      currency,
      customerEmail || 'unknown@example.com',
      productsForAdmin
    );

    await markEvent({ status: 'processed', orderId: order.id, error: null });

    console.log('[WEBHOOK] ✅ Traitement terminé avec succès pour order:', order.id);
    return NextResponse.json({ received: true, order_id: order.id }, { status: 200 });

  } catch (err) {
    // Signature is valid & insert probably happened; ACK 200 to avoid retries, but mark failed.
    const msg = safeErrorString(err);
    console.error('[WEBHOOK] ❌ ERREUR GLOBALE:', msg);

    // Best-effort: mark event as failed (event.id exists because signature passed)
    try {
      await supabaseAdmin
        .from('stripe_webhook_events')
        .update({
          processing_status: 'failed',
          processed_at: new Date().toISOString(),
          error: msg,
        })
        .eq('event_id', event.id);
    } catch (markErr) {
      // DB may be down; best-effort only
      if (env.NODE_ENV !== 'production') {
        console.error('[WEBHOOK] markEvent failed:', markErr);
      }
    }

    return NextResponse.json({ received: true, error: 'internal_error' }, { status: 200 });
  }
}
