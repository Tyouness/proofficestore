/**
 * 📧 SYSTÈME EMAIL PRODUCTION-READY — AllKeyMasters
 * 
 * Architecture:
 * - Idempotence DB via table email_logs (dedupe_key UNIQUE)
 * - Centralisation via sendEmail() (gère insert + envoi + update)
 * - Toutes les fonctions spécifiques appellent sendEmail()
 * 
 * RÈGLES CRITIQUES:
 * - FROM: AllKeyMasters <no-reply@allkeymasters.com>
 * - REPLY-TO: support@allkeymasters.com
 * - Idempotence: dedupe_key stable (stripe:event_id:kind, user:id:kind, etc.)
 * - Try/catch systématique + logs
 * - Pas de tracking open/click
 */

import { Resend } from 'resend';
import { env } from '@/lib/env';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(env.RESEND_API_KEY);

const FROM_EMAIL = 'AllKeyMasters <no-reply@allkeymasters.com>';
const REPLY_TO_EMAIL = 'support@allkeymasters.com';
const ADMIN_EMAIL = 'support@allkeymasters.com';

// Client Supabase Admin (pour email_logs)
const supabaseAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

type EmailResult = {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  error?: string;
  providerId?: string;
};

type EmailKind =
  | 'payment_confirmation'
  | 'license_delivery'
  | 'shipping_tracking'
  | 'welcome'
  | 'admin_sale'
  | 'admin_signup';

interface SendEmailArgs {
  dedupeKey: string;
  kind: EmailKind;
  to: string;
  subject: string;
  html: string;
  payload?: any; // Pour debug/audit
}

/**
 * 🔒 FONCTION CENTRALE — Envoi email avec idempotence DB
 * 
 * Flux:
 * 1. INSERT email_logs (dedupe_key UNIQUE) → si violation = skip
 * 2. Envoi Resend
 * 3. UPDATE email_logs (status + provider_id ou error)
 */
async function sendEmail(args: SendEmailArgs): Promise<EmailResult> {
  const { dedupeKey, kind, to, subject, html, payload } = args;

  // 🔧 CORRECTIF PROBLÈME 4: Log de début
  console.log(`[EMAIL] -> sending kind=${kind} to=${to} dedupe=${dedupeKey}`);

  try {
    // 1️⃣ INSERT email_logs (idempotence gate)
    const { data: emailLog, error: insertError } = await supabaseAdmin
      .from('email_logs')
      .insert({
        dedupe_key: dedupeKey,
        kind,
        to_email: to,
        subject,
        status: 'pending',
        provider: 'resend',
        payload: payload || {},
      })
      .select('id')
      .single();

    // Dedupe: clé déjà existante
    if (insertError) {
      if (insertError.code === '23505') {
        // Unique violation
        console.log(`[EMAIL] ⏭️  Skipped (dedupe): ${dedupeKey}`);
        return { ok: true, skipped: true, reason: 'dedupe' };
      }
      // Autre erreur DB (grave)
      console.error(`[EMAIL] ❌ DB insert error (${dedupeKey}):`, insertError);
      return { ok: false, error: `DB error: ${insertError.message}` };
    }

    if (!emailLog) {
      console.error(`[EMAIL] ❌ No email log created (${dedupeKey})`);
      return { ok: false, error: 'No email log created' };
    }

    // 2️⃣ Envoi Resend (avec timeout 8s)
    try {
      // 🔧 CORRECTIF PROBLÈME 4: Timeout 8000ms
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 8000)
      );

      const { data: resendData, error: resendError } = await Promise.race([
        resend.emails.send({
          from: FROM_EMAIL,
          replyTo: REPLY_TO_EMAIL,
          to,
          subject,
          html,
        }),
        timeoutPromise,
      ]) as any;

      if (resendError) {
        // Échec Resend
        await supabaseAdmin
          .from('email_logs')
          .update({
            status: 'failed',
            error: resendError.message || 'Unknown Resend error',
          })
          .eq('id', emailLog.id);

        console.error(`[EMAIL] ❌ Resend failed (${dedupeKey}):`, resendError.message);
        return { ok: false, error: resendError.message };
      }

      // 3️⃣ Succès: UPDATE email_logs
      await supabaseAdmin
        .from('email_logs')
        .update({
          status: 'sent',
          provider_id: resendData?.id || null,
        })
        .eq('id', emailLog.id);

      console.log(`[EMAIL] ✅ Sent (${kind}): ${to} | Resend ID: ${resendData?.id} | Dedupe: ${dedupeKey}`);
      return { ok: true, providerId: resendData?.id };
    } catch (resendException: any) {
      // Exception Resend (réseau, timeout, etc.)
      const errorMsg = resendException.message || 'Resend exception';
      const isTimeout = errorMsg === 'timeout';
      
      await supabaseAdmin
        .from('email_logs')
        .update({
          status: 'failed',
          error: errorMsg,
        })
        .eq('id', emailLog.id);

      console.error(`[EMAIL] ❌ Resend ${isTimeout ? 'timeout' : 'exception'} (${dedupeKey}):`, errorMsg);
      return { ok: false, error: errorMsg };
    }
  } catch (globalError: any) {
    console.error(`[EMAIL] ❌ Global error (${dedupeKey}):`, globalError.message);
    return { ok: false, error: globalError.message };
  }
}

