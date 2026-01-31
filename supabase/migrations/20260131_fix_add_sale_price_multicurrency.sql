-- Migration corrective : Ajouter les colonnes de prix promotionnels multi-devises manquantes
-- Cette migration est idempotente (peut être exécutée plusieurs fois sans erreur)

-- 1. Ajouter les colonnes de prix promotionnels si elles n'existent pas
DO $$ 
BEGIN
  -- sale_price_eur
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='products' AND column_name='sale_price_eur') THEN
    ALTER TABLE products ADD COLUMN sale_price_eur DECIMAL(10, 2);
    COMMENT ON COLUMN products.sale_price_eur IS 'Prix réduit en Euros (€) - France';
  END IF;

  -- sale_price_usd
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='products' AND column_name='sale_price_usd') THEN
    ALTER TABLE products ADD COLUMN sale_price_usd DECIMAL(10, 2);
    COMMENT ON COLUMN products.sale_price_usd IS 'Prix réduit en Dollars US ($) - États-Unis';
  END IF;

  -- sale_price_gbp
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='products' AND column_name='sale_price_gbp') THEN
    ALTER TABLE products ADD COLUMN sale_price_gbp DECIMAL(10, 2);
    COMMENT ON COLUMN products.sale_price_gbp IS 'Prix réduit en Livres Sterling (£) - Royaume-Uni';
  END IF;

  -- sale_price_cad
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='products' AND column_name='sale_price_cad') THEN
    ALTER TABLE products ADD COLUMN sale_price_cad DECIMAL(10, 2);
    COMMENT ON COLUMN products.sale_price_cad IS 'Prix réduit en Dollars Canadiens (CAD) - Canada';
  END IF;

  -- sale_price_aud
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='products' AND column_name='sale_price_aud') THEN
    ALTER TABLE products ADD COLUMN sale_price_aud DECIMAL(10, 2);
    COMMENT ON COLUMN products.sale_price_aud IS 'Prix réduit en Dollars Australiens (AUD) - Australie';
  END IF;

  -- sale_price_chf
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='products' AND column_name='sale_price_chf') THEN
    ALTER TABLE products ADD COLUMN sale_price_chf DECIMAL(10, 2);
    COMMENT ON COLUMN products.sale_price_chf IS 'Prix réduit en Francs Suisses (CHF) - Suisse';
  END IF;

  -- Labels de promotion par devise
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='products' AND column_name='promo_label_eur') THEN
    ALTER TABLE products ADD COLUMN promo_label_eur VARCHAR(50);
    COMMENT ON COLUMN products.promo_label_eur IS 'Label promotion en Euros (ex: -50%)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='products' AND column_name='promo_label_usd') THEN
    ALTER TABLE products ADD COLUMN promo_label_usd VARCHAR(50);
    COMMENT ON COLUMN products.promo_label_usd IS 'Label promotion en USD (ex: 50% OFF)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='products' AND column_name='promo_label_gbp') THEN
    ALTER TABLE products ADD COLUMN promo_label_gbp VARCHAR(50);
    COMMENT ON COLUMN products.promo_label_gbp IS 'Label promotion en GBP (ex: 50% OFF)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='products' AND column_name='promo_label_cad') THEN
    ALTER TABLE products ADD COLUMN promo_label_cad VARCHAR(50);
    COMMENT ON COLUMN products.promo_label_cad IS 'Label promotion en CAD (ex: 50% OFF)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='products' AND column_name='promo_label_aud') THEN
    ALTER TABLE products ADD COLUMN promo_label_aud VARCHAR(50);
    COMMENT ON COLUMN products.promo_label_aud IS 'Label promotion en AUD (ex: 50% OFF)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='products' AND column_name='promo_label_chf') THEN
    ALTER TABLE products ADD COLUMN promo_label_chf VARCHAR(50);
    COMMENT ON COLUMN products.promo_label_chf IS 'Label promotion en CHF (ex: -50%)';
  END IF;
