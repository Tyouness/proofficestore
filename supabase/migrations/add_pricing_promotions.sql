-- Migration: Système de gestion des prix et promotions
-- Description: Ajoute les colonnes pour gérer les prix réduits et les promotions

-- 1. Ajouter les colonnes de promotion à la table products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS sale_price numeric CHECK (sale_price IS NULL OR sale_price >= 0);

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS on_sale boolean DEFAULT false NOT NULL;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS promo_label text;

-- 2. Contrainte pour vérifier que sale_price < base_price
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_sale_price_lower_than_base') THEN
    ALTER TABLE products
      ADD CONSTRAINT products_sale_price_lower_than_base
      CHECK (sale_price IS NULL OR sale_price < base_price);
  END IF;
END $$;

-- 3. Index pour optimiser les requêtes sur les produits en promotion
CREATE INDEX IF NOT EXISTS idx_products_on_sale ON products(on_sale) WHERE on_sale = true;

-- 4. Fonction pour calculer le prix final (prix d'affichage)
CREATE OR REPLACE FUNCTION get_product_final_price(p_base_price numeric, p_sale_price numeric, p_on_sale boolean)
RETURNS numeric AS $$
BEGIN
  IF p_on_sale AND p_sale_price IS NOT NULL THEN
    RETURN p_sale_price;
  ELSE
    RETURN p_base_price;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 5. Fonction pour calculer le pourcentage de réduction
CREATE OR REPLACE FUNCTION get_discount_percentage(p_base_price numeric, p_sale_price numeric)
RETURNS integer AS $$
BEGIN
  IF p_base_price > 0 AND p_sale_price IS NOT NULL AND p_sale_price < p_base_price THEN
    RETURN ROUND(((p_base_price - p_sale_price) / p_base_price * 100)::numeric);
  ELSE
    RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 6. Vue pour faciliter les requêtes des produits avec prix calculés
CREATE OR REPLACE VIEW products_with_pricing AS
SELECT 
  p.*,
  get_product_final_price(p.base_price, p.sale_price, p.on_sale) as final_price,
  get_discount_percentage(p.base_price, p.sale_price) as discount_percentage,
  CASE 
    WHEN p.on_sale AND p.sale_price IS NOT NULL THEN true
    ELSE false
  END as has_active_promotion
FROM products p;

-- 7. Trigger pour auto-générer le promo_label si vide
CREATE OR REPLACE FUNCTION auto_generate_promo_label()
RETURNS TRIGGER AS $$
BEGIN
  -- Si on_sale est activé, sale_price existe, mais promo_label est vide
  IF NEW.on_sale AND NEW.sale_price IS NOT NULL AND (NEW.promo_label IS NULL OR NEW.promo_label = '') THEN
    NEW.promo_label := '-' || get_discount_percentage(NEW.base_price, NEW.sale_price)::text || '%';
  END IF;
  
  -- Si on_sale est désactivé, vider le promo_label
  IF NOT NEW.on_sale THEN
    NEW.promo_label := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS products_auto_promo_label ON products;
CREATE TRIGGER products_auto_promo_label
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_promo_label();

-- 8. Commentaires pour documentation
COMMENT ON COLUMN products.sale_price IS 'Prix réduit lors d''une promotion. Doit être inférieur à base_price.';
COMMENT ON COLUMN products.on_sale IS 'Active/désactive la promotion pour ce produit.';
COMMENT ON COLUMN products.promo_label IS 'Badge promotionnel affiché (ex: "-80%", "Flash Sale"). Auto-généré si vide.';
COMMENT ON FUNCTION get_product_final_price IS 'Retourne le prix final : sale_price si en promo, sinon base_price.';
COMMENT ON FUNCTION get_discount_percentage IS 'Calcule le pourcentage de réduction entre base_price et sale_price.';
COMMENT ON VIEW products_with_pricing IS 'Vue enrichie avec prix calculés et informations promotionnelles.';

-- 9. Exemples de mise à jour (optionnel - à décommenter si besoin)
-- Mettre Office 2024 Pro en promotion à -20%
-- UPDATE products 
-- SET 
--   sale_price = base_price * 0.8,
--   on_sale = true,
--   promo_label = 'Offre de lancement'
-- WHERE slug = 'office-2024-pro';

-- Mettre Windows 11 Pro en Flash Sale à -30%
-- UPDATE products 
-- SET 
--   sale_price = base_price * 0.7,
--   on_sale = true,
--   promo_label = 'Flash Sale -30%'
-- WHERE slug = 'windows-11-pro';