// ──────────────────────────────────────────────────────────────
// EMAILS CLIENTS
// ──────────────────────────────────────────────────────────────

/**
 * 1️⃣ Confirmation de paiement (Email 1/2)
 */
export async function sendPaymentConfirmationEmail(
  customerEmail: string,
  orderId: string,
  stripeEventId: string,
  locale: string = 'fr'
): Promise<EmailResult> {
  const isFrench = locale.toLowerCase().startsWith('fr');
  const dedupeKey = `stripe:${stripeEventId}:payment_confirmation`;

  return sendEmail({
    dedupeKey,
    kind: 'payment_confirmation',
    to: customerEmail,
    subject: isFrench
      ? '✅ Votre paiement est validé - AllKeyMasters'
      : '✅ Your payment is confirmed - AllKeyMasters',
    html: isFrench
      ? `
        <!DOCTYPE html>
        <html>
          <head><meta charset="utf-8"></head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">✅ Paiement validé</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #1f2937; margin-top: 0;">Bonjour,</h2>
              
              <p style="font-size: 16px;">Nous avons bien reçu votre paiement pour votre commande <strong>${orderId}</strong>. Merci de votre confiance !</p>
              
              <div style="background: #fff; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <h3 style="margin-top: 0; color: #10b981;">📬 Quelle est la suite ?</h3>
                <p>Votre commande est en cours de traitement. Vous allez recevoir d'ici quelques instants un <strong>deuxième email</strong> contenant :</p>
                <ul style="margin: 10px 0;">
                  <li>Votre/vos clé(s) d'activation</li>
                  <li>Un guide d'installation complet</li>
                  <li>Les liens de téléchargement officiels Microsoft</li>
                </ul>
              </div>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                Vous pouvez également retrouver vos licences à tout moment dans votre 
                <a href="https://www.allkeymasters.com/account" style="color: #3b82f6; text-decoration: none;">espace client</a>.
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="font-size: 14px; color: #6b7280;">
                À tout de suite,<br/>
                <strong>L'équipe AllKeyMasters</strong>
              </p>
              
              <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">
                Une question ? Répondez à cet email ou contactez-nous à ${REPLY_TO_EMAIL}
              </p>
            </div>
          </body>
        </html>
      `
      : `
        <!DOCTYPE html>
        <html>
          <head><meta charset="utf-8"></head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">✅ Payment Confirmed</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #1f2937; margin-top: 0;">Hello,</h2>
              
              <p style="font-size: 16px;">We have received your payment for order <strong>${orderId}</strong>. Thank you for your trust!</p>
              
              <div style="background: #fff; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <h3 style="margin-top: 0; color: #10b981;">📬 What's next?</h3>
                <p>Your order is being processed. You will receive a <strong>second email</strong> in a few moments containing:</p>
                <ul style="margin: 10px 0;">
                  <li>Your activation key(s)</li>
                  <li>A complete installation guide</li>
                  <li>Official Microsoft download links</li>
                </ul>
              </div>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                You can also find your licenses anytime in your 
                <a href="https://www.allkeymasters.com/account" style="color: #3b82f6; text-decoration: none;">account area</a>.
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="font-size: 14px; color: #6b7280;">
                See you soon,<br/>
                <strong>The AllKeyMasters Team</strong>
              </p>
              
              <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">
                Questions? Reply to this email or contact us at ${REPLY_TO_EMAIL}
              </p>
            </div>
          </body>
        </html>
      `,
    payload: { orderId, stripeEventId, locale },
  });
}

