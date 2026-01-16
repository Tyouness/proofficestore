/**
 * 🧹 HTML SANITIZATION - PURE REGEX (No dependencies)
 * 
 * Nettoie tout HTML utilisateur AVANT stockage en DB.
 * Protection contre XSS (Cross-Site Scripting).
 * 
 * SÉCURITÉ:
 * - stripHtml retourne TOUJOURS du texte brut
 * - JAMAIS de caractères < ou > dans l'output
 * - Ne décode JAMAIS &lt; ou &gt; (évite re-création HTML)
 * - Compatible client + serveur (aucune dépendance DOM)
 * 
 * Usage:
 * import { stripHtml } from '@/lib/sanitize';
 * const clean = stripHtml(userInput); // Texte brut GARANTI
 */

/**
 * Strip HTML - DÉFENSE EN PROFONDEUR
 * 
 * Étapes de sécurité:
 * 1. Supprime caractères de contrôle
 * 2. Supprime balises HTML
 * 3. Décode UNIQUEMENT entities safe (&amp;, &quot;, &#039;, &nbsp;)
 * 4. SUPPRIME tout < ou > restant (pas d'encodage, texte brut)
 * 5. Normalise espaces
 * 
 * GARANTIT: Texte brut sans < ou >, sans pollution HTML-encoding
 */
export function stripHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';
  
  // 1. Supprimer caractères de contrôle (0x00-0x1F, 0x7F)
  let text = html.replace(/[\u0000-\u001F\u007F]/g, '');
  
  // 2. Supprimer toutes les balises HTML
  text = text.replace(/<[^>]*>/g, '');
  
  // 3. Décoder UNIQUEMENT les entities SAFE (PAS &lt; ou &gt;)
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
  
  // 4. SUPPRIMER tout < ou > restant (texte brut, pas d'encodage)
  text = text.replace(/[<>]/g, '');
  
  // 5. Normaliser espaces multiples et trim
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
}

/**
 * Alias pour rétrocompatibilité
 */
export function sanitizeHtml(html: string): string {
  return stripHtml(html);
}

/**
 * Alias pour affichage
 */
export function sanitizeForDisplay(html: string): string {
  return stripHtml(html);
}

/**
 * Alias pour stockage
 */
export function sanitizeForStorage(text: string): string {
  return stripHtml(text);
}
