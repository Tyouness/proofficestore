/**
 * 🔒 SIGNUP SERVER-SIDE — AllKeyMasters (SAFE + STANDARD SUPABASE)
 * 
 * Route API pour créer un compte utilisateur côté serveur (production-ready).
 * 
 * SÉCURITÉ:
 * - ✅ Utilise ANON_KEY (pas service_role) - route publique safe
 * - ✅ Standard Supabase avec confirmation email si configurée
 * - ✅ Jamais de log password
 * - ✅ Emails envoyés avec idempotence DB (dedupe_key)
 * 
 * FLUX:
 * 1. Validation email + password
 * 2. Création utilisateur via supabase.auth.signUp() (ANON_KEY)
 * 3. Détection si confirmation email requise
 * 4. Envoi emails (welcome OU confirmation instructions + admin) avec idempotence
 * 5. Retour {ok, needsEmailConfirmation}
 * 
 * CORRECTIFS PATCH FINAL:
 * - ✅ userId fallback: stableUserKey = userId ?? email (évite dedupe "user:undefined:...")
 * - ✅ Email cohérent: sendEmailConfirmationInstructionsEmail si confirmation requise
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';
import { 
  sendWelcomeEmail, 
  sendAdminNewSignupEmail,
  sendEmailConfirmationInstructionsEmail 
} from '@/lib/email';

// ✅ Client Supabase ANON (safe pour route publique)
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * POST /api/auth/signup
 * 
 * Body: { email: string, password: string }
 * Returns: { ok: boolean, needsEmailConfirmation?: boolean, error?: string }
 */
export async function POST(request: NextRequest) {
  try {
    // 1️⃣ Parsing JSON
    const body = await request.json();
    const { email, password } = body;

    // Validation basique
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'Email manquant ou invalide' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'Mot de passe manquant ou invalide' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { ok: false, error: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      );
    }

    // 2️⃣ Création utilisateur via Supabase Auth (ANON_KEY - SAFE)
    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${env.NEXT_PUBLIC_SITE_URL || 'https://www.allkeymasters.com'}/account`,
      },
    });

    if (signupError) {
      console.error('[SIGNUP] ❌ Supabase signup error:', signupError.message);
      
      // Messages d'erreur user-friendly
      if (signupError.message.includes('already registered') || signupError.message.includes('User already registered')) {
        return NextResponse.json(
          { ok: false, error: 'Cette adresse email est déjà utilisée' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { ok: false, error: signupError.message || 'Erreur lors de la création du compte' },
        { status: 500 }
      );
    }

    if (!data.user) {
      console.error('[SIGNUP] ❌ No user returned after signup');
      return NextResponse.json(
        { ok: false, error: 'Erreur inconnue lors de la création du compte' },
        { status: 500 }
      );
    }

    // 3️⃣ Détection confirmation email
    // Si data.user.identities existe et est vide, l'email est déjà pris
    if (data.user.identities && data.user.identities.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Cette adresse email est déjà utilisée' },
        { status: 409 }
      );
    }

    const userId = data.user.id;
    const needsEmailConfirmation = !!(data.user.identities && data.user.identities.length > 0 && !data.session);

    // 🔧 CORRECTIF PROBLÈME 1: userId fallback stable (évite dedupe_key "user:undefined:...")
    const stableUserKey = userId ?? email.toLowerCase().trim();

    console.log(`[SIGNUP] ✅ User created: ${email} (ID: ${userId || 'pending'}, Confirmation: ${needsEmailConfirmation})`);

    // 4️⃣ Envoi emails (avec idempotence DB)
    // Note: On ne bloque PAS la réponse si les emails échouent (meilleur UX)
    
    // 🔧 CORRECTIF PROBLÈME 2: Email cohérent selon confirmation requise
    if (needsEmailConfirmation) {
      // Email confirmation instructions (PAS de welcome prématuré)
      sendEmailConfirmationInstructionsEmail(email, stableUserKey)
        .then((result) => {
          if (result.skipped) {
            console.log(`[SIGNUP] ⏭️  Confirmation instructions email skipped (dedupe): ${email}`);
          } else if (!result.ok) {
            console.error(`[SIGNUP] ⚠️  Confirmation instructions email failed: ${result.error}`);
          }
        })
        .catch((err) => console.error('[SIGNUP] ❌ Confirmation instructions email exception:', err.message));
    } else {
      // Email welcome (compte activé directement)
      sendWelcomeEmail(email, stableUserKey)
        .then((result) => {
          if (result.skipped) {
            console.log(`[SIGNUP] ⏭️  Welcome email skipped (dedupe): ${email}`);
          } else if (!result.ok) {
            console.error(`[SIGNUP] ⚠️  Welcome email failed: ${result.error}`);
          }
        })
        .catch((err) => console.error('[SIGNUP] ❌ Welcome email exception:', err.message));
    }

    // Email admin (toujours envoyé)
    sendAdminNewSignupEmail(email, stableUserKey)
      .then((result) => {
        if (result.skipped) {
          console.log(`[SIGNUP] ⏭️  Admin signup email skipped (dedupe): ${email}`);
        } else if (!result.ok) {
          console.error(`[SIGNUP] ⚠️  Admin signup email failed: ${result.error}`);
        }
      })
      .catch((err) => console.error('[SIGNUP] ❌ Admin signup email exception:', err.message));

    // 5️⃣ Retour succès
    return NextResponse.json({
      ok: true,
      needsEmailConfirmation,
    });
  } catch (error: any) {
    console.error('[SIGNUP] ❌ Unexpected error:', error.message);
    return NextResponse.json(
      { ok: false, error: 'Une erreur inattendue est survenue' },
      { status: 500 }
    );
  }
}
