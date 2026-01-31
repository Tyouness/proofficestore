# Internationalisation AllKeyMasters - État d'Avancement

## ✅ PHASE 1 TERMINÉE - Infrastructure de base

### 1. Migration SQL (`supabase/migrations/20260130_add_multi_currency_prices.sql`)
**Statut**: Fichier créé, en attente d'application sur Supabase

**Contenu**:
- Ajout colonnes: `price_eur`, `price_usd`, `price_gbp`, `price_cad`, `price_aud`, `price_chf`
- Migration automatique des prix existants vers `price_eur`
- Initialisation des autres devises avec estimations (à ajuster manuellement)
- Contraintes de validation (prix positifs)
- Index pour performances
- Fonction helper `get_product_price(product_row, currency_code)`
- Vue `products_with_all_prices`

**ACTION REQUISE**: 
1. Aller sur Supabase Dashboard → SQL Editor
2. Copier/coller le contenu du fichier de migration
3. Exécuter (RUN)
4. Remplir manuellement les vrais prix pour chaque devise dans l'admin

---

### 2. Configuration i18n (`src/config/i18n.ts`)
**Statut**: ✅ Terminé

**Locales supportées**:
- `fr` (France) → EUR
- `en` (United States) → USD
- `de` (Deutschland) → EUR
- `es` (España) → EUR
- `it` (Italia) → EUR
- `au` (Australia) → AUD
- `ca` (Canada) → CAD
- `ch` (Schweiz) → CHF

**Helpers disponibles**:
```typescript
// Obtenir le prix dans la bonne devise
getPriceForLocale(product, locale)

// Formater le prix avec symbole
formatPrice(price, locale)

// Mapping locale → devise
localeToCurrency[locale]
```

---

### 3. Middleware i18n (`src/middleware.ts`)
**Statut**: ✅ Mis à jour (fusion i18n + Supabase)

**Fonctionnalités**:
- Routing automatique `/fr/`, `/en/`, `/de/`, etc.
- Détection langue navigateur
- Cookies session Supabase maintenus
- Pattern matching pour exclure fichiers statiques

---

### 4. Fichiers de traduction (`src/messages/`)
**Statut**: ✅ Créés pour toutes les langues

**Fichiers**: `fr.json`, `en.json`, `de.json`, `es.json`, `it.json`, `au.json`, `ca.json`, `ch.json`

**Structure actuelle** (minimale):
```json
{
  "common": {
    "home": "...",
    "products": "...",
    "cart": "...",
    ...
  },
  "test": {
    "title": "...",
    "description": "...",
    ...
  }
}
```

---

### 5. Padding mobile corrigé (`src/app/globals.css`)
**Statut**: ✅ Ajouté

**Fix appliqué**:
```css
@media (max-width: 640px) {
  body {
    padding-left: 16px;
    padding-right: 16px;
  }
  main, .container {
    max-width: 100%;
    overflow-x: hidden;
  }
  img, video, iframe {
    max-width: 100%;
    height: auto;
  }
}
```

---

## ⚠️ PHASE 2 - CE QU'IL RESTE À FAIRE

### 1. Restructurer l'app avec `[locale]/`
**Complexité**: 🔴 **TRÈS ÉLEVÉE**

**Ce qui doit être déplacé**:
```
src/app/
├── [locale]/           ← NOUVEAU dossier dynamique
│   ├── layout.tsx      ← Layout avec sélecteur langue
│   ├── page.tsx        ← Homepage traduite
│   ├── logiciels/
│   ├── produit/[slug]/
│   ├── cart/
│   ├── checkout/
│   ├── account/
│   ├── login/
│   ├── register/
│   ├── blog/
│   ├── support/
│   └── legal/
├── api/                ← Reste à la racine (pas de locale)
└── admin/              ← Reste à la racine (pas de locale)
```

**Estimation**: ~50-100 fichiers à déplacer/adapter

---

