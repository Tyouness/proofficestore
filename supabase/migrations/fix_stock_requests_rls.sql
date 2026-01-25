-- Migration: Correction des politiques RLS pour stock_requests
-- Description: Simplifie les politiques pour permettre aux admins de mettre à jour les demandes

-- 1. Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Lecture admin des demandes de stock" ON stock_requests;
DROP POLICY IF EXISTS "Mise à jour admin des demandes de stock" ON stock_requests;

-- 2. Créer de nouvelles politiques simplifiées

-- Politique pour lecture admin
CREATE POLICY "Admin peut lire les demandes de stock"
ON stock_requests FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_roles.user_id = auth.uid() 
        AND user_roles.role = 'admin'
    )
);

-- Politique pour mise à jour admin
CREATE POLICY "Admin peut mettre à jour les demandes de stock"
ON stock_requests FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_roles.user_id = auth.uid() 
        AND user_roles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_roles.user_id = auth.uid() 
        AND user_roles.role = 'admin'
    )
);

-- 3. Ajouter une politique pour la suppression (optionnel, pour future fonctionnalité)
CREATE POLICY "Admin peut supprimer les demandes de stock"
ON stock_requests FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_roles.user_id = auth.uid() 
        AND user_roles.role = 'admin'
    )
);

-- Commentaire
COMMENT ON TABLE stock_requests IS 'Demandes de notification de disponibilité. Politiques RLS simplifiées pour performance.';