/**
 * 2️⃣ Livraison des licences (Email 2/2 - CRITIQUE)
 * 
 * ⚠️ NE JAMAIS APPELER AVANT QUE LES CLÉS SOIENT ASSIGNÉES EN DB
 */
export async function sendLicenseDeliveryEmail(
  customerEmail: string,
  orderId: string,
  stripeEventId: string,
  licenses: Array<{ productName: string; keyCode: string; productId: string }>,
  locale: string = 'fr'
): Promise<EmailResult> {
  const isFrench = locale.toLowerCase().startsWith('fr');
  const dedupeKey = `stripe:${stripeEventId}:license_delivery`;

  // Sécurité: ne pas envoyer si 0 clés
  if (!licenses || licenses.length === 0) {
    console.warn(`[EMAIL] ⚠️  No licenses to deliver (Order: ${orderId})`);
    return { ok: false, error: 'No licenses provided' };
  }

  // Générer HTML des licences
  const licensesHTML = licenses
    .map(
      (lic) => `
      <div style="background: white; border: 2px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 15px 0;">
        <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 18px;">${lic.productName}</h3>
        <div style="background: #f3f4f6; padding: 12px; border-radius: 5px; font-family: monospace; font-size: 16px; font-weight: bold; color: #1f2937; letter-spacing: 1px;">
          ${lic.keyCode}
        </div>
      </div>
    `
    )
    .join('');

  return sendEmail({
    dedupeKey,
    kind: 'license_delivery',
    to: customerEmail,
    subject: isFrench
      ? `🔑 Vos licences AllKeyMasters - Commande ${orderId}`
      : `🔑 Your AllKeyMasters Licenses - Order ${orderId}`,
      html: isFrench
        ? `
          <!DOCTYPE html>
          <html>
            <head><meta charset="utf-8"></head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🔑 Vos licences sont prêtes !</h1>
              </div>
              
              <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                <p style="font-size: 16px;">Bonjour,</p>
                
                <p style="font-size: 16px;">Voici vos clés d'activation pour la commande <strong>${orderId}</strong> :</p>
                
                ${licensesHTML}
                
                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px;">
                  <p style="margin: 0; font-size: 14px; color: #92400e;">
                    <strong>⚠️ Important :</strong> Conservez précieusement ces clés. Vous pouvez également les retrouver à tout moment dans votre 
                    <a href="https://www.allkeymasters.com/account" style="color: #3b82f6;">espace client</a>.
                  </p>
                </div>
                
                <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #1e40af;">📥 Prochaines étapes</h3>
                  <ol style="margin: 10px 0; padding-left: 20px;">
                    <li>Téléchargez le logiciel depuis le <a href="https://www.microsoft.com" style="color: #3b82f6;">site officiel Microsoft</a></li>
                    <li>Installez le logiciel sur votre ordinateur</li>
                    <li>Entrez votre clé d'activation lors de l'installation</li>
                    <li>Profitez de votre logiciel activé à vie !</li>
                  </ol>
                </div>
                
                <p style="font-size: 14px; color: #6b7280;">
                  Un problème d'activation ? Notre équipe support est disponible à ${REPLY_TO_EMAIL}
                </p>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                
                <p style="font-size: 14px; color: #6b7280;">
                  Merci de votre confiance,<br/>
                  <strong>L'équipe AllKeyMasters</strong>
                </p>
              </div>
            </body>
          </html>
        `
        : `
          <!DOCTYPE html>
          <html>
            <head><meta charset="utf-8"></head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🔑 Your licenses are ready!</h1>
              </div>
              
              <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                <p style="font-size: 16px;">Hello,</p>
                
                <p style="font-size: 16px;">Here are your activation keys for order <strong>${orderId}</strong>:</p>
                
                ${licensesHTML}
                
                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px;">
                  <p style="margin: 0; font-size: 14px; color: #92400e;">
                    <strong>⚠️ Important:</strong> Keep these keys safe. You can also find them anytime in your 
                    <a href="https://www.allkeymasters.com/account" style="color: #3b82f6;">account area</a>.
                  </p>
                </div>
                
                <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #1e40af;">📥 Next Steps</h3>
                  <ol style="margin: 10px 0; padding-left: 20px;">
                    <li>Download the software from the <a href="https://www.microsoft.com" style="color: #3b82f6;">official Microsoft website</a></li>
                    <li>Install the software on your computer</li>
                    <li>Enter your activation key during installation</li>
                    <li>Enjoy your lifetime-activated software!</li>
                  </ol>
                </div>
                
                <p style="font-size: 14px; color: #6b7280;">
                  Activation issues? Our support team is available at ${REPLY_TO_EMAIL}
                </p>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                
                <p style="font-size: 14px; color: #6b7280;">
                  Thank you for your trust,<br/>
                  <strong>The AllKeyMasters Team</strong>
                </p>
              </div>
            </body>
          </html>
        `,
    payload: { orderId, stripeEventId, licenses, locale },
  });
}

