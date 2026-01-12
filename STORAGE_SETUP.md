# Configuration Supabase Storage pour les pièces jointes

## 1. Créer le bucket `support-attachments`

1. Allez dans votre projet Supabase → Storage
2. Cliquez sur "New bucket"
3. Nom : `support-attachments`
4. **Public bucket** : ✅ Activer (pour permettre l'accès aux fichiers)
5. Cliquez sur "Create bucket"

## 2. Vérifier les colonnes de la table `support_messages`

La table `support_messages` doit avoir les colonnes suivantes :

```sql
-- Vérifier si les colonnes existent
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'support_messages' 
  AND column_name IN ('attachment_url', 'file_type');

-- Si elles n'existent pas, les ajouter :
ALTER TABLE support_messages 
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS file_type TEXT CHECK (file_type IN ('image', 'pdf'));
```

## 3. Politique de sécurité (RLS) pour le bucket

Par défaut, le bucket public permet la lecture. Pour l'upload, ajoutez ces politiques :

### Policy 1 : Upload pour les utilisateurs authentifiés
```sql
-- Permettre aux utilisateurs authentifiés d'uploader dans leur ticket
CREATE POLICY "Users can upload to their tickets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'support-attachments' 
  AND EXISTS (
    SELECT 1 FROM support_tickets 
    WHERE support_tickets.id::text = (string_to_array(name, '/'))[1]
    AND support_tickets.user_id = auth.uid()
  )
);
```

### Policy 2 : Lecture publique
```sql
-- Permettre la lecture publique des fichiers
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'support-attachments');
```

### Policy 3 : Upload pour les admins
```sql
-- Permettre aux admins d'uploader dans n'importe quel ticket
CREATE POLICY "Admins can upload anywhere"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'support-attachments'
  AND auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'admin'
  )
);
```

## 4. Test rapide

Pour tester que tout fonctionne :

1. Connectez-vous en tant qu'utilisateur
2. Allez sur `/account/support` et créez un ticket
3. Dans la conversation, cliquez sur le bouton trombone (📎)
4. Sélectionnez une image (JPG, PNG, WEBP) ou un PDF (<5 MB)
5. Envoyez le message
6. Vérifiez que le fichier s'affiche correctement

## Formats supportés

- **Images** : JPEG, PNG, WEBP
- **Documents** : PDF
- **Taille max** : 5 MB

## Architecture des fichiers

Les fichiers sont organisés par ticket :
```
support-attachments/
  ├── {ticket_id_1}/
  │   ├── uuid-1.jpg
  │   ├── uuid-2.png
  │   └── uuid-3.pdf
  ├── {ticket_id_2}/
  │   └── uuid-4.webp
  ...
```

## Dépannage

### Erreur "bucket not found"
→ Vérifiez que le bucket `support-attachments` existe dans Storage

### Erreur "permission denied"
→ Vérifiez les politiques RLS sur `storage.objects`

### Fichier ne s'affiche pas
→ Vérifiez que le bucket est bien en mode **public**

### Upload échoue
→ Vérifiez la taille du fichier (<5 MB) et le format (JPG, PNG, WEBP, PDF)
