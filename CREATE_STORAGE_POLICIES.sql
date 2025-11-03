-- =============================================
-- STORAGE POLICIES FOR PRODUCT IMAGES
-- Bucket: product-images
-- =============================================

-- NOTE: Make sure the bucket 'product-images' exists in Supabase Storage
-- It should be created as PUBLIC bucket for easy access

-- ============================================
-- 1. POLICY: Anyone can view product images
-- ============================================

CREATE POLICY "Public can view product images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- ============================================
-- 2. POLICY: Authenticated users can view images
-- ============================================

CREATE POLICY "Authenticated can view product images"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'product-images');

-- ============================================
-- 3. POLICY: Admins can upload product images
-- ============================================

CREATE POLICY "Admins can upload product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ============================================
-- 4. POLICY: Admins can update product images
-- ============================================

CREATE POLICY "Admins can update product images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'product-images'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ============================================
-- 5. POLICY: Admins can delete product images
-- ============================================

CREATE POLICY "Admins can delete product images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ============================================
-- VERIFICATION
-- ============================================

-- Check storage policies
SELECT 
  policyname,
  bucket_id,
  permissive,
  roles,
  cmd
FROM storage.policies
WHERE bucket_id = 'product-images'
ORDER BY policyname;

-- =============================================
-- SUCCESS! Storage policies created
-- =============================================

/*
USAGE EXAMPLE:

1. Upload image via Supabase client:
   const { data, error } = await supabase.storage
     .from('product-images')
     .upload(`${productId}/${Date.now()}.jpg`, file)

2. Get public URL:
   const { data } = supabase.storage
     .from('product-images')
     .getPublicUrl(path)

3. Delete image:
   const { error } = await supabase.storage
     .from('product-images')
     .remove([path])
*/
