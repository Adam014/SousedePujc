# Supabase Storage Setup Guide

## Manual Setup (Recommended)

1. **Go to Supabase Dashboard**
   - Open your project in Supabase Dashboard
   - Navigate to Storage section

2. **Create Bucket**
   - Click "New bucket"
   - Bucket name: `avatars`
   - Public bucket: `✓ Yes`
   - File size limit: `2097152` (2MB)
   - Allowed MIME types: `image/jpeg,image/png,image/gif,image/webp`

3. **Set up RLS Policies**
   - Go to SQL Editor
   - Run the policies script below

## RLS Policies Script

\`\`\`sql
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
\`\`\`

## Troubleshooting

- **JSON.parse error**: Bucket doesn't exist - create it manually
- **Policy error**: Run the RLS policies script
- **Upload fails**: Check bucket permissions and file size
