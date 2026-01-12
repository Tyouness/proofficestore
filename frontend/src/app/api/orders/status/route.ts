/**
 * Route API : Vérification du statut de commande
 * 
 * ⚠️ RÈGLES :
 * - Client Supabase ADMIN (service role) local
 * - Lecture seule du statut
 * - Utilisé par /checkout/success pour polling
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  try {
    // Récupération du session_id depuis les query params
    const searchParams = req.nextUrl.searchParams;
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'session_id requis' },
        { status: 400 }
      );
    }

    // Client Supabase ADMIN (service role)
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[ORDER_STATUS] Configuration manquante');
      return NextResponse.json(
        { error: 'Configuration serveur manquante' },
        { status: 500 }
      );
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

    // Recherche de la commande
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('id, status, user_id, email_client')
      .eq('stripe_session_id', sessionId)
      .single();

    if (error || !order) {
      console.error('[ORDER_STATUS] Commande introuvable:', error);
      return NextResponse.json(
        { error: 'Commande introuvable' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        order_id: order.id,
        status: order.status,
        user_id: order.user_id,
        email: order.email_client,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('[ORDER_STATUS] Erreur:', error);

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
