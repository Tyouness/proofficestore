-- Fonction RPC : Attribution atomique de licences PAR PRODUCT_ID
-- (Compatible avec le système de variants)
-- 
-- Cette fonction remplace assign_licenses_atomic qui utilisait variant_id
-- Elle cherche les licences par product_id (slug de base)
-- 
-- Ex: product_id = 'office-2024-professional-plus' (sans -digital-key/-dvd/-usb)

CREATE OR REPLACE FUNCTION assign_licenses_by_product(
  p_order_id UUID,
  p_product_id TEXT,
  p_quantity INT
)
RETURNS TABLE(license_key TEXT, key_code TEXT) AS $$
DECLARE
  v_assigned INT := 0;
BEGIN
  -- Log pour debugging
  RAISE NOTICE '[ASSIGN_LICENSES] Order: %, Product: %, Quantity: %', 
    p_order_id, p_product_id, p_quantity;

  -- Sélectionner et verrouiller les licences disponibles
  -- FOR UPDATE SKIP LOCKED évite les deadlocks
  RETURN QUERY
  WITH selected_licenses AS (
    SELECT l.id, l.license_key, l.key_code
    FROM licenses l
    WHERE l.product_id = p_product_id
      AND l.is_used = FALSE
      AND (l.order_id IS NULL OR l.order_id = p_order_id) -- Idempotence
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
    RETURNING licenses.license_key, licenses.key_code
  )
  SELECT 
    updated_licenses.license_key,
    updated_licenses.key_code
  FROM updated_licenses;
  
  -- Vérifier qu'on a bien assigné le bon nombre
  GET DIAGNOSTICS v_assigned = ROW_COUNT;
  
  RAISE NOTICE '[ASSIGN_LICENSES] Assigned % licenses (requested %)', v_assigned, p_quantity;
  
  IF v_assigned < p_quantity THEN
    RAISE EXCEPTION 'Stock insuffisant pour %: % licences demandees, % disponibles', 
      p_product_id, p_quantity, v_assigned
    USING HINT = 'Verifiez le stock de licences dans l''admin panel';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION assign_licenses_by_product IS 'Attribution atomique de licences par product_id (compatible variants)';

-- Permissions
REVOKE ALL ON FUNCTION assign_licenses_by_product FROM PUBLIC;
GRANT EXECUTE ON FUNCTION assign_licenses_by_product TO service_role;
GRANT EXECUTE ON FUNCTION assign_licenses_by_product TO authenticated;
