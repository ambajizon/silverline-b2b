-- =============================================
-- STEP 3: CREATE RLS POLICIES
-- Run this after RLS is enabled
-- =============================================

-- Policy 1: Public read access
CREATE POLICY "Anyone can read silver rates"
ON public.silver_rates
FOR SELECT
TO public
USING (true);

-- Policy 2: Authenticated read access
CREATE POLICY "Authenticated users can read silver rates"
ON public.silver_rates
FOR SELECT
TO authenticated
USING (true);

-- Policy 3: Admin insert
CREATE POLICY "Admins can insert silver rates"
ON public.silver_rates
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy 4: Admin update
CREATE POLICY "Admins can update silver rates"
ON public.silver_rates
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy 5: Admin delete
CREATE POLICY "Admins can delete silver rates"
ON public.silver_rates
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Verify policies created
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'silver_rates';
