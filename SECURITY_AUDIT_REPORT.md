# 🔒 AUDIT DE SÉCURITÉ - AllKeyMasters E-Commerce
**Date**: 16 Janvier 2026  
**Auditeur**: Senior Security Engineer (OWASP ASVS)  
**Périmètre**: Next.js 15 App Router + Supabase + Stripe

---

## 📋 RÉSUMÉ EXÉCUTIF

**Vulnérabilités identifiées**: 23  
- **Critiques**: 4  
- **Élevées**: 8  
- **Moyennes**: 7  
- **Faibles**: 4

**Score global**: 6.2/10 (MOYEN)

---

## 🚨 FINDINGS CRITIQUES

### [CRIT-01] Absence totale de Rate Limiting
**Fichiers concernés**: TOUTES les API routes  
**Gravité**: ⚠️ **CRITIQUE**  
**Impact**: DoS, brute force auth, spam, abus ressources  
**Statut**: ❌ Aucune protection détectée

**Routes vulnérables**:
- `/api/checkout/route.ts` - Pas de limite sur création commandes
- `/api/admin/reviews/delete/route.ts` - Spam possible
- `/api/auth/*` - Brute force login (si endpoints existent)
- `/api/webhook/stripe/route.ts` - Risque de saturation

**Preuve**:
```typescript
// api/checkout/route.ts ligne 62
export async function POST(request: NextRequest) {
  // ❌ AUCUNE vérification rate limit
  try {
    const body: CheckoutRequestBody = await request.json();
    // ...
```

---

### [CRIT-02] Validation d'entrées manquante ou faible
**Fichiers concernés**: Multiple routes API  
**Gravité**: ⚠️ **CRITIQUE**  
**Impact**: Injection, XSS stored, data corruption  
**Statut**: ❌ Validation partielle uniquement

**Problèmes détectés**:

1. **`/api/admin/reviews/delete`** (ligne 33):
```typescript
const { reviewId } = await request.json();
if (!reviewId) { // ❌ Validation minimale
  return NextResponse.json({ error: 'reviewId manquant' }, { status: 400 });
}
// ❌ Pas de validation UUID format
// ❌ Pas de length check
// ❌ Pas de sanitization
```

2. **`/api/checkout/route.ts`** (ligne 120):
```typescript
if (!items || !Array.isArray(items) || items.length === 0) {
  // ✅ Basic check mais...
}
// ❌ Pas de validation stricte des types
// ❌ Pas de max length sur arrays
// ❌ Pas de sanitization des IDs produits
```

3. **`/actions/checkout.ts`** a une meilleure validation mais:
```typescript
// ❌ Pas de Zod schema
// ❌ Validation manuelle sujette à erreurs
// ❌ Pas de strip des champs inconnus
```

---

### [CRIT-03] Secrets exposés en variables d'environnement non validées
**Fichiers concernés**: Multiples  
**Gravité**: ⚠️ **CRITIQUE**  
**Impact**: App crash silencieux, secrets undefined en runtime  
**Statut**: ❌ Aucune validation au démarrage

**Preuves**:
```typescript
// api/webhook/stripe/route.ts ligne 24
const resend = new Resend(process.env.RESEND_API_KEY); 
// ❌ Peut être undefined silencieusement

// middleware.ts ligne 17
process.env.NEXT_PUBLIC_SUPABASE_URL! // ❌ ! force cast dangereux
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ❌ Aucun fichier env.ts pour validation Zod
```

---

### [CRIT-04] Headers HTTP de sécurité absents
**Fichiers concernés**: `next.config.ts`, middleware  
**Gravité**: ⚠️ **CRITIQUE**  
**Impact**: XSS, clickjacking, MIME sniffing, info disclosure  
**Statut**: ❌ Aucun header sécurité configuré

**Headers manquants**:
- ❌ Content-Security-Policy
- ❌ X-Content-Type-Options
- ❌ X-Frame-Options
- ❌ Referrer-Policy
- ❌ Permissions-Policy
- ❌ HSTS (Strict-Transport-Security)

---

## 🔴 FINDINGS ÉLEVÉS

