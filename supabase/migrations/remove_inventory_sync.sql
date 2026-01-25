-- ============================================================
-- Supprimer la synchronisation des inventaires entre variants
-- ============================================================
-- Chaque variant (Digital, DVD, USB) doit avoir son propre stock indépendant

-- 1. Supprimer le trigger de synchronisation
DROP TRIGGER IF EXISTS trigger_sync_group_inventory ON products;

-- 2. Supprimer la fonction de synchronisation
DROP FUNCTION IF EXISTS sync_group_inventory();

-- 3. Supprimer la vue des groupes (plus nécessaire)
DROP VIEW IF EXISTS products_grouped;

-- 4. Le group_id reste dans la table mais n'est plus utilisé pour la synchro
-- Il pourrait servir plus tard pour afficher les variants liés dans l'admin
COMMENT ON COLUMN products.group_id IS 'Identifiant de groupe pour lier les variantes (Digital/DVD/USB). Stocks et prix INDÉPENDANTS.';

-- 5. Vérifier que la fonction de décrémentation existe toujours
-- Cette fonction décrémente UNIQUEMENT le produit acheté
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'decrement_product_inventory';
