/**
 * Générateur de Descriptions SEO par Format de Livraison
 * 
 * OBJECTIF :
 * - Créer des descriptions UNIQUES pour chaque format (Digital, DVD, USB)
 * - Chaque format a ses propres avantages et mots-clés
 * - INTERDICTION de duplication entre formats
 * 
 * STRATÉGIE SEO :
 * - URLs différentes par format (/office-2019-pro-plus-usb)
 * - Contenu sémantique adapté à chaque support
 * - Mots-clés spécifiques par format
 */

export type DeliveryFormat = 'digital' | 'dvd' | 'usb';

// Labels pour affichage des éditions
const EDITION_LABELS: Record<string, string> = {
  pro: 'Professionnel',
  professional_plus: 'Professional Plus',
  home_student: 'Famille et Étudiant',
  home_business: 'Famille et Petite Entreprise',
};

// Labels pour affichage des familles
const FAMILY_LABELS: Record<string, string> = {
  windows: 'Windows',
  office: 'Microsoft Office',
  Office: 'Office',
};

interface ProductVariantSeo {
  // Metadata SEO
  title: string;
  metaDescription: string;
  keywords: string[];
  
  // Contenu unique
  mainTitle: string; // H1
  mainDescription: string; // Paragraphe intro
  longDescription: string; // Description complète pour la page (avec \n\n pour séparer les paragraphes)
  
  // Avantages spécifiques (H2)
  advantages: {
    title: string;
    content: string;
  }[];
  
  // Sections détaillées (H2 + paragraphes)
  sections: {
    title: string;
    content: string;
  }[];
  
  // Bullet points USP
  highlights: string[];
}

interface Product {
  name: string;
  family: string;
  version: string;
  edition: string;
  base_price: number;
}

/**
 * Détecte le format de livraison depuis le slug du produit
 */
export function detectDeliveryFormat(slug: string): DeliveryFormat {
  if (slug.endsWith('-digital-key')) return 'digital';
  if (slug.endsWith('-dvd')) return 'dvd';
  if (slug.endsWith('-usb')) return 'usb';
  return 'digital'; // Par défaut
}

/**
 * Formate le nom du produit pour l'affichage
 * Remplace les underscores par des espaces dans edition
 */
function formatProductName(product: Product): string {
  const family = FAMILY_LABELS[product.family] || product.family;
  const edition = EDITION_LABELS[product.edition] || product.edition.replace(/_/g, ' ');
  return `${family} ${product.version} ${edition}`;
}

/**
 * ========================================
 * CLÉ DIGITALE (DIGITAL KEY)
 * ========================================
 * Focus : Instantanéité, email, téléchargement ISO, prix bas, écologie
 */