### [HIGH-01] Webhook Stripe sans body size limit
**Fichier**: `/api/webhook/stripe/route.ts`  
**Gravité**: 🔴 **ÉLEVÉE**  
**Impact**: DoS via payload géant

```typescript
// ligne 24
const rawBody = await req.text();
// ❌ Pas de limite de taille
// ❌ Un attaquant peut envoyer 100MB
```

---

### [HIGH-02] CSRF protection non vérifiée
**Fichiers**: Toutes les mutations (POST/PUT/DELETE)  
**Gravité**: 🔴 **ÉLEVÉE**  
**Impact**: Actions non autorisées

Next.js App Router a un CSRF protection partiel via cookies SameSite mais:
- ❌ Pas de tokens CSRF explicites
- ❌ Cookies configurés en `sameSite: 'lax'` (middleware.ts:36) - vulnérable aux GET CSRF

---

### [HIGH-03] Erreurs verbales exposant des détails internes
**Fichiers**: Multiples  
**Gravité**: 🔴 **ÉLEVÉE**  
**Impact**: Information disclosure

**Exemples**:
```typescript
// api/checkout/route.ts ligne 158
console.error('[CHECKOUT] Erreur fetch produit:', prodError);
// ❌ Logs stack traces en production potentiellement

// api/admin/reviews/delete ligne 48
console.error('[ADMIN] Delete review error:', error);
// ❌ Erreur Supabase loggée complète
```

---

### [HIGH-04] Aucune protection contre les requêtes concurrentes
**Fichier**: `/api/checkout/route.ts`  
**Gravité**: 🔴 **ÉLEVÉE**  
**Impact**: Double paiement possible

L'idempotence via `cart_hash` existe MAIS:
```typescript
// ligne 140-150
const { data: existingOrders } = await supabase
  .from('orders')
  .select('id, stripe_session_id')
  .eq('cart_hash', cartHash)
  // ❌ Race condition possible si 2 requêtes simultanées
  // ❌ Pas de lock DB
```

---

### [HIGH-05] Logs contenant potentiellement des PII
**Fichiers**: Multiples  
**Gravité**: 🔴 **ÉLEVÉE**  
**Impact**: RGPD violation

```typescript
// api/webhook/stripe/route.ts ligne 34
console.log('[WEBHOOK] ✅ Signature valide - Type:', event.type);
// ❌ event peut contenir email, nom, etc.

// api/checkout/route.ts ligne 73
const authCookie = cookieStore.get('sb-hzptzuljmexfflefxwqy-auth-token');
// ❌ Cookie contient token JWT - ne pas logger
```

---

### [HIGH-06] Cookie auth hardcodé avec nom spécifique
**Fichier**: `/api/checkout/route.ts` ligne 73  
**Gravité**: 🔴 **ÉLEVÉE**  
**Impact**: Breaking change si Supabase change nom cookie

```typescript
const authCookie = cookieStore.get('sb-hzptzuljmexfflefxwqy-auth-token');
// ❌ Nom hardcodé projet-spécifique
// ✅ DEVRAIT utiliser createServerClient uniformément
```

---

### [HIGH-07] Pas de limite sur longueur des commentaires reviews
**Fichier**: Schéma DB reviews (déduit)  
**Gravité**: 🔴 **ÉLEVÉE**  
**Impact**: Storage DoS

```typescript
// Aucune validation trouvée pour:
// - comment.length max
// - Sanitization HTML
```

---

### [HIGH-08] Absence de CORS strict
**Fichiers**: API routes  
**Gravité**: 🔴 **ÉLEVÉE**  
**Impact**: Requêtes cross-origin non autorisées

❌ Aucune configuration CORS détectée dans:
- `next.config.ts`
- Middleware
- Headers API routes

---

## 🟠 FINDINGS MOYENS

### [MED-01] Pas de timeout sur requêtes externes
**Fichier**: `/api/checkout/route.ts`, `/api/webhook/stripe/route.ts`  
**Gravité**: 🟠 **MOYENNE**  
**Impact**: Hang requests

```typescript
// Appels Stripe sans timeout
await stripe.checkout.sessions.create({ ... });
```

---

