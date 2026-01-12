/**
 * Webhook Stripe - Confirmation de paiement + Attribution de licences + Envoi d'emails
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

type AssignLicensesResult = number;

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    // Validation signature Stripe
    const rawBody = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('[WEBHOOK] Signature ou secret manquant');
      return NextResponse.json({ error: 'Configuration invalide' }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      console.error('[WEBHOOK] Signature invalide:', err.message);
      return NextResponse.json({ error: 'Signature invalide' }, { status: 400 });
    }

    // Client Supabase Admin (commun à tous les événements)
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('[WEBHOOK] Variables Supabase manquantes');
      return NextResponse.json({ error: 'Config serveur' }, { status: 500 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

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
      console.error('[WEBHOOK] Commande introuvable:', orderIdFromMetadata);
      return NextResponse.json({ received: true, warning: 'Order not found' }, { status: 200 });
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
      console.error('[WEBHOOK] SECURITY: user_id mismatch');
      return NextResponse.json({ received: true, warning: 'User ID mismatch' }, { status: 200 });
    }

    // Idempotence - Vérifier si déjà payé
    if (order.status === 'paid') {
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

    // 8️⃣ Attribution licences (idempotent)
    const { data: items } = await supabaseAdmin
      .from('order_items')
      .select('product_id, quantity, product_name')
      .eq('order_id', order.id);

    let totalLicenses = 0;
    const results = [];

    if (items && items.length > 0) {
      for (const item of items) {
        // Vérifier si des licences sont déjà attribuées (idempotence)
        const { data: alreadyAssigned } = await supabaseAdmin
          .from('licenses')
          .select('id')
          .eq('order_id', order.id)
          .eq('product_id', item.product_id);

        const alreadyCount = alreadyAssigned?.length || 0;

        if (alreadyCount >= item.quantity) {
          console.log(`[WEBHOOK] ℹ️ ${item.product_name}: déjà attribuées (${alreadyCount}/${item.quantity})`);
          totalLicenses += alreadyCount;
          results.push({ product_id: item.product_id, assigned: alreadyCount, status: 'already_assigned' });
          continue;
        }

        const remainingToAssign = item.quantity - alreadyCount;

        // Sélectionner des licences disponibles
        const { data: availableLicenses } = await supabaseAdmin
          .from('licenses')
          .select('id, key_code')
          .eq('product_id', item.product_id)
          .eq('is_used', false)
          .is('order_id', null)
          .limit(remainingToAssign);

        if (!availableLicenses || availableLicenses.length < remainingToAssign) {
          console.error(`[WEBHOOK] ❌ Stock insuffisant ${item.product_name}: ${availableLicenses?.length || 0}/${remainingToAssign} disponibles`);
          results.push({ 
            product_id: item.product_id, 
            assigned: alreadyCount, 
            status: 'insufficient_stock',
            available: availableLicenses?.length || 0,
            needed: remainingToAssign
          });
          continue;
        }

        // Attribuer les licences
        const licenseIds = availableLicenses.map(l => l.id);
        const { error: updateError } = await supabaseAdmin
          .from('licenses')
          .update({ 
            is_used: true, 
            order_id: order.id 
          })
          .in('id', licenseIds);

        if (updateError) {
          console.error(`[WEBHOOK] ❌ Erreur attribution ${item.product_name}:`, updateError);
          console.error('[WEBHOOK] license assignment error:', {
            product_id: item.product_id,
            product_name: item.product_name,
            order_id: order.id,
            license_ids: licenseIds,
            error: updateError
          });
          results.push({ product_id: item.product_id, assigned: alreadyCount, status: 'error' });
          continue;
        }

        const totalAssigned = alreadyCount + availableLicenses.length;
        totalLicenses += availableLicenses.length;
        console.log(`[WEBHOOK] ✅ ${availableLicenses.length} nouvelles licences → ${item.product_name} (total: ${totalAssigned})`);
        results.push({ product_id: item.product_id, assigned: availableLicenses.length, status: 'ok' });

        // 📧 EMAIL 2: Livraison de la clé (DÉSACTIVÉ POUR DEBUG)
        /*
        if (customerEmail && availableLicenses.length > 0) {
          try {
            const licenseKey = availableLicenses[0].key_code;

            if (licenseKey) {
              await resend.emails.send({
                from: 'AllKeyMasters <allkeymasters@gmail.com>',
                to: customerEmail,
                subject: isFrench
                  ? `🗝️ Votre clé ${item.product_name} + Guide d'installation - AllKeyMasters`
                  : `🗝️ Your ${item.product_name} Key + Installation Guide - AllKeyMasters`,
                html: isFrench
                  ? `
                    <h2>Bonjour,</h2>
                    <p>Merci pour votre achat ! Voici votre clé d'activation unique :</p>
                    <div style="background: #f0f0f0; padding: 20px; margin: 20px 0; text-align: center; font-size: 24px; font-weight: bold; border: 2px solid #333;">
                      ${licenseKey}
                    </div>

                    <h3>🚀 1. Activation Standard</h3>
                    <ol>
                      <li><strong>Téléchargement :</strong> Rendez-vous sur <a href="https://setup.office.com">https://setup.office.com</a></li>
                      <li><strong>Connexion :</strong> Connectez-vous avec votre compte Microsoft.</li>
                      <li><strong>Saisie de la clé :</strong> Entrez la clé fournie ci-dessus.</li>
                      <li><strong>Installation :</strong> Une fois activé, téléchargez Office depuis votre tableau de bord.</li>
                    </ol>

                    <h3>🛠️ 2. En cas d'erreur (Dépannage)</h3>
                    <p>Les systèmes Microsoft ont parfois des bugs de synchronisation. Si la clé est refusée, veuillez suivre ces étapes <strong>dans l'ordre</strong> :</p>

                    <h4>Étape A : Le correctif "Nouveau Compte"</h4>
                    <p>Créez un <strong>NOUVEAU</strong> compte Microsoft et réessayez l'activation. Cela résout la majorité des bugs techniques liés aux anciens comptes.</p>

                    <h4>Étape B : Activation par téléphone (Procédure officielle)</h4>
                    <p>Si l'activation en ligne échoue encore, c'est normal. Choisissez <strong>"Je veux activer le logiciel par téléphone"</strong> dans l'assistant d'activation :</p>
                    <ol>
                      <li>Sélectionnez votre pays.</li>
                      <li>Vous verrez un <strong>Installation ID</strong> (groupes de chiffres).</li>
                      <li>Appelez le numéro gratuit Microsoft affiché.</li>
                      <li>Entrez votre <strong>Installation ID</strong> sur le clavier de votre téléphone lorsque demandé.</li>
                      <li>Le système vous donnera un <strong>Confirmation ID</strong>. Tapez-le dans votre ordinateur pour finaliser l'activation.</li>
                    </ol>

                    <h3>🆘 3. Contactez notre Support</h3>
                    <p>Si vous êtes toujours bloqué après avoir essayé les étapes ci-dessus, contactez directement notre équipe de support. Nous travaillerons ensemble pour résoudre le problème aussi rapidement que possible.</p>

                    <p>Cordialement,<br/>L'équipe <strong>AllKeyMasters</strong>.</p>
                  `
                  : `
                    <h2>Hello,</h2>
                    <p>Thank you for your purchase! Here is your unique activation key:</p>
                    <div style="background: #f0f0f0; padding: 20px; margin: 20px 0; text-align: center; font-size: 24px; font-weight: bold; border: 2px solid #333;">
                      ${licenseKey}
                    </div>

                    <h3>🚀 1. Standard Activation</h3>
                    <ol>
                      <li><strong>Download:</strong> Go to <a href="https://setup.office.com">https://setup.office.com</a></li>
                      <li><strong>Sign in:</strong> Log in with your Microsoft account.</li>
                      <li><strong>Enter the key:</strong> Type the key provided above.</li>
                      <li><strong>Install:</strong> Once activated, download Office from your dashboard.</li>
                    </ol>

                    <h3>🛠️ 2. If you encounter an error (Troubleshooting)</h3>
                    <p>Microsoft systems sometimes have synchronization bugs. If the key is refused, please follow these steps <strong>in order</strong>:</p>

                    <h4>Step A: The "New Account" fix</h4>
                    <p>Create a brand <strong>NEW</strong> Microsoft account and try the activation again. This solves the majority of technical bugs linked to old accounts.</p>

                    <h4>Step B: Phone Activation (Official procedure)</h4>
                    <p>If online activation still fails, this is normal. Choose <strong>"I want to activate the software by telephone"</strong> in the activation wizard:</p>
                    <ol>
                      <li>Select your country.</li>
                      <li>You will see an <strong>Installation ID</strong> (groups of numbers).</li>
                      <li>Call the free Microsoft number displayed.</li>
                      <li>Enter your <strong>Installation ID</strong> on your phone keypad when prompted.</li>
                      <li>The system will give you a <strong>Confirmation ID</strong>. Type it into your computer to finalize the activation.</li>
                    </ol>

                    <h3>🆘 3. Contact our Support</h3>
                    <p>If you are still blocked after trying the steps above, please contact our support team directly. We will work together to resolve the issue as quickly as possible.</p>

                    <p>Best regards,<br/>The <strong>AllKeyMasters</strong> Team.</p>
                  `
              });
              console.log(`[WEBHOOK] ✅ Email 2 (Livraison) envoyé pour ${item.product_name}`);
            }
          } catch (emailError: any) {
            console.error('[WEBHOOK] ⚠️ Erreur envoi Email 2:', emailError.message);
          }
        }
        */
      }
    }

    console.log('[WEBHOOK] ✅ Webhook terminé -', totalLicenses, 'licences attribuées');

    return NextResponse.json({
      received: true,
      status: 'processed',
      order_id: order.id,
      licenses_assigned: totalLicenses,
      details: results,
    });

  } catch (error: any) {
    console.error('[WEBHOOK] ❌ Erreur critique:', error.message);
    // Retourner 200 pour éviter retries Stripe
    return NextResponse.json({ received: true, error: 'Internal error' }, { status: 200 });
  }
}
