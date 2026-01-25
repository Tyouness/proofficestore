-- ============================================================
-- Migration: Synchronisation Prix et Stocks par Groupes
-- Description: Grouper les variantes (Digital/DVD/USB) pour sync automatique
-- ============================================================

-- 1. Ajouter la colonne group_id dans products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS group_id TEXT;

-- 2. Index sur group_id pour optimiser les requêtes de sync
CREATE INDEX IF NOT EXISTS idx_products_group_id 
ON products(group_id) 
WHERE group_id IS NOT NULL;

-- 3. Générer automatiquement les group_id pour les produits existants
-- Grouper par (family, version, edition) - tous les formats d'un même produit
UPDATE products
SET group_id = MD5(CONCAT(family, '-', version, '-', edition))
WHERE group_id IS NULL
  AND family IS NOT NULL 
  AND version IS NOT NULL 
  AND edition IS NOT NULL;

-- 4. SUPPRIMÉ : Synchronisation automatique des prix (chaque variante a son propre prix)
-- Les prix Digital/DVD/USB sont indépendants et gérés manuellement dans l'admin

-- 5. SUPPRIMÉ : Trigger sync_group_prices (prix indépendants par variante)

-- 6. Fonction pour décrémenter le stock après achat
CREATE OR REPLACE FUNCTION decrement_product_inventory(
  product_id TEXT,
  quantity INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  v_current_inventory INTEGER;
  v_new_inventory INTEGER;
BEGIN
  -- Récupérer le stock actuel
  SELECT inventory INTO v_current_inventory
  FROM products
  WHERE slug = product_id;

  -- Vérifier que le produit existe
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produit introuvable: %', product_id;
  END IF;

  -- Calculer le nouveau stock
  v_new_inventory := GREATEST(0, v_current_inventory - quantity);

  -- Mettre à jour le stock
  UPDATE products
  SET inventory = v_new_inventory
  WHERE slug = product_id;

  -- Retourner le nouveau stock
  RETURN v_new_inventory;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder l'accès à la fonction RPC pour les users authentifiés
GRANT EXECUTE ON FUNCTION decrement_product_inventory TO anon, authenticated;

-- 7. Fonction pour synchroniser les stocks entre variantes d'un groupe
-- Si une variante est en rupture, les autres aussi (car même produit physique)
CREATE OR REPLACE FUNCTION sync_group_inventory()
RETURNS TRIGGER AS $$
BEGIN
  -- Si l'inventaire a changé ET que le produit appartient à un groupe
  IF (NEW.inventory IS DISTINCT FROM OLD.inventory) AND NEW.group_id IS NOT NULL THEN
    
    -- Synchroniser l'inventaire de toutes les variantes du groupe
    UPDATE products
    SET inventory = NEW.inventory
    WHERE 
      group_id = NEW.group_id
      AND id != NEW.id;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger pour synchroniser les stocks au sein d'un groupe
DROP TRIGGER IF EXISTS trigger_sync_group_inventory ON products;
CREATE TRIGGER trigger_sync_group_inventory
  AFTER UPDATE ON products
  FOR EACH ROW
  WHEN (OLD.inventory IS DISTINCT FROM NEW.inventory)
  EXECUTE FUNCTION sync_group_inventory();

-- 9. Vue pour faciliter l'affichage des groupes dans l'admin
CREATE OR REPLACE VIEW products_grouped AS
SELECT 
  group_id,
  COUNT(*) as variant_count,
  STRING_AGG(delivery_format, ', ' ORDER BY delivery_format) as formats,
  STRING_AGG(DISTINCT slug, ', ' ORDER BY slug) as all_slugs,
  MAX(CASE WHEN delivery_format = 'DIGITAL' THEN name END) as name,
  MIN(inventory) as min_inventory, -- Stock minimum du groupe
  MAX(created_at) as last_updated
FROM products
WHERE group_id IS NOT NULL
GROUP BY group_id
HAVING COUNT(*) > 1; -- Seulement les groupes avec plusieurs variantes

-- 10. Commentaires pour documentation
COMMENT ON COLUMN products.group_id IS 'Identifiant de groupe pour synchroniser les STOCKS entre variantes (Digital/DVD/USB). Les PRIX restent indépendants.';
COMMENT ON FUNCTION sync_group_inventory IS 'Synchronise automatiquement le stock entre toutes les variantes d''un même groupe (car même produit physique)';
COMMENT ON FUNCTION decrement_product_inventory IS 'Décrémente le stock d''un produit après achat (appelé par webhook Stripe)';
COMMENT ON VIEW products_grouped IS 'Vue admin: groupes de variantes avec leur stock commun';

-- Logs
DO $$
BEGIN
  RAISE NOTICE '✅ Migration prix/stocks terminée';
  RAISE NOTICE '🔗 Colonne group_id ajoutée (MD5 de family-version-edition)';
  RAISE NOTICE '📦 STOCKS: Synchronisés entre variantes via trigger';
  RAISE NOTICE '💰 PRIX: Indépendants par variante (pas de synchronisation)';
  RAISE NOTICE '🔍 Vue products_grouped créée pour l''admin';
  RAISE NOTICE '⚙️ RPC decrement_product_inventory créée pour webhook';
END $$;
COMMENT ON FUNCTION decrement_product_inventory IS 'Décrémente le stock d''un produit après achat (appelé depuis webhook/success)';
COMMENT ON FUNCTION sync_group_inventory IS 'Synchronise automatiquement l''inventaire entre toutes les variantes d''un même groupe';
COMMENT ON VIEW products_grouped IS 'Vue des produits groupés pour l''admin - affiche les groupes avec leurs variantes';

-- 11. Grant permissions pour la fonction RPC accessible depuis Next.js
GRANT EXECUTE ON FUNCTION decrement_product_inventory TO anon, authenticated;

-- Logs
DO $$
BEGIN
  RAISE NOTICE '✅ Migration prix/stocks terminée';
  RAISE NOTICE '🔗 Colonne group_id ajoutée (MD5 de family-version-edition)';
  RAISE NOTICE '📦 STOCKS: Synchronisés entre variantes via trigger';
  RAISE NOTICE '💰 PRIX: Indépendants par variante (pas de synchronisation)';
  RAISE NOTICE '🔍 Vue products_grouped créée pour l''admin';
  RAISE NOTICE '⚙️ RPC decrement_product_inventory créée pour webhook';
END $$;
