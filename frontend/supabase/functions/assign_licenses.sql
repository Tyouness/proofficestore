-- ==========================================
-- Fonction RPC : Attribution atomique de licences
-- ==========================================
-- 
-- Cette fonction garantit qu'une licence ne peut être attribuée qu'une seule fois,
-- même en cas d'accès concurrent (race condition).
-- 
-- Utilise FOR UPDATE SKIP LOCKED pour éviter les deadlocks et garantir l'atomicité.
-- 
-- Retourne le nombre de licences réellement attribuées.

CREATE OR REPLACE FUNCTION assign_licenses_to_order(
  p_order_id UUID,
  p_product_id TEXT,
  p_quantity INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER  -- Exécute avec les privilèges du propriétaire (contourne RLS)
AS $$
DECLARE
  v_assigned_count INTEGER;
BEGIN
  -- Log de démarrage
  RAISE NOTICE '[ASSIGN_LICENSES] Order: %, Product: %, Quantity: %', 
    p_order_id, p_product_id, p_quantity;

  -- Attribution atomique avec verrouillage
  -- FOR UPDATE SKIP LOCKED garantit qu'on ne prend que des licences non verrouillées
  WITH available_licenses AS (
    SELECT id
    FROM licenses
    WHERE product_id = p_product_id
      AND is_used = false
      AND order_id IS NULL
    ORDER BY created_at ASC  -- FIFO : premières créées = premières attribuées
    LIMIT p_quantity
    FOR UPDATE SKIP LOCKED  -- Verrouille les lignes, ignore celles déjà verrouillées
  ),
  updated_licenses AS (
    UPDATE licenses
    SET 
      is_used = true,
      order_id = p_order_id,
      updated_at = NOW()
    WHERE id IN (SELECT id FROM available_licenses)
    RETURNING id
  )
  SELECT COUNT(*) INTO v_assigned_count
  FROM updated_licenses;

  -- Log du résultat
  RAISE NOTICE '[ASSIGN_LICENSES] Assigned % licenses for order %', 
    v_assigned_count, p_order_id;

  -- Retourner le nombre de licences attribuées
  RETURN v_assigned_count;
END;
$$;

-- ==========================================
-- Permissions
-- ==========================================
-- La fonction est SECURITY DEFINER, elle s'exécute avec les droits du propriétaire
-- Mais on peut restreindre qui peut l'appeler

-- Révoquer l'accès public
REVOKE ALL ON FUNCTION assign_licenses_to_order FROM PUBLIC;

-- Autoriser uniquement le service_role (utilisé par le backend)
GRANT EXECUTE ON FUNCTION assign_licenses_to_order TO service_role;

-- ==========================================
-- Comment utiliser cette fonction
-- ==========================================
-- 
-- Depuis le webhook (avec supabaseAdmin) :
-- 
-- const { data, error } = await supabaseAdmin.rpc('assign_licenses_to_order', {
--   p_order_id: order.id,
--   p_product_id: 'win-11-pro',
--   p_quantity: 2
-- });
-- 
-- if (error) {
--   console.error('Erreur attribution:', error);
-- } else {
--   console.log('Licences attribuées:', data); // Retourne le nombre (ex: 2)
-- }
