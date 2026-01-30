-- Migration: Correction vulnérabilités de sécurité détectées par Supabase Security Advisor
-- Date: 2026-01-30
-- Référence: Security Advisor report du 27 Jan 2026

-- ═══════════════════════════════════════════════════════════════════
-- PROBLÈMES DÉTECTÉS:
-- ═══════════════════════════════════════════════════════════════════
-- 1. ❌ View `orders_physical_pending` - SECURITY DEFINER (dangereux)
-- 2. ❌ View `products_with_pricing` - SECURITY DEFINER (dangereux)
-- 3. ❌ View `stock_requests_with_product` - SECURITY DEFINER (dangereux)
-- 4. ❌ Table `stripe_webhook_events` - RLS désactivé
--
-- SECURITY DEFINER signifie que la vue s'exécute avec les permissions du CRÉATEUR
-- au lieu des permissions de l'UTILISATEUR. Cela peut permettre des accès non autorisés.
--
-- SOLUTION: Recréer les vues avec SECURITY INVOKER (permissions de l'utilisateur)
-- ═══════════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════════
-- 1. CORRIGER stock_requests_with_product
-- ═══════════════════════════════════════════════════════════════════

DROP VIEW IF EXISTS public.stock_requests_with_product;

CREATE OR REPLACE VIEW public.stock_requests_with_product
  WITH (security_invoker = true)  -- ✅ Utilise les permissions de l'utilisateur
AS
SELECT 
    sr.id,
    sr.created_at,
    sr.updated_at,
    sr.user_email,
    sr.quantity,
    sr.status,
    sr.ip_address,
    sr.admin_notes,
    p.id as product_id,
    p.name as product_name,
    p.slug as product_slug,
    p.inventory as current_inventory,
    p.base_price as product_price
FROM stock_requests sr
JOIN products p ON p.id = sr.product_id
ORDER BY sr.created_at DESC;

COMMENT ON VIEW public.stock_requests_with_product IS 
  'Vue enrichie des demandes de stock. SECURITY INVOKER pour sécurité.';


-- ═══════════════════════════════════════════════════════════════════
-- 2. CORRIGER products_with_pricing
-- ═══════════════════════════════════════════════════════════════════

DROP VIEW IF EXISTS public.products_with_pricing;

CREATE OR REPLACE VIEW public.products_with_pricing
  WITH (security_invoker = true)  -- ✅ Utilise les permissions de l'utilisateur
AS
SELECT 
  p.*,
  get_product_final_price(p.base_price, p.sale_price, p.on_sale) as final_price,
  get_discount_percentage(p.base_price, p.sale_price) as discount_percentage,
  CASE 
    WHEN p.on_sale AND p.sale_price IS NOT NULL THEN true
    ELSE false
  END as has_active_promotion
FROM products p;

COMMENT ON VIEW public.products_with_pricing IS 
  'Vue enrichie avec prix calculés. SECURITY INVOKER pour sécurité.';


-- ═══════════════════════════════════════════════════════════════════
-- 3. CORRIGER orders_physical_pending
-- ═══════════════════════════════════════════════════════════════════

DROP VIEW IF EXISTS public.orders_physical_pending;

CREATE OR REPLACE VIEW public.orders_physical_pending
  WITH (security_invoker = true)  -- ✅ Utilise les permissions de l'utilisateur
AS
SELECT 
  o.id,
  o.user_id,
  o.email_client,
  o.status,
  o.total_amount,
  o.shipping_name,
  o.shipping_address,
  o.shipping_zip,
  o.shipping_city,
  o.shipping_country,
  o.shipping_phone_prefix || o.shipping_phone_number AS shipping_phone_full,
  o.tracking_number,
  o.shipping_status,
  o.created_at,
  o.updated_at,
  COUNT(oi.id) AS total_items,
  STRING_AGG(p.name || ' (' || oi.variant || ')', ', ') AS products_summary
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
JOIN products p ON oi.product_id = p.slug
WHERE o.shipping_status = 'pending'
  AND p.delivery_format IN ('DVD', 'USB')
GROUP BY o.id
ORDER BY o.created_at DESC;

COMMENT ON VIEW public.orders_physical_pending IS 
  'Vue admin: commandes physiques en attente. SECURITY INVOKER pour sécurité.';


-- ═══════════════════════════════════════════════════════════════════
-- 4. ACTIVER RLS SUR stripe_webhook_events
-- ═══════════════════════════════════════════════════════════════════

-- Cette table stocke les événements webhook Stripe pour éviter les doublons
-- Elle doit être protégée par RLS car elle contient des order_id sensibles

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- Politique: Aucun accès public (uniquement service_role via API)
-- Les webhooks utilisent le service_role key, donc pas besoin de politique SELECT/INSERT
CREATE POLICY "stripe_webhook_events_no_public_access"
  ON public.stripe_webhook_events
  FOR ALL
  TO authenticated, anon
  USING (false);

COMMENT ON TABLE public.stripe_webhook_events IS 
  'Événements webhook Stripe. Service_role uniquement. RLS activé.';


-- ═══════════════════════════════════════════════════════════════════
-- 5. VÉRIFICATIONS FINALES
-- ═══════════════════════════════════════════════════════════════════

DO $$ 
DECLARE
  rec RECORD;
BEGIN
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '✅ MIGRATION SÉCURITÉ TERMINÉE';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Vues corrigées (SECURITY INVOKER):';
  RAISE NOTICE '  ✓ stock_requests_with_product';
  RAISE NOTICE '  ✓ products_with_pricing';
  RAISE NOTICE '  ✓ orders_physical_pending';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Tables avec RLS activé:';
  RAISE NOTICE '  ✓ stripe_webhook_events (nouveau)';
  RAISE NOTICE '';
  RAISE NOTICE '👉 Vérifiez Security Advisor dans Supabase';
  RAISE NOTICE '   Les 4 erreurs devraient disparaître.';
  RAISE NOTICE '════════════════════════════════════════';
END $$;
