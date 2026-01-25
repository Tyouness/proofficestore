# 🚀 Guide d'Installation - Système de Gestion de Stock

## Étape 1 : Exécuter la Migration SQL

1. Connectez-vous à votre projet Supabase : https://supabase.com
2. Allez dans l'onglet **SQL Editor**
3. Copiez le contenu du fichier `supabase/migrations/add_inventory_management.sql`
4. Collez-le dans l'éditeur SQL
5. Cliquez sur **Run** pour exécuter la migration

## Étape 2 : Vérifier les Tables

Dans l'éditeur SQL, exécutez :

```sql
-- Vérifier que la colonne inventory existe
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name = 'inventory';

-- Vérifier que la table stock_requests existe
SELECT * FROM stock_requests LIMIT 1;

-- Vérifier que la vue existe
SELECT * FROM stock_requests_with_product LIMIT 1;
```

## Étape 3 : Initialiser l'Inventaire (Optionnel)

Si vous souhaitez mettre tous les produits en stock par défaut :

```sql
UPDATE products 
SET inventory = 999 
WHERE inventory IS NULL OR inventory = 0;
```

## Étape 4 : Tester le Frontend

1. **Redémarrer le serveur Next.js** :
   ```bash
   cd frontend
   npm run dev
   ```

2. **Tester une page produit** :
   - Visitez `http://localhost:3000/produit/[un-slug-produit]`
   - Vérifiez que le bouton "Ajouter au panier" s'affiche normalement

3. **Tester la rupture de stock** :
   - Allez sur `http://localhost:3000/admin/inventory`
   - Mettez un produit à 0 (bouton "Rupture")
   - Visitez la page de ce produit
   - ✅ Le formulaire de demande doit apparaître

4. **Tester une demande** :
   - Remplissez le formulaire avec votre email + quantité
   - Cliquez sur "Vérifier la disponibilité sous 1h"
   - ✅ Vous devriez voir un toast de succès

5. **Voir la demande dans l'admin** :
   - Allez sur `http://localhost:3000/admin/stock-requests`
   - ✅ Votre demande doit apparaître dans la liste

## Étape 5 : Tester la Sécurité

### Test Honeypot (Anti-Bot)

Ouvrez la console navigateur et exécutez :

```javascript
// Simuler un bot qui remplit le champ caché
const form = document.querySelector('form');
const honeypot = document.createElement('input');
honeypot.name = 'contact';
honeypot.value = 'bot@test.com'; // Bot détecté
form.appendChild(honeypot);
```

✅ La demande devrait être "acceptée" silencieusement sans être enregistrée.

### Test Rate Limiting

1. Soumettez 3 demandes rapides pour le même produit avec le même email
2. ✅ La 4ème demande doit être bloquée avec un message d'erreur

### Test Validation Email

Essayez des emails invalides :
- `test` (pas de @)
- `test@tempmail.com` (domaine jetable bloqué)
- `test@` (domaine manquant)

✅ Tous doivent être rejetés avec un message d'erreur

## Étape 6 : Configuration Production

### Variables d'Environnement

Assurez-vous que ces variables sont configurées dans `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Déploiement Vercel

Si vous déployez sur Vercel :

1. Ajoutez les variables d'environnement dans les Settings
2. Redéployez l'application
3. Vérifiez que tout fonctionne en production

## 🐛 Dépannage

### Erreur : "Column inventory does not exist"

**Solution** : La migration SQL n'a pas été exécutée.
- Retournez à l'étape 1 et exécutez la migration.

### Erreur : "Table stock_requests does not exist"

**Solution** : Même chose que ci-dessus.

### Le formulaire de demande n'apparaît pas

**Vérifications** :
1. Le produit a-t-il bien `inventory = 0` ?
   ```sql
   SELECT slug, name, inventory FROM products WHERE slug = 'votre-slug';
   ```
2. Le composant ProductActions reçoit-il la prop `inventory` ?
   - Vérifiez que la requête dans `page.tsx` sélectionne bien le champ `inventory`

### Les demandes ne s'enregistrent pas

**Vérifications** :
1. Les politiques RLS sont-elles actives ?
   ```sql
   SELECT tablename, policyname, permissive, roles, cmd 
   FROM pg_policies 
   WHERE tablename = 'stock_requests';
   ```
2. La console navigateur montre-t-elle des erreurs ?

### Accès refusé dans l'admin

**Solution** : Vérifiez que votre compte a le rôle `admin` :
```sql
SELECT id, email, role FROM profiles WHERE email = 'votre-email@admin.com';
```

Si le rôle est NULL ou 'user', mettez-le à jour :
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'votre-email@admin.com';
```

## ✅ Checklist Finale

- [ ] Migration SQL exécutée avec succès
- [ ] Colonne `inventory` existe sur la table `products`
- [ ] Table `stock_requests` créée
- [ ] Vue `stock_requests_with_product` créée
- [ ] Formulaire de demande s'affiche quand stock = 0
- [ ] Bouton normal s'affiche quand stock > 0
- [ ] Demande enregistrée dans la base de données
- [ ] Page `/admin/stock-requests` accessible et fonctionnelle
- [ ] Page `/admin/inventory` accessible et fonctionnelle
- [ ] Protection honeypot fonctionne
- [ ] Rate limiting fonctionne
- [ ] Validation email fonctionne

## 🎉 Félicitations !

Votre système de gestion de stock avec capture de leads est opérationnel !

**Prochaines étapes** :
1. Configurez l'envoi d'emails automatiques (optionnel)
2. Ajoutez des notifications Slack/Discord (optionnel)
3. Analysez les produits les plus demandés pour optimiser le stock

---

**Support** : Si vous rencontrez un problème, vérifiez d'abord les logs serveur et la console navigateur.
