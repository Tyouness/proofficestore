-- Migration: cart_hash contrainte unique + NOT NULL
-- Empêche 2 commandes pending avec même user_id + cart_hash
-- Race condition protection

-- Ajouter colonne cart_hash si elle n'existe pas (NOT NULL)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS cart_hash TEXT NOT NULL DEFAULT '';

-- Index unique partiel (seulement sur status='pending')
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_unique_pending_cart
ON orders (user_id, cart_hash)
WHERE status = 'pending';

-- Documentation
COMMENT ON INDEX idx_orders_unique_pending_cart IS 
'Empêche la création de commandes en double pendant le checkout (race condition).
Uniquement appliqué sur status=pending pour permettre réutilisation du hash après finalisation.';
