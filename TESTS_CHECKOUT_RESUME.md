# Tests Manuels - Correctif Checkout Resume

## Objectif
Tester le correctif du bug où l'utilisateur annule le paiement Stripe et obtient "Aucun produit trouvé" en retentant.

## Corrections apportées

### 1. API Route `/api/checkout/resume`
- **Fichier**: `frontend/src/app/api/checkout/resume/route.ts`
- **Fonction**: Permet de reprendre une session Stripe existante si elle est encore valide
- **Logique**:
  - Authentification obligatoire
  - Recalcule le `cart_hash` depuis le panier actuel
  - Cherche la dernière commande `pending` avec ce `cart_hash` (dernières 15 minutes)
  - Si session Stripe existe et est réutilisable (open + unpaid + < 30 min) → retourne l'URL
  - Sinon → retourne 409 avec `shouldRetry: true` (le client relance `/api/checkout`)

### 2. Page `/checkout/cancel` améliorée
- **Fichier**: `frontend/src/app/checkout/cancel/page.tsx`
- **Changements**:
  - Ajout du bouton "Reprendre le paiement" (primaire, noir)
  - Bouton "Retour au panier" (secondaire, blanc)
  - Bouton "Retour à l'accueil" (tertiaire, blanc)
  - Appel de `/api/checkout/resume` au clic sur "Reprendre le paiement"
  - Si session réutilisable → redirection vers Stripe
  - Si session expirée → redirection vers `/checkout` (création nouvelle session)

### 3. Migration automatique du panier
- **Fichier**: `frontend/src/context/CartContext.tsx`
- **Problème résolu**: Anciens paniers contenant des slugs longs (`windows-11-pro-digital-key`) au lieu de slugs courts (`windows-11-pro`)
- **Solution**: Au chargement du panier depuis localStorage:
  - Détecte les slugs longs (pattern: `-digital-key$`, `-dvd$`, `-usb$`)
  - Les convertit en slugs courts
  - Extrait le `format` depuis le suffixe si nécessaire
  - Sauvegarde automatiquement le panier migré
  - Logs de debug en console pour traçabilité

### 4. Logs de debug checkout
- **Fichier**: `frontend/src/actions/checkout.ts`
- **Ajout**: Logs de debug uniquement en développement pour afficher:
  - Si chaque `productId` est un UUID ou un slug
  - Type détecté pour chaque item du panier
  - Permet de diagnostiquer rapidement les problèmes de format

---

## Tests à effectuer

### Test A: Reprise de session Stripe valide
**Scénario**: L'utilisateur annule le paiement et le reprend immédiatement (< 30 min)

**Étapes**:
1. Ajouter un produit au panier (ex: Windows 11 Pro, format Digital)
2. Aller sur `/checkout`
3. Compléter l'email et cliquer sur "Procéder au paiement"
4. Sur la page Stripe Checkout, cliquer sur le bouton "Back" ou fermer la fenêtre
5. Vous arrivez sur `/checkout/cancel`
6. Cliquer sur le bouton **"Reprendre le paiement"** (bouton noir, primaire)

**Résultat attendu**:
- ✅ Redirection automatique vers la **même session Stripe** (URL identique)
- ✅ Panier pré-rempli sur Stripe
- ✅ Pas de nouvelle commande `pending` créée dans la base de données
- ✅ Toast "Création d'une nouvelle session..." ne s'affiche PAS

**Console attendue**:
```
[RESUME] 🔄 Demande de reprise de paiement
[RESUME] ✅ Utilisateur: [user_id]
[RESUME] 🛒 Items reçus: 1
[RESUME] 🔐 Cart hash: [hash]
[RESUME] ✅ Commande trouvée: [order_id]
[RESUME] 📊 Session Stripe: { id, status: 'open', payment_status: 'unpaid', url: true }
[RESUME] ✅ Session réutilisable, retour URL
[CANCEL] ✅ Session réutilisée, redirection
```

---

### Test B: Reprise après expiration de session
**Scénario**: L'utilisateur attend > 30 minutes avant de reprendre le paiement

