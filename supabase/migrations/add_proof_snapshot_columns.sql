/**
 * Migration : Ajout colonnes pour preuves d'achat immuables
 * 
 * OBJECTIF :
 * - paid_at : Date exacte du paiement (≠ created_at)
 * - proof_snapshot : JSON immuable figé au 1er téléchargement
 * - proof_generated_at : Timestamp de première génération
 * 
 * CONFORMITÉ JURIDIQUE :
 * - Le snapshot garantit l'immutabilité en cas de litige
 * - Si produit renommé ou template modifié, le PDF reste identique
 */

-- 1. Ajout colonne paid_at (date réelle de paiement)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- 2. Ajout colonne proof_snapshot (JSON immuable)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS proof_snapshot JSONB;

-- 3. Ajout colonne proof_generated_at (date première génération)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS proof_generated_at TIMESTAMPTZ;

-- 4. Index pour performance
CREATE INDEX IF NOT EXISTS idx_orders_paid_at ON orders(paid_at);
CREATE INDEX IF NOT EXISTS idx_orders_proof_generated_at ON orders(proof_generated_at);

-- 5. Commentaires pour documentation
COMMENT ON COLUMN orders.paid_at IS 'Date exacte du paiement confirmé par Stripe (≠ created_at)';
COMMENT ON COLUMN orders.proof_snapshot IS 'Snapshot JSON immuable pour preuve d''achat (juridique)';
COMMENT ON COLUMN orders.proof_generated_at IS 'Date de première génération de la preuve (immutabilité)';

-- 6. (Optionnel) Rétrocompatibilité : Migrer paid_at depuis created_at pour commandes existantes
-- ⚠️ À adapter selon ton workflow réel (webhook Stripe met à jour paid_at normalement)
UPDATE orders
SET paid_at = created_at
WHERE status = 'paid' AND paid_at IS NULL;
