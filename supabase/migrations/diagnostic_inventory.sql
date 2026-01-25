-- Script de diagnostic pour la synchronisation d'inventaire

-- 1. Vérifier que la fonction RPC decrement_product_inventory existe
SELECT 
  proname AS function_name,
  prosrc AS function_body
FROM pg_proc
WHERE proname = 'decrement_product_inventory';

-- 2. Vérifier que le trigger sync_group_inventory existe
SELECT 
  tgname AS trigger_name,
  tgrelid::regclass AS table_name
FROM pg_trigger
WHERE tgname = 'trigger_sync_group_inventory';

-- 3. Voir les group_id existants
SELECT 
  slug,
  name,
  delivery_format,
  group_id,
  inventory
FROM products
WHERE group_id IS NOT NULL
ORDER BY group_id, delivery_format;

-- 4. Test manuel de décrémentation (ATTENTION: ceci va modifier les données!)
-- Décommentez seulement si vous voulez tester
-- SELECT decrement_product_inventory('votre-slug-ici', 1);

-- 5. Vérifier les permissions de la fonction RPC
SELECT 
  grantee,
  privilege_type
FROM information_schema.routine_privileges
WHERE routine_name = 'decrement_product_inventory';
