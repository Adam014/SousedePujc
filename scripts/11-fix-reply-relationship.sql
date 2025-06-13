-- Nejprve odstraníme existující foreign key constraint pokud existuje
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_reply_to_id_fkey;

-- Přidáme sloupec reply_to_id pokud neexistuje
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS reply_to_id UUID;

-- Vytvoříme správný foreign key constraint s explicitním názvem
ALTER TABLE chat_messages 
ADD CONSTRAINT fk_chat_messages_reply_to 
FOREIGN KEY (reply_to_id) 
REFERENCES chat_messages(id) 
ON DELETE SET NULL;

-- Vytvoříme index pro rychlejší dotazy
CREATE INDEX IF NOT EXISTS idx_chat_messages_reply_to_id ON chat_messages(reply_to_id);

-- Aktualizujeme RLS policies
DROP POLICY IF EXISTS "Users can read messages in their rooms" ON chat_messages;
CREATE POLICY "Users can read messages in their rooms" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_rooms 
      WHERE chat_rooms.id = chat_messages.room_id 
      AND (chat_rooms.owner_id = auth.uid() OR chat_rooms.borrower_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert messages in their rooms" ON chat_messages;
CREATE POLICY "Users can insert messages in their rooms" ON chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_rooms 
      WHERE chat_rooms.id = chat_messages.room_id 
      AND (chat_rooms.owner_id = auth.uid() OR chat_rooms.borrower_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update their own messages" ON chat_messages;
CREATE POLICY "Users can update their own messages" ON chat_messages
  FOR UPDATE USING (sender_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own messages" ON chat_messages;
CREATE POLICY "Users can delete their own messages" ON chat_messages
  FOR DELETE USING (sender_id = auth.uid());
