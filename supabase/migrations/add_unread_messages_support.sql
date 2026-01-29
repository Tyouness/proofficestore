-- Migration: Ajout compteur messages non lus pour tickets support
-- Description: Ajoute unread_count et trigger pour incrémenter automatiquement

-- Ajouter la colonne unread_count
ALTER TABLE support_tickets
ADD COLUMN IF NOT EXISTS unread_count INTEGER NOT NULL DEFAULT 0;

-- Créer un trigger pour incrémenter unread_count quand l'admin répond
CREATE OR REPLACE FUNCTION increment_ticket_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Si c'est un message de l'admin, incrémenter le compteur
  IF NEW.sender_role = 'admin' THEN
    UPDATE support_tickets
    SET unread_count = unread_count + 1
    WHERE id = NEW.ticket_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_increment_unread ON support_messages;
CREATE TRIGGER trigger_increment_unread
  AFTER INSERT ON support_messages
  FOR EACH ROW
  EXECUTE FUNCTION increment_ticket_unread_count();

-- Fonction pour réinitialiser le compteur quand le client consulte
CREATE OR REPLACE FUNCTION reset_ticket_unread_count(p_ticket_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE support_tickets
  SET unread_count = 0
  WHERE id = p_ticket_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute à authenticated
GRANT EXECUTE ON FUNCTION reset_ticket_unread_count(UUID) TO authenticated;
