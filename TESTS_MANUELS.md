# TESTS MANUELS - Corrections Sécurité

## TEST 1: Rate Limiting Fail-Closed (Auth/Write)

**Objectif**: Vérifier que les routes critiques sont bloquées si Redis down

```bash
# 1. Sans Redis configuré (.env sans UPSTASH_REDIS_REST_URL)
# 2. En mode production (NODE_ENV=production)
# 3. Test route write (/api/checkout)

curl -X POST http://localhost:3000/api/checkout \
  -H "Content-Type: application/json" \
  -d '{"items":[]}' \
  -v

# ATTENDU: 429 Too Many Requests avec Retry-After: 60
# (fail-closed car config='write' et NODE_ENV='production')
```

---

## TEST 2: Body Size Limit Webhook (Bytes)

**Objectif**: Vérifier limite 1MB en bytes (pas chars)

```bash
# Générer payload 2MB (doit échouer)
dd if=/dev/zero bs=1M count=2 2>/dev/null | base64 | \
curl -X POST http://localhost:3000/api/webhook/stripe \
  -H "Content-Type: application/json" \
  -H "stripe-signature: fake" \
  --data-binary @- \
  -w "\nHTTP Status: %{http_code}\n"

# ATTENDU: HTTP 413 Payload Too Large

# Payload 500KB (doit passer validation taille, échouer signature)
dd if=/dev/zero bs=512K count=1 2>/dev/null | base64 | \
curl -X POST http://localhost:3000/api/webhook/stripe \
  -H "Content-Type: application/json" \
  -H "stripe-signature: fake" \
  --data-binary @- \
  -w "\nHTTP Status: %{http_code}\n"

# ATTENDU: HTTP 400 (signature invalide, mais taille OK)
```

---

## TEST 3: Webhook Idempotence (event.id)

**Objectif**: Envoyer 2x le même event Stripe → pas de double traitement

### Étapes:
1. Configurer Stripe CLI webhook local:
```bash
stripe listen --forward-to localhost:3000/api/webhook/stripe
```

2. Déclencher événement test:
```bash
stripe trigger checkout.session.completed
```

3. Copier l'event.id depuis les logs

4. Rejouer le même event (simuler retry Stripe):
```bash
# Récupérer l'event
stripe events retrieve evt_xxx...

# Le renvoyer manuellement (POST avec même event.id)
```

**ATTENDU**:
- 1ère requête: `{ received: true, status: "processed", licenses_assigned: X }`
- 2ème requête: `{ received: true, cached: true }` (idempotence)
- DB `stripe_webhook_events`: 1 seule ligne avec event_id

---

## TEST 4: Attribution Licences Atomique (Concurrence)

**Objectif**: 2 webhooks simultanés ne peuvent pas assigner la même licence

### Setup:
1. Créer produit avec exactement 5 licences en stock
2. Créer 2 commandes de 3 licences chacune

### Test:
```bash
# Terminal 1: Webhook commande A (3 licences)
curl -X POST http://localhost:3000/api/webhook/stripe \
  -H "stripe-signature: ..." \
  -d @webhook_order_a.json &

# Terminal 2: Webhook commande B (3 licences) - SIMULTANÉ
curl -X POST http://localhost:3000/api/webhook/stripe \
  -H "stripe-signature: ..." \
  -d @webhook_order_b.json &
```

**ATTENDU**:
- Commande A: 3 licences assignées ✅
- Commande B: Stock insuffisant ❌ (seules 2 licences restantes)
- **AUCUNE** licence assignée à 2 commandes simultanément
- Vérification DB:
  ```sql
  SELECT order_id, COUNT(*) 
  FROM licenses 
  WHERE is_used = true 
  GROUP BY order_id;
  -- Aucun doublon possible grâce à FOR UPDATE SKIP LOCKED
  ```

---

## TEST 5: CSP Headers Prod vs Dev

**Objectif**: unsafe-eval absent en production

### Dev:
```bash
NODE_ENV=development npm run dev
curl -I http://localhost:3000/ | grep Content-Security-Policy
```
**ATTENDU**: `script-src ... 'unsafe-eval' ...` (HMR nécessite)

