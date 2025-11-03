-- =============================================
-- RLS POLICIES FOR PRODUCTS TABLES
-- Security policies for categories, sub-categories, and products
-- =============================================

-- ============================================
-- 1. ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. CATEGORIES POLICIES
-- ============================================

-- Policy: Anyone can read categories (including resellers)
CREATE POLICY "Anyone can read categories"
ON public.categories
FOR SELECT
TO public
USING (true);

-- Policy: Authenticated users can read categories
CREATE POLICY "Authenticated can read categories"
ON public.categories
FOR SELECT
TO authenticated
USING (true);

-- Policy: Only admins can insert categories
CREATE POLICY "Admins can insert categories"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy: Only admins can update categories
CREATE POLICY "Admins can update categories"
ON public.categories
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

-- Policy: Only admins can delete categories
CREATE POLICY "Admins can delete categories"
ON public.categories
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ============================================
-- 3. SUB-CATEGORIES POLICIES
-- ============================================

-- Policy: Anyone can read sub-categories
CREATE POLICY "Anyone can read sub_categories"
ON public.sub_categories
FOR SELECT
TO public
USING (true);

-- Policy: Authenticated users can read sub-categories
CREATE POLICY "Authenticated can read sub_categories"
ON public.sub_categories
FOR SELECT
TO authenticated
USING (true);

-- Policy: Only admins can insert sub-categories
CREATE POLICY "Admins can insert sub_categories"
ON public.sub_categories
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy: Only admins can update sub-categories
CREATE POLICY "Admins can update sub_categories"
ON public.sub_categories
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

-- Policy: Only admins can delete sub-categories
CREATE POLICY "Admins can delete sub_categories"
ON public.sub_categories
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ============================================
-- 4. PRODUCTS POLICIES
-- ============================================

-- Policy: Anyone can read active products
CREATE POLICY "Anyone can read active products"
ON public.products
FOR SELECT
TO public
USING (status = 'active');

-- Policy: Authenticated users can read all products
CREATE POLICY "Authenticated can read products"
ON public.products
FOR SELECT
TO authenticated
USING (true);

-- Policy: Only admins can insert products
CREATE POLICY "Admins can insert products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy: Only admins can update products
CREATE POLICY "Admins can update products"
ON public.products
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

-- Policy: Only admins can delete products
CREATE POLICY "Admins can delete products"
ON public.products
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('categories', 'sub_categories', 'products')
ORDER BY tablename;

-- Check all policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('categories', 'sub_categories', 'products')
ORDER BY tablename, policyname;

-- =============================================
-- SUCCESS! RLS Policies created
-- Total: 15 policies (5 per table)
-- =============================================
