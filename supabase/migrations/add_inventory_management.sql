-- Migration: Système de gestion de stock et capture de leads
-- Description: Ajoute la gestion d'inventaire aux produits et une table pour capturer les demandes de stock

-- 1. Ajouter la colonne inventory à la table products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS inventory integer DEFAULT 0 NOT NULL;

-- Commentaire pour documentation
COMMENT ON COLUMN products.inventory IS 'Quantité disponible en stock. 0 = rupture de stock.';

-- Index pour optimiser les requêtes de vérification de stock
CREATE INDEX IF NOT EXISTS idx_products_inventory ON products(inventory);

-- 2. Créer la table stock_requests pour capturer les demandes de stock
CREATE TABLE IF NOT EXISTS stock_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    
    -- Informations sur le produit demandé
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Informations client
    user_email text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL CHECK (quantity > 0 AND quantity <= 100),
    
    -- Suivi du statut
    status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'contacted', 'completed', 'cancelled')),
    
    -- Métadonnées pour anti-spam
    ip_address text,
    user_agent text,
    
    -- Notes administratives
    admin_notes text
);

-- Commentaires pour documentation
COMMENT ON TABLE stock_requests IS 'Demandes de notification de disponibilité pour produits en rupture de stock';
COMMENT ON COLUMN stock_requests.status IS 'pending: en attente, contacted: client contacté, completed: commande finalisée, cancelled: demande annulée';

-- Index pour optimiser les requêtes admin
CREATE INDEX IF NOT EXISTS idx_stock_requests_created_at ON stock_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_requests_status ON stock_requests(status);
CREATE INDEX IF NOT EXISTS idx_stock_requests_product_id ON stock_requests(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_requests_email_created ON stock_requests(user_email, created_at DESC);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_stock_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS stock_requests_updated_at ON stock_requests;
CREATE TRIGGER stock_requests_updated_at
    BEFORE UPDATE ON stock_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_requests_updated_at();

-- 3. Fonction pour vérifier les demandes en double (anti-spam)
CREATE OR REPLACE FUNCTION check_duplicate_stock_request(
    p_email text,
    p_product_id uuid,
    p_hours_threshold integer DEFAULT 1
)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM stock_requests 
        WHERE user_email = p_email 
        AND product_id = p_product_id 
        AND created_at > now() - (p_hours_threshold || ' hours')::interval
        AND status != 'cancelled'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Vue pour faciliter les requêtes admin
CREATE OR REPLACE VIEW stock_requests_with_product AS
SELECT 
    sr.id,
    sr.created_at,
    sr.updated_at,
    sr.user_email,
    sr.quantity,
    sr.status,
    sr.ip_address,
    sr.admin_notes,
    p.id as product_id,
    p.name as product_name,
    p.slug as product_slug,
    p.inventory as current_inventory,
    p.base_price as product_price
FROM stock_requests sr
JOIN products p ON p.id = sr.product_id
ORDER BY sr.created_at DESC;

-- Commentaire
COMMENT ON VIEW stock_requests_with_product IS 'Vue enrichie des demandes de stock avec informations produit';

-- 5. Politique RLS (Row Level Security) pour stock_requests
ALTER TABLE stock_requests ENABLE ROW LEVEL SECURITY;

-- Politique pour insertion publique (avec rate limiting géré côté application)
CREATE POLICY "Insertion publique des demandes de stock"
ON stock_requests FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Politique pour lecture admin uniquement
CREATE POLICY "Lecture admin des demandes de stock"
ON stock_requests FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.email IN (
            SELECT email FROM profiles WHERE role = 'admin'
        )
    )
);

-- Politique pour mise à jour admin uniquement
CREATE POLICY "Mise à jour admin des demandes de stock"
ON stock_requests FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.email IN (
            SELECT email FROM profiles WHERE role = 'admin'
        )
    )
);

-- 6. Initialiser l'inventaire pour les produits existants (optionnel)
-- Par défaut, tous les produits sont en stock avec une quantité généreuse
UPDATE products 
SET inventory = 999 
WHERE inventory = 0;

-- Commentaire final
COMMENT ON COLUMN products.inventory IS 'Inventaire géré manuellement. Mettre à 0 pour activer la capture de leads.';
