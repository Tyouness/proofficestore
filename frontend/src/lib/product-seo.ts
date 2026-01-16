// Générateur de contenu SEO unique par produit
// Utilisé pour metadata, descriptions longues et FAQ

interface ProductSeoData {
  title: string; // 55-60 caractères
  metaDescription: string; // 150-160 caractères
  longDescription: string; // 400-600 mots
  benefits: string[];
  useCases: string[];
}

export function generateProductSeo(product: {
  name: string;
  family: string;
  version?: string;
  edition?: string;
  delivery_type: string;
  base_price: number;
  slug: string;
}): ProductSeoData {
  const isOffice = product.family === 'office';
  const isWindows = product.family === 'windows';
  const isDigital = product.delivery_type === 'digital_key';
  const deliveryText = isDigital ? 'Livraison Immédiate' : 'Livraison Rapide';

  // Extraction version et édition
  const version = product.version || '';
  const isPro = product.edition?.includes('professional') || product.name.toLowerCase().includes('pro');
  const isHome = product.edition?.includes('home') || product.name.toLowerCase().includes('home');

  // TITLE SEO (55-60 caractères)
  let title = '';
  if (isOffice && isPro) {
    title = `${product.name} – Licence Pro | ${deliveryText}`;
  } else if (isOffice && isHome) {
    title = `${product.name} – Licence Famille | Achat Direct`;
  } else if (isWindows) {
    title = `${product.name} – Clé Activation | ${deliveryText}`;
  } else {
    title = `${product.name} – Licence Officielle`;
  }
  
  // S'assurer que le title ne dépasse pas 60 caractères
  if (title.length > 60) {
    title = title.slice(0, 57) + '...';
  }

  // META DESCRIPTION (150-160 caractères)
  let metaDescription = '';
  if (isOffice && isPro) {
    metaDescription = `Achetez ${product.name} authentique à ${product.base_price.toFixed(2)}€. Licence perpétuelle Microsoft. Activation immédiate. Support français inclus. Paiement sécurisé.`;
  } else if (isOffice && isHome) {
    metaDescription = `${product.name} officiel pour particuliers. Licence à vie ${product.base_price.toFixed(2)}€. Installation simple. Livraison instantanée. Garantie Microsoft authentique.`;
  } else if (isWindows) {
    metaDescription = `Clé ${product.name} authentique ${product.base_price.toFixed(2)}€. Licence perpétuelle Microsoft. Activation en 5 min. Support technique gratuit. Garantie satisfait ou remboursé.`;
  } else {
    metaDescription = `Licence ${product.name} officielle. ${deliveryText}. Prix compétitif ${product.base_price.toFixed(2)}€. Support français. Paiement 100% sécurisé.`;
  }

  // Garantir 150-160 caractères
  if (metaDescription.length > 160) {
    metaDescription = metaDescription.slice(0, 157) + '...';
  } else if (metaDescription.length < 150) {
    metaDescription += ' Achat en ligne sécurisé.';
  }

  // DESCRIPTION LONGUE (400-600 mots)
  let longDescription = '';
  
  if (isOffice && isPro) {
    longDescription = `
**${product.name}** est la solution professionnelle complète de Microsoft pour les entreprises, travailleurs indépendants et professionnels exigeants. Cette licence perpétuelle vous offre un accès à vie aux applications bureautiques essentielles, sans abonnement mensuel.

**Suite logicielle complète pour professionnels**

${product.name} regroupe l'ensemble des applications Microsoft Office dans leur version ${version} : Word pour le traitement de texte professionnel, Excel pour l'analyse de données et la comptabilité, PowerPoint pour des présentations percutantes, Outlook pour la gestion emails et calendriers, Access pour les bases de données, Publisher pour la publication assistée par ordinateur, et OneNote pour la prise de notes collaborative.

Cette édition Professional Plus se distingue par ses fonctionnalités avancées destinées aux professionnels : outils de collaboration d'entreprise, compatibilité étendue avec les formats de fichiers, macros VBA pour automatiser les tâches répétitives, et intégration complète avec les services Microsoft 365.

**Licence perpétuelle sans abonnement**

Contrairement à Microsoft 365 qui nécessite un abonnement mensuel, cette licence ${product.name} est perpétuelle. Vous payez une seule fois ${product.base_price.toFixed(2)}€ et conservez le logiciel à vie sur votre PC. Aucun frais récurrent, aucune surprise. Vous restez maître de votre investissement logiciel.

La licence authentique Microsoft que vous recevez vous permet d'installer et d'activer le logiciel sur un ordinateur Windows. En cas de changement de PC ou de réinstallation du système, vous pouvez désactiver la licence sur l'ancien ordinateur et la réactiver sur le nouveau, autant de fois que nécessaire.

**Livraison instantanée et activation immédiate**

${isDigital ? 
  'Votre clé d\'activation est envoyée par email dans les 5 minutes suivant la validation de votre paiement. Vous recevez également un lien de téléchargement direct depuis les serveurs officiels Microsoft. L\'installation complète prend environ 15 minutes selon votre connexion internet.' :
  'Votre support physique est expédié sous 24h et livré sous 3 à 5 jours ouvrés. Il contient le DVD d\'installation original Microsoft et votre clé d\'activation imprimée.'
}

L'activation se fait en quelques clics : installez le logiciel, saisissez votre clé d'activation à 25 caractères, et le système vérifie automatiquement l'authenticité auprès des serveurs Microsoft. L'activation est définitive et ne nécessite aucune manipulation supplémentaire.

**Compatibilité et configuration requise**

${product.name} est compatible avec Windows 10 et Windows 11 (versions 32-bit et 64-bit). Configuration minimale recommandée : processeur 1 GHz, 2 Go de RAM (4 Go recommandé), 4 Go d'espace disque disponible, et une résolution d'écran de 1280 x 768 pixels minimum.

Le logiciel fonctionne parfaitement hors ligne. Une connexion internet est uniquement requise pour l'activation initiale et les mises à jour de sécurité Microsoft (recommandées mais non obligatoires).

**Support technique français inclus**

Notre équipe support francophone vous accompagne gratuitement par email pour l'installation, l'activation et l'utilisation de votre licence ${product.name}. Nous répondons sous 24h maximum aux jours ouvrés. De plus, vous bénéficiez de la documentation officielle Microsoft et des tutoriels en ligne.

**Garantie authenticité Microsoft**

Toutes nos licences ${product.name} sont des clés d'activation officielles Microsoft, 100% authentiques et légales. Elles sont vérifiables directement sur le site Microsoft. Nous garantissons l'activation à 100% ou vous êtes remboursé sous 30 jours sans condition.

Achetez votre licence ${product.name} dès aujourd'hui et profitez d'un logiciel professionnel complet pour ${product.base_price.toFixed(2)}€, sans frais cachés ni abonnement.
    `.trim();
  } else if (isOffice && isHome) {
    longDescription = `
**${product.name}** est la version familiale et étudiante de la suite bureautique Microsoft Office ${version}. Conçue pour un usage personnel et domestique, cette licence perpétuelle offre les applications essentielles pour la maison, les études et les projets personnels.

**Applications essentielles pour toute la famille**

Cette édition inclut les trois piliers de la productivité bureautique : Word pour rédiger documents, lettres et rapports ; Excel pour gérer budgets familiaux, tableaux et calculs ; et PowerPoint pour créer des présentations scolaires ou personnelles. Version ${version} avec toutes les dernières fonctionnalités.

Que vous soyez étudiant, parent, ou simplement utilisateur occasionnel, ${product.name} répond à tous vos besoins bureautiques quotidiens. Interface intuitive en français, modèles prêts à l'emploi, et compatibilité totale avec les fichiers Office reçus par email ou téléchargés.

**Licence à vie sans abonnement**

Pour seulement ${product.base_price.toFixed(2)}€, vous obtenez une licence perpétuelle valable à vie. Aucun abonnement mensuel comme Microsoft 365, aucun renouvellement automatique. Vous payez une fois et conservez le logiciel définitivement sur votre PC Windows.

Cette licence authentique Microsoft peut être réinstallée autant de fois que nécessaire sur le même ordinateur. En cas de panne ou de changement de PC, il suffit de désactiver la licence sur l'ancien ordinateur pour pouvoir l'activer sur un nouveau.

**Installation simple et rapide**

${isDigital ?
  'Dès validation de votre paiement, vous recevez par email votre clé d\'activation officielle Microsoft et un lien de téléchargement direct. Installation en 10 minutes : téléchargez, installez, activez. Aucun CD/DVD requis, tout est numérique.' :
  'Vous recevez le DVD d\'installation original Microsoft par courrier sous 3-5 jours. Il contient le logiciel complet et votre clé d\'activation. Installation classique depuis le support physique.'
}

L'activation est automatique : lors de l'installation, le système vous demande votre clé à 25 caractères, puis vérifie l'authenticité auprès de Microsoft. Une fois activé, ${product.name} fonctionne pleinement hors ligne, sans nécessiter de connexion permanente.

**Usage personnel non commercial**

Important : ${product.name} est destiné à un usage strictement personnel et non commercial. Si vous êtes professionnel, auto-entrepreneur ou entreprise, nous vous recommandons la version Professional Plus qui inclut des fonctionnalités métier supplémentaires et autorise l'usage commercial.

Cette licence couvre un seul ordinateur Windows (PC de bureau ou portable). Idéal pour équiper le PC familial, l'ordinateur des enfants pour leurs devoirs, ou votre laptop personnel.

**Configuration système requise**

Compatible Windows 10 et Windows 11 (32-bit ou 64-bit). Configuration minimale : processeur 1 GHz, 2 Go de RAM, 3 Go d'espace disque. Connexion internet requise uniquement pour l'activation initiale et les mises à jour de sécurité optionnelles.

**Support client français**

Notre équipe francophone répond à toutes vos questions par email sous 24h. Que ce soit pour l'installation, l'activation, ou l'utilisation des fonctionnalités, nous vous accompagnons gratuitement. Documentation officielle Microsoft également fournie.

**Garantie satisfait ou remboursé 30 jours**

Si ${product.name} ne répond pas à vos attentes ou rencontre un problème d'activation, nous vous remboursons intégralement sous 30 jours. Aucune question posée. Nous garantissons des licences Microsoft 100% authentiques et fonctionnelles.

Commandez votre ${product.name} aujourd'hui pour ${product.base_price.toFixed(2)}€ et équipez votre foyer d'une suite bureautique complète et professionnelle.
    `.trim();
  } else if (isWindows) {
    longDescription = `
**${product.name}** est le système d'exploitation professionnel de Microsoft, conçu pour offrir performance, sécurité et productivité. Cette licence perpétuelle vous permet d'installer et d'activer Windows sur votre PC, sans frais d'abonnement.

**Système d'exploitation complet et performant**

${product.name} intègre toutes les fonctionnalités nécessaires pour un usage professionnel ou personnel exigeant : interface moderne et intuitive, Microsoft Edge pour la navigation web, Windows Defender pour la sécurité en temps réel, gestionnaire de fichiers optimisé, et compatibilité avec des milliers de logiciels et périphériques.

Cette version Pro se distingue par ses capacités professionnelles : BitLocker pour chiffrer vos données sensibles, accès distant Bureau à distance, support du domaine Active Directory pour les entreprises, Hyper-V pour la virtualisation, et Windows Update for Business pour gérer les mises à jour.

**Licence perpétuelle Microsoft authentique**

Pour ${product.base_price.toFixed(2)}€, vous obtenez une clé d'activation officielle Microsoft valable à vie. Aucun abonnement, aucun frais caché. Vous payez une fois et Windows reste installé définitivement sur votre ordinateur.

Cette licence authentique est liée à votre carte mère. En cas de changement de composants majeurs ou de nouveau PC, vous pouvez contacter le support Microsoft pour transférer votre licence. La clé reste valide indéfiniment et peut être réactivée en cas de réinstallation du système.

**Activation immédiate en 5 minutes**

${isDigital ?
  'Votre clé d\'activation Windows est envoyée par email dans les 5 minutes après paiement. Vous recevez également le lien de téléchargement officiel Microsoft (Media Creation Tool) pour créer une clé USB d\'installation bootable.' :
  'Vous recevez une clé USB bootable contenant l\'installateur Windows officiel et votre clé d\'activation imprimée. Livraison sous 3-5 jours par courrier suivi.'
}

L'installation complète prend 20-30 minutes selon votre matériel. Branchez la clé USB (ou téléchargez l'ISO), démarrez le PC dessus, suivez l'assistant d'installation, et saisissez votre clé d'activation à 25 caractères. Windows s'active automatiquement en ligne et est prêt à l'emploi.

**Mises à jour de sécurité incluses**

Votre licence ${product.name} vous donne accès aux mises à jour de sécurité Microsoft publiées régulièrement. Ces mises à jour corrigent les failles de sécurité, améliorent la stabilité du système, et ajoutent de nouvelles fonctionnalités mineures.

Vous conservez le contrôle total : installez les mises à jour quand vous le souhaitez, ou configurez l'installation automatique. Windows Update gère tout en arrière-plan sans perturber votre travail.

**Configuration requise**

${product.name} nécessite un PC compatible 64-bit avec processeur 1 GHz minimum (2 cœurs recommandés), 4 Go de RAM minimum (8 Go recommandé), 64 Go d'espace disque, et une carte graphique compatible DirectX 12. Firmware UEFI et Secure Boot requis pour une sécurité maximale.

Compatible avec la quasi-totalité des PC vendus depuis 2015. Si vous avez un doute sur la compatibilité, contactez notre support avant achat.

**Support technique français gratuit**

Notre équipe vous assiste gratuitement pour l'installation, l'activation et le dépannage de ${product.name}. Réponse par email sous 24h maximum. Nous fournissons également des tutoriels détaillés en français et la documentation officielle Microsoft.

**Garantie activation 100%**

Nous garantissons l'activation réussie de votre licence ${product.name} ou remboursement intégral sous 30 jours. Toutes nos clés proviennent de sources officielles Microsoft et sont vérifiables en ligne. Zéro risque, satisfaction garantie.

Achetez votre licence ${product.name} maintenant pour ${product.base_price.toFixed(2)}€ et profitez d'un système Windows professionnel, sécurisé et performant sur votre PC.
    `.trim();
  } else {
    longDescription = `Licence authentique ${product.name} pour un usage professionnel ou personnel. Prix compétitif ${product.base_price.toFixed(2)}€. ${deliveryText}. Support technique français inclus.`;
  }

  // BENEFITS
  const benefits = isOffice ? [
    'Licence perpétuelle à vie, paiement unique',
    isDigital ? 'Livraison par email en 5 minutes' : 'Livraison physique sous 3-5 jours',
    'Applications Office complètes en français',
    'Compatible Windows 10 et Windows 11',
    'Support technique français gratuit',
    'Réinstallation illimitée sur le même PC',
    'Garantie authenticité Microsoft 100%'
  ] : [
    'Licence Windows perpétuelle authentique',
    'Activation immédiate en ligne',
    'Mises à jour de sécurité incluses',
    'Compatible PC 64-bit récents',
    'Support technique français inclus',
    'Garantie satisfait ou remboursé 30 jours'
  ];

  // USE CASES
  const useCases = isOffice && isPro ? [
    'Travailleurs indépendants et freelances',
    'PME et TPE (bureaux, cabinets, commerces)',
    'Professions libérales (avocats, comptables, architectes)',
    'Associations et organisations'
  ] : isOffice && isHome ? [
    'Étudiants et lycéens pour devoirs et exposés',
    'Familles pour gestion budgets et courriers',
    'Particuliers pour projets personnels',
    'Usage domestique non commercial'
  ] : [
    'PC de bureau professionnels',
    'Ordinateurs portables entreprises',
    'Postes de travail individuels',
    'Stations de travail performantes'
  ];

  return {
    title,
    metaDescription,
    longDescription,
    benefits,
    useCases
  };
}
