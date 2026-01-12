-- Script SQL pour ajouter les colonnes nécessaires à la gestion des remboursements
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Ajouter la colonne stripe_payment_intent dans orders (si elle n'existe pas)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS stripe_payment_intent TEXT;

-- 2. Ajouter la colonne revoked dans licenses (si elle n'existe pas)
ALTER TABLE licenses 
ADD COLUMN IF NOT EXISTS revoked BOOLEAN DEFAULT false;

-- 3. Créer un index pour améliorer les performances des requêtes de remboursement
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent 
ON orders(stripe_payment_intent);

-- 4. Créer un index pour les licences révoquées
CREATE INDEX IF NOT EXISTS idx_licenses_revoked 
ON licenses(revoked) WHERE revoked = true;

-- 5. Vérification : afficher la structure des tables
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name IN ('orders', 'licenses')
ORDER BY table_name, ordinal_position;
