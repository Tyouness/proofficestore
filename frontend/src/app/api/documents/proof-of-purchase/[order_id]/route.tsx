/**
 * API Route : Génération de Preuve d'Achat PDF
 * Route : /api/documents/proof-of-purchase/[order_id]
 * Méthode : GET
 * 
 * SÉCURITÉ :
 * - Authentification requise
 * - Vérification ownership (utilisateur = propriétaire de la commande)
 * - Commande doit être payée (status = 'paid')
 * 
 * ❌ AUCUNE donnée sensible (clé de licence) dans le PDF
 * ✅ Document NON FISCAL (preuve d'achat uniquement)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { renderToStream } from '@react-pdf/renderer';
import { ProofOfPurchaseTemplate } from '@/lib/pdf/ProofOfPurchaseTemplate';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ order_id: string }> }
) {
  try {
    const { order_id } = await params;

    // 1. Vérifier l'authentification
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié. Veuillez vous connecter.' },
        { status: 401 }
      );
    }

    // 2. Récupérer la commande et vérifier l'ownership
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        created_at,
        total_amount,
        status,
        user_id,
        customer_email
      `)
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Commande introuvable.' },
        { status: 404 }
      );
    }

    // 3. Vérifier que l'utilisateur est propriétaire de la commande
    if (order.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Accès non autorisé à cette commande.' },
        { status: 403 }
      );
    }

    // 4. Vérifier que la commande est payée
    if (order.status !== 'paid') {
      return NextResponse.json(
        { error: 'La preuve d\'achat n\'est disponible que pour les commandes payées.' },
        { status: 400 }
      );
    }

    // 5. Récupérer les items de la commande
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        product_name,
        variant_name,
        quantity,
        unit_price,
        total_price
      `)
      .eq('order_id', order_id)
      .order('created_at', { ascending: true });

    if (itemsError || !orderItems || orderItems.length === 0) {
      return NextResponse.json(
        { error: 'Aucun produit trouvé pour cette commande.' },
        { status: 404 }
      );
    }

    // 6. Préparer les données pour le PDF
    const proofData = {
      orderNumber: order.order_number,
      orderDate: order.created_at,
      customerEmail: order.customer_email,
      paymentMethod: 'Carte bancaire (Stripe)', // Toutes les commandes passent par Stripe
      items: orderItems.map(item => ({
        product_name: item.product_name,
        variant_name: item.variant_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      })),
      totalAmount: order.total_amount,
    };

    // 7. Générer le PDF à la volée
    const pdfStream = await renderToStream(
      <ProofOfPurchaseTemplate data={proofData} />
    );

    // 8. Convertir le stream en buffer
    const chunks: any[] = [];
    for await (const chunk of pdfStream) {
      chunks.push(chunk);
    }
    const pdfBuffer = Buffer.concat(chunks.map(chunk => 
      Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    ));

    // 9. Retourner le PDF avec les bons headers
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="preuve-achat-${order.order_number}.pdf"`,
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error('[PDF Generation Error]', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du PDF. Veuillez réessayer.' },
      { status: 500 }
    );
  }
}

/**
 * Sécurité supplémentaire : Désactiver les autres méthodes HTTP
 */
export async function POST() {
  return NextResponse.json({ error: 'Méthode non autorisée' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Méthode non autorisée' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Méthode non autorisée' }, { status: 405 });
}
