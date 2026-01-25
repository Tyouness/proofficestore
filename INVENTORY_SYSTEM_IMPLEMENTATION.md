# 📦 Système de Gestion de Stock & Capture de Leads

## ✅ Implémentation Complète - AllKeyMasters

Ce document récapitule l'implémentation du système de gestion de stock dynamique avec capture de leads B2B/B2C.

---

## 🗂️ Fichiers Créés

### 1. Migration Base de Données
**Fichier:** `supabase/migrations/add_inventory_management.sql`

**Contenu:**
- Ajout colonne `inventory` à la table `products`
- Création table `stock_requests` (demandes de stock)
- Vue enrichie `stock_requests_with_product`
- Fonction anti-spam `check_duplicate_stock_request()`
- Politiques RLS (Row Level Security)
- Initialisation inventaire produits existants (999 par défaut)

**À exécuter dans Supabase:**
```sql
-- Copier le contenu du fichier et l'exécuter dans l'éditeur SQL Supabase
```

---

### 2. Validation Zod
**Fichier:** `frontend/src/lib/validation.ts`

**Ajouts:**
- `stockRequestSchema` : Validation formulaire demande de stock
- `stockRequestStatusSchema` : Validation des statuts
- `updateStockRequestSchema` : Validation mise à jour admin

---

### 3. Server Actions
**Fichier:** `frontend/src/actions/stock-request.ts`

**Fonctions:**
- ✉️ `createStockRequest()` : Enregistrer une demande de stock
  - Protection honeypot (anti-bot)
  - Rate limiting (3 demandes/heure)
  - Vérification doublons
  - Capture IP et User-Agent

- 📋 `getStockRequests()` : Récupérer toutes les demandes (admin)
- ✏️ `updateStockRequest()` : Mettre à jour statut/notes (admin)
- 🔢 `getStockRequestStats()` : Statistiques (admin)

---

### 4. Composant Produit Modifié
**Fichier:** `frontend/src/components/ProductActions.tsx`

**Changements:**
- Nouvelle prop `inventory?: number`
- Affichage conditionnel :
  - **Stock > 0** : Bouton classique "Ajouter au panier"
  - **Stock = 0** : Formulaire de demande de stock
    - Champ email (validation stricte)
    - Champ quantité (1-100)
    - Honeypot caché (anti-bot)
    - Bouton "Vérifier la disponibilité sous 1h"

**Pages modifiées:**
- `frontend/src/app/produit/[slug]/page.tsx` : Ajout prop `inventory`

---

### 5. Pages Admin

#### a) Gestion des Demandes de Stock
**Fichiers:**
- `frontend/src/app/admin/stock-requests/page.tsx`
- `frontend/src/app/admin/stock-requests/StockRequestsTable.tsx`

**Fonctionnalités:**
- 📊 Statistiques (total, en attente, contactés, complétés, annulés)
- 🔍 Filtres par statut
- 📝 Table interactive avec :
  - Email client (lien mailto)
  - Produit demandé (lien vers page)
  - Quantité
  - Stock actuel
  - Changement de statut en 1 clic
  - Notes administratives
  - IP de la demande

**Accès:** `/admin/stock-requests`

---

#### b) Gestion de l'Inventaire
**Fichiers:**
- `frontend/src/app/admin/inventory/page.tsx`
- `frontend/src/app/admin/inventory/InventoryManager.tsx`

**Fonctionnalités:**
- 📊 Statistiques (total produits, stock bas, ruptures)
- 🔍 Recherche par nom/famille
- 🔍 Filtres (Tous, Stock bas ≤10, Rupture)
- ✏️ Modification directe du stock
- ⚡ Boutons rapides :
  - "Rupture" : Mettre à 0 (active capture de leads)
  - "Réappro" : Mettre à 999 (réapprovisionner)

**Accès:** `/admin/inventory`

---

## 🚀 Guide d'Utilisation

### Pour l'Administrateur

1. **Activer la Capture de Leads pour un Produit**
   - Aller sur `/admin/inventory`
   - Trouver le produit
   - Cliquer sur "Rupture" ou mettre manuellement à `0`
   - ✅ Le formulaire de demande s'affiche automatiquement sur la page produit

2. **Traiter une Demande de Stock**
   - Aller sur `/admin/stock-requests`
   - Voir les demandes "En attente"
   - Vérifier le stock réel du produit
   - Envoyer un email au client avec la disponibilité
   - Changer le statut en "Contacté"
   - Une fois commandé, mettre "Complété"

3. **Réapprovisionner un Produit**
   - Aller sur `/admin/inventory`
   - Cliquer sur "Réappro" (999 unités)
   - Ou entrer manuellement la quantité exacte

---

### Pour le Client

Quand un produit est en **rupture de stock** :

