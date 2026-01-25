/**
 * Types pour le tunnel de paiement sécurisé
 */

export interface CheckoutItem {
  productId: string;    // Le slug du produit (ex: 'win-11-pro')
  variant: 'digital' | 'dvd' | 'usb';
  quantity: number;
}

export interface ShippingAddressInput {
  shipping_name: string;
  shipping_address: string;
  shipping_zip: string;
  shipping_city: string;
  shipping_country: string;
  shipping_phone_prefix: string;
  shipping_phone_number: string;
}

export interface CreateCheckoutSessionInput {
  items: CheckoutItem[];
  email: string;
  shippingAddress?: ShippingAddressInput; // Requis si items contient DVD/USB
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
  shipping_status?: 'pending' | 'shipped' | null;
  shipping_name?: string | null;
  shipping_address?: string | null;
  shipping_zip?: string | null;
  shipping_city?: string | null;
  shipping_country?: string | null;
  shipping_phone_prefix?: string | null;
  shipping_phone_number?: string | null;
  tracking_number?: string | null;
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
