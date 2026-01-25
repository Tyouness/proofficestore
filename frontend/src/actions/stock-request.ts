/**
 * 🔔 SERVER ACTIONS - DEMANDES DE STOCK
 * 
 * Gestion des demandes de notification pour produits en rupture de stock.
 * 
 * Fonctionnalités:
 * - Capture d'email + quantité pour produits épuisés
 * - Protection anti-spam (honeypot + rate limiting)
 * - Vérification de doublons
 * - Interface admin pour traitement
 * 
 * @module actions/stock-request
 */

'use server';

import { createServerClient } from '@/lib/supabase-server';
import { stockRequestSchema, updateStockRequestSchema } from '@/lib/validation';
import { headers } from 'next/headers';
import { z } from 'zod';

// ── Types ──
type StockRequestResult = {
  success: boolean;
  message: string;
  requestId?: string;
};

type UpdateStockRequestResult = {
  success: boolean;
  message: string;
};

// ── Configuration Rate Limiting ──
const RATE_LIMIT_HOURS = 1; // Fenêtre de rate limiting
const MAX_REQUESTS_PER_HOUR = 3; // Max demandes par email par produit par heure

/**
 * 📧 Créer une demande de notification de stock
 * 
 * Appelé quand un client veut être notifié de la disponibilité d'un produit.
 * 
 * Sécurité:
 * - Validation Zod stricte
 * - Honeypot anti-bot
 * - Rate limiting par email
 * - Vérification de doublons
 * 
 * @param formData - Données du formulaire (productId, email, quantity, honeypot)
 * @returns Promise<StockRequestResult>
 */
export async function createStockRequest(
  formData: FormData
): Promise<StockRequestResult> {
  try {
    // 1. Récupérer et valider les données
    const rawData = {
      productId: formData.get('productId'),
      email: formData.get('email'),
      quantity: Number(formData.get('quantity')) || 1,
      honeypot: formData.get('contact') || '', // Champ piège pour bots
    };

    // Validation Zod
    const validatedData = stockRequestSchema.parse(rawData);

    // 2. Vérification honeypot (anti-bot)
    if (validatedData.honeypot !== '') {
      console.warn('🤖 Bot détecté via honeypot:', {
        email: validatedData.email,
        productId: validatedData.productId,
      });
      // Retourner succès pour tromper le bot
      return {
        success: true,
        message: 'Demande enregistrée avec succès.',
      };
    }

    // 3. Récupérer métadonnées pour anti-spam
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for') || 
                      headersList.get('x-real-ip') || 
                      'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    // 4. Connexion Supabase
    const supabase = await createServerClient();

    // 5. Vérifier que le produit existe et est bien en rupture
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, inventory')
      .eq('slug', validatedData.productId) // productId est le slug, pas l'UUID
      .single();

    if (productError || !product) {
      return {
        success: false,
        message: 'Produit introuvable.',
      };
    }

    if (product.inventory > 0) {
      return {
        success: false,
        message: 'Ce produit est actuellement disponible.',
      };
    }

    // 6. Rate limiting - Vérifier les demandes récentes
    const { data: recentRequests, error: rateLimitError } = await supabase
      .from('stock_requests')
      .select('id')
      .eq('user_email', validatedData.email.toLowerCase())
      .eq('product_id', product.id)
      .gte('created_at', new Date(Date.now() - RATE_LIMIT_HOURS * 60 * 60 * 1000).toISOString())
      .neq('status', 'cancelled');

    if (rateLimitError) {
      console.error('Erreur rate limiting:', rateLimitError);
    }

    if (recentRequests && recentRequests.length >= MAX_REQUESTS_PER_HOUR) {
      return {
        success: false,
        message: `Vous avez déjà fait ${MAX_REQUESTS_PER_HOUR} demandes pour ce produit récemment. Veuillez patienter.`,
      };
    }

    // 7. Vérifier les doublons exacts (même quantité)
    const { data: existingRequest } = await supabase
      .from('stock_requests')
      .select('id')
      .eq('user_email', validatedData.email.toLowerCase())
      .eq('product_id', product.id)
      .eq('quantity', validatedData.quantity)
      .eq('status', 'pending')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Dernières 24h
      .maybeSingle();

    if (existingRequest) {
      return {
        success: false,
        message: 'Vous avez déjà une demande identique en cours de traitement.',
      };
    }

    // 8. Créer la demande de stock
    const { data: newRequest, error: insertError } = await supabase
      .from('stock_requests')
      .insert({
        product_id: product.id, // Utiliser l'UUID du produit, pas le slug
        user_email: validatedData.email.toLowerCase(),
        quantity: validatedData.quantity,
        ip_address: ipAddress,
        user_agent: userAgent,
        status: 'pending',
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Erreur insertion stock_request:', insertError);
      return {
        success: false,
        message: 'Erreur lors de l\'enregistrement de votre demande.',
      };
    }

    // 9. Succès
    return {
      success: true,
      message: `Demande reçue ! Un conseiller vérifie le stock pour ${validatedData.quantity} licence${validatedData.quantity > 1 ? 's' : ''} et vous répond par mail d'ici 1h.`,
      requestId: newRequest.id,
    };

  } catch (error) {
    // Gestion des erreurs de validation Zod
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return {
        success: false,
        message: firstError?.message || 'Données invalides.',
      };
    }

    // Erreurs inattendues
    console.error('Erreur createStockRequest:', error);
    return {
      success: false,
      message: 'Une erreur est survenue. Veuillez réessayer.',
    };
  }
}

