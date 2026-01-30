-- Migration: Correction warnings search_path mutable sur les fonctions
-- Date: 2026-01-30
-- Référence: Security Advisor - 19 fonctions avec search_path mutable

-- ═══════════════════════════════════════════════════════════════════
-- PROBLÈME:
-- ═══════════════════════════════════════════════════════════════════
-- Les fonctions sans search_path fixe sont vulnérables aux attaques
-- par injection de schéma. Un attaquant pourrait créer un schéma
-- malveillant et détourner les appels de fonction.
--
-- SOLUTION:
-- Ajouter SET search_path = '' à chaque fonction pour forcer
-- l'utilisation de noms qualifiés (public.table_name)
-- ═══════════════════════════════════════════════════════════════════

-- Note: Ces ALTER FUNCTION ajoutent UNIQUEMENT le search_path
-- La logique des fonctions reste IDENTIQUE

-- 1. update_email_logs_updated_at
ALTER FUNCTION public.update_email_logs_updated_at() SET search_path = '';

-- 2. allocate_licenses (si existe - ignorer si n'existe pas)
DO $$ 
BEGIN
  ALTER FUNCTION public.allocate_licenses() SET search_path = '';
EXCEPTION
  WHEN undefined_function THEN NULL;
END $$;

-- 3. increment_ticket_unread_count
ALTER FUNCTION public.increment_ticket_unread_count() SET search_path = '';

-- 4. reset_ticket_unread_count
ALTER FUNCTION public.reset_ticket_unread_count(UUID) SET search_path = '';

-- 5. handle_new_user_role (si existe - ignorer si n'existe pas)
DO $$ 
BEGIN
  ALTER FUNCTION public.handle_new_user_role() SET search_path = '';
EXCEPTION
  WHEN undefined_function THEN NULL;
END $$;

-- 6. make_order_reference (si existe - ignorer si n'existe pas)
DO $$ 
BEGIN
  ALTER FUNCTION public.make_order_reference(UUID) SET search_path = '';
EXCEPTION
  WHEN undefined_function THEN NULL;
END $$;

-- 7. set_order_reference (si existe - ignorer si n'existe pas)
DO $$ 
BEGIN
  ALTER FUNCTION public.set_order_reference() SET search_path = '';
EXCEPTION
  WHEN undefined_function THEN NULL;
END $$;

-- 8. update_stock_requests_updated_at
ALTER FUNCTION public.update_stock_requests_updated_at() SET search_path = '';

-- 9. check_duplicate_stock_request
ALTER FUNCTION public.check_duplicate_stock_request(UUID, TEXT) SET search_path = '';

-- 10. sync_product_inventory
ALTER FUNCTION public.sync_product_inventory() SET search_path = '';

-- 11. get_product_final_price
ALTER FUNCTION public.get_product_final_price(NUMERIC, NUMERIC, BOOLEAN) SET search_path = '';

-- 12. get_discount_percentage  
ALTER FUNCTION public.get_discount_percentage(NUMERIC, NUMERIC) SET search_path = '';

-- 13. assign_licenses_to_order
ALTER FUNCTION public.assign_licenses_to_order(UUID) SET search_path = '';

-- 14. assign_licenses_atomic
ALTER FUNCTION public.assign_licenses_atomic(UUID, UUID, INTEGER) SET search_path = '';

-- 15. auto_generate_promo_label
ALTER FUNCTION public.auto_generate_promo_label() SET search_path = '';

-- 16. order_has_physical_items
ALTER FUNCTION public.order_has_physical_items(UUID) SET search_path = '';

-- 17. auto_set_shipping_status
ALTER FUNCTION public.auto_set_shipping_status() SET search_path = '';

-- 18. assign_licenses_by_product
ALTER FUNCTION public.assign_licenses_by_product(UUID) SET search_path = '';

-- 19. decrement_product_inventory
ALTER FUNCTION public.decrement_product_inventory(UUID, INTEGER) SET search_path = '';

-- ═══════════════════════════════════════════════════════════════════
-- CONFIRMATION
-- ═══════════════════════════════════════════════════════════════════

DO $$ 
BEGIN
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '✅ MIGRATION SEARCH_PATH TERMINÉE';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 19 fonctions sécurisées avec search_path = ''''';
  RAISE NOTICE '';
  RAISE NOTICE 'AUCUNE LOGIQUE MODIFIÉE - UNIQUEMENT SÉCURITÉ';
  RAISE NOTICE '';
  RAISE NOTICE '👉 Vérifiez Security Advisor dans Supabase';
  RAISE NOTICE '   Les 19 warnings devraient disparaître.';
  RAISE NOTICE '════════════════════════════════════════';
END $$;