/**
 * 3️⃣ Notification d'expédition (produits physiques)
 */
export async function sendShippingTrackingEmail(
  customerEmail: string,
  orderId: string,
  trackingNumber: string,
  shippingStatus: string,
  carrier: string = 'Colissimo',
  shippingAddress?: string
): Promise<EmailResult> {
  const dedupeKey = `shipping:${orderId}:${trackingNumber}:${shippingStatus}`;

  return sendEmail({
    dedupeKey,
    kind: 'shipping_tracking',
    to: customerEmail,
    subject: `📦 Votre commande ${orderId} a été expédiée !`,
      html: `
        <!DOCTYPE html>
        <html>
          <head><meta charset="utf-8"></head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">📦 Commande expédiée !</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px;">Bonjour,</p>
              
              <p style="font-size: 16px;">Votre commande <strong>${orderId}</strong> a été expédiée et est en route vers vous !</p>
              
              <div style="background: white; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #1f2937;">🚚 Informations de suivi</h3>
                <p style="margin: 10px 0;"><strong>Transporteur :</strong> ${carrier}</p>
                <p style="margin: 10px 0;"><strong>Numéro de suivi :</strong></p>
                <div style="background: #f3f4f6; padding: 12px; border-radius: 5px; font-family: monospace; font-size: 16px; font-weight: bold; color: #1f2937;">
                  ${trackingNumber}
                </div>
                ${
                  shippingAddress
                    ? `<p style="margin: 10px 0;"><strong>Adresse de livraison :</strong><br/>${shippingAddress.replace(
                        /\n/g,
                        '<br/>'
                      )}</p>`
                    : ''
                }
              </div>
              
              <div style="background: #dbeafe; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px;">
                  💡 <strong>Astuce :</strong> Vous pouvez suivre votre colis en temps réel sur le site du transporteur en utilisant votre numéro de suivi.
                </p>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="font-size: 14px; color: #6b7280;">
                Merci de votre commande,<br/>
                <strong>L'équipe AllKeyMasters</strong>
              </p>
              
              <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">
                Une question ? Contactez-nous à ${REPLY_TO_EMAIL}
              </p>
            </div>
          </body>
        </html>
      `,
    payload: { orderId, trackingNumber, shippingStatus, carrier, shippingAddress },
  });
}

/**
 * 4️⃣ Email de bienvenue (création de compte - compte activé directement)
 * 
 * 🔧 CORRECTIF PROBLÈME 1: userKey au lieu de userId (fallback stable)
 */