function generateDigitalKeySeo(product: Product): ProductVariantSeo {
  const productName = formatProductName(product);
  
  return {
    // SEO Metadata
    title: `${productName} - Clé Numérique Instantanée | ${product.base_price}€`,
    metaDescription: `Achetez ${productName} en version clé numérique. Livraison instantanée par email, téléchargement ISO officiel Microsoft. Activation immédiate dès réception. Licence perpétuelle ${product.base_price}€.`,
    keywords: [
      'clé numérique',
      'licence digitale',
      'téléchargement instantané',
      'email immédiat',
      'ISO microsoft',
      'activation en ligne',
      'licence dématérialisée',
      'livraison instantanée',
      'achat numérique',
      'esd microsoft',
    ],
    
    // H1
    mainTitle: `${productName} - Clé d'Activation Numérique Instantanée`,
    
    // Intro principale
    mainDescription: `Obtenez votre clé ${productName} par email en moins de 5 minutes. Notre système de livraison automatisé vous envoie instantanément votre licence numérique authentique Microsoft après validation du paiement. Téléchargez l'ISO officiel depuis nos serveurs sécurisés et activez votre logiciel immédiatement, sans attendre de livraison physique.`,
    
    // Avantages spécifiques Digital
    advantages: [
      {
        title: 'Livraison Ultra-Rapide par Email',
        content: `Recevez votre clé d'activation ${productName} directement dans votre boîte email en moins de 5 minutes après votre achat. Plus besoin d'attendre plusieurs jours : notre système automatisé traite votre commande instantanément, 24h/24 et 7j/7. Vous pouvez installer votre logiciel dès maintenant, même à 3h du matin un dimanche.`,
      },
      {
        title: 'Téléchargement ISO Officiel Microsoft Inclus',
        content: `Accédez immédiatement au fichier d'installation ISO authentique ${productName} depuis votre espace client. Nos liens de téléchargement pointent directement vers les serveurs officiels Microsoft ou nos serveurs miroirs sécurisés. Gravez l'ISO sur DVD, créez une clé USB bootable ou installez directement via montage virtuel.`,
      },
      {
        title: 'Prix Imbattable Sans Frais de Production',
        content: `Profitez du meilleur tarif du marché grâce à l'absence de coûts de fabrication et d'expédition. Une clé numérique ${productName} coûte ${product.base_price}€, soit 20 à 30€ de moins qu'une version DVD ou USB. Vous payez uniquement la licence Microsoft, sans surcoût logistique.`,
      },
      {
        title: 'Zéro Impact Environnemental',
        content: `Faites un geste pour la planète en choisissant la version dématérialisée. Aucun plastique, aucun carton, aucun transport routier ou aérien. Votre licence ${productName} numérique réduit votre empreinte carbone de 100% par rapport aux supports physiques, tout en offrant exactement les mêmes fonctionnalités.`,
      },
    ],
    
    // Sections détaillées
    sections: [
      {
        title: 'Comment fonctionne la livraison instantanée ?',
        content: `Dès validation de votre paiement sécurisé Stripe, notre plateforme automatisée génère votre clé ${productName} unique et vous l'envoie par email. Vous recevez simultanément vos identifiants d'accès à votre espace client AllKeyMasters, où vous pouvez télécharger l'ISO Microsoft officiel et consulter le tutoriel d'installation illustré étape par étape.`,
      },
      {
        title: 'Sauvegarde et réinstallation simplifiées',
        content: `Votre clé numérique ${productName} est stockée de manière permanente dans votre compte client sécurisé. En cas de panne de disque dur, changement de PC ou réinstallation Windows, reconnectez-vous simplement pour récupérer votre licence. Plus de risque de perdre un DVD rayé ou une clé USB égarée : votre licence est sauvegardée à vie dans le cloud.`,
      },
      {
        title: 'Installation multi-appareils selon votre licence',
        content: `Selon les termes de votre licence Microsoft ${productName}, vous pouvez installer le logiciel sur le nombre d'appareils autorisé. Téléchargez l'ISO autant de fois que nécessaire depuis votre espace client, sans limitation de bande passante. Gardez précieusement votre clé d'activation pour réactiver le logiciel en cas de besoin.`,
      },
    ],
    
    // Highlights USP
    highlights: [
      '✅ Livraison instantanée par email (< 5 min)',
      '✅ ISO Microsoft officiel téléchargeable 24/7',
      '✅ Activation immédiate sans attente',
      `✅ Prix le plus bas : ${product.base_price}€ (économie 20-30€)`,
      '✅ Zéro impact environnemental (dématérialisé)',
      '✅ Sauvegarde permanente dans votre compte client',
      '✅ Réinstallation illimitée avec la même clé',
      '✅ Support technique français inclus',
    ],
    
    // Long description pour la page (combinaison de toutes les sections)
    longDescription: `Obtenez votre clé ${productName} par email en moins de 5 minutes. Notre système de livraison automatisé vous envoie immédiatement votre licence officielle Microsoft, accompagnée du lien de téléchargement ISO. Cette solution 100% numérique vous permet d'activer votre logiciel instantanément, sans frais de port ni délai d'attente. Profitez du prix le plus avantageux du marché : ${product.base_price}€ TTC, soit une économie de 20 à 30€ par rapport aux versions DVD ou USB.

**Livraison Ultra-Rapide par Email**

Dès validation de votre paiement, votre clé d'activation ${productName} est envoyée automatiquement à votre adresse email. Le processus est entièrement automatisé, garantissant une livraison en moins de 5 minutes, 24h/24 et 7j/7. Vous recevez également un accès sécurisé à votre espace client AllKeyMasters, où votre licence est archivée de manière permanente pour consultation et téléchargement ultérieur.

**Téléchargement ISO Officiel Microsoft Inclus**

Avec votre clé numérique ${productName}, vous bénéficiez d'un accès direct au fichier ISO authentique Microsoft. Téléchargez l'installateur depuis les serveurs officiels de Microsoft ou via notre lien sécurisé fourni dans votre email de confirmation. Le fichier ISO vous permet de créer votre propre support d'installation (USB ou DVD) si besoin, offrant une flexibilité maximale pour installer le logiciel sur vos appareils.

**Prix Imbattable Sans Frais de Production**

Le format clé numérique élimine tous les coûts de fabrication, d'emballage et d'expédition. Cette économie se répercute directement sur votre facture : à ${product.base_price}€, c'est le moyen le plus économique d'obtenir ${productName}. Pas de frais cachés, pas de supplément pour la livraison express – vous payez uniquement pour la licence Microsoft authentique.

**Zéro Impact Environnemental**

En choisissant la clé digitale ${productName}, vous participez à la réduction des déchets électroniques et de l'empreinte carbone. Aucun plastique, aucun emballage, aucun transport polluant – juste une licence dématérialisée livrée instantanément par email. Cette approche écologique n'implique aucun compromis : votre logiciel est strictement identique aux versions physiques, avec la même authenticité Microsoft et les mêmes fonctionnalités.

**Installation multi-appareils selon votre licence**

Selon les termes de votre licence Microsoft ${productName}, vous pouvez installer le logiciel sur le nombre d'appareils autorisé. Téléchargez l'ISO autant de fois que nécessaire depuis votre espace client, sans limitation de bande passante. Gardez précieusement votre clé d'activation pour réactiver le logiciel en cas de besoin.`,
  };
}

