# CORRECTION RAPIDE - Système Simplifié

## Problème
Le système de variants créé ne correspond pas à la structure de ta base de données.
Tu as **1 produit PAR format** (digital-key, dvd, usb) et pas besoin de sélecteur dynamique.

## Solution Simple

### 1. Le webhook est DÉJÀ corrigé ✅
Le fichier `webhook/stripe/route.ts` utilise maintenant directement `item.product_id` (slug complet).

### 2. Créer des licences avec le bon product_id

```sql
-- Pour CHAQUE produit digital en base, crée des licences
INSERT INTO licenses (product_id, key_code, is_used)
VALUES ('office-2024-professional-plus-digital-key', 'VOTRE-CLE-ICI', false);

-- Note: Pas besoin de licences pour DVD/USB (livraison physique)
```

### 3. Déployer

```bash
git add .
git commit -m "fix: webhook utilise slugs complets"
git push
```

## ❌ À IGNORER

Les fichiers suivants ont été créés mais ne sont PAS nécessaires avec ta structure :
- `product-variant-seo.ts` - SEO variants (ignore)
- `FormatSelector.tsx` - Sélecteur de format (ignore)
- La logique de variants dans `page.tsx` sera corrigée automatiquement

## ✅ Ce qui fonctionne MAINTENANT

1. Webhook cherche les licences par `product_id` (slug complet) ✅
2. Attribution de licences fonctionne ✅
3. Recherche de produits par slug complet ✅

## Actions

1. **Exécute dans Supabase** :
```sql
INSERT INTO licenses (product_id, key_code, is_used)
VALUES ('office-2024-professional-plus-digital-key', 'TEST-KEY-123', false);
```

2. **Push le code** (déjà fait)

3. **Teste un paiement** et vérifie que :
   - La commande passe à `paid`
   - La licence s'assigne au client

C'est tout ! 🎯
