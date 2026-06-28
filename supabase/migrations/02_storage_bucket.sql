-- =============================================
-- STORAGE BUCKETS SETUP & POLICY CONFIGURATION
-- =============================================

-- 1. Create the 'avatar-images' public bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatar-images',
    'avatar-images',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public access to read avatar images
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatar-images');

-- 3. Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatar-images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Allow authenticated users to update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatar-images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Allow authenticated users to delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'avatar-images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);
