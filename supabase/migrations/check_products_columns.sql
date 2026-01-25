-- Script pour vérifier les colonnes de la table products

-- Liste complète des colonnes avec leurs types
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;
