-- ============================================================
-- Migration: Logistique produits physiques (DVD/USB)
-- Description: Ajoute les colonnes pour gérer les livraisons physiques
-- ============================================================

-- 1. Créer l'ENUM pour le statut d'expédition
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shipping_status_enum') THEN
    CREATE TYPE shipping_status_enum AS ENUM ('pending', 'shipped');
  END IF;
END $$;

-- 2. Ajouter les colonnes d'adresse de livraison à la table orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS shipping_name TEXT;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS shipping_address TEXT;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS shipping_zip TEXT;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS shipping_city TEXT;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS shipping_country TEXT;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS shipping_phone_prefix TEXT;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS shipping_phone_number TEXT;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS tracking_number TEXT;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS shipping_status shipping_status_enum;

-- 3. Ajouter la colonne delivery_format dans products si elle n'existe pas
-- (pour différencier digital/dvd/usb directement dans products)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS delivery_format TEXT;

-- Contrainte CHECK pour delivery_format
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_delivery_format_check') THEN
    ALTER TABLE products
      ADD CONSTRAINT products_delivery_format_check
      CHECK (delivery_format IS NULL OR delivery_format IN ('DIGITAL', 'DVD', 'USB'));
  END IF;
END $$;

-- 4. Mettre à jour les produits existants selon delivery_type
-- Mapping: digital_key -> DIGITAL, dvd -> DVD, usb -> USB
UPDATE products
SET delivery_format = CASE 
  WHEN delivery_type = 'digital_key' THEN 'DIGITAL'
  WHEN delivery_type = 'dvd' THEN 'DVD'
  WHEN delivery_type = 'usb' THEN 'USB'
  ELSE 'DIGITAL'
END
WHERE delivery_format IS NULL;

-- 5. Index pour optimiser les requêtes admin (filtrer par statut + date)
CREATE INDEX IF NOT EXISTS idx_orders_shipping_status 
ON orders(shipping_status, created_at DESC) 
WHERE shipping_status IS NOT NULL;

-- 6. Index sur delivery_format dans products
CREATE INDEX IF NOT EXISTS idx_products_delivery_format 
ON products(delivery_format);

-- 7. Fonction pour déterminer si une commande contient des produits physiques
CREATE OR REPLACE FUNCTION order_has_physical_items(p_order_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM order_items oi
    JOIN products p ON oi.product_id = p.slug
    WHERE oi.order_id = p_order_id
      AND p.delivery_format IN ('DVD', 'USB')
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- 8. Trigger pour auto-set shipping_status = 'pending' si commande physique
CREATE OR REPLACE FUNCTION auto_set_shipping_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier si la commande contient des items physiques
  IF order_has_physical_items(NEW.id) THEN
    NEW.shipping_status := 'pending';
  ELSE
    NEW.shipping_status := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orders_auto_shipping_status ON orders;
CREATE TRIGGER orders_auto_shipping_status
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_shipping_status();

-- 9. Vue pour faciliter les requêtes admin sur les commandes physiques
CREATE OR REPLACE VIEW orders_physical_pending AS
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

-- 10. Commentaires pour documentation
COMMENT ON COLUMN orders.shipping_name IS 'Nom complet du destinataire (requis uniquement pour commandes physiques)';
COMMENT ON COLUMN orders.shipping_address IS 'Adresse de livraison complète';
COMMENT ON COLUMN orders.shipping_zip IS 'Code postal validé selon le pays';
COMMENT ON COLUMN orders.shipping_city IS 'Ville de livraison';
COMMENT ON COLUMN orders.shipping_country IS 'Code pays ISO 2 (ex: FR, BE, MA)';
COMMENT ON COLUMN orders.shipping_phone_prefix IS 'Indicatif téléphonique international (ex: +33)';
COMMENT ON COLUMN orders.shipping_phone_number IS 'Numéro de téléphone sans indicatif';
COMMENT ON COLUMN orders.tracking_number IS 'Numéro de suivi transporteur (rempli par admin à l''expédition)';
COMMENT ON COLUMN orders.shipping_status IS 'Statut d''expédition: pending (en attente) ou shipped (expédié)';
COMMENT ON COLUMN products.delivery_format IS 'Format de livraison: DIGITAL, DVD ou USB';
COMMENT ON FUNCTION order_has_physical_items IS 'Retourne true si la commande contient au moins un produit DVD ou USB';
COMMENT ON VIEW orders_physical_pending IS 'Vue pour l''admin: toutes les commandes physiques en attente d''expédition';

-- 11. RLS Policies pour les colonnes shipping (lecture user, écriture admin uniquement)
-- Note: Les updates de tracking/shipping_status doivent passer par supabaseAdmin côté serveur

-- Permettre aux users de lire leurs propres adresses de livraison
-- (déjà couvert par la policy existante sur orders)

-- Logs
DO $$
BEGIN
  RAISE NOTICE '✅ Migration logistique terminée';
  RAISE NOTICE '📦 Colonnes shipping ajoutées à orders';
  RAISE NOTICE '🚚 ENUM shipping_status_enum créé (pending, shipped)';
  RAISE NOTICE '📍 Colonne delivery_format ajoutée à products';
  RAISE NOTICE '🔍 Vue orders_physical_pending créée pour l''admin';
END $$;
