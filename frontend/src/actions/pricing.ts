/**
 * 💰 SERVER ACTIONS - GESTION DES PRIX ET PROMOTIONS
 * 
 * Fonctionnalités:
 * - Mise à jour des prix de base et prix réduits
 * - Activation/désactivation des promotions
 * - Gestion des labels promotionnels
 * - Revalidation automatique pour ISR
 * 
 * Sécurité:
 * - Vérification admin obligatoire
 * - Validation stricte des prix avec Zod
 * - Contrainte: sale_price < base_price
 * 
 * @module actions/pricing
 */

'use server';

import { createServerClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import { updateProductPricingSchema } from '@/lib/validation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Client admin pour contourner RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ── Types ──
type PricingUpdateResult = {
  success: boolean;
  message: string;
};

type ProductPricing = {
  id: string;
  slug: string;
  name: string;
  base_price: number;
  sale_price: number | null;
  on_sale: boolean;
  promo_label: string | null;
  final_price: number;
  discount_percentage: number;
};

/**
 * 💰 Mettre à jour les prix d'un produit (admin uniquement)
 * 
 * @param formData - Données du formulaire de mise à jour
 * @returns Promise<PricingUpdateResult>
 */
export async function updateProductPricing(
  formData: FormData
): Promise<PricingUpdateResult> {
  try {
    // 1. Validation des données
    const rawData = {
      productId: formData.get('productId'),
      basePrice: parseFloat(formData.get('basePrice') as string),
      salePrice: formData.get('salePrice') 
        ? parseFloat(formData.get('salePrice') as string) 
        : null,
      onSale: formData.get('onSale') === 'true',
      promoLabel: formData.get('promoLabel') || null,
      // Prix multi-devises
      priceEur: formData.get('priceEur') 
        ? parseFloat(formData.get('priceEur') as string) 
        : null,
      priceUsd: formData.get('priceUsd') 
        ? parseFloat(formData.get('priceUsd') as string) 
        : null,
      priceGbp: formData.get('priceGbp') 
        ? parseFloat(formData.get('priceGbp') as string) 
        : null,
      priceCad: formData.get('priceCad') 
        ? parseFloat(formData.get('priceCad') as string) 
        : null,
      priceAud: formData.get('priceAud') 
        ? parseFloat(formData.get('priceAud') as string) 
        : null,
      priceChf: formData.get('priceChf') 
        ? parseFloat(formData.get('priceChf') as string) 
        : null,
      // Prix promotionnels multi-devises
      salePriceEur: formData.get('salePriceEur') 
        ? parseFloat(formData.get('salePriceEur') as string) 
        : null,
      salePriceUsd: formData.get('salePriceUsd') 
        ? parseFloat(formData.get('salePriceUsd') as string) 
        : null,
      salePriceGbp: formData.get('salePriceGbp') 
        ? parseFloat(formData.get('salePriceGbp') as string) 
        : null,
      salePriceCad: formData.get('salePriceCad') 
        ? parseFloat(formData.get('salePriceCad') as string) 
        : null,
      salePriceAud: formData.get('salePriceAud') 
        ? parseFloat(formData.get('salePriceAud') as string) 
        : null,
      salePriceChf: formData.get('salePriceChf') 
        ? parseFloat(formData.get('salePriceChf') as string) 
        : null,
    };

    const validatedData = updateProductPricingSchema.parse(rawData);

    // 2. Vérification admin
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
      return { success: false, message: 'Accès refusé - Admin uniquement' };
    }

    // 3. Récupérer les infos du produit (slug + group_id) avec client admin
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('slug, group_id')
      .eq('id', validatedData.productId)
      .single();

    if (!product) {
      return { success: false, message: 'Produit introuvable' };
    }

    // 4. Mettre à jour les prix (avec client admin pour contourner RLS)
    // NOTE: Chaque variante a son propre prix (pas de synchronisation automatique)
    const { error } = await supabaseAdmin
      .from('products')
      .update({
        base_price: validatedData.basePrice,
        sale_price: validatedData.salePrice,
        on_sale: validatedData.onSale,
        promo_label: validatedData.promoLabel,
        // Prix multi-devises
        price_eur: validatedData.priceEur,
        price_usd: validatedData.priceUsd,
        price_gbp: validatedData.priceGbp,
        price_cad: validatedData.priceCad,
        price_aud: validatedData.priceAud,
        price_chf: validatedData.priceChf,
        // Prix promotionnels multi-devises
        sale_price_eur: validatedData.salePriceEur,
        sale_price_usd: validatedData.salePriceUsd,
        sale_price_gbp: validatedData.salePriceGbp,
        sale_price_cad: validatedData.salePriceCad,
        sale_price_aud: validatedData.salePriceAud,
        sale_price_chf: validatedData.salePriceChf,
      })
      .eq('id', validatedData.productId);

    if (error) {
      console.error('Erreur updateProductPricing:', error);
      return { success: false, message: `Erreur lors de la mise à jour: ${error.message}` };
    }

    // 5. Revalidation ISR pour affichage instantané
    revalidatePath('/logiciels');
    revalidatePath(`/produit/${product.slug}`);
    revalidatePath('/');
    
    // Pas besoin de revalider les autres variantes (prix indépendants)

    return { 
      success: true, 
      message: 'Prix mis à jour avec succès'
    };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        message: error.issues[0]?.message || 'Données invalides' 
      };
    }

    console.error('Erreur updateProductPricing:', error);
    return { success: false, message: 'Erreur serveur' };
  }
}

