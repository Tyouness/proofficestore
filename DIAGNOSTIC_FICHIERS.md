# 🔍 Diagnostic des Pièces Jointes

## ✅ Corrections Appliquées

### 1. Requêtes SQL - Colonnes Complètes
**Problème** : Les requêtes initiales ne récupéraient pas `attachment_url` et `file_type`  
**Solution** : Ajout explicite des colonnes dans tous les `.select()`

#### Côté Client (`/account/support/[id]/page.tsx`)
```typescript
// ✅ AVANT
.select('id, sender_role, content, created_at')

// ✅ APRÈS
.select('id, sender_role, content, attachment_url, file_type, created_at')
```

#### Côté Admin (`/admin/tickets/[id]/page.tsx`)
```typescript
// ✅ AVANT
.select('id, sender_role, content, created_at')

// ✅ APRÈS
.select('id, sender_role, content, attachment_url, file_type, created_at')
```

### 2. API Admin - Retour Complet
**Problème** : L'API retournait `.select()` sans colonnes spécifiques  
**Solution** : `.select()` explicite avec tous les champs

```typescript
// ✅ /api/admin/tickets/reply/route.ts
.select('id, sender_id, sender_role, content, attachment_url, file_type, created_at')
```

### 3. Logs de Diagnostic
**Ajoutés** : Console.log à chaque étape critique

#### Upload Fichier
```typescript
console.log('[CLIENT/ADMIN] Fichier uploadé avec succès:', attachmentData);
// Affiche : { url: "https://...", type: "image" }
```

#### Avant Insert
```typescript
console.log('[CLIENT/ADMIN] Envoi du message avec données:', messageData);
// Affiche : { attachment_url: "...", file_type: "image", ... }
```

#### Après Insert
```typescript
console.log('[CLIENT/ADMIN] Message inséré avec succès:', data);
// Doit contenir attachment_url et file_type
```

#### Realtime
```typescript
console.log('[CLIENT/ADMIN REALTIME] Message avec pièce jointe:', {
  attachment_url: newMsg.attachment_url,
  file_type: newMsg.file_type,
});
```

### 4. Vérifications de Sécurité
**Ajoutées** : Blocages si URL manquante

```typescript
// Si fichier uploadé mais URL manquante
if (currentFile && !attachmentData?.url) {
  throw new Error('URL du fichier manquante après upload');
}

// Si réponse API ne contient pas l'attachment
if (attachmentData && !data.attachment_url) {
  throw new Error('La pièce jointe n\'a pas été sauvegardée correctement');
}
```

### 5. Realtime - Déduplication Améliorée
**Ajoutée** : Logs lors de la déduplication

```typescript
setMessages((prev) => {
  if (prev.some((m) => m.id === newMsg.id)) {
    console.log('[REALTIME] Message déjà présent, ignoré');
    return prev;
  }
  return [...prev, newMsg];
});
```

---

## 🧪 Tests de Diagnostic

### Test 1 : Upload et Vérification Console
1. Ouvrir la console du navigateur (F12)
2. Joindre un fichier et envoyer
3. **Vérifier les logs dans l'ordre** :

```
✅ [CLIENT] Fichier uploadé avec succès: { url: "https://...", type: "image" }
✅ [CLIENT] Envoi du message avec données: { attachment_url: "...", file_type: "image", ... }
✅ [CLIENT] Message inséré avec succès: { id: "...", attachment_url: "...", file_type: "image", ... }
```

**Si l'URL est `null` quelque part → Le problème est identifié**

### Test 2 : Vérification Base de Données
1. Aller dans Supabase Dashboard → Table Editor → `support_messages`
2. Chercher le dernier message inséré
3. **Vérifier les colonnes** :
   - `attachment_url` : Doit contenir l'URL complète
   - `file_type` : Doit contenir "image" ou "pdf"

**Si les colonnes sont vides → Problème d'insertion**

### Test 3 : Rafraîchissement Page
1. Envoyer un message avec fichier
2. **Rafraîchir la page (F5)**
3. Le fichier doit réapparaître

**Si le fichier disparaît → Problème de requête SQL initiale**

### Test 4 : Realtime Synchronisation
1. Ouvrir deux onglets (Admin + Client)
2. Envoyer un fichier depuis le client
3. **Vérifier côté admin** :

