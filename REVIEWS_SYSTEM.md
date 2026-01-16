# Système d'avis produits - Documentation

## 📋 Vue d'ensemble

Système complet d'avis clients avec :
- ✅ Validation stricte : uniquement après achat vérifié
- ✅ RLS Supabase : sécurité au niveau base de données
- ✅ 1 avis par produit par commande (contrainte unique)
- ✅ JSON-LD enrichi avec aggregateRating réel
- ✅ Interface dans /account (formulaire) et /produit/[slug] (affichage)

## 🚀 Installation

### 1. Exécuter la migration SQL

**Option A : Via Supabase Dashboard (recommandé)**

1. Ouvrez votre projet Supabase
2. Allez dans `SQL Editor`
3. Créez une nouvelle query
4. Copiez-collez le contenu de `supabase/migrations/create_reviews_table.sql`
5. Exécutez la query (Run)

**Option B : Via CLI Supabase**

```bash
cd supabase
supabase migration up
```

### 2. Vérifier la table et les policies

Après migration, vérifiez :

```sql
-- Table créée ?
SELECT * FROM public.reviews LIMIT 1;

-- RLS activé ?
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename = 'reviews';

-- Policies créées ?
SELECT policyname FROM pg_policies 
WHERE tablename = 'reviews';
```

Vous devriez voir 4 policies :
- `Les avis sont visibles par tous`
- `Les utilisateurs peuvent créer un avis pour leur achat`
- `Les utilisateurs peuvent modifier leur avis`
- `Les utilisateurs peuvent supprimer leur avis`

## 📁 Structure des fichiers

```
frontend/src/
├── app/
│   ├── account/
│   │   ├── page.tsx              # Page compte (modifiée pour avis)
│   │   └── ReviewForm.tsx         # Composant formulaire avis (NOUVEAU)
│   └── produit/
│       └── [slug]/
│           └── page.tsx           # Page produit (modifiée pour affichage avis)
│
supabase/migrations/
└── create_reviews_table.sql       # Migration SQL (NOUVEAU)
```

## 🎯 Fonctionnement

### Pour l'utilisateur

1. **Achat** → L'utilisateur achète un produit (commande payée)
2. **Réception** → Il reçoit sa licence dans `/account`
3. **Notation** → Bouton "Noter ce produit" apparaît sous chaque licence
4. **Formulaire** → Il donne une note (1-5 étoiles) + commentaire optionnel
5. **Validation** → L'avis est envoyé et s'affiche sur la page produit
6. **Confirmation** → Badge "Merci, avis envoyé" + impossibilité de re-noter

### Côté technique

**RLS INSERT Policy :**
```sql
-- L'utilisateur peut insérer un avis SEULEMENT SI :
auth.uid() = user_id                    -- Il est connecté
AND EXISTS (                            
  SELECT 1 FROM orders 
  WHERE id = order_id 
    AND user_id = auth.uid() 
    AND status = 'paid'                 -- La commande est payée
)
AND EXISTS (
  SELECT 1 FROM order_items 
  WHERE order_id = order_id 
    AND product_id = product_id         -- Le produit fait partie de la commande
)
```

**Contrainte unique :**
```sql
UNIQUE (user_id, product_id, order_id)
-- Empêche de noter 2 fois le même produit dans la même commande
```

## 🔒 Sécurité

### Ce qui EST possible :
- ✅ Lire tous les avis (lecture publique)
- ✅ Créer un avis après achat vérifié
- ✅ Modifier/supprimer son propre avis

### Ce qui N'EST PAS possible :
- ❌ Créer un avis sans avoir acheté le produit
- ❌ Créer 2 avis pour le même produit/commande
- ❌ Modifier/supprimer l'avis d'un autre utilisateur
- ❌ Bypass avec service_role (pas utilisé côté client)

## 📊 JSON-LD SEO

Le schema Product est automatiquement enrichi avec `aggregateRating` et `review` si des avis existent :

```json
{
  "@type": "Product",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.6",
    "reviewCount": 12
  },
  "review": [
    {
      "@type": "Review",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "5"
      },
      "author": {
        "@type": "Person",
        "name": "Client vérifié"
      },
      "reviewBody": "Excellent produit !",
      "datePublished": "2026-01-15T10:30:00Z"
    }
  ]
}
```

Si aucun avis, `aggregateRating` et `review` ne sont PAS inclus (pas de fake data).

## 🧪 Tests

### Test 1 : Créer un avis valide

1. Connectez-vous avec un compte ayant une commande payée
2. Allez dans `/account`
3. Sous une licence, cliquez "Noter ce produit"
4. Donnez une note et un commentaire
5. Envoyez → L'avis apparaît immédiatement avec badge "Merci, avis envoyé"

### Test 2 : Tentative de double avis

1. Essayez de re-noter le même produit de la même commande
2. Résultat attendu : "Vous avez déjà noté ce produit pour cette commande"

### Test 3 : Affichage sur page produit

1. Allez sur la page du produit noté
2. Scrollez vers "Avis Clients"
3. Vérifiez que votre avis apparaît avec :
   - Étoiles correctes
   - Commentaire affiché
   - Auteur "Client vérifié"
   - Date de publication

### Test 4 : JSON-LD

1. Inspectez le code source de la page produit
2. Cherchez `<script type="application/ld+json">`
3. Vérifiez la présence de `aggregateRating` et `review`

## 🐛 Dépannage

### Le bouton "Noter ce produit" n'apparaît pas

**Vérifications :**
- La commande est-elle payée (`status = 'paid'`) ?
- La licence est-elle attribuée (`licenses.is_used = true`) ?
- L'avis existe-t-il déjà pour ce produit/commande ?

**Debug SQL :**
```sql
SELECT 
  o.id as order_id,
  o.status,
  oi.product_id,
  l.key_code,
  r.id as review_id
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
LEFT JOIN licenses l ON l.order_id = o.id AND l.product_id = oi.product_id
LEFT JOIN reviews r ON r.order_id = o.id AND r.product_id = oi.product_id
WHERE o.user_id = 'YOUR_USER_ID';
```

### Erreur "Vous avez déjà noté ce produit"

C'est normal : la contrainte unique empêche les doublons. L'utilisateur a déjà noté ce produit pour cette commande.

### Les avis ne s'affichent pas sur la page produit

**Vérifications :**
- La table `reviews` contient-elle des avis pour ce produit ?
- Le RLS SELECT est-il actif et public ?

**Debug SQL :**
```sql
SELECT * FROM reviews WHERE product_id = 'PRODUCT_ID';
```

## 📝 Notes importantes

1. **Pas de service_role côté client** : Toutes les opérations utilisent le client Supabase standard avec RLS.

2. **Anonymisation** : Les avis affichent "Client vérifié" au lieu de l'email/nom réel de l'utilisateur.

3. **Pas de pagination côté serveur** : Limite de 10 avis récents. Pour plus, ajouter un système "Afficher plus" côté client.

4. **Pas de modération** : Les avis sont publiés immédiatement. Pour modération, ajouter un champ `approved` avec policy UPDATE admin.

5. **Modificable** : L'utilisateur peut modifier/supprimer son avis via les policies UPDATE/DELETE (fonctionnalité UI à ajouter si besoin).