/**
 * 📊 Récupérer tous les produits avec leurs prix (admin uniquement)
 * 
 * @returns Promise<ProductPricing[]>
 */
export async function getAllProductPricing() {
  try {
    const supabase = await createServerClient();

    // Vérification admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, message: 'Non authentifié', data: [] };
    }

    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (userRole?.role !== 'admin') {
      return { success: false, message: 'Accès refusé', data: [] };
    }

    // Récupérer les produits avec prix calculés + group_id + prix multi-devises (avec client admin)
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('id, slug, name, base_price, sale_price, on_sale, promo_label, group_id, delivery_format, price_eur, price_usd, price_gbp, price_cad, price_aud, price_chf, sale_price_eur, sale_price_usd, sale_price_gbp, sale_price_cad, sale_price_aud, sale_price_chf')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Erreur getAllProductPricing:', error);
      return { success: false, message: 'Erreur de récupération', data: [] };
    }

    // Calculer final_price et discount_percentage côté application
    const productsWithPricing = (data || []).map(p => ({
      ...p,
      final_price: p.on_sale && p.sale_price ? p.sale_price : p.base_price,
      discount_percentage: p.on_sale && p.sale_price && p.sale_price < p.base_price
        ? Math.round(((p.base_price - p.sale_price) / p.base_price) * 100)
        : 0
    }));

    return { 
      success: true, 
      data: productsWithPricing as ProductPricing[] || [] 
    };

  } catch (error) {
    console.error('Erreur getAllProductPricing:', error);
    return { success: false, message: 'Erreur serveur', data: [] };
  }
}

/**
 * ⚡ Activer/Désactiver rapidement une promotion (admin uniquement)
 * 
 * @param productId - ID du produit
 * @param onSale - Activer ou désactiver la promo
 * @returns Promise<PricingUpdateResult>
 */
export async function toggleProductPromotion(
  productId: string,
  onSale: boolean
): Promise<PricingUpdateResult> {
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

    // Récupérer le slug pour revalidation (avec client admin)
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('slug')
      .eq('id', productId)
      .single();

    if (!product) {
      return { success: false, message: 'Produit introuvable' };
    }

    // Toggle la promotion (avec client admin)
    const { error } = await supabaseAdmin
      .from('products')
      .update({ on_sale: onSale })
      .eq('id', productId);

    if (error) {
      console.error('Erreur toggleProductPromotion:', error);
      return { success: false, message: `Erreur lors de la mise à jour: ${error.message}` };
    }

    // Revalidation
    revalidatePath('/logiciels');
    revalidatePath(`/produit/${product.slug}`);
    revalidatePath('/');

    return { 
      success: true, 
      message: onSale ? 'Promotion activée' : 'Promotion désactivée' 
    };

  } catch (error) {
    console.error('Erreur toggleProductPromotion:', error);
    return { success: false, message: 'Erreur serveur' };
  }
}
