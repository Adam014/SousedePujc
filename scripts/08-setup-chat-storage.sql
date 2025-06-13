-- Vytvoření bucket pro chat soubory
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-files', 'chat-files', true);

-- Nastavení politik pro upload
CREATE POLICY "Authenticated users can upload chat files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'chat-files' 
  AND auth.role() = 'authenticated'
);

-- Nastavení politik pro čtení
CREATE POLICY "Anyone can view chat files" ON storage.objects
FOR SELECT USING (bucket_id = 'chat-files');

-- Nastavení politik pro smazání (pouze vlastník)
CREATE POLICY "Users can delete their own chat files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'chat-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