export async function sendWelcomeEmail(customerEmail: string, userKey: string): Promise<EmailResult> {
  const dedupeKey = `user:${userKey}:welcome`;

  return sendEmail({
    dedupeKey,
    kind: 'welcome',
    to: customerEmail,
    subject: '🎉 Bienvenue chez AllKeyMasters !',
      html: `
        <!DOCTYPE html>
        <html>
          <head><meta charset="utf-8"></head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Bienvenue !</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px;">Bonjour et bienvenue chez AllKeyMasters !</p>
              
              <p style="font-size: 16px;">Votre compte a été créé avec succès. Vous pouvez maintenant profiter de tous nos avantages :</p>
              
              <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <ul style="margin: 0; padding-left: 20px;">
                  <li style="margin: 10px 0;">✅ Accès permanent à vos licences</li>
                  <li style="margin: 10px 0;">📥 Téléchargement illimité de vos clés</li>
                  <li style="margin: 10px 0;">📜 Historique de toutes vos commandes</li>
                  <li style="margin: 10px 0;">🎫 Système de support prioritaire</li>
                  <li style="margin: 10px 0;">🔔 Notifications de nouveaux produits</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://www.allkeymasters.com/account" style="display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                  Accéder à mon espace client
                </a>
              </div>
              
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  <strong>💡 Astuce :</strong> Pensez à vérifier vos spams si vous ne recevez pas nos emails. Ajoutez ${FROM_EMAIL} à vos contacts.
                </p>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="font-size: 14px; color: #6b7280;">
                Besoin d'aide ? Notre équipe support est à votre disposition à ${REPLY_TO_EMAIL}
              </p>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
                À bientôt,<br/>
                <strong>L'équipe AllKeyMasters</strong>
              </p>
            </div>
          </body>
        </html>
      `,
    payload: { userKey },
  });
}

// ──────────────────────────────────────────────────────────────
// EMAILS ADMIN
// ──────────────────────────────────────────────────────────────

/**
 * 5️⃣ Notification admin — Nouvelle vente
 */