### 2. Adapter tous les composants
**Fichiers à modifier**:
- `components/Header.tsx` → Ajouter sélecteur de langue (drapeaux)
- `components/ProductCard.tsx` → Utiliser `getPriceForLocale()`
- `components/ProductCarousel.tsx` → Prix multi-devises
- `components/Hero.tsx` → Textes traduits
- `components/Footer.tsx` → Liens traduits
- Tous les autres composants avec du texte

---

### 3. Adapter les API routes
**Problématique**: Les API routes doivent rester à `/api/` mais gérer la devise

**Fichiers à modifier**:
- `api/checkout/route.ts` → Récupérer prix selon devise client
- `api/webhook/stripe/route.ts` → Gérer multi-devises
- Tous les emails → Templates multilingues

---

### 4. Créer les balises hreflang SEO
**À implémenter dans chaque layout**:
```tsx
export async function generateMetadata({ params: { locale } }) {
  return {
    alternates: {
      canonical: `https://www.allkeymasters.com/${locale}`,
      languages: {
        'fr-FR': 'https://www.allkeymasters.com/fr',
        'en-US': 'https://www.allkeymasters.com/en',
        'de-DE': 'https://www.allkeymasters.com/de',
        ...
      }
    }
  }
}
```

---

### 5. Traduire tout le contenu
**Volumes estimés**:
- Interface UI: ~200 strings
- Descriptions produits: ~20 produits × 8 langues = 160 descriptions
- Articles blog: ~5 articles × 8 langues = 40 articles
- Pages légales: ~4 pages × 8 langues = 32 pages
- Emails: ~15 templates × 8 langues = 120 templates

**Total**: ~500+ textes à traduire

---

### 6. Tests nécessaires
- [ ] Routing fonctionne pour toutes les locales
- [ ] Prix s'affichent dans la bonne devise
- [ ] Formatage devise correct (€19.99 vs $19.99)
- [ ] Balises hreflang présentes
- [ ] Sélecteur de langue fonctionne
- [ ] Checkout multi-devises
- [ ] Emails envoyés dans la bonne langue
- [ ] SEO: Google indexe bien chaque version

---

## 💡 RECOMMANDATION: PAGE DE TEST D'ABORD

Avant de tout migrer, créer **UNE SEULE page de test** pour valider:

### Étape 1: Créer structure minimale
```
src/app/[locale]/
├── layout.tsx          ← Layout de base avec useTranslations
└── test-seo/
    └── page.tsx        ← Page de test simple
```

### Étape 2: Tester
- Vérifier que `/fr/test-seo` fonctionne
- Vérifier que `/en/test-seo` fonctionne
- Inspecter `<head>` pour voir hreflang
- Tester changement de langue

### Étape 3: Si ça marche
- Migrer page par page
- Tester entre chaque migration
- Garder version actuelle en backup

---

## 🚨 RISQUES SI MIGRATION COMPLÈTE IMMÉDIATE

1. **Site cassé en production** pendant plusieurs heures
2. **SEO impacté** (URLs changent toutes)
3. **Checkout ne fonctionne plus**
4. **Emails en mauvaise langue**
5. **Prix incorrects affichés**
6. **Difficile de rollback**

---

## ✅ PROCHAINES ÉTAPES RECOMMANDÉES

1. **VOUS**: Appliquer migration SQL sur Supabase
2. **VOUS**: Remplir les prix manuels pour chaque devise
3. **MOI**: Créer page de test `/[locale]/test-seo`
4. **NOUS**: Valider que routing + hreflang fonctionnent
5. **MOI**: Si OK, migrer Homepage en premier
6. **NOUS**: Tester en production
7. **MOI**: Continuer page par page si pas de problèmes

---

## 📞 QUESTIONS À RÉSOUDRE

1. **Traductions professionnelles** ou Google Translate pour démarrer ?
2. **Descriptions produits** : vous les traduisez manuellement ou j'utilise une API ?
3. **Blog** : traduire tous les articles maintenant ou plus tard ?
4. **Emails** : priorité sur quels templates en premier ?
5. **Stripe**: un compte par devise ou tout en EUR avec conversion ?

---

**Dernière mise à jour**: 31 janvier 2026  
**Créé par**: GitHub Copilot  
**Statut global**: Infrastructure prête, refactoring en attente de validation
