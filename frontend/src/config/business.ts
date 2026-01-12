/**
 * Configuration centralisée des informations de l'entreprise AllKeyMasters
 * À utiliser dans tous les composants pour maintenir la cohérence des données
 */

export interface BusinessInfo {
  companyName: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  support: {
    email: string;
    hours: string;
  };
  social?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
  };
}

export const BUSINESS_INFO: BusinessInfo = {
  companyName: 'AllKeyMasters',
  address: '2400 route des dolines, 06560 Valbonne, France',
  phone: '+33 6 21 87 47 89',
  email: 'support@allkeymasters.com',
  website: 'https://www.allkeymasters.com',
  support: {
    email: 'support@allkeymasters.com',
    hours: 'Disponible 24/7 via l\'espace client',
  },
};

/**
 * Métadonnées SEO pour le référencement Google
 */
export const SEO_CONFIG = {
  defaultTitle: 'AllKeyMasters | Clés de licences officielles Windows & Office',
  defaultDescription:
    'Achetez vos clés de licences logicielles au meilleur prix sur AllKeyMasters. Livraison instantanée, support 24/7 et garantie d\'activation.',
  keywords: [
    'clés Windows',
    'licences Office',
    'activation Windows',
    'clés logiciels',
    'licence authentique',
    'AllKeyMasters',
  ],
};
