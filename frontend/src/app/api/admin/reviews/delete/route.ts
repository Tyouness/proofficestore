/**
 * API Admin - Soft Delete Review
 * 
 * SÉCURITÉ :
 * ✅ Rate limiting (admin: 60 req/min)
 * ✅ Validation Zod strict (UUID)
 * ✅ Vérification admin via RLS
 * ✅ Soft delete (is_deleted flag)
 * ✅ Pas de PII dans les logs
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase-server';
import { rateLimit, getUserIdentifier } from '@/lib/rateLimit';
import { deleteReviewInputSchema, parseOrThrow } from '@/lib/validation';
import { env } from '@/lib/env';

const supabaseAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: NextRequest) {
  try {
    // ── 1. AUTHENTIFICATION ──
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // ── 2. RATE LIMITING (user-based) ──
    const identifier = getUserIdentifier(user.id);
    const limited = await rateLimit(identifier, 'admin');
    
    if (!limited.success) {
      return NextResponse.json(
        { 
          error: 'Trop de requêtes', 
          retryAfter: limited.retryAfter 
        },
        { 
          status: 429,
          headers: limited.headers
        }
      );
    }

    // ── 3. VÉRIFICATION RÔLE ADMIN ──
    const { data: userRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!userRole || userRole.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès refusé - admin requis' },
        { status: 403 }
      );
    }

    // ── 4. VALIDATION STRICTE INPUT (ZOD) ──
    let rawBody;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'JSON invalide' },
        { status: 400 }
      );
    }

    const validatedInput = parseOrThrow(
      deleteReviewInputSchema,
      rawBody,
      'delete review input'
    );

    // ── 5. SOFT DELETE ──
    const { error } = await supabaseAdmin
      .from('reviews')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: user.id,
      })
      .eq('id', validatedInput.reviewId);

    if (error) {
      console.error('[ADMIN] Erreur suppression review');
      return NextResponse.json(
        { error: 'Erreur lors de la suppression' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    // Log sans PII
    console.error('[ADMIN] Exception dans delete review');
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