/**
 * 📋 Récupérer toutes les demandes de stock (admin uniquement)
 * 
 * @param filters - Filtres optionnels (status, productId)
 * @returns Liste des demandes avec infos produit
 */
export async function getStockRequests(filters?: {
  status?: 'pending' | 'contacted' | 'completed' | 'cancelled';
  productId?: string;
}) {
  try {
    const supabase = await createServerClient();

    // Vérifier que l'utilisateur est admin
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

    // Requête via la vue enrichie
    let query = supabase
      .from('stock_requests_with_product')
      .select('*')
      .order('created_at', { ascending: false });

    // Appliquer les filtres
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.productId) {
      query = query.eq('product_id', filters.productId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erreur getStockRequests:', error);
      return { success: false, message: 'Erreur de récupération', data: [] };
    }

    return { success: true, data: data || [] };

  } catch (error) {
    console.error('Erreur getStockRequests:', error);
    return { success: false, message: 'Erreur serveur', data: [] };
  }
}

/**
 * ✏️ Mettre à jour une demande de stock (admin uniquement)
 * 
 * @param formData - ID de la demande + nouveaux status/notes
 * @returns Promise<UpdateStockRequestResult>
 */
export async function updateStockRequest(
  formData: FormData
): Promise<UpdateStockRequestResult> {
  try {
    // 1. Validation
    const rawData = {
      requestId: formData.get('requestId'),
      status: formData.get('status') || undefined,
      adminNotes: formData.get('adminNotes') || undefined,
    };

    const validatedData = updateStockRequestSchema.parse(rawData);

    // 2. Connexion et vérification admin
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

    // 3. Mettre à jour
    const updateData: any = {};
    if (validatedData.status) updateData.status = validatedData.status;
    if (validatedData.adminNotes !== undefined) updateData.admin_notes = validatedData.adminNotes;

    const { error } = await supabase
      .from('stock_requests')
      .update(updateData)
      .eq('id', validatedData.requestId);

    if (error) {
      console.error('Erreur updateStockRequest:', error);
      return { success: false, message: 'Erreur de mise à jour' };
    }

    return { success: true, message: 'Demande mise à jour avec succès' };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.issues[0]?.message || 'Données invalides' };
    }

    console.error('Erreur updateStockRequest:', error);
    return { success: false, message: 'Erreur serveur' };
  }
}

/**
 * 🔢 Obtenir les statistiques des demandes de stock (admin)
 */
export async function getStockRequestStats() {
  try {
    const supabase = await createServerClient();

    // Vérification admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (userRole?.role !== 'admin') return null;

    // Compter par statut
    const { data, error } = await supabase
      .from('stock_requests')
      .select('status');

    if (error || !data) return null;

    const stats = {
      total: data.length,
      pending: data.filter(r => r.status === 'pending').length,
      contacted: data.filter(r => r.status === 'contacted').length,
      completed: data.filter(r => r.status === 'completed').length,
      cancelled: data.filter(r => r.status === 'cancelled').length,
    };

    return stats;

  } catch (error) {
    console.error('Erreur getStockRequestStats:', error);
    return null;
  }
}
