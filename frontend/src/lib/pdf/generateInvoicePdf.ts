/**
 * Générateur de PDF pour facture (webhook)
 * Utilise le template ProofOfPurchaseTemplate
 */

import React from 'react';
import ReactPDF from '@react-pdf/renderer';
import { ProofOfPurchaseTemplate } from './ProofOfPurchaseTemplate';

interface OrderItem {
  product_name: string;
  variant_name?: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface GenerateInvoicePdfArgs {
  orderNumber: string;
  orderDate: string;
  customerEmail: string;
  paymentMethod: string;
  items: OrderItem[];
  totalAmount: number;
}

/**
 * Génère un Buffer PDF pour la facture
 */
export async function generateInvoicePdf(data: GenerateInvoicePdfArgs): Promise<Buffer> {
  console.log('[PDF] ═══════════════════════════════════════════════');
  console.log('[PDF] 🚀 DÉBUT GÉNÉRATION PDF');
  console.log('[PDF] ═══════════════════════════════════════════════');
  
  try {
    console.log('[PDF] 📋 [1/5] Validation des données d\'entrée');
    console.log('[PDF] 📋 Order Number:', data.orderNumber);
    console.log('[PDF] 📋 Order Date:', data.orderDate);
    console.log('[PDF] 📋 Customer Email:', data.customerEmail);
    console.log('[PDF] 📋 Payment Method:', data.paymentMethod);
    console.log('[PDF] 📋 Items count:', data.items.length);
    console.log('[PDF] 📋 Total Amount:', data.totalAmount);
    
    if (!data.orderNumber || !data.customerEmail || !data.items || data.items.length === 0) {
      throw new Error('Données invalides pour la génération PDF');
    }
    
    console.log('[PDF] ✅ [1/5] Données validées');
    
    console.log('[PDF] 📄 [2/5] Création du template React');
    console.log('[PDF] 📄 [2/5] React version:', React.version);
    console.log('[PDF] 📄 [2/5] ProofOfPurchaseTemplate type:', typeof ProofOfPurchaseTemplate);
    
    // Créer le template avec React.createElement pour le typing correct
    const template = React.createElement(ProofOfPurchaseTemplate, { data });
    console.log('[PDF] ✅ [2/5] Template créé avec succès');
    
    console.log('[PDF] 🌊 [3/5] Appel ReactPDF.renderToStream');
    console.log('[PDF] 🌊 [3/5] ReactPDF version:', (ReactPDF as any).version || 'unknown');
    
    const pdfStream = await ReactPDF.renderToStream(template as any);
    console.log('[PDF] ✅ [3/5] Stream créé, début lecture des chunks...');

    // Convertir le stream en Buffer avec timeout
    console.log('[PDF] 📦 [4/5] Conversion stream → Buffer (timeout 30s)');
    const chunks: Uint8Array[] = [];
    let totalBytesReceived = 0;
    
    return new Promise((resolve, reject) => {
      // Timeout de 30 secondes pour éviter les blocages
      const timeout = setTimeout(() => {
        console.error('[PDF] ❌ TIMEOUT: Génération PDF > 30s');
        console.error('[PDF] 📍 Chunks reçus:', chunks.length);
        console.error('[PDF] 📍 Bytes reçus:', totalBytesReceived);
        reject(new Error('PDF generation timeout after 30s'));
      }, 30000);
      
      pdfStream.on('data', (chunk: Uint8Array) => {
        chunks.push(chunk);
        totalBytesReceived += chunk.length;
        console.log('[PDF] 📦 Chunk #' + chunks.length + ':', chunk.length, 'bytes | Total:', totalBytesReceived, 'bytes');
      });
      
      pdfStream.on('end', () => {
        clearTimeout(timeout);
        const buffer = Buffer.concat(chunks);
        console.log('[PDF] ✅ [4/5] Stream terminé avec succès');
        console.log('[PDF] ✅ [5/5] Buffer final:', buffer.length, 'bytes (', chunks.length, 'chunks)');
        console.log('[PDF] ═══════════════════════════════════════════════');
        console.log('[PDF] ✅ GÉNÉRATION PDF TERMINÉE AVEC SUCCÈS');
        console.log('[PDF] ═══════════════════════════════════════════════');
        resolve(buffer);
      });
      
      pdfStream.on('error', (err) => {
        clearTimeout(timeout);
        console.error('[PDF] ❌❌❌ ERREUR STREAM PDF ❌❌❌');
        console.error('[PDF] 📍 Error name:', (err as Error)?.name);
        console.error('[PDF] 📍 Error message:', (err as Error)?.message);
        console.error('[PDF] 📍 Error stack:', (err as Error)?.stack);
        console.error('[PDF] 📍 Chunks avant erreur:', chunks.length);
        console.error('[PDF] 📍 Bytes avant erreur:', totalBytesReceived);
        reject(err);
      });
    });
  } catch (error) {
    console.error('[PDF] ❌❌❌ ERREUR GÉNÉRATION PDF ❌❌❌');
    console.error('[PDF] 📍 Étape: Avant création du stream');
    console.error('[PDF] 📍 Error type:', (error as Error)?.constructor?.name);
    console.error('[PDF] 📍 Error name:', (error as Error)?.name);
    console.error('[PDF] 📍 Error message:', (error as Error)?.message);
    console.error('[PDF] 📍 Error stack:', (error as Error)?.stack);
    
    // Vérifications spécifiques
    if (error instanceof TypeError) {
      console.error('[PDF] 📍 TypeError détecté - possiblement:');
      console.error('[PDF] 📍   - Module @react-pdf/renderer mal installé');
      console.error('[PDF] 📍   - Composant ProofOfPurchaseTemplate invalide');
      console.error('[PDF] 📍   - Props manquantes ou incorrectes');
    }
    
    throw error;
  }
}