1. 🔔 Un badge orange s'affiche : "Indisponibilité temporaire"
2. 📝 Le bouton d'achat est remplacé par un formulaire :
   - Email
   - Quantité souhaitée
3. ✉️ Message après soumission : "Un conseiller vérifie le stock et vous répond par mail d'ici 1h"
4. 📧 L'admin reçoit la demande dans le backoffice

---

## 🛡️ Sécurité Implémentée

### 1. Protection Anti-Spam
- ✅ **Honeypot** : Champ caché `contact` (les bots le remplissent)
- ✅ **Rate Limiting** : Max 3 demandes/heure par email par produit
- ✅ **Vérification doublons** : Empêche demandes identiques < 24h
- ✅ **Validation Zod** : Email + quantité strictement validés
- ✅ **Capture métadonnées** : IP + User-Agent pour analyse

### 2. Protection Base de Données
- ✅ **RLS Supabase** : Seuls les admins voient les demandes
- ✅ **Insertion publique** : Les visiteurs peuvent créer des demandes
- ✅ **Contraintes SQL** : Quantité entre 1 et 100

---

## 📊 Schéma de la Table `stock_requests`

```sql
CREATE TABLE stock_requests (
  id uuid PRIMARY KEY,
  created_at timestamp,
  updated_at timestamp,
  product_id uuid REFERENCES products(id),
  user_email text NOT NULL,
  quantity integer CHECK (quantity BETWEEN 1 AND 100),
  status text CHECK (status IN ('pending', 'contacted', 'completed', 'cancelled')),
  ip_address text,
  user_agent text,
  admin_notes text
);
```

---

## 🎯 Workflow Complet

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Admin met le stock à 0 dans /admin/inventory                │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Client visite /produit/[slug]                                │
│    → Voit le formulaire de demande au lieu du bouton d'achat   │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Client soumet email + quantité                               │
│    → Validation + Protection anti-spam                          │
│    → Enregistrement dans stock_requests                        │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Admin voit la demande dans /admin/stock-requests             │
│    → Email client, produit, quantité, stock actuel             │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Admin vérifie stock réel et contacte le client              │
│    → Change statut en "Contacté"                                │
│    → Ajoute notes si besoin                                    │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. Si commande finalisée → Statut "Complété"                   │
│    Si client ne répond pas → Statut "Annulé"                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Captures d'Écran UI

### Côté Client (Rupture de Stock)
```
┌──────────────────────────────────────────┐
│ ⏳ Indisponibilité temporaire            │
│ Nous vérifions le stock disponible      │
├──────────────────────────────────────────┤
│ Vérifier la disponibilité                │
│                                          │
│ Votre email *                            │
│ [votre@email.fr                    ]    │
│                                          │
│ Quantité souhaitée *                     │
│ [1                                  ]    │
│                                          │
│ [✉️ Vérifier la disponibilité sous 1h]  │
│                                          │
│ 📞 Besoin d'aide ? 01 23 45 67 89       │
└──────────────────────────────────────────┘
```

### Côté Admin (Liste Demandes)
```
┌──────────────────────────────────────────────────────────────┐
│ 📋 Demandes de Stock                                         │
│                                                              │
│ [Total: 45] [En attente: 12] [Contactés: 8] [Complétés: 25]│
│                                                              │
│ Date      Email              Produit      Qté  Stock Statut│
│ 24 Jan    client@test.fr    Office 2021   5    0    ⏳     │
│ 23 Jan    pro@company.com   Windows 11    10   0    ✉️     │
└──────────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist de Déploiement

- [ ] Exécuter la migration SQL dans Supabase
- [ ] Vérifier que la colonne `inventory` existe sur tous les produits
- [ ] Tester la création d'une demande de stock (frontend)
- [ ] Vérifier protection honeypot (remplir champ caché)
- [ ] Vérifier rate limiting (3+ demandes rapides)
- [ ] Accéder à `/admin/inventory` et modifier un stock
- [ ] Accéder à `/admin/stock-requests` et changer un statut
- [ ] Ajouter les liens dans le menu admin principal

---

## 🔗 Prochaines Améliorations Optionnelles

- 📧 Email automatique aux clients (via Supabase Functions ou Resend)
- 🔔 Notification Slack/Discord pour nouvelles demandes
- 📊 Dashboard analytics (produits les plus demandés)
- 🤖 Auto-réappro via API fournisseur

---

## 📞 Support

En cas de problème, vérifier :
1. Migration SQL bien exécutée (`inventory` existe dans `products`)
2. Politiques RLS actives sur `stock_requests`
3. Variables d'environnement Supabase correctes
4. Logs serveur pour erreurs validation

---

**Implémentation réalisée par GitHub Copilot**  
**Date:** Janvier 2026  
**Stack:** Next.js + Supabase + Zod + Tailwind CSS