export async function sendAdminNewSaleEmail(
  orderId: string,
  stripeEventId: string,
  amount: number,
  currency: string,
  customerEmail: string,
  products: Array<{ name: string; quantity: number; type: 'DIGITAL' | 'PHYSICAL' }>,
  shippingAddress?: string
): Promise<EmailResult> {
  const dedupeKey = `stripe:${stripeEventId}:admin_sale`;
  const productsHTML = products
    .map(
      (p) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${p.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${p.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">
          <span style="background: ${
            p.type === 'DIGITAL' ? '#dbeafe' : '#fef3c7'
          }; color: ${
        p.type === 'DIGITAL' ? '#1e40af' : '#92400e'
      }; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
            ${p.type}
          </span>
        </td>
      </tr>
    `
    )
    .join('');

  return sendEmail({
    dedupeKey,
    kind: 'admin_sale',
    to: ADMIN_EMAIL,
    subject: `💰 Nouvelle vente ${amount} ${currency} - ${orderId}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head><meta charset="utf-8"></head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 700px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 25px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">💰 Nouvelle vente AllKeyMasters</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 25px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
              <div style="background: white; border-radius: 6px; padding: 20px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
                <h2 style="margin-top: 0; color: #1f2937; font-size: 18px;">📋 Détails de la commande</h2>
                <p style="margin: 8px 0;"><strong>ID Commande :</strong> <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 3px;">${orderId}</code></p>
                <p style="margin: 8px 0;"><strong>Montant :</strong> ${amount} ${currency}</p>
                <p style="margin: 8px 0;"><strong>Client :</strong> <a href="mailto:${customerEmail}" style="color: #3b82f6;">${customerEmail}</a></p>
              </div>
              
              <div style="background: white; border-radius: 6px; padding: 20px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
                <h2 style="margin-top: 0; color: #1f2937; font-size: 18px;">🛒 Produits commandés</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="background: #f9fafb;">
                      <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Produit</th>
                      <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e5e7eb;">Quantité</th>
                      <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e5e7eb;">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${productsHTML}
                  </tbody>
                </table>
              </div>
              
              ${
                shippingAddress
                  ? `
                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 5px;">
                  <h3 style="margin-top: 0; color: #92400e; font-size: 16px;">📦 Adresse de livraison (produit physique)</h3>
                  <p style="margin: 0; font-size: 14px; white-space: pre-line;">${shippingAddress}</p>
                </div>
              `
                  : ''
              }
              
              <div style="text-align: center; margin-top: 25px;">
                <a href="https://www.allkeymasters.com/admin/orders" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Voir dans le panel admin
                </a>
              </div>
            </div>
          </body>
        </html>
      `,
    payload: { orderId, stripeEventId, amount, currency, customerEmail, products, shippingAddress },
  });
}

/**
 * 6️⃣ Notification admin — Nouvelle inscription
 * 
 * 🔧 CORRECTIF PROBLÈME 1: userKey au lieu de userId (fallback stable)
 */
export async function sendAdminNewSignupEmail(customerEmail: string, userKey: string): Promise<EmailResult> {
  const dedupeKey = `user:${userKey}:admin_signup`;
  const timestamp = new Date().toLocaleString('fr-FR', {
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  return sendEmail({
    dedupeKey,
    kind: 'admin_signup',
    to: ADMIN_EMAIL,
    subject: `👤 Nouvelle inscription - ${customerEmail}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head><meta charset="utf-8"></head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 25px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">👤 Nouvelle inscription</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 25px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
              <div style="background: white; border-radius: 6px; padding: 20px; border: 1px solid #e5e7eb;">
                <h2 style="margin-top: 0; color: #1f2937; font-size: 18px;">📋 Informations utilisateur</h2>
                <p style="margin: 8px 0;"><strong>Email :</strong> <a href="mailto:${customerEmail}" style="color: #3b82f6;">${customerEmail}</a></p>
                <p style="margin: 8px 0;"><strong>User Key :</strong> <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 3px; font-size: 12px;">${userKey}</code></p>
                <p style="margin: 8px 0;"><strong>Date/Heure :</strong> ${timestamp}</p>
              </div>
              
              <div style="text-align: center; margin-top: 20px;">
                <a href="https://www.allkeymasters.com/admin/users" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Voir dans le panel admin
                </a>
              </div>
            </div>
          </body>
        </html>
      `,
    payload: { userKey, timestamp },
  });
}

// ──────────────────────────────────────────────────────────────
// EMAIL CONFIRMATION (inscription avec confirmation email)
// ──────────────────────────────────────────────────────────────

/**
 * 7️⃣ Instructions de confirmation email (nouvelle inscription avec confirmation requise)
 * 
 * 🔧 CORRECTIF PROBLÈME 2: Email cohérent quand needsEmailConfirmation=true
 * 
 * Au lieu d'envoyer un welcome prématuré disant "compte activé", on envoie
 * un email expliquant qu'il faut confirmer l'adresse email d'abord.
 */
export async function sendEmailConfirmationInstructionsEmail(
  customerEmail: string,
  userKey: string
): Promise<EmailResult> {
  const dedupeKey = `user:${userKey}:email_confirmation_instructions`;

  return sendEmail({
    dedupeKey,
    kind: 'welcome', // Gardons 'welcome' comme kind (c'est le premier email d'inscription)
    to: customerEmail,
    subject: '📧 Confirmez votre adresse email – AllKeyMasters',
    html: `
        <!DOCTYPE html>
        <html>
          <head><meta charset="utf-8"></head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">📧 Confirmez votre email</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px;">Bonjour,</p>
              
              <p style="font-size: 16px;">Merci de vous être inscrit sur AllKeyMasters ! Pour activer votre compte, vous devez confirmer votre adresse email.</p>
              
              <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <h3 style="margin-top: 0; color: #1e40af;">📬 Prochaines étapes</h3>
                <ol style="margin: 10px 0; padding-left: 20px;">
                  <li>Vérifiez votre boîte de réception (y compris spams/promotions)</li>
                  <li>Ouvrez l'email de confirmation Supabase</li>
                  <li>Cliquez sur le lien de confirmation</li>
                  <li>Connectez-vous à votre compte !</li>
                </ol>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://mail.google.com" target="_blank" style="display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 5px;">
                  📧 Ouvrir Gmail
                </a>
                <a href="https://outlook.live.com" target="_blank" style="display: inline-block; background: #0078d4; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 5px;">
                  📧 Ouvrir Outlook
                </a>
              </div>
              
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  <strong>⚠️ Email de confirmation non reçu ?</strong><br/>
                  Vérifiez vos spams ou contactez-nous à ${REPLY_TO_EMAIL}
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <p style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">Une fois confirmé, connectez-vous :</p>
                <a href="https://www.allkeymasters.com/login" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                  🔐 Se connecter
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="font-size: 14px; color: #6b7280;">
                À très bientôt,<br/>
                <strong>L'équipe AllKeyMasters</strong>
              </p>
              
              <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">
                Besoin d'aide ? Contactez-nous à ${REPLY_TO_EMAIL}
              </p>
            </div>
          </body>
        </html>
      `,
    payload: { userKey },
  });
}
