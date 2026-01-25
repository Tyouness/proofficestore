-- ============================================================
-- Fix: Synchroniser les inventaires existants par groupe
-- ============================================================

-- Mettre toutes les variantes d'un groupe au stock MAXIMUM du groupe
UPDATE products
SET inventory = subquery.max_inventory
FROM (
  SELECT 
    group_id,
    MAX(inventory) as max_inventory
  FROM products
  WHERE group_id IS NOT NULL
  GROUP BY group_id
) AS subquery
WHERE products.group_id = subquery.group_id;

-- Vérifier le résultat
SELECT 
  slug,
  delivery_format,
  inventory,
  group_id
FROM products
WHERE group_id IS NOT NULL
ORDER BY group_id, delivery_format;