/**
 * ========================================
 * DVD (SUPPORT PHYSIQUE OPTIQUE)
 * ========================================
 * Focus : Possession physique, réinstallation hors ligne, archivage entreprise
 */
function generateDvdSeo(product: Product): ProductVariantSeo {
  const productName = formatProductName(product);
  const dvdPrice = product.base_price + 20; // +20€ vs digital
  
  return {
    // SEO Metadata
    title: `${productName} DVD - Support Physique Original | ${dvdPrice}€`,
    metaDescription: `${productName} sur DVD authentique avec boîtier. Installation hors ligne, archivage physique pour entreprise, réinstallation sans connexion internet. Licence perpétuelle + support tangible ${dvdPrice}€.`,
    keywords: [
      'dvd original',
      'support physique',
      'installation offline',
      'sans internet',
      'archivage entreprise',
      'media tangible',
      'boîtier dvd',
      'sauvegarde physique',
      'installation hors ligne',
      'dvd microsoft',
    ],
    
    // H1
    mainTitle: `${productName} sur DVD - Support Physique de Sauvegarde`,
    
    // Intro principale
    mainDescription: `Recevez ${productName} sur DVD authentique dans un boîtier professionnel, accompagné de votre clé d'activation imprimée. Ce support optique officiel vous permet d'installer votre logiciel même sans connexion internet, idéal pour les environnements sécurisés ou isolés. Conservez votre DVD comme archive physique permanente pour vos réinstallations futures.`,
    
    // Avantages spécifiques DVD
    advantages: [
      {
        title: 'Support de Sauvegarde Physique Permanent',
        content: `Contrairement à une clé numérique immatérielle, vous possédez un DVD tangible ${productName} que vous pouvez ranger dans vos archives d'entreprise. Ce support optique reste lisible pendant 10 à 25 ans selon la qualité du disque, vous garantissant une copie d'installation permanente même si Microsoft arrête la distribution de cette version.`,
      },
      {
        title: 'Installation Hors Ligne Sans Connexion Internet',
        content: `Installez ${productName} sur des ordinateurs non connectés au réseau grâce au DVD bootable. Idéal pour les serveurs isolés, les postes de travail en zone sécurisée ANSSI, ou les PC d'atelier sans Wi-Fi. Tout le contenu d'installation est gravé sur le disque : vous n'avez besoin d'aucun téléchargement, même pas pour les fichiers d'installation de base.`,
      },
      {
        title: 'Conformité Archivage pour Entreprises et Administrations',
        content: `Les normes comptables et d'audit imposent parfois la conservation de supports physiques d'installation pendant 10 ans. Le DVD ${productName} répond à cette exigence réglementaire : vous pouvez le classer dans votre salle d'archives avec vos factures et contrats de licence. En cas de contrôle URSSAF ou audit ISO, vous prouvez facilement la légalité de votre logiciel.`,
      },
      {
        title: 'Objet Cadeau Tangible pour Offrir',
        content: `Offrez une version physique ${productName} à un proche, un employé ou un client : le boîtier DVD fait un cadeau concret et professionnel. Contrairement à un email avec une clé, vous remettez un objet palpable avec notice d'installation imprimée. Idéal pour les cadeaux d'entreprise de fin d'année ou les dotations matérielles pour nouveaux salariés.`,
      },
    ],
    
    // Sections détaillées
    sections: [
      {
        title: 'Contenu du coffret DVD ${productName}',
        content: `Vous recevez un boîtier DVD professionnel contenant : (1) le disque optique gravé avec l'installation complète ${productName}, (2) votre clé d'activation authentique Microsoft imprimée sur un certificat anti-contrefaçon, (3) une notice d'installation en français avec captures d'écran, (4) un guide de dépannage des erreurs courantes d'activation.`,
      },
      {
        title: 'Durée de vie et conditions de stockage',
        content: `Les DVD professionnels ${productName} que nous fournissons utilisent des disques de qualité archivage (Verbatim ou TDK), avec une durée de vie estimée de 10 à 25 ans dans des conditions normales. Stockez votre DVD à l'abri de la lumière directe du soleil, dans un boîtier fermé, à température ambiante (15-25°C). Évitez l'humidité et les rayures en manipulant le disque par les bords.`,
      },
      {
        title: 'Installation sur PC sans lecteur DVD',
        content: `Si votre ordinateur moderne ne possède pas de lecteur optique interne, utilisez un lecteur DVD USB externe (disponible pour 15-20€ chez n'importe quel revendeur informatique). Branchez le lecteur, insérez le DVD ${productName}, et lancez l'installation normalement. Vous pouvez aussi copier le contenu du DVD sur une clé USB pour créer un support d'installation réutilisable.`,
      },
    ],
    
    // Highlights USP
    highlights: [
      '✅ DVD authentique dans boîtier professionnel',
      '✅ Installation 100% hors ligne (sans internet)',
      '✅ Support de sauvegarde physique permanent (10-25 ans)',
      '✅ Conformité archivage entreprise/administration',
      '✅ Clé d\'activation imprimée sur certificat',
      '✅ Notice installation en français incluse',
      '✅ Idéal pour cadeau ou dotation matérielle',
      `✅ Livraison sécurisée Colissimo 48-72h (+${dvdPrice - product.base_price}€)`,
    ],
    
    // Long description pour la page
    longDescription: `Recevez ${productName} sur DVD authentique dans un boîtier professionnel, accompagné de votre clé d'activation Microsoft imprimée sur certificat anti-contrefaçon. Cette version physique vous permet d'installer le logiciel hors ligne, sans connexion Internet, et constitue un support de sauvegarde permanent que vous pouvez conserver pendant 10 à 25 ans. Idéal pour les entreprises soumises à des obligations d'archivage réglementaire ou pour offrir un cadeau tangible.

**Support de Sauvegarde Physique Permanent**

Le DVD ${productName} vous appartient définitivement : conservez-le dans vos archives comme preuve matérielle de votre licence Microsoft. Les disques de qualité professionnelle (Verbatim ou TDK) que nous utilisons ont une durée de vie de 10 à 25 ans dans des conditions de stockage normales. En cas de panne informatique, reformatage ou achat d'un nouvel ordinateur, vous disposez toujours d'un support physique pour réinstaller votre logiciel sans dépendre d'un téléchargement en ligne.

**Installation Hors Ligne Sans Connexion Internet**

L'un des avantages majeurs du DVD ${productName} : l'installation complète sans connexion Internet. Insérez le disque dans votre lecteur, lancez le programme d'installation, et le logiciel s'installe directement depuis le support optique. Particulièrement utile pour les PC en zone sans réseau (ateliers industriels, salles sécurisées, laboratoires) ou lorsque votre connexion ADSL est trop lente pour télécharger plusieurs Go d'installation.

**Conformité Archivage pour Entreprises et Administrations**

Les normes comptables et d'audit imposent parfois la conservation de supports physiques d'installation pendant 10 ans. Le DVD ${productName} répond à cette exigence réglementaire : vous pouvez le classer dans votre salle d'archives avec vos factures et contrats de licence. En cas de contrôle URSSAF ou audit ISO, vous prouvez facilement la légalité de votre logiciel.

**Objet Cadeau Tangible pour Offrir**

Offrez une version physique ${productName} à un proche, un employé ou un client : le boîtier DVD fait un cadeau concret et professionnel. Contrairement à un email avec une clé, vous remettez un objet palpable avec notice d'installation imprimée. Idéal pour les cadeaux d'entreprise de fin d'année ou les dotations matérielles pour nouveaux salariés.

**Contenu du coffret DVD ${productName}**

Vous recevez un boîtier DVD professionnel contenant : (1) le disque optique gravé avec l'installation complète ${productName}, (2) votre clé d'activation authentique Microsoft imprimée sur un certificat anti-contrefaçon, (3) une notice d'installation en français avec captures d'écran, (4) un guide de dépannage des erreurs courantes d'activation.

**Durée de vie et conditions de stockage**

Les DVD professionnels ${productName} que nous fournissons utilisent des disques de qualité archivage (Verbatim ou TDK), avec une durée de vie estimée de 10 à 25 ans dans des conditions normales. Stockez votre DVD à l'abri de la lumière directe du soleil, dans un boîtier fermé, à température ambiante (15-25°C). Évitez l'humidité et les rayures en manipulant le disque par les bords.

**Installation sur PC sans lecteur DVD**

Si votre ordinateur moderne ne possède pas de lecteur optique interne, utilisez un lecteur DVD USB externe (disponible pour 15-20€ chez n'importe quel revendeur informatique). Branchez le lecteur, insérez le DVD ${productName}, et lancez l'installation normalement. Vous pouvez aussi copier le contenu du DVD sur une clé USB pour créer un support d'installation réutilisable.`,
  };
}

