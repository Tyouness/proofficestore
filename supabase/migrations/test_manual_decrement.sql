-- ============================================================
-- TEST MANUEL: Vérifier si la fonction de décrémentation fonctionne
-- ============================================================

-- 1️⃣ AVANT: Voir le stock actuel
SELECT slug, inventory FROM products WHERE slug = 'office-2019-professional-plus-dvd';

-- 2️⃣ APPELER LA FONCTION (décrémenter 1)
SELECT decrement_product_inventory('office-2019-professional-plus-dvd', 1);

-- 3️⃣ APRÈS: Voir le nouveau stock (devrait être 1 au lieu de 2)
SELECT slug, inventory FROM products WHERE slug = 'office-2019-professional-plus-dvd';
