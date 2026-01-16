-- ============================================
-- Migration: Système d'avis produits (immutable)
-- - Client: SELECT public + INSERT verified purchase
-- - Client: NO UPDATE, NO DELETE
-- - Admin: soft delete only (cannot be reposted)
-- ============================================

-- 0) UUID helper
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1) Supprimer l'ancienne table si elle existe (ATTENTION: perte de données)
DROP TABLE IF EXISTS public.reviews CASCADE;

-- 2) Table reviews avec soft delete
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,

  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,

  created_at timestamptz NOT NULL DEFAULT now(),

  -- Soft delete (admin only)
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  deleted_by uuid REFERENCES auth.users(id),

  -- 1 avis max par utilisateur, par produit, par commande (même si supprimé)
  CONSTRAINT unique_user_product_order UNIQUE (user_id, product_id, order_id)
);

-- 3) Index performance
CREATE INDEX idx_reviews_product_created ON public.reviews(product_id, created_at DESC);
CREATE INDEX idx_reviews_order ON public.reviews(order_id);
CREATE INDEX idx_reviews_user ON public.reviews(user_id);
CREATE INDEX idx_reviews_not_deleted ON public.reviews(product_id) WHERE is_deleted = false;

-- 4) RLS ON
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 5) Public read: seulement les avis non supprimés
CREATE POLICY "Reviews: public read (not deleted)"
ON public.reviews
FOR SELECT
USING (is_deleted = false);

-- 6) INSERT: uniquement achat vérifié + utilisateur = user_id
CREATE POLICY "Reviews: verified buyers can insert"
ON public.reviews
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND is_deleted = false
  AND EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_id
      AND o.user_id = auth.uid()
      AND o.status = 'paid'
  )
  AND EXISTS (
    SELECT 1
    FROM public.order_items oi
    WHERE oi.order_id = order_id
      AND oi.product_id = product_id
  )
);

-- 7) ADMIN helper function
-- TEMPORAIRE: vérifier via user_roles si elle existe, sinon fallback
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier si la table user_roles existe
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_roles'
  ) THEN
    RETURN EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
    );
  ELSE
    -- Fallback: vérifier dans user_metadata
    RETURN COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
      false
    );
  END IF;
END;
$$;

-- 8) Admin can read all (including deleted)
CREATE POLICY "Reviews: admin can read all"
ON public.reviews
FOR SELECT
USING (public.is_admin() = true);

-- 9) Admin soft delete (UPDATE) uniquement
CREATE POLICY "Reviews: admin can soft delete"
ON public.reviews
FOR UPDATE
USING (public.is_admin() = true)
WITH CHECK (public.is_admin() = true);

-- Commentaires
COMMENT ON TABLE public.reviews IS 'Avis clients (1 avis par produit/commande). Client immutable. Suppression admin en soft delete.';
COMMENT ON COLUMN public.reviews.is_deleted IS 'Soft delete (admin) - l''avis reste en base pour empêcher un repost';
COMMENT ON COLUMN public.reviews.rating IS 'Note de 1 à 5 étoiles';
COMMENT ON COLUMN public.reviews.comment IS 'Commentaire optionnel du client';