/**
 * ========================================
 * CLÉ USB (SUPPORT PHYSIQUE MODERNE)
 * ========================================
 * Focus : Rapidité installation, PC sans lecteur, durabilité support
 */
function generateUsbKeySeo(product: Product): ProductVariantSeo {
  const productName = formatProductName(product);
  const usbPrice = product.base_price + 25; // +25€ vs digital
  
  return {
    // SEO Metadata
    title: `${productName} Clé USB Bootable - Installation Rapide | ${usbPrice}€`,
    metaDescription: `${productName} sur clé USB 3.0 bootable. Installation 3x plus rapide qu'un DVD, compatible PC sans lecteur disque, support durable et réutilisable. Licence perpétuelle + clé USB ${usbPrice}€.`,
    keywords: [
      'clé usb bootable',
      'usb 3.0',
      'installation rapide',
      'sans lecteur dvd',
      'support moderne',
      'plug and play',
      'usb réutilisable',
      'pc portable',
      'ultrabook',
      'installation usb',
    ],
    
    // H1
    mainTitle: `${productName} sur Clé USB Bootable - Installation Ultra-Rapide`,
    
    // Intro principale
    mainDescription: `Installez ${productName} en 15-20 minutes grâce à notre clé USB 3.0 bootable préchargée. Jusqu'à 3 fois plus rapide qu'un DVD grâce au débit USB 3.0 (5 Gbps vs 1,35x DVD), cette solution moderne convient parfaitement aux PC portables et ultrabooks dépourvus de lecteur optique. Votre clé d'activation est gravée sur le boîtier USB inoxydable.`,
    
    // Avantages spécifiques USB
    advantages: [
      {
        title: 'Installation 3x Plus Rapide Grâce à l\'USB 3.0',
        content: `Terminez l'installation ${productName} en 15-20 minutes au lieu de 45-60 minutes avec un DVD. La technologie USB 3.0 offre un débit de 5 Gbit/s, soit 3,7 fois supérieur à un DVD-ROM (vitesse 8x = 1,35 Gbit/s). Les fichiers se copient instantanément sur votre disque dur, réduisant drastiquement le temps d'attente et minimisant les risques d'erreur d'installation due à une lecture défectueuse.`,
      },
      {
        title: 'Compatible avec Tous les PC Modernes Sans Lecteur',
        content: `La majorité des ultrabooks, PC portables gaming et PC mini-tour récents n'ont plus de lecteur DVD pour gagner en finesse et en poids. Notre clé USB bootable ${productName} fonctionne sur n'importe quel ordinateur doté d'un port USB 2.0/3.0 (universellement présent). Branchez, bootez depuis le BIOS/UEFI, et installez : c'est aussi simple qu'un DVD, mais sans le lecteur.`,
      },
      {
        title: 'Support Durable et Réutilisable Pendant 10+ Ans',
        content: `Contrairement à un DVD qui peut se rayer ou se délaminer, une clé USB industrielle ${productName} résiste aux chocs, à l'humidité modérée et aux variations de température. Sa mémoire flash NAND conserve les données pendant 10 ans minimum sans alimentation électrique. Après installation, reformatez la clé pour l'utiliser comme stockage de fichiers classique (8 Go ou 16 Go selon modèle).`,
      },
      {
        title: 'Plug-and-Play : Aucun Logiciel Tiers Requis',
        content: `Le système d'installation ${productName} sur clé USB est 100% bootable : aucun besoin de créer vous-même une clé d'installation avec Rufus ou Media Creation Tool. Branchez la clé, démarrez votre PC en sélectionnant "Boot from USB" dans le BIOS, et le programme d'installation Microsoft démarre automatiquement. Gain de temps et simplicité maximale pour les utilisateurs non techniques.`,
      },
    ],
    
    // Sections détaillées
    sections: [
      {
        title: 'Spécifications techniques de la clé USB',
        content: `Nous fournissons une clé USB 3.0 de marque industrielle (SanDisk, Kingston ou équivalent) avec capacité 8 Go ou 16 Go selon disponibilité. Le boîtier métallique anodisé protège la mémoire flash des chocs et rayures. Votre clé ${productName} est préchargée avec l'image ISO officielle Microsoft en mode UEFI/Legacy, compatible avec tous les PC fabriqués depuis 2010.`,
      },
      {
        title: 'Comment booter depuis la clé USB ?',
        content: `Au démarrage du PC, appuyez sur la touche F12, F2, Suppr ou Échap (selon votre carte mère) pour accéder au menu de boot. Sélectionnez "USB Storage Device" ou le nom de votre clé USB dans la liste. L'installation ${productName} démarre automatiquement. Si votre PC est configuré en Secure Boot (Windows 11), assurez-vous que la clé est au format UEFI (c'est le cas de nos clés modernes).`,
      },
      {
        title: 'Réutilisation de la clé après installation',
        content: `Une fois ${productName} installé et activé sur votre PC, vous pouvez reformater la clé USB pour l'utiliser comme périphérique de stockage classique. Les 8 ou 16 Go deviennent disponibles pour sauvegarder vos documents, photos ou fichiers de travail. Conservez toutefois une copie de l'ISO ${productName} sur votre disque dur si vous prévoyez des réinstallations futures : votre clé d'activation reste valide à vie.`,
      },
    ],
    
    // Highlights USP
    highlights: [
      '✅ Clé USB 3.0 bootable préchargée',
      '✅ Installation 3x plus rapide qu\'un DVD (15-20 min)',
      '✅ Compatible tous PC sans lecteur optique',
      '✅ Support durable 10+ ans (résistant chocs/rayures)',
      '✅ Plug-and-Play : aucun logiciel requis',
      '✅ Clé d\'activation gravée sur boîtier métal',
      '✅ Réutilisable après install (8-16 Go storage)',
      `✅ Livraison rapide Chronopost 24-48h (+${usbPrice - product.base_price}€)`,
    ],
    
    // Long description pour la page
    longDescription: `Installez ${productName} en 15-20 minutes grâce à notre clé USB 3.0 bootable préchargée. Cette solution moderne combine la rapidité du numérique (transfert 3x plus rapide qu'un DVD) et la fiabilité du support physique durable. Idéale pour les ultrabooks et PC sans lecteur optique, notre clé USB garantit une installation professionnelle sans logiciel tiers, avec un support réutilisable pendant 10+ ans.

**Installation 3x Plus Rapide Grâce à l'USB 3.0**

L'interface USB 3.0 offre des vitesses de transfert allant jusqu'à 5 Gbit/s, soit environ 3 fois plus rapides qu'un lecteur DVD (1.4x). En pratique, installer ${productName} depuis notre clé USB prend 15 à 20 minutes contre 45 à 60 minutes avec un DVD. Le gain de temps est particulièrement appréciable lors de déploiements multi-postes en entreprise : économisez des heures de productivité en équipant rapidement votre parc informatique.

**Compatible avec Tous les PC Modernes Sans Lecteur**

La majorité des ultrabooks, PC portables gaming et PC mini-tour récents n'ont plus de lecteur DVD pour gagner en finesse et en poids. Notre clé USB bootable ${productName} fonctionne sur n'importe quel ordinateur doté d'un port USB 2.0/3.0 (universellement présent). Branchez, bootez depuis le BIOS/UEFI, et installez : c'est aussi simple qu'un DVD, mais sans le lecteur.

**Support Durable et Réutilisable Pendant 10+ Ans**

Contrairement à un DVD qui peut se rayer ou se délaminer, une clé USB industrielle ${productName} résiste aux chocs, à l'humidité modérée et aux variations de température. Sa mémoire flash NAND conserve les données pendant 10 ans minimum sans alimentation électrique. Après installation, reformatez la clé pour l'utiliser comme stockage de fichiers classique (8 Go ou 16 Go selon modèle).

**Plug-and-Play : Aucun Logiciel Tiers Requis**

Le système d'installation ${productName} sur clé USB est 100% bootable : aucun besoin de créer vous-même une clé d'installation avec Rufus ou Media Creation Tool. Branchez la clé, démarrez votre PC en sélectionnant "Boot from USB" dans le BIOS, et le programme d'installation Microsoft démarre automatiquement. Gain de temps et simplicité maximale pour les utilisateurs non techniques.

**Spécifications techniques de la clé USB**

Nous fournissons une clé USB 3.0 de marque industrielle (SanDisk, Kingston ou équivalent) avec capacité 8 Go ou 16 Go selon disponibilité. Le boîtier métallique anodisé protège la mémoire flash des chocs et rayures. Votre clé ${productName} est préchargée avec l'image ISO officielle Microsoft en mode UEFI/Legacy, compatible avec tous les PC fabriqués depuis 2010.

**Comment booter depuis la clé USB ?**

Au démarrage du PC, appuyez sur la touche F12, F2, Suppr ou Échap (selon votre carte mère) pour accéder au menu de boot. Sélectionnez "USB Storage Device" ou le nom de votre clé USB dans la liste. L'installation ${productName} démarre automatiquement. Si votre PC est configuré en Secure Boot (Windows 11), assurez-vous que la clé est au format UEFI (c'est le cas de nos clés modernes).

**Réutilisation de la clé après installation**

Une fois ${productName} installé et activé sur votre PC, vous pouvez reformater la clé USB pour l'utiliser comme périphérique de stockage classique. Les 8 ou 16 Go deviennent disponibles pour sauvegarder vos documents, photos ou fichiers de travail. Conservez toutefois une copie de l'ISO ${productName} sur votre disque dur si vous prévoyez des réinstallations futures : votre clé d'activation reste valide à vie.`,
  };
}

