/**
 * API Route - Mise à jour du tracking et status d'expédition (Admin uniquement)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase-server';
import { sendShippingTrackingEmail } from '@/lib/email';

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
    const { data: updatedOrder, error } = await supabaseAdmin
      .from('orders')
      .update({
        tracking_number: trackingNumber,
        shipping_status: shippingStatus
      })
      .eq('id', orderId)
      .select('email_client, shipping_address')
      .single();

    if (error) {
      console.error('[Admin Update Shipping Error]', error);
      return NextResponse.json(
        { success: false, message: `Erreur: ${error.message}` },
        { status: 500 }
      );
    }

    // 📧 Envoyer email au client si statut = shipped (avec idempotence DB)
    // dedupe_key = shipping:{orderId}:{trackingNumber}:{status}
    if (shippingStatus === 'shipped' && updatedOrder?.email_client) {
      await sendShippingTrackingEmail(
        updatedOrder.email_client,
        orderId,
        trackingNumber,
        shippingStatus,
        'Colissimo',
        updatedOrder.shipping_address
      );
    }

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
