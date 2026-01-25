/**
 * 📦 SERVER ACTIONS - GESTION DE L'INVENTAIRE
 * 
 * Fonctionnalités:
 * - Mise à jour du stock des produits
 * - Actions rapides (rupture, réapprovisionnement)
 * 
 * Sécurité:
 * - Vérification admin obligatoire
 * - Client admin pour contourner RLS
 * 
 * @module actions/inventory
 */

'use server';

import { createServerClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

// Client admin pour contourner RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

type InventoryUpdateResult = {
  success: boolean;
  message: string;
};

/**
 * 📦 Mettre à jour l'inventaire d'un produit (admin uniquement)
 * 
 * @param productId - ID du produit
 * @param newInventory - Nouvelle quantité
 * @returns Promise<InventoryUpdateResult>
 */
export async function updateProductInventory(
  productId: string,
  newInventory: number
): Promise<InventoryUpdateResult> {
  try {
    // Vérification admin
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, message: 'Non authentifié' };
    }

    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (userRole?.role !== 'admin') {
      return { success: false, message: 'Accès refusé' };
    }

    // Validation
    if (newInventory < 0) {
      return { success: false, message: 'Le stock ne peut pas être négatif' };
    }

    // Récupérer le slug et le group_id pour revalidation
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('slug, group_id')
      .eq('id', productId)
      .single();

    if (!product) {
      return { success: false, message: 'Produit introuvable' };
    }

    // Mettre à jour l'inventaire (avec client admin)
    // Le trigger sync_group_inventory mettra automatiquement à jour
    // toutes les variantes du même groupe
    const { error } = await supabaseAdmin
      .from('products')
      .update({ inventory: newInventory })
      .eq('id', productId);

    if (error) {
      console.error('Erreur updateProductInventory:', error);
      return { success: false, message: `Erreur: ${error.message}` };
    }

    // Revalidation de la page du produit et de toutes ses variantes
    revalidatePath('/admin/inventory');
    revalidatePath('/logiciels');
    revalidatePath(`/produit/${product.slug}`);

    // Si le produit fait partie d'un groupe, revalider toutes les variantes
    if (product.group_id) {
      const { data: groupProducts } = await supabaseAdmin
        .from('products')
        .select('slug')
        .eq('group_id', product.group_id)
        .neq('id', productId);

      if (groupProducts) {
        for (const variant of groupProducts) {
          revalidatePath(`/produit/${variant.slug}`);
        }
      }

      return { success: true, message: 'Stock mis à jour (toutes les variantes synchronisées)' };
    }

    return { success: true, message: 'Stock mis à jour' };

  } catch (error) {
    console.error('Erreur updateProductInventory:', error);
    return { success: false, message: 'Erreur serveur' };
  }
}

/**
 * 📦 Décrémenter l'inventaire après achat (webhook/success page)
 * 
 * Utilise la fonction RPC SQL qui synchronise automatiquement
 * tout le groupe de variantes via le trigger sync_group_inventory
 * 
 * @param productId - ID du produit
 * @param quantity - Quantité à décrémenter
 * @returns Promise<{ success: boolean; message: string; newStock?: number }>
 */
export async function decrementProductInventory(
  productId: string,
  quantity: number
): Promise<{ success: boolean; message: string; newStock?: number }> {
  try {
    // Appeler la fonction RPC pour décrémenter l'inventaire
    const { data, error } = await supabaseAdmin
      .rpc('decrement_product_inventory', {
        product_id: productId,
        quantity: quantity
      });

    if (error) {
      console.error('Erreur décrémentation inventaire:', error);
      return { 
        success: false, 
        message: `Erreur lors de la décrémentation de l'inventaire: ${error.message}` 
      };
    }

    // data contient le nouveau stock après décrémentation
    // Récupérer le slug et group_id pour revalidation
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('slug, group_id')
      .eq('id', productId)
      .single();

    if (product) {
      // Revalidation
      revalidatePath('/logiciels');
      revalidatePath(`/produit/${product.slug}`);

      // Si le produit fait partie d'un groupe, revalider toutes les variantes
      if (product.group_id) {
        const { data: groupProducts } = await supabaseAdmin
          .from('products')
          .select('slug')
          .eq('group_id', product.group_id)
          .neq('id', productId);

        if (groupProducts) {
          for (const variant of groupProducts) {
            revalidatePath(`/produit/${variant.slug}`);
          }
        }
      }
    }

    return { 
      success: true, 
      message: `Inventaire décrémenté avec succès`,
      newStock: data
    };
  } catch (error) {
    console.error('Exception décrémentation inventaire:', error);
    return { 
      success: false, 
      message: 'Erreur serveur lors de la décrémentation' 
    };
  }
}
