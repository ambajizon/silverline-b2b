-- =============================================
-- FIX RLS POLICIES FOR APP_SETTINGS TABLE
-- Run this if you're getting "row-level security policy" error
-- =============================================

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "Anyone can read app settings" ON public.app_settings;
DROP POLICY IF EXISTS "Authenticated users can read app settings" ON public.app_settings;
DROP POLICY IF EXISTS "Service role full access" ON public.app_settings;
DROP POLICY IF EXISTS "Authenticated can insert app settings" ON public.app_settings;
DROP POLICY IF EXISTS "Authenticated can update app settings" ON public.app_settings;
DROP POLICY IF EXISTS "Authenticated can delete app settings" ON public.app_settings;

-- Create new policies

-- 1. Anyone can READ settings (public access for resellers)
CREATE POLICY "Anyone can read app settings"
ON public.app_settings
FOR SELECT
TO public
USING (true);

-- 2. Service role has FULL ACCESS (bypasses RLS but be explicit)
CREATE POLICY "Service role full access"
ON public.app_settings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. Authenticated users can INSERT settings
CREATE POLICY "Authenticated can insert app settings"
ON public.app_settings
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 4. Authenticated users can UPDATE settings
CREATE POLICY "Authenticated can update app settings"
ON public.app_settings
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 5. Authenticated users can DELETE settings
CREATE POLICY "Authenticated can delete app settings"
ON public.app_settings
FOR DELETE
TO authenticated
USING (true);

-- Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'app_settings'
ORDER BY policyname;

-- =============================================
-- SUCCESS! Policies updated
-- Now try updating support contact in admin panel
-- =============================================
