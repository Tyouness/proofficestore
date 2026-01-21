-- ============================================================
-- AllKeyMasters - Migration + Seed Catalogue Produits (FULL)
-- Idempotent + Durci
-- ============================================================

BEGIN;

-- 0) Colonnes catalogue (ajout si absentes)
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS family TEXT;

ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS version TEXT;

ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS edition TEXT;

ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS delivery_type TEXT;

ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS long_description TEXT;

ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS slug TEXT;

ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS name TEXT;

ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS base_price NUMERIC;

-- 1) Contraintes CHECK (idempotentes)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_family_check') THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_family_check
      CHECK (family IS NULL OR family IN ('windows', 'office'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_delivery_type_check') THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_delivery_type_check
      CHECK (delivery_type IS NULL OR delivery_type IN ('digital_key', 'dvd', 'usb'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_base_price_positive') THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_base_price_positive
      CHECK (base_price IS NULL OR base_price >= 0);
  END IF;
END $$;

-- 2) Contrainte UNIQUE sur slug (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_slug_key'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_slug_key UNIQUE (slug);
  END IF;
END $$;

-- 3) Index de performance (idempotents)
CREATE INDEX IF NOT EXISTS idx_products_family ON public.products(family);
CREATE INDEX IF NOT EXISTS idx_products_version ON public.products(version);
CREATE INDEX IF NOT EXISTS idx_products_edition ON public.products(edition);
CREATE INDEX IF NOT EXISTS idx_products_delivery_type ON public.products(delivery_type);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active) WHERE is_active = true;

-- ============================================================
-- 4) SEED PRODUITS (UPSERT via slug)
-- ============================================================

-- ---- OFFICE 2019 PROFESSIONAL PLUS (digital/dvd/usb)
INSERT INTO public.products
  (slug, name, family, version, edition, delivery_type, description, long_description, base_price, is_active, is_featured, image_url)
VALUES
  (
    'office-2019-professional-plus-digital-key',
    'Office 2019 Professional Plus - Clé Numérique',
    'office','2019','professional_plus','digital_key',
    'Suite bureautique complète avec licence perpétuelle : Word, Excel, PowerPoint, Outlook, Access, Publisher et OneNote. Sans abonnement.',
    '<h1>Office 2019 Professional Plus – Clé d''activation digitale officielle</h1><h2>Pourquoi choisir cette version professionnelle ?</h2><p>Cette suite bureautique Microsoft complète s''adresse aux professionnels et aux entreprises. Contrairement aux formules par abonnement, elle offre une licence perpétuelle : un seul paiement pour une utilisation illimitée dans le temps.</p><p>L''édition Pro Plus inclut l''ensemble des applications essentielles : Word, Excel, PowerPoint, Outlook, Access, Publisher et OneNote. Chaque logiciel bénéficie des fonctionnalités avancées réservées aux versions professionnelles, comme les macros VBA dans Excel, la gestion de bases de données avec Access, ou encore la publication assistée par ordinateur via Publisher.</p><p>Cette suite bureautique s''adresse aux utilisateurs recherchant stabilité et autonomie. Pas de connexion internet obligatoire après l''installation, pas de renouvellement mensuel, et aucune surprise dans vos dépenses informatiques.</p><h2>Livraison instantanée de votre clé Office 2019 par email</h2><p>Votre office 2019 pro plus clé d''activation vous parvient directement dans votre boîte email sous 5 à 10 minutes après validation du paiement. Le message contient votre clé produit unique de 25 caractères, ainsi que les instructions détaillées pour télécharger et installer le logiciel.</p><p>Ce mode de livraison digital présente plusieurs avantages : disponibilité immédiate 24h/24 et 7j/7, aucun risque de perte ou de détérioration d''un support physique, et accès permanent depuis votre compte client. Vous pouvez consulter votre clé Office 2019 à tout moment, même plusieurs années après l''achat.</p><p>La clé Office 2019 reste valide indéfiniment et peut être réutilisée en cas de réinstallation du système d''exploitation ou de changement de matériel. Toutes les licences sont fournies via le programme Microsoft Cloud Solution Provider (CSP) et s''activent directement via le système d''activation Microsoft. Conservez précieusement votre email de confirmation : il constitue votre preuve d''achat et votre accès à l''assistance technique.</p><h2>Téléchargement ISO officiel Microsoft</h2><p>Une fois votre clé digitale reçue, vous téléchargez le fichier d''installation via un lien sécurisé vers les sources officielles Microsoft. Le téléchargement ISO Office 2019 vous est fourni via un lien sécurisé pointant vers les sources officielles de l''éditeur.</p><p>Le fichier ISO contient l''intégralité des programmes de la suite bureautique, dans leur version complète et non modifiée. Ce format vous permet de créer une clé USB bootable, de graver un DVD de secours, ou d''installer directement par montage virtuel sous Windows 10 et Windows 11.</p><p>L''image ISO pèse environ 3,5 Go et inclut toutes les applications en version 32 bits et 64 bits. Vous choisissez l''architecture adaptée à votre ordinateur lors de l''installation. Microsoft met à jour régulièrement les fichiers d''installation pour y intégrer les correctifs de sécurité.</p><h2>Licence Office 2019 : activation, durée et compatibilité</h2><h3>Office 2019 sans abonnement : licence à vie</h3><p>La licence Office 2019 fonctionne selon le modèle perpétuel traditionnel. Vous achetez une fois, vous utilisez définitivement. Aucun abonnement mensuel, aucun renouvellement automatique, aucune expiration programmée.</p><p>Cette licence autorise l''installation sur un seul ordinateur à la fois. En cas de remplacement de votre machine, vous désactivez la licence sur l''ancien appareil et la réactivez sur le nouveau. Le système d''activation Microsoft gère les transferts de licence pour une utilisation normale sur plusieurs années.</p><p>Les mises à jour de sécurité restent disponibles, garantissant la protection de vos documents et données. Les mises à jour fonctionnelles majeures ne sont pas incluses : la version conserve ses fonctionnalités d''origine, assurant une stabilité maximale pour les environnements professionnels.</p><h3>Compatibilité Windows 10 et Windows 11</h3><p>L''édition Pro Plus fonctionne parfaitement sur Windows 10 (toutes versions récentes) et Windows 11. La compatibilité Windows 11 a été confirmée par Microsoft dès le lancement du nouveau système d''exploitation.</p><p>La configuration minimale requiert 4 Go de RAM, 4 Go d''espace disque disponible, et un processeur cadencé à 1,6 GHz minimum. Un écran de résolution 1280x768 pixels garantit un affichage optimal des interfaces.</p><p>La suite ne s''installe pas sur les anciens systèmes Windows, Microsoft ayant volontairement limité la compatibilité aux systèmes récents pour des raisons de sécurité. Pour ces anciens systèmes, des versions antérieures restent disponibles.</p><h3>Activation simple par clé produit</h3><p>L''activation Office 2019 s''effectue en quelques clics lors de la première utilisation. Après l''installation, vous ouvrez n''importe quelle application, cliquez sur "Activer", puis saisissez votre clé de 25 caractères reçue par email.</p><p>Le processus vérifie automatiquement l''authenticité auprès des serveurs Microsoft. Une connexion internet temporaire est nécessaire uniquement pour cette étape. Une fois validée, la licence reste active même hors ligne.</p><p>En cas de difficulté, l''activation téléphonique reste disponible. Microsoft propose un numéro gratuit permettant de valider manuellement votre licence avec l''assistance d''un conseiller, garantissant que chaque client puisse utiliser son logiciel sans blocage technique.</p><h2>Différences entre Office 2019 Pro Plus et les autres versions</h2><p>Cette édition se distingue des versions grand public par son éventail complet d''applications. Contrairement à la version Famille et Étudiant qui limite l''utilisateur à Word, Excel et PowerPoint, Professional Plus inclut Outlook pour la messagerie, Access pour les bases de données, et Publisher pour la mise en page professionnelle.</p><p>Par rapport à la version Famille et Petite Entreprise, l''édition Pro Plus ajoute Access et Publisher, deux outils essentiels pour les environnements professionnels avancés. Elle intègre également les fonctionnalités de collaboration réseau et les stratégies de groupe, absentes des versions familiales.</p><p>Concernant Office 2021, cette version plus récente apporte des améliorations visuelles et fonctionnelles mineures. Office 2019 reste pertinent pour les utilisateurs privilégiant la stabilité éprouvée et un tarif d''acquisition unique, tandis qu''Office 2021 s''adresse à ceux recherchant les dernières optimisations Microsoft sans passer par l''abonnement Microsoft 365.</p><p>La différence avec Microsoft 365 (anciennement Office 365) réside dans le modèle économique : cette version s''achète une fois et reste acquise, tandis que Microsoft 365 requiert un abonnement mensuel ou annuel. Elle convient aux utilisateurs préférant maîtriser leurs dépenses logicielles sur le long terme.</p><h2>Questions fréquentes sur Office 2019 Professional Plus</h2><p><strong>Puis-je utiliser ma licence sur plusieurs ordinateurs ?</strong><br>Non, la licence autorise l''installation sur un seul PC à la fois. Vous pouvez toutefois transférer la licence vers un nouvel ordinateur en la désactivant sur l''ancien.</p><p><strong>Les mises à jour sont-elles incluses ?</strong><br>Oui, les mises à jour de sécurité et correctifs sont fournis gratuitement. Les nouvelles fonctionnalités majeures ne sont pas ajoutées, préservant la stabilité du logiciel.</p><p><strong>Office 2019 convient-il pour un usage professionnel intensif ?</strong><br>Oui, l''édition Professional Plus est conçue pour les environnements professionnels exigeants. Elle supporte les charges de travail intensives, les macros complexes, et les bases de données volumineuses via Access.</p><p><strong>La clé fonctionne-t-elle sur Mac ?</strong><br>Non, cette clé est exclusivement conçue pour Windows. Les utilisateurs Mac doivent se procurer Office 2019 pour Mac, qui utilise un système de licence différent.</p><p><strong>Combien de temps l''activation reste-t-elle valide ?</strong><br>Indéfiniment. Une fois activée, votre licence ne s''expire jamais. Vous conservez l''accès à tous les logiciels sans limitation de durée.</p>',
    149.90, true, true,
    '/images/products/office-2019-pro-plus.jpg'
  ),
  (
    'office-2019-professional-plus-dvd',
    'Office 2019 Professional Plus - DVD',
    'office','2019','professional_plus','dvd',
    'Suite Office complète - support DVD.',
    '<h1>Office 2019 Professional Plus – Version DVD</h1><h2>Pourquoi choisir le support physique pour votre licence professionnelle ?</h2><p>Cette édition complète de Microsoft Office 2019 arrive sur support d''installation physique accompagné de sa clé d''activation fournie sur support imprimé. Cette solution s''adresse aux professionnels et aux organisations privilégiant l''autonomie face aux téléchargements volumineux et la maîtrise totale de leurs outils d''installation.</p><p>L''office 2019 pro plus dvd inclut l''ensemble des applications essentielles : Word, Excel, PowerPoint, Outlook, Access, Publisher et OneNote. Chaque logiciel bénéficie des fonctionnalités avancées réservées aux versions professionnelles, comme les macros VBA dans Excel, la gestion de bases de données avec Access, ou encore la publication assistée par ordinateur via Publisher.</p><p>Cette licence Office 2019 DVD fonctionne selon le modèle perpétuel : un seul paiement pour une utilisation illimitée dans le temps, sans abonnement mensuel ni renouvellement automatique. Idéal pour les budgets informatiques maîtrisés sur le long terme.</p><h2>Support d''installation physique : avantages concrets</h2><p>Le support d''installation physique présente plusieurs atouts stratégiques pour les environnements professionnels. Contrairement aux versions téléchargeables nécessitant une connexion internet stable et rapide, ce format permet une installation Office 2019 sans internet sur l''ensemble de votre parc informatique.</p><p>Cette caractéristique se révèle particulièrement utile dans plusieurs scénarios : zones géographiques à faible débit, sites industriels isolés, infrastructures sécurisées déconnectées, ou encore installations multiples simultanées sans saturer la bande passante de l''entreprise.</p><p>Le support d''installation physique facilite également l''archivage interne des éléments d''installation. Vous conservez un support permanent pour vos réinstallations futures, vos déploiements sur nouveaux postes, ou vos restaurations après incidents techniques, sans dépendre de la disponibilité des serveurs de téléchargement.</p><h2>DVD ou clé digitale : quelle différence pour votre usage ?</h2><p>La principale distinction entre Office 2019 version DVD et la clé numérique réside dans le mode de livraison et d''installation. La version digitale nécessite un téléchargement de 3,5 Go depuis internet, tandis que le support physique contient déjà tous les fichiers nécessaires.</p><p>Pour les utilisateurs bénéficiant d''une connexion internet rapide et stable, la clé digitale offre une disponibilité immédiate par email. En revanche, l''Office 2019 support physique convient mieux aux environnements contraints en bande passante, aux installations massives simultanées, ou aux organisations imposant des protocoles de sécurité stricts limitant les téléchargements externes.</p><p>Les deux versions activent exactement la même licence perpétuelle et donnent accès aux mêmes applications avec des fonctionnalités identiques. Le choix dépend exclusivement de vos contraintes d''infrastructure et de vos préférences en matière de gestion des supports d''installation.</p><h2>Licence perpétuelle : activation, durée et compatibilité</h2><h3>Office 2019 sans abonnement : licence à vie</h3><p>Cette licence fonctionne selon le modèle perpétuel traditionnel de Microsoft. Vous achetez une fois, vous utilisez définitivement. Aucun abonnement mensuel, aucun renouvellement automatique, aucune expiration programmée.</p><p>L''activation s''effectue avec la clé produit de 25 caractères fournie sur support imprimé. Après installation depuis le support physique, vous ouvrez n''importe quelle application, cliquez sur "Activer", puis saisissez votre clé. Le système Microsoft vérifie l''authenticité et valide votre licence de manière permanente.</p><p>La licence autorise l''installation sur un seul ordinateur à la fois. En cas de remplacement de votre machine, vous désactivez la licence sur l''ancien appareil et la réactivez sur le nouveau en utilisant le même support d''installation. Ce processus peut être répété sans limitation dans le temps.</p><h3>Compatibilité Windows 10 et Windows 11</h3><p>L''édition Professional Plus fonctionne parfaitement sur Windows 10 (versions récentes) et Windows 11. Microsoft a confirmé la compatibilité complète dès le lancement du nouveau système d''exploitation.</p><p>La configuration minimale requiert 4 Go de RAM, 4 Go d''espace disque disponible, et un processeur cadencé à 1,6 GHz minimum. Un lecteur DVD est évidemment nécessaire pour lire le support d''installation physique fourni. Si votre ordinateur ne dispose pas de lecteur optique, vous pouvez utiliser un lecteur externe USB ou copier le contenu du support sur une clé USB depuis un autre poste.</p><p>Les mises à jour de sécurité restent disponibles gratuitement après activation, garantissant la protection de vos documents et données professionnelles sur toute la durée d''utilisation.</p><h3>Installation hors ligne et déploiement réseau</h3><p>Le principal avantage du support physique réside dans l''installation Office 2019 hors ligne complète. Une fois le support inséré, l''installation se déroule entièrement depuis le lecteur local sans requérir de connexion internet, à l''exception de l''activation finale qui nécessite une brève validation en ligne.</p><p>Pour les environnements totalement déconnectés, Microsoft propose une activation téléphonique gratuite permettant de valider manuellement votre licence avec l''assistance d''un conseiller. Cette procédure garantit que même les infrastructures les plus sécurisées peuvent activer leurs licences légalement.</p><p>Les administrateurs réseau peuvent également déployer l''installation à partir d''un point de montage centralisé créé depuis le support physique, accélérant considérablement les installations massives sur plusieurs dizaines de postes.</p><h2>Applications incluses : suite bureautique complète</h2><p>Professional Plus représente l''édition la plus complète de la gamme Office 2019. Elle intègre toutes les applications essentielles pour un environnement professionnel exigeant.</p><p>Word assure le traitement de texte avancé avec révision collaborative, styles automatisés et fusion de documents. Excel gère les tableaux de données complexes, les analyses croisées, les macros VBA et la modélisation financière. PowerPoint crée des présentations professionnelles avec animations et transitions avancées.</p><p>Outlook centralise la messagerie, le calendrier et les contacts avec synchronisation Exchange Server. Access développe et gère des bases de données relationnelles pour des volumes importants d''informations structurées. Publisher conçoit des supports de communication professionnels : brochures, catalogues, newsletters.</p><p>OneNote organise vos notes et informations en carnets numériques partageables. Cette combinaison complète couvre l''ensemble des besoins bureautiques d''une organisation professionnelle.</p><h2>Différences entre éditions Office 2019</h2><p>L''édition Professional Plus se distingue des versions grand public par son éventail complet d''applications. Contrairement à la version Famille et Étudiant limitée à Word, Excel et PowerPoint, Professional Plus ajoute Outlook, Access et Publisher.</p><p>Par rapport à la version Famille et Petite Entreprise qui inclut Outlook, l''édition Pro Plus intègre Access et Publisher, deux outils essentiels pour les environnements professionnels avancés. Elle propose également les fonctionnalités de collaboration réseau et les stratégies de groupe, absentes des versions familiales.</p><p>La différence avec Microsoft 365 (anciennement Office 365) réside dans le modèle économique : cette version s''achète une fois et reste acquise définitivement, tandis que Microsoft 365 requiert un abonnement mensuel ou annuel récurrent. Elle convient aux organisations préférant maîtriser leurs dépenses logicielles sur le long terme.</p><h2>Questions fréquentes sur la version DVD</h2><p><strong>Mon ordinateur n''a pas de lecteur DVD, puis-je utiliser cette version ?</strong><br>Oui, vous pouvez utiliser un lecteur DVD externe USB ou copier le contenu du support sur une clé USB depuis un autre ordinateur équipé. Le support physique reste ensuite disponible pour vos archivages et futures réinstallations.</p><p><strong>Puis-je installer sur plusieurs ordinateurs avec le même support ?</strong><br>Le support d''installation physique peut être utilisé sur plusieurs machines, mais la licence n''autorise qu''une seule activation simultanée. Vous devez acheter autant de licences que de postes à équiper. Le support sert uniquement à faciliter l''installation.</p><p><strong>Les mises à jour nécessitent-elles internet ?</strong><br>Les mises à jour de sécurité se téléchargent via Windows Update et nécessitent une connexion internet. Vous pouvez toutefois utiliser les logiciels sans limitation après l''installation et l''activation, même hors ligne.</p><p><strong>La clé d''activation peut-elle être réutilisée après réinstallation ?</strong><br>Oui, votre clé produit reste valide indéfiniment. En cas de réinstallation du système ou de changement de matériel, vous réutilisez le même support d''installation et la même clé d''activation fournie initialement.</p><p><strong>Quelle est la différence de prix avec la version digitale ?</strong><br>Le support physique inclut les coûts de production, conditionnement et expédition, expliquant une différence tarifaire par rapport à la clé numérique téléchargeable. Ce surcoût se justifie par les avantages stratégiques du support d''installation physique pour certaines organisations.</p>',
    169.90, true, false,
    '/images/products/office-2019-pro-plus.jpg'
  ),
  (
    'office-2019-professional-plus-usb',
    'Office 2019 Professional Plus - Clé USB',
    'office','2019','professional_plus','usb',
    'Suite Office complète - support USB bootable.',
    'Microsoft Office 2019 Professional Plus sur clé USB bootable. Installation simplifiée. Licence perpétuelle.',
    179.90, true, false,
    '/images/products/office-2019-pro-plus.jpg'
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  family = EXCLUDED.family,
  version = EXCLUDED.version,
  edition = EXCLUDED.edition,
  delivery_type = EXCLUDED.delivery_type,
  description = EXCLUDED.description,
  long_description = EXCLUDED.long_description,
  base_price = EXCLUDED.base_price,
  is_active = EXCLUDED.is_active,
  is_featured = EXCLUDED.is_featured,
  image_url = EXCLUDED.image_url;

-- ---- OFFICE 2021 PROFESSIONAL PLUS (digital/dvd/usb)
INSERT INTO public.products
  (slug, name, family, version, edition, delivery_type, description, long_description, base_price, is_active, is_featured, image_url)
VALUES
  (
    'office-2021-professional-plus-digital-key',
    'Office 2021 Professional Plus - Clé Numérique',
    'office','2021','professional_plus','digital_key',
    'Suite Office 2021 complète (pro) : Word, Excel, PowerPoint, Outlook, etc.',
    'Microsoft Office 2021 Professional Plus inclut Word, Excel, PowerPoint, Outlook, OneNote, Access, Publisher, Teams. Licence perpétuelle 1 PC Windows. Livraison instantanée.',
    189.90, true, true,
    '/images/products/office-2021-pro-plus.jpg'
  ),
  (
    'office-2021-professional-plus-dvd',
    'Office 2021 Professional Plus - DVD',
    'office','2021','professional_plus','dvd',
    'Suite Office 2021 complète - support DVD.',
    'Microsoft Office 2021 Professional Plus sur DVD. Licence perpétuelle, support physique.',
    209.90, true, false,
    '/images/products/office-2021-pro-plus.jpg'
  ),
  (
    'office-2021-professional-plus-usb',
    'Office 2021 Professional Plus - Clé USB',
    'office','2021','professional_plus','usb',
    'Suite Office 2021 complète - support USB bootable.',
    'Microsoft Office 2021 Professional Plus sur clé USB bootable. Licence perpétuelle.',
    219.90, true, false,
    '/images/products/office-2021-pro-plus.jpg'
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  family = EXCLUDED.family,
  version = EXCLUDED.version,
  edition = EXCLUDED.edition,
  delivery_type = EXCLUDED.delivery_type,
  description = EXCLUDED.description,
  long_description = EXCLUDED.long_description,
  base_price = EXCLUDED.base_price,
  is_active = EXCLUDED.is_active,
  is_featured = EXCLUDED.is_featured,
  image_url = EXCLUDED.image_url;

-- ---- OFFICE 2024 PROFESSIONAL PLUS (digital only)
INSERT INTO public.products
  (slug, name, family, version, edition, delivery_type, description, long_description, base_price, is_active, is_featured, image_url)
VALUES
  (
    'office-2024-professional-plus-digital-key',
    'Office 2024 Professional Plus - Clé Numérique',
    'office','2024','professional_plus','digital_key',
    'Suite Office 2024 dernière génération.',
    'Microsoft Office 2024 Professional Plus. Licence perpétuelle pour 1 PC Windows. Livraison instantanée.',
    229.90, true, false,
    '/images/products/office-2024-pro-plus.jpg'
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  family = EXCLUDED.family,
  version = EXCLUDED.version,
  edition = EXCLUDED.edition,
  delivery_type = EXCLUDED.delivery_type,
  description = EXCLUDED.description,
  long_description = EXCLUDED.long_description,
  base_price = EXCLUDED.base_price,
  is_active = EXCLUDED.is_active,
  is_featured = EXCLUDED.is_featured,
  image_url = EXCLUDED.image_url;

-- ---- OFFICE 2019 HOME & STUDENT (digital/dvd)
INSERT INTO public.products
  (slug, name, family, version, edition, delivery_type, description, long_description, base_price, is_active, is_featured, image_url)
VALUES
  (
    'office-2019-home-student-digital-key',
    'Office 2019 Famille et Étudiant - Clé Numérique',
    'office','2019','home_student','digital_key',
    'Word, Excel, PowerPoint, OneNote.',
    'Office 2019 Famille et Étudiant : licence perpétuelle (Word, Excel, PowerPoint, OneNote) pour 1 PC Windows. Livraison instantanée.',
    89.90, true, false,
    '/images/products/office-2019-home-student.jpg'
  ),
  (
    'office-2019-home-student-dvd',
    'Office 2019 Famille et Étudiant - DVD',
    'office','2019','home_student','dvd',
    'Word, Excel, PowerPoint, OneNote - support DVD.',
    'Office 2019 Famille et Étudiant sur DVD : licence perpétuelle, support physique.',
    99.90, true, false,
    '/images/products/office-2019-home-student.jpg'
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  family = EXCLUDED.family,
  version = EXCLUDED.version,
  edition = EXCLUDED.edition,
  delivery_type = EXCLUDED.delivery_type,
  description = EXCLUDED.description,
  long_description = EXCLUDED.long_description,
  base_price = EXCLUDED.base_price,
  is_active = EXCLUDED.is_active,
  is_featured = EXCLUDED.is_featured,
  image_url = EXCLUDED.image_url;

-- ---- OFFICE 2021 HOME & STUDENT (digital/dvd)
INSERT INTO public.products
  (slug, name, family, version, edition, delivery_type, description, long_description, base_price, is_active, is_featured, image_url)
VALUES
  (
    'office-2021-home-student-digital-key',
    'Office 2021 Famille et Étudiant - Clé Numérique',
    'office','2021','home_student','digital_key',
    'Word, Excel, PowerPoint, OneNote.',
    'Office 2021 Famille et Étudiant : licence perpétuelle (Word, Excel, PowerPoint, OneNote) pour 1 PC Windows. Livraison instantanée.',
    109.90, true, false,
    '/images/products/office-2021-home-student.jpg'
  ),
  (
    'office-2021-home-student-dvd',
    'Office 2021 Famille et Étudiant - DVD',
    'office','2021','home_student','dvd',
    'Word, Excel, PowerPoint, OneNote - support DVD.',
    'Office 2021 Famille et Étudiant sur DVD : licence perpétuelle, support physique.',
    119.90, true, false,
    '/images/products/office-2021-home-student.jpg'
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  family = EXCLUDED.family,
  version = EXCLUDED.version,
  edition = EXCLUDED.edition,
  delivery_type = EXCLUDED.delivery_type,
  description = EXCLUDED.description,
  long_description = EXCLUDED.long_description,
  base_price = EXCLUDED.base_price,
  is_active = EXCLUDED.is_active,
  is_featured = EXCLUDED.is_featured,
  image_url = EXCLUDED.image_url;

-- ---- OFFICE 2019 HOME & BUSINESS (digital/dvd)
INSERT INTO public.products
  (slug, name, family, version, edition, delivery_type, description, long_description, base_price, is_active, is_featured, image_url)
VALUES
  (
    'office-2019-home-business-digital-key',
    'Office 2019 Famille et Petite Entreprise - Clé Numérique',
    'office','2019','home_business','digital_key',
    'Word, Excel, PowerPoint, Outlook, OneNote.',
    'Office 2019 Famille et Petite Entreprise : licence perpétuelle (Word, Excel, PowerPoint, Outlook, OneNote) pour 1 PC Windows. Livraison instantanée.',
    119.90, true, false,
    '/images/products/office-2019-home-business.jpg'
  ),
  (
    'office-2019-home-business-dvd',
    'Office 2019 Famille et Petite Entreprise - DVD',
    'office','2019','home_business','dvd',
    'Word, Excel, PowerPoint, Outlook, OneNote - support DVD.',
    'Office 2019 Famille et Petite Entreprise sur DVD : licence perpétuelle, support physique.',
    129.90, true, false,
    '/images/products/office-2019-home-business.jpg'
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  family = EXCLUDED.family,
  version = EXCLUDED.version,
  edition = EXCLUDED.edition,
  delivery_type = EXCLUDED.delivery_type,
  description = EXCLUDED.description,
  long_description = EXCLUDED.long_description,
  base_price = EXCLUDED.base_price,
  is_active = EXCLUDED.is_active,
  is_featured = EXCLUDED.is_featured,
  image_url = EXCLUDED.image_url;

-- ---- OFFICE 2021 HOME & BUSINESS (digital/dvd)
INSERT INTO public.products
  (slug, name, family, version, edition, delivery_type, description, long_description, base_price, is_active, is_featured, image_url)
VALUES
  (
    'office-2021-home-business-digital-key',
    'Office 2021 Famille et Petite Entreprise - Clé Numérique',
    'office','2021','home_business','digital_key',
    'Word, Excel, PowerPoint, Outlook, OneNote.',
    'Office 2021 Famille et Petite Entreprise : licence perpétuelle (Word, Excel, PowerPoint, Outlook, OneNote) pour 1 PC Windows. Livraison instantanée.',
    139.90, true, false,
    '/images/products/office-2021-home-business.jpg'
  ),
  (
    'office-2021-home-business-dvd',
    'Office 2021 Famille et Petite Entreprise - DVD',
    'office','2021','home_business','dvd',
    'Word, Excel, PowerPoint, Outlook, OneNote - support DVD.',
    'Office 2021 Famille et Petite Entreprise sur DVD : licence perpétuelle, support physique.',
    149.90, true, false,
    '/images/products/office-2021-home-business.jpg'
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  family = EXCLUDED.family,
  version = EXCLUDED.version,
  edition = EXCLUDED.edition,
  delivery_type = EXCLUDED.delivery_type,
  description = EXCLUDED.description,
  long_description = EXCLUDED.long_description,
  base_price = EXCLUDED.base_price,
  is_active = EXCLUDED.is_active,
  is_featured = EXCLUDED.is_featured,
  image_url = EXCLUDED.image_url;

-- ---- WINDOWS 10 PRO (digital/dvd/usb)
INSERT INTO public.products
  (slug, name, family, version, edition, delivery_type, description, long_description, base_price, is_active, is_featured, image_url)
VALUES
  (
    'windows-10-pro-digital-key',
    'Windows 10 Professionnel - Clé Numérique',
    'windows','10','pro','digital_key',
    'OS professionnel stable et éprouvé.',
    'Windows 10 Pro : BitLocker, Bureau à distance, Hyper-V, gestion de domaine. Licence perpétuelle OEM. Livraison instantanée.',
    79.90, true, true,
    '/images/products/windows-10-pro.jpg'
  ),
  (
    'windows-10-pro-dvd',
    'Windows 10 Professionnel - DVD',
    'windows','10','pro','dvd',
    'OS pro - support DVD.',
    'Windows 10 Pro sur DVD bootable. Licence perpétuelle OEM. Support physique.',
    89.90, true, false,
    '/images/products/windows-10-pro.jpg'
  ),
  (
    'windows-10-pro-usb',
    'Windows 10 Professionnel - Clé USB',
    'windows','10','pro','usb',
    'OS pro - support USB bootable.',
    'Windows 10 Pro sur clé USB bootable. Licence perpétuelle OEM. Support USB.',
    99.90, true, false,
    '/images/products/windows-10-pro.jpg'
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  family = EXCLUDED.family,
  version = EXCLUDED.version,
  edition = EXCLUDED.edition,
  delivery_type = EXCLUDED.delivery_type,
  description = EXCLUDED.description,
  long_description = EXCLUDED.long_description,
  base_price = EXCLUDED.base_price,
  is_active = EXCLUDED.is_active,
  is_featured = EXCLUDED.is_featured,
  image_url = EXCLUDED.image_url;

-- ---- WINDOWS 11 PRO (digital/dvd/usb)
INSERT INTO public.products
  (slug, name, family, version, edition, delivery_type, description, long_description, base_price, is_active, is_featured, image_url)
VALUES
  (
    'windows-11-pro-digital-key',
    'Windows 11 Professionnel - Clé Numérique',
    'windows','11','pro','digital_key',
    'Dernier OS Microsoft, moderne et sécurisé.',
    'Windows 11 Pro : sécurité renforcée, BitLocker, Bureau à distance, Hyper-V, Windows Hello. Licence perpétuelle OEM. Livraison instantanée.',
    99.90, true, true,
    '/images/products/windows-11-pro.jpg'
  ),
  (
    'windows-11-pro-dvd',
    'Windows 11 Professionnel - DVD',
    'windows','11','pro','dvd',
    'Windows 11 Pro - support DVD.',
    'Windows 11 Pro sur DVD bootable. Licence perpétuelle OEM. Support physique.',
    109.90, true, false,
    '/images/products/windows-11-pro.jpg'
  ),
  (
    'windows-11-pro-usb',
    'Windows 11 Professionnel - Clé USB',
    'windows','11','pro','usb',
    'Windows 11 Pro - support USB bootable.',
    'Windows 11 Pro sur clé USB bootable. Licence perpétuelle OEM. Support USB.',
    119.90, true, false,
    '/images/products/windows-11-pro.jpg'
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  family = EXCLUDED.family,
  version = EXCLUDED.version,
  edition = EXCLUDED.edition,
  delivery_type = EXCLUDED.delivery_type,
  description = EXCLUDED.description,
  long_description = EXCLUDED.long_description,
  base_price = EXCLUDED.base_price,
  is_active = EXCLUDED.is_active,
  is_featured = EXCLUDED.is_featured,
  image_url = EXCLUDED.image_url;

-- ============================================================
-- 5) HARDENING : NOT NULL (uniquement si possible)
-- ============================================================
DO $$
DECLARE
  null_slugs  INTEGER;
  null_names  INTEGER;
  null_prices INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_slugs FROM public.products WHERE slug IS NULL;
  SELECT COUNT(*) INTO null_names FROM public.products WHERE name IS NULL;
  SELECT COUNT(*) INTO null_prices FROM public.products WHERE base_price IS NULL;

  IF null_slugs = 0 THEN
    ALTER TABLE public.products ALTER COLUMN slug SET NOT NULL;
  END IF;

  IF null_names = 0 THEN
    ALTER TABLE public.products ALTER COLUMN name SET NOT NULL;
  END IF;

  IF null_prices = 0 THEN
    ALTER TABLE public.products ALTER COLUMN base_price SET NOT NULL;
  END IF;
END $$;

COMMIT;

-- ============================================================
-- 6) VÉRIFICATIONS
-- ============================================================

-- Résumé des produits
SELECT 
  family,
  version,
  edition,
  delivery_type,
  COUNT(*) as count,
  SUM(CASE WHEN is_featured THEN 1 ELSE 0 END) as featured_count
FROM public.products
WHERE family IN ('windows', 'office')
GROUP BY family, version, edition, delivery_type
ORDER BY family, version DESC, edition, delivery_type;

-- Produits vedettes
SELECT slug, name, family, version, edition, delivery_type, base_price
FROM public.products
WHERE is_featured = true
ORDER BY family, version DESC, slug;
