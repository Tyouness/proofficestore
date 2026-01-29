-- Migration: Ajouter colonne sale_price pour les prix soldés
-- Date: 2026-01-29

BEGIN;

-- Ajouter la colonne sale_price (prix soldé)
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS sale_price NUMERIC;

-- Ajouter une contrainte pour s'assurer que le prix soldé est positif
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_sale_price_positive') THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_sale_price_positive
      CHECK (sale_price IS NULL OR sale_price >= 0);
  END IF;
END $$;

-- Ajouter un index pour optimiser les requêtes sur les produits en solde
CREATE INDEX IF NOT EXISTS idx_products_sale_price ON public.products(sale_price) WHERE sale_price IS NOT NULL;

COMMIT;
