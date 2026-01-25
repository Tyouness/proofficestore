-- ============================================================
-- FIX TEMPORAIRE: Remettre le stock à 2 et simuler le webhook
-- ============================================================

-- 1️⃣ REMETTRE LE STOCK à 2 (annuler le test manuel)
UPDATE products 
SET inventory = 2 
WHERE slug = 'office-2019-professional-plus-dvd';

-- 2️⃣ SIMULER CE QUE LE WEBHOOK AURAIT DÛ FAIRE pour les 5 commandes
-- Chaque commande = -1, donc 5 commandes = -5
-- Stock final devrait être: 2 - 5 = -3 → mais GREATEST(0, -3) = 0

SELECT decrement_product_inventory('office-2019-professional-plus-dvd', 5);

-- 3️⃣ VÉRIFIER LE RÉSULTAT (devrait être 0)
SELECT slug, inventory FROM products WHERE slug = 'office-2019-professional-plus-dvd';

-- ============================================================
-- SOLUTION PERMANENTE: Configurer Stripe CLI (à faire après)
-- ============================================================
-- Pour tester les webhooks en local, il faut installer Stripe CLI:
-- https://stripe.com/docs/stripe-cli
-- 
-- Puis lancer: stripe listen --forward-to localhost:3001/api/webhook/stripe
