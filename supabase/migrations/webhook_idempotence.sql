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
CREATE INDEX idx_webhook_events_event_id ON stripe_webhook_events(event_id);
CREATE INDEX idx_webhook_events_order_id ON stripe_webhook_events(order_id);

-- RPC pour attribution atomique de licences
-- Retourne les clés de licence attribuées
CREATE OR REPLACE FUNCTION assign_licenses_atomic(
  p_order_id UUID,
  p_variant_id UUID,
  p_quantity INT
)
RETURNS TABLE(license_key TEXT) AS $$
DECLARE
  v_assigned INT := 0;
BEGIN
  -- Sélectionner et verrouiller les licences disponibles
  -- FOR UPDATE SKIP LOCKED évite les deadlocks
  RETURN QUERY
  WITH selected_licenses AS (
    SELECT l.id, l.license_key
    FROM licenses l
    WHERE l.variant_id = p_variant_id
      AND l.is_used = FALSE
      AND l.order_id IS NULL
    ORDER BY l.created_at ASC
    LIMIT p_quantity
    FOR UPDATE SKIP LOCKED -- Atomique, évite concurrence
  ),
  updated_licenses AS (
    UPDATE licenses
    SET is_used = TRUE,
        order_id = p_order_id,
        assigned_at = NOW()
    FROM selected_licenses
    WHERE licenses.id = selected_licenses.id
    RETURNING licenses.license_key
  )
  SELECT updated_licenses.license_key
  FROM updated_licenses;
  
  -- Vérifier qu'on a bien assigné le bon nombre
  GET DIAGNOSTICS v_assigned = ROW_COUNT;
  IF v_assigned < p_quantity THEN
    RAISE EXCEPTION 'Stock insuffisant: % licences demandees, % disponibles', p_quantity, v_assigned;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION assign_licenses_atomic IS 'Attribution atomique de licences avec verrouillage FOR UPDATE SKIP LOCKED';
