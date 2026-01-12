/**
 * Types pour le tunnel de paiement sécurisé
 */

export interface CheckoutItem {
  productId: string;    // Le slug du produit (ex: 'win-11-pro')
  variant: 'digital' | 'dvd' | 'usb';
  quantity: number;
}

export interface CreateCheckoutSessionInput {
  items: CheckoutItem[];
  email: string;
}

export interface CreateCheckoutSessionResult {
  success: boolean;
  sessionUrl?: string;
  error?: string;
}

export interface OrderRecord {
  id: string;
  email_client: string;
  status: 'pending' | 'paid' | 'canceled';
  total_amount: number; // En centimes
  stripe_session_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItemRecord {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  variant: 'digital' | 'dvd' | 'usb';
  unit_price: number; // En centimes
  quantity: number;
  created_at: string;
}