END $$;

-- 2. Migrer les prix réduits existants (sale_price) dans sale_price_eur
UPDATE products
SET sale_price_eur = sale_price
WHERE sale_price_eur IS NULL AND sale_price IS NOT NULL;

-- 2b. Migrer le label promo existant vers promo_label_eur
UPDATE products
SET promo_label_eur = promo_label
WHERE promo_label_eur IS NULL AND promo_label IS NOT NULL;

-- 3. Initialiser les prix réduits multi-devises à partir de sale_price_eur (si défini)
UPDATE products
SET 
  sale_price_usd = ROUND(sale_price_eur * 1.10, 2),
  sale_price_gbp = ROUND(sale_price_eur * 0.85, 2),
  sale_price_cad = ROUND(sale_price_eur * 1.50, 2),
  sale_price_aud = ROUND(sale_price_eur * 1.70, 2),
  sale_price_chf = ROUND(sale_price_eur * 1.05, 2)
WHERE sale_price_eur IS NOT NULL
  AND (sale_price_usd IS NULL OR sale_price_gbp IS NULL OR sale_price_cad IS NULL OR sale_price_aud IS NULL OR sale_price_chf IS NULL);

-- 4. Ajouter des contraintes pour les prix promotionnels (si elles n'existent pas)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_sale_price_eur_positive') THEN
    ALTER TABLE products ADD CONSTRAINT products_sale_price_eur_positive CHECK (sale_price_eur IS NULL OR sale_price_eur >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_sale_price_usd_positive') THEN
    ALTER TABLE products ADD CONSTRAINT products_sale_price_usd_positive CHECK (sale_price_usd IS NULL OR sale_price_usd >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_sale_price_gbp_positive') THEN
    ALTER TABLE products ADD CONSTRAINT products_sale_price_gbp_positive CHECK (sale_price_gbp IS NULL OR sale_price_gbp >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_sale_price_cad_positive') THEN
    ALTER TABLE products ADD CONSTRAINT products_sale_price_cad_positive CHECK (sale_price_cad IS NULL OR sale_price_cad >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_sale_price_aud_positive') THEN
    ALTER TABLE products ADD CONSTRAINT products_sale_price_aud_positive CHECK (sale_price_aud IS NULL OR sale_price_aud >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_sale_price_chf_positive') THEN
    ALTER TABLE products ADD CONSTRAINT products_sale_price_chf_positive CHECK (sale_price_chf IS NULL OR sale_price_chf >= 0);
  END IF;
END $$;

-- 5. Mettre à jour la vue products_with_all_prices
-- Supprimer l'ancienne vue pour éviter les conflits de colonnes
DROP VIEW IF EXISTS products_with_all_prices;

CREATE VIEW products_with_all_prices AS
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
  promo_label_eur,
  promo_label_usd,
  promo_label_gbp,
  promo_label_cad,
  promo_label_aud,
  promo_label_chf,
  sale_price_usd,
  sale_price_gbp,
  sale_price_cad,
  sale_price_aud,
  sale_price_chf,
  -- Labels formatés (prix normaux)
  CASE WHEN price_eur IS NOT NULL THEN price_eur || ' €' ELSE NULL END as price_eur_formatted,
  CASE WHEN price_usd IS NOT NULL THEN '$' || price_usd ELSE NULL END as price_usd_formatted,
  CASE WHEN price_gbp IS NOT NULL THEN '£' || price_gbp ELSE NULL END as price_gbp_formatted,
  CASE WHEN price_cad IS NOT NULL THEN price_cad || ' CAD' ELSE NULL END as price_cad_formatted,
  CASE WHEN price_aud IS NOT NULL THEN price_aud || ' AUD' ELSE NULL END as price_aud_formatted,
  CASE WHEN price_chf IS NOT NULL THEN price_chf || ' CHF' ELSE NULL END as price_chf_formatted,
  -- Labels formatés (prix réduits)
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