### [MED-02] Sanitization HTML absente
**Fichiers**: ReviewForm, comments display  
**Gravité**: 🟠 **MOYENNE**  
**Impact**: XSS stored

❌ Aucun `DOMPurify` détecté
❌ Pas de liste allowlist tags HTML

---

### [MED-03] Email validation regex faible
**Fichier**: `/actions/checkout.ts` ligne 44  
**Gravité**: 🟠 **MOYENNE**

```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// ⚠️ Accepte: test@test@test.com
// ⚠️ Pas de validation TLD
```

---

### [MED-04] Pas de detection d'emails jetables
**Fichier**: `/actions/checkout.ts`  
**Gravité**: 🟠 **MOYENNE**  
**Impact**: Spam, fraude

❌ Accepte: `user@tempmail.com`, `user@guerrillamail.com`

---

### [MED-05] Absence de journalisation centralisée
**Fichiers**: Tous  
**Gravité**: 🟠 **MOYENNE**  
**Impact**: Debugging difficile, pas d'audit trail

❌ console.log/error utilisés partout
✅ DEVRAIT: Winston, Pino, ou Datadog

---

### [MED-06] Pas de monitoring erreurs
**Fichiers**: Tous  
**Gravité**: 🟠 **MOYENNE**

❌ Pas de Sentry
❌ Pas d'alerting
❌ Erreurs silencieuses possibles

---

### [MED-07] Dépendances non auditées
**Fichier**: `package.json` (non lu)  
**Gravité**: 🟠 **MOYENNE**

⚠️ À vérifier: `npm audit`, versions obsolètes

---

## 🟡 FINDINGS FAIBLES

### [LOW-01] Console.log en production
**Fichiers**: Multiples  
**Gravité**: 🟡 **FAIBLE**

Tous les `console.log` seront visibles en production

---

### [LOW-02] Pas de health check endpoint
**Gravité**: 🟡 **FAIBLE**

❌ `/api/health` manquant

---

### [LOW-03] Commentaires de code verbeux
**Gravité**: 🟡 **FAIBLE**

Trop de commentaires exposent la logique interne

---

### [LOW-04] Pas de version API
**Gravité**: 🟡 **FAIBLE**

Routes `/api/v1/...` préférables

---

## ✅ POINTS POSITIFS

1. ✅ **Supabase RLS activé** (déduit usage)
2. ✅ **Query builder Supabase** (pas de SQL raw)
3. ✅ **Idempotence checkout** (cart_hash)
4. ✅ **Validation signature Stripe** (webhook)
5. ✅ **Soft delete reviews** (is_deleted)
6. ✅ **Admin role check** (user_roles table)
7. ✅ **Service role côté serveur uniquement**
8. ✅ **HTTPS enforced** (déduit production config)

---

## 📊 STATISTIQUES

| Catégorie | Trouvées | Corrigées | Reste |
|-----------|---------|-----------|-------|
| Critiques | 4 | 0 | 4 |
| Élevées | 8 | 0 | 8 |
| Moyennes | 7 | 0 | 7 |
| Faibles | 4 | 0 | 4 |
| **TOTAL** | **23** | **0** | **23** |

---

## 🎯 PLAN DE CORRECTION (Ordre de priorité)

### Phase 1 - Critiques (Urgent - 1-2 jours)
1. Implémenter Rate Limiting (Upstash Redis)
2. Ajouter validation Zod stricte toutes routes
3. Créer `lib/env.ts` avec validation Zod
4. Configurer headers HTTP sécurité

### Phase 2 - Élevés (Important - 3-4 jours)
5. Ajouter body size limits
6. Implémenter CSRF tokens explicites
7. Centraliser gestion erreurs
8. Fix logs PII
9. Ajouter CORS strict
10. Sanitization HTML (DOMPurify)

### Phase 3 - Moyens (Normal - 1 semaine)
11. Timeouts requêtes externes
12. Email validation stricte + blocklist
13. Logging centralisé (Pino)
14. Monitoring (Sentry)

### Phase 4 - Faibles (Optionnel)
15. Supprimer console.log prod
16. Health check endpoint
17. Nettoyer commentaires
18. Versioning API

---

**FICHIERS SUIVANTS** contiendront les corrections réelles de code.
