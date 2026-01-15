# 🔧 Corrections Stripe & Supabase - Résumé des modifications

## 📋 Problèmes identifiés et corrigés

### ❌ Problème 1 : Échec du Checkout - URLs incorrectes
**Symptôme** : Erreur lors de `stripe.checkout.sessions.create`

**Cause** : Les URLs `success_url` et `cancel_url` pointaient vers `http://localhost:3000` au lieu de `https://www.allkeymasters.com`

**Solution** :
1. ✅ Ajout de la variable `NEXT_PUBLIC_SITE_URL=https://www.allkeymasters.com` dans `.env.local`
2. ✅ Mise à jour de [checkout.ts](frontend/src/actions/checkout.ts#L360-L361) pour utiliser `NEXT_PUBLIC_SITE_URL || NEXT_PUBLIC_APP_URL`

```typescript
// AVANT
success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancel`,

// APRÈS
success_url: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL}/checkout/cancel`,
```

---

### ❌ Problème 2 : Déconnexion automatique après retour de Stripe
**Symptôme** : L'utilisateur est déconnecté lors du retour de la page `/checkout/success`

**Cause** : 
- Pas de middleware Supabase pour rafraîchir la session
- Cookies non partagés entre `allkeymasters.com` et `www.allkeymasters.com`

**Solution** :
1. ✅ Création de [middleware.ts](frontend/src/middleware.ts) avec configuration SSR de Supabase
2. ✅ Configuration des cookies avec `domain: '.allkeymasters.com'` pour partager entre domaines
3. ✅ `sameSite: 'lax'` pour permettre les cookies lors des redirections externes (Stripe)

```typescript
// Configuration cookies dans middleware.ts
cookies: {
  setAll(cookiesToSet) {
    cookiesToSet.forEach(({ name, value, options }) => {
      supabaseResponse.cookies.set(name, value, {
        ...options,
        domain: process.env.NODE_ENV === 'production' 
          ? '.allkeymasters.com' // ✅ Cookies partagés entre www et domaine racine
          : undefined,
        sameSite: 'lax', // ✅ Permet redirections Stripe
        secure: process.env.NODE_ENV === 'production',
      });
    });
  },
}
```

---

### ❌ Problème 3 : Page de succès bloquée sur "Paiement en cours"
**Symptôme** : Le statut de la commande reste `pending` et n'est jamais mis à jour

**Cause** : Le webhook Stripe fonctionne correctement, mais potentiellement :
- Webhook pas configuré pour pointer vers l'URL de production
- `STRIPE_WEBHOOK_SECRET` manquant ou incorrect dans Vercel

**Solution** :
1. ✅ Documentation complète dans [VERCEL_CONFIG.md](VERCEL_CONFIG.md)
2. ✅ Instructions pour configurer le webhook Stripe en production :
   - URL endpoint : `https://www.allkeymasters.com/api/webhook/stripe`
   - Événements : `checkout.session.completed`, `charge.refunded`, etc.
3. ✅ Variable `STRIPE_WEBHOOK_SECRET` à configurer dans Vercel Dashboard

**Le code du webhook est déjà correct** :
- ✅ Validation de signature Stripe
- ✅ Mise à jour du statut de la commande à `paid`
- ✅ Attribution automatique des licences
- ✅ Idempotence (gestion des retries Stripe)

---

## 📦 Packages ajoutés

```bash
npm install @supabase/ssr
npm install @vercel/speed-insights
```

---

## 📁 Fichiers modifiés

### 1. Configuration
- ✅ `frontend/.env.local` - Ajout de `NEXT_PUBLIC_SITE_URL`
- ✅ `frontend/.env.production` - Template pour variables Vercel (référence)

### 2. Code source
- ✅ `frontend/src/middleware.ts` - **CRÉÉ** - Middleware Supabase SSR
- ✅ `frontend/src/actions/checkout.ts` - URLs Stripe mises à jour
- ✅ `frontend/src/app/layout.tsx` - Speed Insights ajouté

### 3. Documentation
- ✅ `VERCEL_CONFIG.md` - **CRÉÉ** - Guide complet configuration Vercel
- ✅ `CORRECTIONS_STRIPE.md` - **CE FICHIER** - Résumé des corrections

---

## 🚀 Étapes de déploiement

### 1. Pousser le code sur GitHub
```bash
git add .
git commit -m "fix: Correct Stripe URLs, add Supabase middleware, configure production variables"
git push origin main
```

### 2. Configurer les variables d'environnement dans Vercel
Allez dans **Vercel Dashboard** → **Votre projet** → **Settings** → **Environment Variables**

Ajoutez ces variables (voir [VERCEL_CONFIG.md](VERCEL_CONFIG.md) pour les valeurs) :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET` (⚠️ différent en prod, voir étape 3)
- `NEXT_PUBLIC_SITE_URL=https://www.allkeymasters.com`
- `NEXT_PUBLIC_APP_URL=https://www.allkeymasters.com`
- `RESEND_API_KEY`

### 3. Configurer le Webhook Stripe pour production
1. Dashboard Stripe → **Webhooks** → **Add endpoint**
2. URL : `https://www.allkeymasters.com/api/webhook/stripe`
3. Événements : 
   - `checkout.session.completed`
   - `charge.refunded`
   - `charge.dispute.created`
   - `charge.dispute.closed`
4. **Copier le Signing Secret** (commence par `whsec_`)
5. **Mettre à jour** `STRIPE_WEBHOOK_SECRET` dans Vercel avec cette nouvelle valeur

