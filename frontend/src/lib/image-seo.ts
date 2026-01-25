/**
 * SEO IMAGES - Métadonnées optimisées pour Google 2025-2026
 * Respect des Core Web Vitals, E-E-A-T et Image SEO best practices
 * 
 * RÈGLES :
 * - Alt unique par produit (max 125 caractères)
 * - Title orienté action/réassurance
 * - Variantes LSI (pas de keyword stuffing)
 * - Descriptif + intention utilisateur
 */

interface ProductImageMeta {
  alt: string;
  title: string;
  priority?: boolean;
}

interface ProductInfo {
  name: string;
  family: 'windows' | 'office';
  version?: string;
  edition?: string;
  deliveryType: 'digital_key' | 'dvd' | 'usb';
}

/**
 * Génère les métadonnées SEO optimisées pour une image produit
 * 
 * @param slug - Slug du produit (ex: 'office-2021-professional-plus-digital-key')
 * @param product - Informations produit pour contextualiser
 * @param isHeroImage - True si c'est l'image principale de la page produit
 * @returns Attributs alt et title optimisés SEO
 */
export function getProductImageSEO(
  slug: string,
  product?: ProductInfo,
  isHeroImage: boolean = false
): ProductImageMeta {
  // Mapping des alt/title par slug (évite les duplications)
  const seoMappings: Record<string, ProductImageMeta> = {
    // ──────────────────────────────────────────
    // WINDOWS
    // ──────────────────────────────────────────
    'windows-11-pro': {
      alt: 'Licence Windows 11 Professionnel OEM authentique pour PC fixe et portable',
      title: 'Activer Windows 11 Pro avec clé de licence perpétuelle officielle',
      priority: isHeroImage,
    },
    'windows-10-pro': {
      alt: 'Clé d\'activation Windows 10 Pro officielle livrée par email instantanément',
      title: 'Installer Windows 10 Professionnel avec licence authentique Microsoft',
      priority: isHeroImage,
    },

    // ──────────────────────────────────────────
    // OFFICE 2024
    // ──────────────────────────────────────────
    'office-2024-professional-plus': {
      alt: 'Suite bureautique Office 2024 Pro Plus – licence perpétuelle sans abonnement',
      title: 'Télécharger Office 2024 Professionnel avec clé d\'activation à vie',
      priority: isHeroImage,
    },

    // ──────────────────────────────────────────
    // OFFICE 2021
    // ──────────────────────────────────────────
    'office-2021-professional-plus': {
      alt: 'Logiciel Office 2021 Pro Plus authentique compatible Windows 11 et Mac',
      title: 'Acheter Office 2021 Professionnel Plus avec licence définitive',
      priority: isHeroImage,
    },
    'office-2021-home-student': {
      alt: 'Office 2021 Famille et Étudiant – Word Excel PowerPoint pour usage personnel',
      title: 'Licence Office 2021 Famille sans renouvellement mensuel requis',
      priority: isHeroImage,
    },
    'office-2021-home-business': {
      alt: 'Pack Office 2021 Famille et Petite Entreprise avec Outlook professionnel',
      title: 'Activer Office 2021 Entreprise pour PME et indépendants',
      priority: isHeroImage,
    },

    // ──────────────────────────────────────────
    // OFFICE 2019
    // ──────────────────────────────────────────
    'office-2019-professional-plus': {
      alt: 'Licence Office 2019 Pro Plus pérenne – installation hors ligne possible',
      title: 'Clé numérique Office 2019 Professionnel livrée sous 5 minutes',
      priority: isHeroImage,
    },
    'office-2019-home-student': {
      alt: 'Suite Office 2019 pour étudiants et familles – Word Excel PowerPoint OneNote',
      title: 'Télécharger Office 2019 Famille avec accès permanent aux logiciels',
      priority: isHeroImage,
    },
    'office-2019-home-business': {
      alt: 'Office 2019 Petite Entreprise avec outils collaboratifs et Outlook',
      title: 'Installer Office 2019 Entreprise sur PC Windows 10 ou 11',
      priority: isHeroImage,
    },
  };

  // Chercher la correspondance base (sans suffixe -dvd/-usb/-digital-key)
  let baseSEO: ProductImageMeta | undefined;
  
  for (const [key, meta] of Object.entries(seoMappings)) {
    if (slug.startsWith(key)) {
      baseSEO = meta;
      break;
    }
  }

  // Si pas de mapping trouvé, générer dynamiquement depuis les infos produit
  if (!baseSEO && product) {
    baseSEO = generateDynamicSEO(product);
  }

  // Fallback générique (ne devrait jamais arriver en production)
  if (!baseSEO) {
    return {
      alt: 'Licence logicielle Microsoft authentique avec livraison instantanée',
      title: 'Clé d\'activation officielle garantie par AllKeyMasters',
      priority: isHeroImage,
    };
  }

  // Adapter l'alt selon le type de livraison (DVD/USB)
  let finalAlt = baseSEO.alt;
  if (slug.includes('-dvd')) {
    finalAlt = finalAlt.replace(/clé numérique|licence numérique|clé d'activation/i, 'DVD d\'installation physique');
  } else if (slug.includes('-usb')) {
    finalAlt = finalAlt.replace(/clé numérique|licence numérique|clé d'activation/i, 'clé USB bootable');
  }

  return {
    ...baseSEO,
    alt: finalAlt,
    priority: isHeroImage,
  };
}

/**
 * Génère des métadonnées SEO dynamiques si le slug n'est pas mappé
 * (Backup pour les nouveaux produits)
 */
function generateDynamicSEO(product: ProductInfo): ProductImageMeta {
  const familyLabel = product.family === 'windows' ? 'Windows' : 'Office';
  const versionLabel = product.version || '';
  const editionLabel = product.edition?.replace(/_/g, ' ') || '';
  
  let deliveryContext = '';
  if (product.deliveryType === 'digital_key') {
    deliveryContext = 'téléchargement immédiat après achat';
  } else if (product.deliveryType === 'dvd') {
    deliveryContext = 'DVD original expédié sous 24h';
  } else if (product.deliveryType === 'usb') {
    deliveryContext = 'clé USB bootable envoyée rapidement';
  }

  return {
    alt: `Licence ${familyLabel} ${versionLabel} ${editionLabel} – ${deliveryContext}`.trim(),
    title: `Activer ${familyLabel} ${versionLabel} avec clé officielle Microsoft`.trim(),
  };
}

/**
 * Génère l'alt pour les images du panier (contexte différent)
 */
export function getCartImageAlt(productName: string): string {
  // Variantes pour éviter les duplications avec ProductCard
  return `${productName} ajouté au panier – vérifier le format de livraison`;
}

/**
 * Métadonnées pour les images contextuelles (UX/confiance)
 */
export const CONTEXTUAL_IMAGES_SEO = {
  emailDelivery: {
    alt: 'Réception par email de clé de licence Microsoft sous 10 minutes maximum',
    title: 'Livraison instantanée et automatique après validation du paiement',
  },
  securePayment: {
    alt: 'Paiement sécurisé via Stripe avec vérification bancaire 3D Secure',
    title: 'Transaction protégée et cryptée pour achat en toute confiance',
  },
  activation: {
    alt: 'Guide d\'activation de licence Windows ou Office via portail Microsoft',
    title: 'Processus d\'activation simple en 3 étapes avec support inclus',
  },
  support247: {
    alt: 'Service client disponible 24h/24 pour assistance technique immédiate',
    title: 'Équipe support réactive pour résoudre tout problème d\'activation',
  },
  guarantee: {
    alt: 'Garantie de remboursement et licence authentique certifiée Microsoft',
    title: 'Engagement qualité avec remplacement gratuit en cas de défaut',
  },
} as const;

/**
 * Optimisation Open Graph pour partage social
 */
export function getOGImageMeta(productName: string): { url: string; alt: string; width: number; height: number } {
  return {
    url: 'https://www.allkeymasters.com/og-default.jpg', // Image OG par défaut (1200x630)
    alt: `${productName} – Licence Microsoft officielle livrée instantanément par AllKeyMasters`,
    width: 1200,
    height: 630,
  };
}
