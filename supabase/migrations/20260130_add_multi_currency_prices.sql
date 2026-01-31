-- Migration : Ajout des prix multi-devises pour l'internationalisation
-- Permet de fixer manuellement les prix pour chaque marché sans conversion automatique

-- 1. Ajouter les colonnes de prix pour chaque devise (normaux + promotionnels)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS price_eur DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS price_usd DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS price_gbp DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS price_cad DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS price_aud DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS price_chf DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS sale_price_eur DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS sale_price_usd DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS sale_price_gbp DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS sale_price_cad DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS sale_price_aud DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS sale_price_chf DECIMAL(10, 2);

-- 2. Commentaires pour documenter chaque colonne
COMMENT ON COLUMN products.price_eur IS 'Prix en Euros (€) - France';
COMMENT ON COLUMN products.price_usd IS 'Prix en Dollars US ($) - États-Unis';
COMMENT ON COLUMN products.price_gbp IS 'Prix en Livres Sterling (£) - Royaume-Uni';
COMMENT ON COLUMN products.price_cad IS 'Prix en Dollars Canadiens (CAD) - Canada';
COMMENT ON COLUMN products.price_aud IS 'Prix en Dollars Australiens (AUD) - Australie';
COMMENT ON COLUMN products.price_chf IS 'Prix en Francs Suisses (CHF) - Suisse';
COMMENT ON COLUMN products.sale_price_eur IS 'Prix réduit en Euros (€) - France';
COMMENT ON COLUMN products.sale_price_usd IS 'Prix réduit en Dollars US ($) - États-Unis';
COMMENT ON COLUMN products.sale_price_gbp IS 'Prix réduit en Livres Sterling (£) - Royaume-Uni';
COMMENT ON COLUMN products.sale_price_cad IS 'Prix réduit en Dollars Canadiens (CAD) - Canada';
COMMENT ON COLUMN products.sale_price_aud IS 'Prix réduit en Dollars Australiens (AUD) - Australie';
COMMENT ON COLUMN products.sale_price_chf IS 'Prix réduit en Francs Suisses (CHF) - Suisse';

-- 3. Migrer les prix existants (base_price) dans price_eur (colonne par défaut)
UPDATE products
SET price_eur = base_price
WHERE price_eur IS NULL AND base_price IS NOT NULL;

-- 3b. Migrer les prix réduits existants (sale_price) dans sale_price_eur
UPDATE products
SET sale_price_eur = sale_price
WHERE sale_price_eur IS NULL AND sale_price IS NOT NULL;

