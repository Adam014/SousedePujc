-- Přidání sloupců pro přílohy do chat_messages
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_name TEXT,
ADD COLUMN IF NOT EXISTS attachment_type TEXT;

-- Přidání sloupce last_seen do users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Index pro lepší výkon při dotazech na last_seen
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen);