### 4. Vérifier la configuration du domaine
- ✅ `www.allkeymasters.com` configuré comme domaine principal
- ✅ Redirection de `allkeymasters.com` → `www.allkeymasters.com` active
- ✅ Root Directory configuré sur `frontend/`

---

## ✅ Checklist de test post-déploiement

### Test 1 : Checkout
- [ ] Ajouter un produit au panier
- [ ] Aller sur `/checkout`
- [ ] Remplir l'email et valider
- [ ] ✅ La redirection vers Stripe fonctionne
- [ ] ✅ L'URL contient `www.allkeymasters.com`

### Test 2 : Paiement
- [ ] Utiliser la carte test Stripe : `4242 4242 4242 4242`
- [ ] Compléter le paiement
- [ ] ✅ Redirection vers `/checkout/success`
- [ ] ✅ L'utilisateur est toujours connecté
- [ ] ✅ Le statut passe à "Paiement confirmé" (pas "Paiement en cours")

### Test 3 : Webhook
- [ ] Vérifier dans **Stripe Dashboard** → **Webhooks**
- [ ] ✅ L'événement `checkout.session.completed` a été reçu
- [ ] ✅ Le status HTTP est `200`
- [ ] ✅ Pas d'erreur dans les logs

### Test 4 : Commande & Licences
- [ ] Vérifier dans Supabase la table `orders`
- [ ] ✅ Le statut de la commande est `paid`
- [ ] ✅ `stripe_session_id` et `stripe_payment_intent` sont remplis
- [ ] Vérifier dans Supabase la table `licenses`
- [ ] ✅ Les licences sont attribuées (`is_used: true`, `order_id` rempli)

### Test 5 : Session persistante
- [ ] Se connecter sur le site
- [ ] Effectuer un paiement complet
- [ ] Après retour de Stripe, rafraîchir la page
- [ ] ✅ L'utilisateur est toujours connecté

---

## 🐛 Dépannage

### Erreur : "Checkout failed"
**Diagnostic** : Vérifier les logs Vercel Function pour `checkout`
- Variable `NEXT_PUBLIC_SITE_URL` manquante ou incorrecte
- URLs Stripe pointent vers `localhost`

### Erreur : "Paiement en cours" bloqué
**Diagnostic** : Vérifier Stripe Dashboard → Webhooks
- Webhook pas configuré
- `STRIPE_WEBHOOK_SECRET` incorrect
- Erreur 400/500 dans les logs du webhook

### Erreur : "Déconnecté après paiement"
**Diagnostic** : Vérifier le middleware
- `@supabase/ssr` pas installé
- Cookies `domain` mal configuré
- `sameSite` pas configuré à `lax`

---

## 📊 Logs à surveiller

### Logs Vercel (Functions)
```
Deployments → Cliquez sur déploiement → Function Logs
```
Rechercher :
- `[CHECKOUT]` - Logs de création de session
- `[WEBHOOK]` - Logs de traitement webhook
- `[MIDDLEWARE]` - Logs de session Supabase

### Logs Stripe
```
Dashboard → Developers → Webhooks → Cliquez sur endpoint
```
Vérifier :
- Status HTTP (doit être `200`)
- Nombre de retries (doit être `0`)
- Payload JSON reçu

### Logs Supabase
```
Dashboard → Logs → Postgres Logs
```
Vérifier :
- Insertions dans `orders`
- Updates dans `orders` (status → paid)
- Updates dans `licenses` (attribution)

---

## 📚 Documentation technique

### Architecture du flux de paiement

```
1. CLIENT (/checkout)
   └─> Server Action (createStripeCheckoutSession)
       ├─> Validation inputs
       ├─> Récupération produits Supabase
       ├─> Création commande (status: pending)
       └─> Création session Stripe
           └─> Redirection → stripe.com

2. STRIPE CHECKOUT
   └─> Paiement client
       └─> checkout.session.completed
           └─> Webhook → /api/webhook/stripe

3. WEBHOOK
   ├─> Validation signature Stripe
   ├─> Update commande (status: paid)
   ├─> Attribution licences
   └─> Emails (désactivés pour debug)

4. CLIENT (/checkout/success)
   ├─> Polling /api/orders/status
   └─> Affichage "Paiement confirmé"
```

### Variables d'environnement requises

| Variable | Où | Description |
|----------|-----|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Clé anon Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Clé admin Supabase (bypass RLS) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Public | Clé publique Stripe |
| `STRIPE_SECRET_KEY` | Secret | Clé secrète Stripe |
| `STRIPE_WEBHOOK_SECRET` | Secret | Secret webhook Stripe |
| `NEXT_PUBLIC_SITE_URL` | Public | **URL production** (www.allkeymasters.com) |
| `NEXT_PUBLIC_APP_URL` | Public | Fallback URL (même valeur que SITE_URL) |
| `RESEND_API_KEY` | Secret | Clé API Resend (emails) |

---

## ✅ Résultat attendu

Après déploiement et configuration correcte :

1. ✅ Le checkout redirige vers Stripe avec les bonnes URLs
2. ✅ L'utilisateur reste connecté après retour de Stripe
3. ✅ Le webhook met à jour le statut de la commande
4. ✅ Les licences sont attribuées automatiquement
5. ✅ La page de succès affiche "Paiement confirmé" en quelques secondes
6. ✅ Pas d'erreur dans les logs Vercel ou Stripe

---

## 🆘 Support

Si problème persiste :
1. Vérifier [VERCEL_CONFIG.md](VERCEL_CONFIG.md) pour la configuration complète
2. Consulter les logs Vercel, Stripe et Supabase
3. Tester avec la carte test Stripe : `4242 4242 4242 4242`
4. Vérifier que toutes les variables d'environnement sont configurées dans Vercel