### Prod:
```bash
NODE_ENV=production npm run build && npm start
curl -I http://localhost:3000/ | grep Content-Security-Policy
```
**ATTENDU**: `script-src 'self' 'unsafe-inline' https://js.stripe.com` (PAS unsafe-eval)

---

## TEST 6: Validation Antifraude Webhook

**Objectif**: Webhook rejette si session_id ne correspond pas

### Setup:
1. Créer commande avec `stripe_session_id = "cs_test_abc123"`
2. Envoyer webhook avec `session.id = "cs_test_xyz789"` (différent)

**ATTENDU**: 
```json
{
  "received": true,
  "warning": "Session ID mismatch"
}
```
- Commande pas mise à jour
- Event marqué comme traité (pas de retry)

---

## TEST 7: XSS Protection Reviews

**Objectif**: HTML malveillant neutralisé

### Payload XSS:
```bash
curl -X POST http://localhost:3000/api/reviews/create \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-xxx..." \
  -d '{
    "product_id": "uuid-here",
    "rating": 5,
    "title": "Great product",
    "comment": "<img src=x onerror=alert(1)><script>alert(\"XSS\")</script>"
  }'
```

**ATTENDU**:
- DB stocke: texte brut OU HTML safe (pas de `<script>`, `onerror`)
- Affichage page: `<img src=x>` (balise safe) mais PAS `onerror`
- Aucun JavaScript exécuté

### Vérification DB:
```sql
SELECT comment FROM reviews WHERE id = 'xxx';
-- Doit contenir version sanitized (pas de script/onerror)
```

---

## TEST 8: Checkout - Produits par UUID (pas slug)

**Objectif**: Vérifier que /api/checkout utilise UUIDs

### Payload correct:
```json
{
  "items": [
    {
      "product_id": "550e8400-e29b-41d4-a716-446655440000",
      "variant_id": "660e8400-e29b-41d4-a716-446655440111",
      "quantity": 2
    }
  ]
}
```

**ATTENDU**: Succès ✅

### Payload avec slug (doit échouer):
```json
{
  "items": [
    {
      "product_id": "windows-11-pro",
      "variant_id": "digital",
      "quantity": 2
    }
  ]
}
```

**ATTENDU**: HTTP 400 (Zod validation UUID échoue)

---

## TEST 9: Env Validation au Démarrage

**Objectif**: App crash si variables critiques manquantes

### Test:
```bash
# Supprimer variable critique
unset STRIPE_SECRET_KEY

# Lancer app
npm run dev
```

**ATTENDU (dev)**:
```
[ENV] ERREUR: Variables d environnement invalides:
  - STRIPE_SECRET_KEY: Required

Verifiez votre fichier .env.local

[Process exited with code 1]
```

**ATTENDU (prod build)**:
```
Error: [ENV] Variables d environnement invalides:
...
(Build échoue, pas de déploiement)
```

---

## TEST 10: Rate Limiting Headers

**Objectif**: Vérifier headers X-RateLimit-*

```bash
curl -v http://localhost:3000/api/checkout \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"items":[]}' \
  2>&1 | grep -E "X-RateLimit|Retry-After"
```

**ATTENDU**:
```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 29
X-RateLimit-Reset: 2026-01-16T...Z
```

Après 30 requêtes:
```
X-RateLimit-Remaining: 0
Retry-After: 42
HTTP/1.1 429 Too Many Requests
```

---

## CHECKLIST POST-TESTS

- [ ] Rate limiting fail-closed fonctionne (prod sans Redis)
- [ ] Body size limit en bytes (pas chars)
- [ ] Idempotence webhook (event.id unique)
- [ ] Attribution licences atomique (pas de doublons concurrence)
- [ ] CSP sans unsafe-eval en prod
- [ ] Validation antifraude session_id
- [ ] XSS neutralisé (sanitize HTML)
- [ ] Checkout utilise UUIDs (pas slugs)
- [ ] Env validation crash au démarrage
- [ ] Rate limiting headers corrects

