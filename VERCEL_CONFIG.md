# 🚀 Configuration Vercel pour AllKeyMasters

## Variables d'environnement OBLIGATOIRES à configurer dans Vercel

Allez dans **Vercel Dashboard** → **Votre projet** → **Settings** → **Environment Variables**

### 1. Supabase (Base de données)

```bash
# ⚠️ Remplacez par vos vraies clés depuis Supabase Dashboard > Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon_supabase
SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_role_supabase
```

### 2. Stripe (Paiements)

```bash
# ⚠️ Remplacez par vos vraies clés depuis Stripe Dashboard
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_votre_cle_publique_stripe
STRIPE_SECRET_KEY=sk_test_votre_cle_secrete_stripe
STRIPE_WEBHOOK_SECRET=whsec_votre_webhook_secret_stripe
```

### 3. Application URLs

```bash
# ⚠️ CRITIQUE : URL de production (avec www)
NEXT_PUBLIC_SITE_URL=https://www.allkeymasters.com

# URL locale (pour développement uniquement, peut être omise en production)
NEXT_PUBLIC_APP_URL=https://www.allkeymasters.com
```

### 4. Resend (Emails)

```bash
# ⚠️ Remplacez par votre vraie clé depuis Resend Dashboard
RESEND_API_KEY=re_votre_cle_resend
```

---

## ⚠️ IMPORTANT : Configuration du Webhook Stripe pour Production

### Étape 1 : Configurer l'endpoint Webhook dans Stripe Dashboard

1. Allez sur **https://dashboard.stripe.com/test/webhooks**
2. Cliquez sur **"Add endpoint"**
3. URL de l'endpoint : `https://www.allkeymasters.com/api/webhook/stripe`
4. Événements à écouter :
   - `checkout.session.completed`
   - `charge.refunded`
   - `charge.dispute.created`
   - `charge.dispute.closed`
5. Cliquez sur **"Add endpoint"**
6. Copiez le **Signing secret** (commence par `whsec_`)
7. Mettez à jour la variable `STRIPE_WEBHOOK_SECRET` dans Vercel avec cette nouvelle valeur

### Étape 2 : Vérifier la configuration du domaine

Dans **Vercel Dashboard** → **Settings** → **Domains**, assurez-vous que :
- ✅ `www.allkeymasters.com` est configuré comme domaine principal
- ✅ La redirection de `allkeymasters.com` vers `www.allkeymasters.com` est active

### Étape 3 : Tester le webhook

1. Effectuez un paiement test sur votre site en production
2. Vérifiez dans **Stripe Dashboard** → **Webhooks** que l'événement a été reçu
3. Si le webhook échoue, vérifiez :
   - L'URL de l'endpoint est correcte
   - Le `STRIPE_WEBHOOK_SECRET` est à jour
   - Les logs Vercel pour voir les erreurs

---

## 🔍 Diagnostic des problèmes courants

### Problème : "Échec du checkout"

**Cause** : Les URLs de redirection Stripe pointent vers `localhost` au lieu de `www.allkeymasters.com`

**Solution** : Vérifiez que `NEXT_PUBLIC_SITE_URL=https://www.allkeymasters.com` est bien configuré dans Vercel

### Problème : "Déconnexion après retour de Stripe"

**Cause** : Les cookies Supabase ne sont pas partagés entre le domaine racine et le sous-domaine `www`

**Solution** : Le middleware `src/middleware.ts` configure maintenant les cookies avec `domain: '.allkeymasters.com'` pour résoudre ce problème

### Problème : "Paiement en cours" bloqué sur la page de succès

**Cause** : Le webhook Stripe n'a pas été reçu ou a échoué

**Solution** :
1. Vérifiez que l'endpoint webhook est configuré dans Stripe Dashboard
2. Vérifiez que le `STRIPE_WEBHOOK_SECRET` est correct
3. Consultez les logs Vercel pour voir les erreurs du webhook

---

## 📁 Structure du projet dans Vercel

```
Root Directory: frontend/
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

**⚠️ IMPORTANT** : Le dossier racine du projet doit être configuré sur `frontend/` car le code est dans un sous-dossier.

Pour configurer cela :
1. Allez dans **Vercel Dashboard** → **Settings** → **General**
2. Section **Build & Development Settings**
3. **Root Directory** : `frontend`
4. Cliquez sur **Save**

---

## ✅ Checklist de déploiement

Avant de pousser sur GitHub :

- [ ] Toutes les variables d'environnement sont configurées dans Vercel
- [ ] `NEXT_PUBLIC_SITE_URL=https://www.allkeymasters.com` est défini
- [ ] Le domaine `www.allkeymasters.com` est configuré dans Vercel
- [ ] L'endpoint webhook Stripe pointe vers `https://www.allkeymasters.com/api/webhook/stripe`
- [ ] Le `STRIPE_WEBHOOK_SECRET` de production est configuré
- [ ] Le dossier racine est configuré sur `frontend/`

Après le déploiement :

- [ ] Tester un paiement en mode test
- [ ] Vérifier que le webhook est reçu dans Stripe Dashboard
- [ ] Vérifier que l'utilisateur reste connecté après retour de Stripe
- [ ] Vérifier que le statut de la commande passe à "paid"
- [ ] Vérifier que les licences sont attribuées correctement

---

## 🆘 Support

Si vous rencontrez des problèmes :
1. Consultez les logs Vercel : **Deployments** → Cliquez sur le déploiement → **Function Logs**
2. Consultez les logs Stripe : **Dashboard** → **Developers** → **Webhooks** → Cliquez sur l'endpoint
3. Vérifiez les logs de la fonction Supabase (si applicable)
