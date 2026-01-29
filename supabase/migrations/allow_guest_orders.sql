-- Migration: Permettre les commandes guest (user_id nullable)
-- Date: 2026-01-29

BEGIN;

-- Modifier la contrainte user_id pour permettre NULL (commandes guest)
ALTER TABLE public.orders 
  ALTER COLUMN user_id DROP NOT NULL;

-- Ajouter une contrainte pour s'assurer qu'on a au moins un email
ALTER TABLE public.orders 
  ADD CONSTRAINT orders_email_required CHECK (email_client IS NOT NULL AND email_client != '');

-- Index pour rechercher les commandes guest
CREATE INDEX IF NOT EXISTS idx_orders_guest ON public.orders(email_client) WHERE user_id IS NULL;

COMMIT;
