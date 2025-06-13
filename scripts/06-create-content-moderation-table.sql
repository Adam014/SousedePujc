-- Vytvoření tabulky pro logování moderace obsahu
CREATE TABLE IF NOT EXISTS content_moderation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  original_message TEXT NOT NULL,
  filtered_message TEXT NOT NULL,
  filtered_words TEXT[] NOT NULL,
  context_type VARCHAR(50) NOT NULL DEFAULT 'chat_message',
  context_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexy pro lepší výkon
CREATE INDEX IF NOT EXISTS idx_content_moderation_logs_user_id ON content_moderation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_content_moderation_logs_created_at ON content_moderation_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_content_moderation_logs_context ON content_moderation_logs(context_type, context_id);

-- RLS policies
ALTER TABLE content_moderation_logs ENABLE ROW LEVEL SECURITY;

-- Pouze admini mohou číst logy moderace
CREATE POLICY "Admins can view moderation logs" ON content_moderation_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- Systém může vkládat logy
CREATE POLICY "System can insert moderation logs" ON content_moderation_logs
  FOR INSERT WITH CHECK (true);
