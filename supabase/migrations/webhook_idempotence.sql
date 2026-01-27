-- Table pour idempotence des webhooks Stripe
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id BIGSERIAL PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE, -- Stripe event.id
  event_type TEXT NOT NULL,
  order_id UUID REFERENCES orders(id),
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour recherche rapide
-- Note: event_id a déjà un index unique via contrainte UNIQUE (pas besoin d'index supplémentaire)
CREATE INDEX IF NOT EXISTS idx_webhook_events_order_id ON stripe_webhook_events(order_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON stripe_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created ON stripe_webhook_events(created_at DESC);

-- Indexes performance licenses (FOR UPDATE SKIP LOCKED optimization)
CREATE INDEX IF NOT EXISTS idx_licenses_product_id ON licenses(product_id);
CREATE INDEX IF NOT EXISTS idx_licenses_available ON licenses(product_id, is_used, revoked, order_id) 
  WHERE is_used = FALSE AND revoked = FALSE AND order_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_licenses_order_id ON licenses(order_id) WHERE order_id IS NOT NULL;

-- UNIQUE constraint sur key_code (idempotence licences)
DO $$ 
BEGIN
  ALTER TABLE licenses ADD CONSTRAINT licenses_key_code_unique UNIQUE (key_code);
EXCEPTION
  WHEN duplicate_table THEN NULL; -- Ignore si déjà existe
  WHEN others THEN NULL;
END $$;

-- Contraintes NOT NULL
DO $$ 
BEGIN
  ALTER TABLE licenses ALTER COLUMN is_used SET DEFAULT FALSE;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE licenses ALTER COLUMN is_used SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE licenses ALTER COLUMN revoked SET DEFAULT FALSE;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE licenses ALTER COLUMN revoked SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Commentaires
COMMENT ON TABLE stripe_webhook_events IS 'Idempotence atomique Stripe via event_id UNIQUE';
COMMENT ON COLUMN stripe_webhook_events.event_id IS 'Stripe event.id - clé unique pour déduplication';
COMMENT ON INDEX idx_licenses_available IS 'Index partiel pour assign_licenses_by_product (FOR UPDATE SKIP LOCKED)';
