-- Migration: cart_hash contrainte unique + NOT NULL + CHECK
-- Empêche 2 commandes pending avec même user_id + cart_hash
-- Race condition protection

-- ============================================================
-- ÉTAPE 1: Ajouter colonne cart_hash si elle n'existe pas
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'orders'
    AND column_name = 'cart_hash'
  ) THEN
    -- Ajouter colonne NULLABLE (sans DEFAULT)
    ALTER TABLE orders ADD COLUMN cart_hash TEXT;
    RAISE NOTICE 'Colonne cart_hash ajoutée';
  ELSE
    RAISE NOTICE 'Colonne cart_hash existe déjà';
  END IF;
END $$;

-- ============================================================
-- ÉTAPE 2: Backfill des valeurs NULL ou '' existantes
-- ============================================================
-- Générer un cart_hash unique pour chaque ligne existante
-- Format: md5(id || timestamp) pour garantir unicité
DO $$
DECLARE
  affected_count INT;
BEGIN
  UPDATE orders
  SET cart_hash = MD5(id::TEXT || COALESCE(created_at::TEXT, NOW()::TEXT))
  WHERE cart_hash IS NULL OR cart_hash = '';
  
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RAISE NOTICE 'Backfill cart_hash: % lignes mises à jour', affected_count;
END $$;

-- ============================================================
-- ÉTAPE 3: Ajouter contraintes NOT NULL + CHECK
-- ============================================================
DO $$
BEGIN
  -- NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'orders'
    AND column_name = 'cart_hash'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE orders ALTER COLUMN cart_hash SET NOT NULL;
    RAISE NOTICE 'Contrainte NOT NULL ajoutée sur cart_hash';
  ELSE
    RAISE NOTICE 'cart_hash est déjà NOT NULL';
  END IF;

  -- CHECK (length > 0)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'orders_cart_hash_not_empty'
  ) THEN
    ALTER TABLE orders
    ADD CONSTRAINT orders_cart_hash_not_empty
    CHECK (length(cart_hash) > 0);
    RAISE NOTICE 'Contrainte CHECK (length > 0) ajoutée';
  ELSE
    RAISE NOTICE 'Contrainte CHECK existe déjà';
  END IF;
END $$;

-- ============================================================
-- ÉTAPE 4: Index unique partiel (status='pending')
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_unique_pending_cart
ON orders (user_id, cart_hash)
WHERE status = 'pending';

-- ============================================================
-- ÉTAPE 5: Documentation
-- ============================================================
COMMENT ON INDEX idx_orders_unique_pending_cart IS 
'Empêche création de commandes pending en doublon (même user + même panier). Index partiel pour performance.';
