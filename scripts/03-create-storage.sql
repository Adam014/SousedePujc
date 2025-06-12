-- Vytvoření bucketu pro avatary
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Nastavení policy pro čtení avatarů (veřejné)
CREATE POLICY "Avatars are publicly accessible" ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

-- Nastavení policy pro nahrávání avatarů (pouze přihlášení uživatelé)
CREATE POLICY "Users can upload their own avatars" ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid() IS NOT NULL
);

-- Nastavení policy pro aktualizaci avatarů (pouze vlastní avatary)
CREATE POLICY "Users can update their own avatars" ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Nastavení policy pro mazání avatarů (pouze vlastní avatary)
CREATE POLICY "Users can delete their own avatars" ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);