```
✅ [ADMIN REALTIME] Nouveau message reçu: { ... }
✅ [ADMIN REALTIME] Message avec pièce jointe: { attachment_url: "...", file_type: "image" }
```

**Si les logs ne s'affichent pas → Problème Realtime**

### Test 5 : URL Publique
1. Copier l'URL d'un fichier depuis les logs
2. Ouvrir dans un nouvel onglet
3. Le fichier doit s'afficher

**Si erreur 403 ou 404 → Problème de bucket public**

---

## 🐛 Scénarios d'Erreur Possibles

### Erreur 1 : URL manquante après upload
**Log** : `URL du fichier manquante après upload`  
**Cause** : La fonction `uploadFile()` a échoué silencieusement  
**Solution** : Vérifier que le bucket `support-attachments` existe et est configuré

### Erreur 2 : Pièce jointe non sauvegardée
**Log** : `La pièce jointe n'a pas été sauvegardée correctement`  
**Cause** : L'insert SQL n'a pas inclus `attachment_url`  
**Solution** : Vérifier que `messageData` contient bien `attachment_url` et `file_type`

### Erreur 3 : Fichier disparaît au rafraîchissement
**Symptôme** : Bulle vide après F5  
**Cause** : La requête SQL initiale ne sélectionne pas `attachment_url`  
**Solution** : Vérifier le `.select()` dans `page.tsx` (déjà corrigé)

### Erreur 4 : Realtime ne synchronise pas les fichiers
**Symptôme** : Pas de log Realtime avec pièce jointe  
**Cause** : Supabase Realtime ne retourne pas toutes les colonnes  
**Solution** : Vérifier que RLS permet la lecture de `attachment_url` et `file_type`

### Erreur 5 : Bulle indique "Support"
**Symptôme** : Message affiché comme "Support" au lieu du fichier  
**Cause** : Le composant UI ne détecte pas `attachment_url`  
**Solution** : Vérifier le rendu conditionnel dans le composant

---

## 📋 Checklist de Vérification

### Configuration Supabase
- [ ] Bucket `support-attachments` existe
- [ ] Bucket est **public**
- [ ] Colonnes `attachment_url` (TEXT) et `file_type` (TEXT) existent dans `support_messages`
- [ ] RLS permet la lecture de ces colonnes

### Code Client
- [ ] `page.tsx` sélectionne `attachment_url` et `file_type`
- [ ] `uploadFile()` retourne `{ url, type }`
- [ ] `handleSendMessage()` vérifie l'URL avant insert
- [ ] `.select()` après insert inclut tous les champs
- [ ] Realtime log les messages avec pièces jointes

### Code Admin
- [ ] `page.tsx` sélectionne `attachment_url` et `file_type`
- [ ] `uploadFile()` retourne `{ url, type }`
- [ ] `handleSendMessage()` vérifie l'URL avant API call
- [ ] API `/api/admin/tickets/reply` accepte et retourne `attachment_url` et `file_type`
- [ ] Realtime log les messages avec pièces jointes

### UI/UX
- [ ] Les images s'affichent en miniature
- [ ] Les PDF ont un bouton de téléchargement
- [ ] Les messages sans texte mais avec fichier s'affichent correctement

---

## 🔧 Commandes de Diagnostic SQL

### Vérifier les colonnes existantes
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'support_messages' 
AND column_name IN ('attachment_url', 'file_type');
```

### Vérifier les messages avec pièces jointes
```sql
SELECT 
  id, 
  sender_role, 
  content,
  attachment_url,
  file_type,
  created_at
FROM support_messages 
WHERE attachment_url IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

### Vérifier les derniers messages
```sql
SELECT * 
FROM support_messages 
ORDER BY created_at DESC 
LIMIT 5;
```

---

## 📞 Prochaines Étapes

1. **Tester l'envoi d'un fichier** et observer les logs console
2. **Copier les logs** et analyser où l'URL disparaît
3. **Vérifier la base de données** pour confirmer la présence des données
4. **Tester le rafraîchissement** pour valider la persistance
5. **Tester le Realtime** entre deux utilisateurs

Si le problème persiste après ces corrections, les logs permettront d'identifier exactement où se situe la défaillance.
