-- Vytvoření bucket pro avatary pomocí Supabase Dashboard nebo SQL funkce
-- Poznámka: Tento skript by měl být spuštěn s admin právy nebo přes Supabase Dashboard

-- Nejprve zkontrolujeme, zda bucket existuje
DO $$
BEGIN
  -- Pokusíme se vytvořit bucket (toto může vyžadovat admin práva)
  INSERT INTO storage.buckets (id, name, public) 
  VALUES ('avatars', 'avatars', true)
  ON CONFLICT (id) DO NOTHING;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Insufficient privileges to create bucket. Please create bucket "avatars" manually in Supabase Dashboard.';
  WHEN OTHERS THEN
    RAISE NOTICE 'Bucket may already exist or other error occurred: %', SQLERRM;
END $$;

-- Vytvoření RLS policies pro storage.objects
-- Tyto policies by měly fungovat i bez admin práv

-- Smazání existujících policies (pokud existují)
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Policy pro čtení avatarů (veřejné)
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Policy pro upload avatarů (pouze vlastní)
CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy pro update avatarů (pouze vlastní)  
CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy pro delete avatarů (pouze vlastní)
CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