-- 4. Initialiser les autres devises avec des valeurs par défaut basées sur price_eur
-- (L'admin devra les ajuster manuellement ensuite)
UPDATE products
SET 
  price_usd = ROUND(price_eur * 1.10, 2),  -- EUR -> USD (approximation +10%)
  price_gbp = ROUND(price_eur * 0.85, 2),  -- EUR -> GBP (approximation -15%)
  price_cad = ROUND(price_eur * 1.50, 2),  -- EUR -> CAD (approximation +50%)
  price_aud = ROUND(price_eur * 1.70, 2),  -- EUR -> AUD (approximation +70%)
  price_chf = ROUND(price_eur * 1.05, 2)   -- EUR -> CHF (approximation +5%)
WHERE price_eur IS NOT NULL
  AND (price_usd IS NULL OR price_gbp IS NULL OR price_cad IS NULL OR price_aud IS NULL OR price_chf IS NULL);

-- 4b. Initialiser les prix réduits multi-devises à partir de sale_price_eur (si défini)
UPDATE products
SET 
  sale_price_usd = ROUND(sale_price_eur * 1.10, 2),  -- EUR -> USD (approximation +10%)
  sale_price_gbp = ROUND(sale_price_eur * 0.85, 2),  -- EUR -> GBP (approximation -15%)
  sale_price_cad = ROUND(sale_price_eur * 1.50, 2),  -- EUR -> CAD (approximation +50%)
  sale_price_aud = ROUND(sale_price_eur * 1.70, 2),  -- EUR -> AUD (approximation +70%)
  sale_price_chf = ROUND(sale_price_eur * 1.05, 2)   -- EUR -> CHF (approximation +5%)
WHERE sale_price_eur IS NOT NULL
  AND (sale_price_usd IS NULL OR sale_price_gbp IS NULL OR sale_price_cad IS NULL OR sale_price_aud IS NULL OR sale_price_chf IS NULL);

-- 5. Ajouter des contraintes pour garantir que les prix sont positifs
ALTER TABLE products
ADD CONSTRAINT products_price_eur_positive CHECK (price_eur IS NULL OR price_eur >= 0),
ADD CONSTRAINT products_price_usd_positive CHECK (price_usd IS NULL OR price_usd >= 0),
ADD CONSTRAINT products_price_gbp_positive CHECK (price_gbp IS NULL OR price_gbp >= 0),
ADD CONSTRAINT products_price_cad_positive CHECK (price_cad IS NULL OR price_cad >= 0),
ADD CONSTRAINT products_price_aud_positive CHECK (price_aud IS NULL OR price_aud >= 0),
ADD CONSTRAINT products_price_chf_positive CHECK (price_chf IS NULL OR price_chf >= 0),
ADD CONSTRAINT products_sale_price_eur_positive CHECK (sale_price_eur IS NULL OR sale_price_eur >= 0),
ADD CONSTRAINT products_sale_price_usd_positive CHECK (sale_price_usd IS NULL OR sale_price_usd >= 0),
ADD CONSTRAINT products_sale_price_gbp_positive CHECK (sale_price_gbp IS NULL OR sale_price_gbp >= 0),
ADD CONSTRAINT products_sale_price_cad_positive CHECK (sale_price_cad IS NULL OR sale_price_cad >= 0),
ADD CONSTRAINT products_sale_price_aud_positive CHECK (sale_price_aud IS NULL OR sale_price_aud >= 0),
ADD CONSTRAINT products_sale_price_chf_positive CHECK (sale_price_chf IS NULL OR sale_price_chf >= 0);

-- 6. Index pour améliorer les performances des requêtes filtrées par devise
CREATE INDEX IF NOT EXISTS idx_products_price_eur ON products(price_eur) WHERE price_eur IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_price_usd ON products(price_usd) WHERE price_usd IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_price_gbp ON products(price_gbp) WHERE price_gbp IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_price_cad ON products(price_cad) WHERE price_cad IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_price_aud ON products(price_aud) WHERE price_aud IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_price_chf ON products(price_chf) WHERE price_chf IS NOT NULL;

-- 7. Fonction helper pour récupérer le prix dans la devise demandée
CREATE OR REPLACE FUNCTION get_product_price(
  product_row products,
  currency_code TEXT DEFAULT 'EUR'
)
RETURNS DECIMAL(10, 2)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN CASE UPPER(currency_code)
    WHEN 'EUR' THEN product_row.price_eur
    WHEN 'USD' THEN product_row.price_usd
    WHEN 'GBP' THEN product_row.price_gbp
    WHEN 'CAD' THEN product_row.price_cad
    WHEN 'AUD' THEN product_row.price_aud
    WHEN 'CHF' THEN product_row.price_chf
    ELSE product_row.price_eur  -- Fallback sur EUR
  END;
END;
$$;

COMMENT ON FUNCTION get_product_price IS 'Récupère le prix d''un produit dans la devise spécifiée';

-- 8. Vue pour faciliter les requêtes multi-devises
CREATE OR REPLACE VIEW products_with_all_prices AS
SELECT 
  id,
  name,
  slug,
  family,
  version,
  edition,
  delivery_type,
  description,
  long_description,
  image_url,
  is_featured,
  is_active,
  base_price,
  price_eur,
  price_usd,
  price_gbp,
  price_cad,
  price_aud,
  price_chf,
  sale_price_eur,
  sale_price_usd,
  sale_price_gbp,
  sale_price_cad,
  sale_price_aud,
  sale_price_chf,
  -- Ajouter des labels de devise formatés (prix normaux)
  CASE WHEN price_eur IS NOT NULL THEN price_eur || ' €' ELSE NULL END as price_eur_formatted,
  CASE WHEN price_usd IS NOT NULL THEN '$' || price_usd ELSE NULL END as price_usd_formatted,
  CASE WHEN price_gbp IS NOT NULL THEN '£' || price_gbp ELSE NULL END as price_gbp_formatted,
  CASE WHEN price_cad IS NOT NULL THEN price_cad || ' CAD' ELSE NULL END as price_cad_formatted,
  CASE WHEN price_aud IS NOT NULL THEN price_aud || ' AUD' ELSE NULL END as price_aud_formatted,
  CASE WHEN price_chf IS NOT NULL THEN price_chf || ' CHF' ELSE NULL END as price_chf_formatted,
  -- Ajouter des labels de devise formatés (prix réduits)
  CASE WHEN sale_price_eur IS NOT NULL THEN sale_price_eur || ' €' ELSE NULL END as sale_price_eur_formatted,
  CASE WHEN sale_price_usd IS NOT NULL THEN '$' || sale_price_usd ELSE NULL END as sale_price_usd_formatted,
  CASE WHEN sale_price_gbp IS NOT NULL THEN '£' || sale_price_gbp ELSE NULL END as sale_price_gbp_formatted,
  CASE WHEN sale_price_cad IS NOT NULL THEN sale_price_cad || ' CAD' ELSE NULL END as sale_price_cad_formatted,
  CASE WHEN sale_price_aud IS NOT NULL THEN sale_price_aud || ' AUD' ELSE NULL END as sale_price_aud_formatted,
  CASE WHEN sale_price_chf IS NOT NULL THEN sale_price_chf || ' CHF' ELSE NULL END as sale_price_chf_formatted,
  inventory,
  created_at
FROM products;

COMMENT ON VIEW products_with_all_prices IS 'Vue avec tous les prix formatés pour chaque devise';
