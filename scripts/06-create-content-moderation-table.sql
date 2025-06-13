-- Vytvoření tabulky pro záznamy o nevhodném obsahu
CREATE TABLE IF NOT EXISTS content_moderation_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_message TEXT NOT NULL,
    filtered_message TEXT NOT NULL,
    filtered_words TEXT[] NOT NULL,
    context_type VARCHAR(50) NOT NULL DEFAULT 'chat_message',
    context_id UUID,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pro rychlejší vyhledávání
CREATE INDEX IF NOT EXISTS idx_content_moderation_logs_user_id ON content_moderation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_content_moderation_logs_created_at ON content_moderation_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_content_moderation_logs_context ON content_moderation_logs(context_type, context_id);

-- Přidání sloupce last_seen do tabulky users pro sledování aktivity
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Trigger pro automatickou aktualizaci last_seen při přihlášení
CREATE OR REPLACE FUNCTION update_user_last_seen()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_seen = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Vytvoření triggeru pro aktualizaci last_seen
DROP TRIGGER IF EXISTS trigger_update_user_last_seen ON users;
CREATE TRIGGER trigger_update_user_last_seen
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_user_last_seen();
