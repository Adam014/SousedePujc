-- Vytvoření tabulky pro reakce na zprávy
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unikátní constraint - jeden uživatel může mít pouze jednu reakci daného typu na zprávu
  UNIQUE(message_id, user_id, emoji)
);

-- Indexy pro lepší výkon
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id);

-- RLS policies
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

-- Policy pro čtení - všichni mohou číst reakce
CREATE POLICY "Anyone can read message reactions" ON message_reactions
  FOR SELECT USING (true);

-- Policy pro vkládání - pouze přihlášení uživatelé mohou přidávat reakce
CREATE POLICY "Users can add their own reactions" ON message_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy pro mazání - uživatelé mohou mazat pouze své reakce
CREATE POLICY "Users can delete their own reactions" ON message_reactions
  FOR DELETE USING (auth.uid() = user_id);
