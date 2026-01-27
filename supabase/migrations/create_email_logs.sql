-- ================================================================
-- TABLE: email_logs
-- 
-- Purpose: Idempotence + audit trail pour tous les emails Resend
-- 
-- Règles:
-- - dedupe_key UNIQUE empêche envois doubles (Stripe retries)
-- - status: 'pending' | 'sent' | 'failed'
-- - provider: 'resend' (future: mailgun, etc.)
-- - provider_id: ID retourné par Resend (tracking)
-- ================================================================

CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  
  -- Idempotence (UNIQUE constraint)
  dedupe_key TEXT NOT NULL UNIQUE,
  
  -- Métadonnées email
  kind TEXT NOT NULL, -- 'payment_confirmation' | 'license_delivery' | 'shipping_tracking' | 'welcome' | 'admin_sale' | 'admin_signup'
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  
  -- État
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  
  -- Provider (Resend)
  provider TEXT NOT NULL DEFAULT 'resend',
  provider_id TEXT, -- ID retourné par Resend après envoi
  
  -- Erreur si échec
  error TEXT,
  
  -- Payload original (debug)
  payload JSONB
);

-- Index pour requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_email_logs_status_created 
  ON public.email_logs(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_logs_kind 
  ON public.email_logs(kind);

CREATE INDEX IF NOT EXISTS idx_email_logs_to_email 
  ON public.email_logs(to_email);

-- Trigger auto-update updated_at
CREATE OR REPLACE FUNCTION update_email_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_email_logs_updated_at
  BEFORE UPDATE ON public.email_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_email_logs_updated_at();

-- RLS (Row Level Security) - Service role only
-- 🔧 CORRECTIF PROBLÈME 3: Pas de dépendance user_roles (migration fragile)
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Pas de policy SELECT pour authenticated (seulement service_role)
-- Raison: email_logs est une table backend-only (admin via service_role)

-- Service role bypass (pour webhooks + email system)
CREATE POLICY "Service role full access"
  ON public.email_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Commentaires
COMMENT ON TABLE public.email_logs IS 'Audit trail + idempotence pour emails transactionnels Resend';
COMMENT ON COLUMN public.email_logs.dedupe_key IS 'Clé unique pour éviter doublons (ex: stripe:evt_123:payment_confirmation)';
COMMENT ON COLUMN public.email_logs.provider_id IS 'ID retourné par Resend (format: re_xxxxxxxxxx)';
COMMENT ON COLUMN public.email_logs.payload IS 'Données originales de la requête email (debug)';
