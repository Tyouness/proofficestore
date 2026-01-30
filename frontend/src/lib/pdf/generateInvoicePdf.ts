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
  try {
    console.log('[PDF] 🚀 Début génération PDF pour commande:', data.orderNumber);
    console.log('[PDF] 📊 Données:', {
      items: data.items.length,
      total: data.totalAmount,
      email: data.customerEmail
    });
    
    // Créer le template avec React.createElement pour le typing correct
    const template = React.createElement(ProofOfPurchaseTemplate, { data });
    
    console.log('[PDF] 📄 Template créé, appel renderToStream...');
    
    const pdfStream = await ReactPDF.renderToStream(template as any);
    console.log('[PDF] 🌊 Stream créé, lecture des chunks...');

    // Convertir le stream en Buffer avec timeout
    const chunks: Uint8Array[] = [];
    return new Promise((resolve, reject) => {
      // Timeout de 30 secondes pour éviter les blocages
      const timeout = setTimeout(() => {
        console.error('[PDF] ⏱️ TIMEOUT: Génération PDF > 30s');
        reject(new Error('PDF generation timeout after 30s'));
      }, 30000);
      
      pdfStream.on('data', (chunk: Uint8Array) => {
        chunks.push(chunk);
        console.log('[PDF] 📦 Chunk reçu:', chunk.length, 'bytes, total:', chunks.length, 'chunks');
      });
      
      pdfStream.on('end', () => {
        clearTimeout(timeout);
        const buffer = Buffer.concat(chunks);
        console.log('[PDF] ✅ Stream terminé, buffer total:', buffer.length, 'bytes');
        resolve(buffer);
      });
      
      pdfStream.on('error', (err) => {
        clearTimeout(timeout);
        console.error('[PDF] ❌ Erreur stream:', err);
        reject(err);
      });
    });
  } catch (error) {
    console.error('[PDF] ❌ Erreur génération facture:', error);
    console.error('[PDF] 📍 Error name:', (error as Error)?.name);
    console.error('[PDF] 📍 Error message:', (error as Error)?.message);
    console.error('[PDF] 📍 Stack:', (error as Error)?.stack);
    throw error;
  }
}
