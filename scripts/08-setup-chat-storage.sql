-- Vytvoření storage bucket pro chat soubory
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-files', 'chat-files', true)
ON CONFLICT (id) DO NOTHING;

-- Nastavení policies pro chat-files bucket
CREATE POLICY "Authenticated users can upload chat files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'chat-files' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Anyone can view chat files" ON storage.objects
  FOR SELECT USING (bucket_id = 'chat-files');

CREATE POLICY "Users can update their own chat files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'chat-files' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own chat files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'chat-files' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
