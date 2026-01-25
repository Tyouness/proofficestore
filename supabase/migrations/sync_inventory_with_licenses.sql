-- Migration: Synchronisation du stock avec les licences disponibles
-- Description: Met à jour l'inventory en fonction des clés non assignées + met les produits physiques à 0

-- 1. Mettre tous les produits physiques (DVD/USB) en rupture de stock
UPDATE products
SET inventory = 0
WHERE delivery_type IN ('dvd', 'usb');

-- Commentaire
COMMENT ON COLUMN products.inventory IS 'Stock synchronisé automatiquement avec les licences disponibles. 0 pour produits physiques (DVD/USB).';

-- 2. Synchroniser le stock des produits digitaux avec le nombre de licences disponibles
-- On compte les licences non utilisées et non révoquées par product_id
WITH license_counts AS (
  SELECT 
    p.id as product_id,
    COUNT(l.id) as available_licenses
  FROM products p
  LEFT JOIN licenses l ON l.product_id = p.slug 
    AND l.is_used = false 
    AND l.order_id IS NULL
    AND (l.revoked = false OR l.revoked IS NULL)
  WHERE p.delivery_type = 'digital_key'
  GROUP BY p.id
)
UPDATE products p
SET inventory = COALESCE(lc.available_licenses, 0)
FROM license_counts lc
WHERE p.id = lc.product_id
AND p.delivery_type = 'digital_key';

-- 3. Créer une fonction pour synchroniser automatiquement le stock après insertion/update de licence
CREATE OR REPLACE FUNCTION sync_product_inventory()
RETURNS TRIGGER AS $$
DECLARE
  v_product_id uuid;
  v_delivery_type text;
BEGIN
  -- Récupérer le product_id et delivery_type à partir du slug
  SELECT p.id, p.delivery_type
  INTO v_product_id, v_delivery_type
  FROM products p
  WHERE p.slug = COALESCE(NEW.product_id, OLD.product_id);

  -- Uniquement pour les produits digitaux
  IF v_delivery_type = 'digital_key' THEN
    -- Mettre à jour l'inventory du produit avec le nombre de licences disponibles
    UPDATE products p
    SET inventory = (
      SELECT COUNT(*)
      FROM licenses l
      WHERE l.product_id = p.slug
      AND l.is_used = false
      AND l.order_id IS NULL
      AND (l.revoked = false OR l.revoked IS NULL)
    )
    WHERE p.id = v_product_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 4. Créer des triggers pour synchronisation automatique
DROP TRIGGER IF EXISTS sync_inventory_after_license_insert ON licenses;
CREATE TRIGGER sync_inventory_after_license_insert
  AFTER INSERT ON licenses
  FOR EACH ROW
  EXECUTE FUNCTION sync_product_inventory();

DROP TRIGGER IF EXISTS sync_inventory_after_license_update ON licenses;
CREATE TRIGGER sync_inventory_after_license_update
  AFTER UPDATE ON licenses
  FOR EACH ROW
  WHEN (OLD.is_used IS DISTINCT FROM NEW.is_used OR OLD.order_id IS DISTINCT FROM NEW.order_id OR OLD.revoked IS DISTINCT FROM NEW.revoked)
  EXECUTE FUNCTION sync_product_inventory();

DROP TRIGGER IF EXISTS sync_inventory_after_license_delete ON licenses;
CREATE TRIGGER sync_inventory_after_license_delete
  AFTER DELETE ON licenses
  FOR EACH ROW
  EXECUTE FUNCTION sync_product_inventory();

-- 5. Commentaire final
COMMENT ON FUNCTION sync_product_inventory() IS 'Synchronise automatiquement le stock du produit avec le nombre de licences digitales disponibles (non assignées).';

-- 6. Afficher un résumé du stock après synchronisation
SELECT 
  p.name,
  p.delivery_type,
  p.inventory as stock_actuel,
  COUNT(l.id) FILTER (WHERE l.is_used = false AND l.order_id IS NULL AND (l.revoked = false OR l.revoked IS NULL)) as licences_disponibles,
  COUNT(l.id) FILTER (WHERE l.is_used = true OR l.order_id IS NOT NULL OR l.revoked = true) as licences_utilisees
FROM products p
LEFT JOIN licenses l ON l.product_id = p.slug
WHERE p.is_active = true
GROUP BY p.id, p.name, p.delivery_type, p.inventory
ORDER BY p.delivery_type, p.name;