**Étapes**:
1. Ajouter un produit au panier
2. Aller sur `/checkout` et procéder au paiement
3. Annuler sur Stripe (bouton "Back")
4. **ATTENDRE 31+ MINUTES** (ou modifier manuellement l'heure de création dans la base de données pour tester plus rapidement)
5. Sur `/checkout/cancel`, cliquer sur **"Reprendre le paiement"**

**Résultat attendu**:
- ✅ Toast affiché: "Création d'une nouvelle session de paiement..."
- ✅ Redirection automatique vers `/checkout`
- ✅ Page `/checkout` crée une **nouvelle session Stripe**
- ✅ Ancienne commande `pending` supprimée de la base de données

**Console attendue**:
```
[RESUME] ⏰ Session expirée/invalide
[CANCEL] 🔄 Session expirée, redirection vers nouveau checkout
[CHECKOUT] 🗑️ Ancienne commande supprimée, création d'une nouvelle
```

---

### Test C: Retour au panier après annulation
**Scénario**: L'utilisateur annule et veut modifier son panier avant de reprendre

**Étapes**:
1. Ajouter 2 produits au panier
2. Aller sur `/checkout` → Procéder au paiement
3. Annuler sur Stripe
4. Sur `/checkout/cancel`, cliquer sur **"Retour au panier"** (bouton blanc)

**Résultat attendu**:
- ✅ Redirection vers `/cart`
- ✅ Le panier contient toujours les 2 produits (aucun vidage automatique)
- ✅ Possibilité de modifier les quantités ou supprimer des items
- ✅ Ensuite, possibilité de relancer le checkout normalement

**Vérification panier**:
- Les produits affichés ont un `id` COURT (ex: `windows-11-pro`, PAS `windows-11-pro-digital-key`)
- Si vous aviez un ancien panier avec des slugs longs, vérifier la console:
  ```
  [CART] 🔄 Migration slug: windows-11-pro-digital-key
  [CART] ✅ Migration effectuée, sauvegarde...
  ```

---

### Test D: Vérification "Aucun produit trouvé" (bug principal)
**Scénario**: Reproduire le bug d'origine pour confirmer qu'il est corrigé

**Étapes**:
1. Vider le panier complètement (localStorage)
2. Ajouter un produit au panier
3. Aller sur `/checkout` → Procéder au paiement
4. Annuler sur Stripe
5. Sur `/checkout/cancel`, cliquer sur "Retour au panier"
6. Retourner sur `/checkout`
7. Procéder au paiement à nouveau

**Résultat attendu**:
- ❌ **BUG ANCIEN**: Toast "Aucun produit trouvé"
- ✅ **APRÈS CORRECTIF**: Création normale de la session Stripe, redirection vers Stripe Checkout

**Console attendue (développement uniquement)**:
```
[CHECKOUT] 🔍 Item debug: {
  productId: 'windows-11-pro',
  variant: 'digital',
  isUUID: false,
  isSlug: true,
  type: 'SLUG'
}
[CHECKOUT] 🔍 Recherche des produits avec slugs complets: ['windows-11-pro-digital-key']
[CHECKOUT] ✅ Produits trouvés: 1
```

---

### Test E: Migration panier legacy
**Scénario**: Tester la migration automatique d'un ancien panier

**Étapes**:
1. Ouvrir la console développeur (F12)
2. Dans l'onglet "Application" > "Local Storage"
3. Trouver la clé `allkeymasters_cart`
4. Modifier manuellement la valeur pour ajouter un ancien format:
   ```json
   [
     {
       "id": "windows-11-pro-digital-key",
       "title": "Windows 11 Pro",
       "price": 29.99,
       "format": "digital",
       "quantity": 1
     }
   ]
   ```
5. Rafraîchir la page (F5)

**Résultat attendu**:
- ✅ Console affiche:
  ```
  [CART] 🔄 Migration slug: windows-11-pro-digital-key
  [CART] ✅ Migration effectuée, sauvegarde...
  ```
- ✅ Le panier dans l'UI affiche toujours le produit
- ✅ Dans "Application" > "Local Storage", la clé `allkeymasters_cart` est maintenant:
  ```json
  [
    {
      "id": "windows-11-pro",
      "title": "Windows 11 Pro",
      "price": 29.99,
      "format": "digital",
      "quantity": 1
    }
  ]
  ```

---

## Vérifications base de données

### Après Test A (session réutilisée)
```sql
-- Vérifier qu'il n'y a qu'UNE SEULE commande pending pour l'utilisateur
SELECT id, user_id, status, stripe_session_id, created_at, cart_hash
FROM orders
WHERE user_id = 'afc3cd53-8661-4c31-91fe-28506a5175bd'
  AND status = 'pending'
ORDER BY created_at DESC;

-- Résultat attendu: 1 seule ligne (la session réutilisée)
```

### Après Test B (session expirée)
```sql
-- Vérifier que l'ancienne commande a été supprimée et une nouvelle créée
SELECT id, user_id, status, stripe_session_id, created_at, cart_hash
FROM orders
WHERE user_id = 'afc3cd53-8661-4c31-91fe-28506a5175bd'
  AND status = 'pending'
ORDER BY created_at DESC;

-- Résultat attendu: 1 seule ligne (nouvelle session, created_at récent)
```

---

## Checklist de régression

### Idempotence existante
- [ ] **Test**: Cliquer 5 fois rapidement sur "Procéder au paiement" sur `/checkout`
- [ ] **Attendu**: Pas de duplication de commande, redirection vers la même session Stripe
- [ ] **Base de données**: Une seule commande `pending` avec le même `cart_hash`

### Vidage du panier après paiement
- [ ] **Test**: Compléter un paiement Stripe jusqu'au bout (utiliser carte test `4242 4242 4242 4242`)
- [ ] **Attendu**: Webhook déclenché → Commande passe à `paid` → Panier vidé automatiquement
- [ ] **UI**: Panier vide après redirection vers `/checkout/success`

### Logs uniquement en développement
- [ ] **Test**: Construire en production (`npm run build`) et vérifier les logs
- [ ] **Attendu**: Les logs `[CHECKOUT] 🔍 Item debug:` ne s'affichent PAS en production
- [ ] **Vérifier**: `if (process.env.NODE_ENV === 'development')` dans `checkout.ts`

---

## Résolution des problèmes

### Erreur "Aucune session active" en continu
**Symptôme**: Même en cliquant rapidement sur "Reprendre le paiement", toast "Aucune session active"

**Diagnostic**:
1. Vérifier la console:
   - `[RESUME] ℹ️ Aucune commande pending récente trouvée`
   - OU `[RESUME] ℹ️ Pas de session Stripe attachée`
2. Vérifier la base de données:
   ```sql
   SELECT * FROM orders WHERE user_id = 'votre_user_id' AND status = 'pending';
   ```

**Solution**:
- Si aucune commande `pending`: Normal, cliquer sur "Retour au panier" puis relancer checkout
- Si commande existe mais pas de `stripe_session_id`: Bug dans le checkout initial → vérifier logs

### Migration panier ne fonctionne pas
**Symptôme**: Slugs longs restent après rafraîchissement

**Diagnostic**:
1. Console affiche-t-elle les logs de migration ?
2. localStorage a-t-il été modifié ?

**Solution**:
- Vider complètement le cache navigateur
- Supprimer manuellement la clé `allkeymasters_cart`
- Réajouter un produit au panier (sera au bon format)

---

## Notes techniques

### Durée de validité session Stripe
- **Création**: `expires_at` = maintenant + 1 heure
- **Réutilisation**: Session considérée valide si < 30 minutes (sécurité supplémentaire)
- **Statuts Stripe**:
  - `open` = session active, paiement non effectué
  - `complete` = paiement réussi
  - `expired` = session expirée (> 1h ou annulée côté Stripe)

### Cart Hash
- **Algorithme**: SHA256 de la représentation déterministe du panier
- **Format**: `productId:variant:quantity` trié alphabétiquement
- **Exemple**: `windows-11-pro:digital:1|office-2024-pro:usb:2` → hash unique
- **Utilité**: Idempotence - éviter les doublons de commande pour le même panier

### Slugs produits
- **Court** (panier): `windows-11-pro`, `office-2024-pro`
- **Long** (base de données): `windows-11-pro-digital-key`, `office-2024-pro-usb`
- **Construction**: `${shortSlug}-${variant}` où variant = `digital-key | dvd | usb`

---

## Résumé des fichiers modifiés

1. ✅ `frontend/src/app/api/checkout/resume/route.ts` - **CRÉÉ**
2. ✅ `frontend/src/app/checkout/cancel/page.tsx` - **MODIFIÉ**
3. ✅ `frontend/src/context/CartContext.tsx` - **MODIFIÉ** (migration)
4. ✅ `frontend/src/actions/checkout.ts` - **MODIFIÉ** (logs debug)

---

## Tests de non-régression

- [ ] Checkout normal fonctionne (ajout panier → checkout → paiement)
- [ ] Idempotence fonctionne (double-clic sur "Procéder au paiement")
- [ ] Webhook Stripe fonctionne (paiement → statut `paid` → licences assignées)
- [ ] Panier vidé après paiement réussi
- [ ] Migration panier legacy fonctionne
- [ ] Logs debug uniquement en développement

---

**Date**: 2026-01-16  
**Version**: Post-correctif checkout resume  
**Testeur**: [À compléter]
