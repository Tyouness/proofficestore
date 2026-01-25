'use server';

/**
 * Server Actions pour la gestion des expéditions (admin uniquement)
 */

import { createServerClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * Vérifie si l'utilisateur connecté est admin
 */
async function isUserAdmin(): Promise<boolean> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return false;

  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .single();

  return !!data;
}

export interface ShippingOrder {
  id: string;
  user_id: string;
  email_client: string;
  total_amount: number;
  shipping_name: string;
  shipping_address: string;
  shipping_zip: string;
  shipping_city: string;
  shipping_country: string;
  shipping_phone_prefix: string;
  shipping_phone_number: string;
  tracking_number: string | null;
  shipping_status: 'pending' | 'shipped';
  created_at: string;
  products_summary: string;
  total_items: number;
}

/**
 * Récupère toutes les commandes physiques en attente
 */
export async function getPendingShippingOrders(): Promise<{
  success: boolean;
  orders?: ShippingOrder[];
  error?: string;
}> {
  try {
    // Vérifier les permissions admin
    if (!await isUserAdmin()) {
      return { success: false, error: 'Accès refusé - Admin requis' };
    }

    // Utiliser la vue SQL créée dans la migration
    const { data, error } = await supabaseAdmin
      .from('orders_physical_pending')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[SHIPPING] Erreur lors de la récupération des commandes:', error);
      return { success: false, error: 'Erreur lors de la récupération des commandes' };
    }

    return { success: true, orders: data as ShippingOrder[] };
  } catch (error) {
    console.error('[SHIPPING] Exception:', error);
    return { success: false, error: 'Erreur serveur' };
  }
}

/**
 * Marquer une commande comme expédiée avec numéro de suivi
 */
export async function markOrderAsShipped(
  orderId: string,
  trackingNumber: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Vérifier les permissions admin
    if (!await isUserAdmin()) {
      return { success: false, error: 'Accès refusé - Admin requis' };
    }

    // Validation
    if (!orderId || !trackingNumber.trim()) {
      return { success: false, error: 'ID commande et numéro de suivi requis' };
    }

    // Update via supabaseAdmin pour contourner RLS
    const { error } = await supabaseAdmin
      .from('orders')
      .update({
        tracking_number: trackingNumber.trim(),
        shipping_status: 'shipped',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .eq('shipping_status', 'pending'); // Sécurité: seulement si encore pending

    if (error) {
      console.error('[SHIPPING] Erreur lors de la mise à jour:', error);
      return { success: false, error: 'Erreur lors de la mise à jour' };
    }

    // Revalider le cache pour que l'admin voie le changement immédiatement
    revalidatePath('/admin/shipping');

    return { success: true };
  } catch (error) {
    console.error('[SHIPPING] Exception:', error);
    return { success: false, error: 'Erreur serveur' };
  }
}

/**
 * Récupère toutes les commandes expédiées (pour historique)
 */
export async function getShippedOrders(): Promise<{
  success: boolean;
  orders?: ShippingOrder[];
  error?: string;
}> {
  try {
    // Vérifier les permissions admin
    if (!await isUserAdmin()) {
      return { success: false, error: 'Accès refusé - Admin requis' };
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        user_id,
        email_client,
        total_amount,
        shipping_name,
        shipping_address,
        shipping_zip,
        shipping_city,
        shipping_country,
        shipping_phone_prefix,
        shipping_phone_number,
        tracking_number,
        shipping_status,
        created_at
      `)
      .eq('shipping_status', 'shipped')
      .order('updated_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[SHIPPING] Erreur lors de la récupération des commandes expédiées:', error);
      return { success: false, error: 'Erreur lors de la récupération' };
    }

    return { success: true, orders: data as ShippingOrder[] };
  } catch (error) {
    console.error('[SHIPPING] Exception:', error);
    return { success: false, error: 'Erreur serveur' };
  }
}
