-- ============================================================
-- DIAGNOSTIC: Comprendre pourquoi l'inventaire ne décrémente pas
-- ============================================================

-- 1️⃣ LISTER TOUS LES PRODUITS (slug, nom, format, inventaire)
SELECT slug, name, delivery_format, inventory, delivery_type
FROM products
WHERE delivery_format IS NOT NULL OR delivery_type LIKE '%dvd%' OR delivery_type LIKE '%usb%'
ORDER BY name, delivery_format;

-- 2️⃣ STRUCTURE DE LA TABLE PRODUCTS (colonnes disponibles)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'products' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3️⃣ DERNIÈRE COMMANDE PAYÉE (voir product_id utilisé)
SELECT 
  o.id as order_id,
  o.created_at,
  o.status,
  oi.product_id,
  oi.quantity,
  oi.product_name
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
WHERE o.status = 'paid'
ORDER BY o.created_at DESC
LIMIT 5;

-- 4️⃣ VÉRIFIER LA FONCTION DE DÉCRÉMENTATION
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'decrement_product_inventory';
