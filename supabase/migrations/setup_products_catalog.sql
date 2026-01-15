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
    'Suite Office complète : Word, Excel, PowerPoint, Outlook, Access, Publisher.',
    'Microsoft Office 2019 Professional Plus inclut Word, Excel, PowerPoint, Outlook, OneNote, Access, Publisher. Licence perpétuelle pour 1 PC Windows. Livraison instantanée.',
    149.90, true, true,
    '/images/products/office-2019-pro-plus.jpg'
  ),
  (
    'office-2019-professional-plus-dvd',
    'Office 2019 Professional Plus - DVD',
    'office','2019','professional_plus','dvd',
    'Suite Office complète - support DVD.',
    'Microsoft Office 2019 Professional Plus sur DVD avec licence perpétuelle. Support physique.',
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
