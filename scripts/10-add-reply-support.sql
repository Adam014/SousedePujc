-- Přidání sloupce pro reply_to_id do chat_messages tabulky
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL;

-- Index pro rychlejší dotazy na replies
CREATE INDEX IF NOT EXISTS idx_chat_messages_reply_to_id ON chat_messages(reply_to_id);

-- Aktualizace RLS policies pro podporu replies
DROP POLICY IF EXISTS "Users can read messages in their rooms" ON chat_messages;
CREATE POLICY "Users can read messages in their rooms" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_rooms 
      WHERE chat_rooms.id = chat_messages.room_id 
      AND (chat_rooms.owner_id = auth.uid() OR chat_rooms.borrower_id = auth.uid())
    )
  );