/**
 * ========================================
 * FONCTION PRINCIPALE D'EXPORT
 * ========================================
 */
export function generateProductVariantSeo(
  product: Product,
  deliveryType: 'digital' | 'dvd' | 'usb'
): ProductVariantSeo {
  switch (deliveryType) {
    case 'digital':
      return generateDigitalKeySeo(product);
    case 'dvd':
      return generateDvdSeo(product);
    case 'usb':
      return generateUsbKeySeo(product);
    default:
      return generateDigitalKeySeo(product); // Fallback
  }
}

/**
 * Générer le slug URL selon le format
 * Ex: office-2019-pro-plus → office-2019-pro-plus-usb
 */
export function generateVariantSlug(
  baseSlug: string,
  deliveryType: 'digital' | 'dvd' | 'usb'
): string {
  // Retirer le suffixe existant s'il y en a un
  const cleanSlug = baseSlug
    .replace(/-digital-key$/, '')
    .replace(/-dvd$/, '')
    .replace(/-usb$/, '');
  
  // Ajouter le nouveau suffixe
  switch (deliveryType) {
    case 'digital':
      return `${cleanSlug}-digital-key`;
    case 'dvd':
      return `${cleanSlug}-dvd`;
    case 'usb':
      return `${cleanSlug}-usb`;
    default:
      return `${cleanSlug}-digital-key`;
  }
}

/**
 * Calculer le prix selon le format
 */
export function calculateVariantPrice(
  basePrice: number,
  deliveryType: 'digital' | 'dvd' | 'usb'
): number {
  switch (deliveryType) {
    case 'digital':
      return basePrice; // Prix de base
    case 'dvd':
      return basePrice + 20; // +20€ pour DVD
    case 'usb':
      return basePrice + 25; // +25€ pour USB
    default:
      return basePrice;
  }
}
