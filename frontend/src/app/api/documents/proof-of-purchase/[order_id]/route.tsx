/**
 * API Route : Génération de Preuve d'Achat PDF
 * Route : /api/documents/proof-of-purchase/[order_id]
 * Méthode : GET
 * 
 * SÉCURITÉ :
 * - Authentification requise
 * - Vérification ownership (utilisateur = propriétaire de la commande) OU admin
 * - Commande doit être payée (status = 'paid')
 * - Snapshot immuable stocké en DB pour conformité juridique
 * 
 * ❌ AUCUNE donnée sensible (clé de licence) dans le PDF
 * ✅ Document NON FISCAL (preuve d'achat uniquement)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { renderToStream } from '@react-pdf/renderer';
import { ProofOfPurchaseTemplate } from '@/lib/pdf/ProofOfPurchaseTemplate';

// ⚠️ CRITIQUE : Node.js runtime requis pour @react-pdf/renderer
export const runtime = 'nodejs';

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

    // 1b. Vérifier si l'utilisateur est admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    const isAdmin = profile?.role === 'admin';

    // 2. Récupérer la commande (avec paid_at pour date exacte de paiement)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        created_at,
        paid_at,
        total_amount,
        status,
        user_id,
        email_client,
        proof_snapshot
      `)
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Commande introuvable.' },
        { status: 404 }
      );
    }

    // 3. Vérifier que l'utilisateur est propriétaire OU admin
    if (order.user_id !== user.id && !isAdmin) {
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

    // 4b. ⚠️ CRITIQUE : Vérifier paid_at existe (sinon date incorrecte)
    if (!order.paid_at) {
      return NextResponse.json(
        { error: 'Date de paiement manquante. Contactez le support.' },
        { status: 500 }
      );
    }

    // 5. ⚠️ IMMUTABILITÉ : Si snapshot existe, l'utiliser (preuve juridique)
    if (order.proof_snapshot) {
      const snapshot = JSON.parse(order.proof_snapshot);
      
      // Générer le PDF à partir du snapshot immuable
      const pdfStream = await renderToStream(
        <ProofOfPurchaseTemplate data={snapshot} />
      );

      const chunks: any[] = [];
      for await (const chunk of pdfStream) {
        chunks.push(chunk);
      }
      const pdfBuffer = Buffer.concat(chunks.map(chunk => 
        Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      ));

      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="preuve-achat-${order.id}.pdf"`,
          'Cache-Control': 'no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    }

    // 6. Récupérer les items de la commande (pour créer le snapshot)
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        product_name,
        variant,
        quantity,
        unit_price
      `)
      .eq('order_id', order_id)
      .order('created_at', { ascending: true });

    if (itemsError || !orderItems || orderItems.length === 0) {
      return NextResponse.json(
        { error: 'Aucun produit trouvé pour cette commande.' },
        { status: 404 }
      );
    }

    // Calculer total_price pour chaque item
    const itemsWithTotal = orderItems.map(item => ({
      product_name: item.product_name,
      variant_name: item.variant || 'digital',
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.unit_price * item.quantity
    }));

    // 7. ⚠️ COHÉRENCE : Vérifier que sum(items) correspond au total
    const itemsTotal = itemsWithTotal.reduce((sum, item) => sum + item.total_price, 0);
    if (Math.abs(itemsTotal - order.total_amount) > 1) { // Tolérance 1 centime
      console.error('[PDF] Incohérence totaux:', { itemsTotal, orderTotal: order.total_amount });
      // On continue mais on log l'erreur (à investiguer côté métier)
    }

    // 8. ⚠️ SNAPSHOT IMMUABLE : Figer les données à l'instant T
    const proofData = {
      orderNumber: order.id.substring(0, 8).toUpperCase(), // ID court pour lisibilité
      orderDate: order.paid_at, // ✅ Date de paiement réelle (pas created_at)
      customerEmail: order.email_client,
      paymentMethod: 'Carte bancaire (Stripe)',
      items: itemsWithTotal,
      totalAmount: order.total_amount,
      generatedAt: new Date().toISOString(), // Date de première génération
      templateVersion: '1.0.0', // Versioning du template
    };

    // 9. ⚠️ STOCKER LE SNAPSHOT en DB (immutabilité juridique)
    await supabase
      .from('orders')
      .update({ 
        proof_snapshot: JSON.stringify(proofData),
        proof_generated_at: new Date().toISOString()
      })
      .eq('id', order_id)
      .is('proof_snapshot', null); // Uniquement si pas déjà généré

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
        'Content-Disposition': `attachment; filename="preuve-achat-${order.id}.pdf"`,
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
