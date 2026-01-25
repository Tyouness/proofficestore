/**
 * API Route - Mise à jour du tracking et status d'expédition (Admin uniquement)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase-server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    // Vérification admin
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (userRole?.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Accès refusé' },
        { status: 403 }
      );
    }

    // Récupérer les données
    const body = await req.json();
    const { orderId, trackingNumber, shippingStatus } = body;

    if (!orderId || !trackingNumber || !shippingStatus) {
      return NextResponse.json(
        { success: false, message: 'Paramètres manquants' },
        { status: 400 }
      );
    }

    // Mettre à jour la commande
    const { error } = await supabaseAdmin
      .from('orders')
      .update({
        tracking_number: trackingNumber,
        shipping_status: shippingStatus
      })
      .eq('id', orderId);

    if (error) {
      console.error('[Admin Update Shipping Error]', error);
      return NextResponse.json(
        { success: false, message: `Erreur: ${error.message}` },
        { status: 500 }
      );
    }

    // TODO: Envoyer un email au client avec le tracking

    return NextResponse.json({
      success: true,
      message: 'Tracking mis à jour avec succès'
    });

  } catch (error) {
    console.error('[Admin Update Shipping Exception]', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
