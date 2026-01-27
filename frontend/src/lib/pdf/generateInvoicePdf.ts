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
    // Créer le template avec React.createElement pour le typing correct
    const template = React.createElement(ProofOfPurchaseTemplate, { data });
    
    const pdfStream = await ReactPDF.renderToStream(template as any);

    // Convertir le stream en Buffer
    const chunks: Uint8Array[] = [];
    return new Promise((resolve, reject) => {
      pdfStream.on('data', (chunk: Uint8Array) => chunks.push(chunk));
      pdfStream.on('end', () => resolve(Buffer.concat(chunks)));
      pdfStream.on('error', reject);
    });
  } catch (error) {
    console.error('[PDF] Erreur génération facture:', error);
    throw error;
  }
}
