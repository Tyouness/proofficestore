/**
 * Générateur de PDF pour facture (webhook)
 * Utilise le template ProofOfPurchaseTemplate
 */

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
    const pdfStream = await ReactPDF.renderToStream(
      ProofOfPurchaseTemplate({ data })
    );

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
