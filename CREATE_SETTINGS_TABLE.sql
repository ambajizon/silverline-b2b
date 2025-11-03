-- =============================================
-- CREATE SETTINGS TABLE
-- This table stores system-wide configuration
-- =============================================

-- ============================================
-- 1. CREATE SETTINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index on key for fast lookups
CREATE INDEX IF NOT EXISTS idx_settings_key ON public.settings(key);

-- Add comments
COMMENT ON TABLE public.settings IS 'System-wide configuration settings';
COMMENT ON COLUMN public.settings.key IS 'Unique setting identifier (e.g., gst_rate, company_name)';
COMMENT ON COLUMN public.settings.value IS 'Setting value stored as text';

-- ============================================
-- 2. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. CREATE RLS POLICIES
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read settings" ON public.settings;
DROP POLICY IF EXISTS "Admins can insert settings" ON public.settings;
DROP POLICY IF EXISTS "Admins can update settings" ON public.settings;
DROP POLICY IF EXISTS "Admins can delete settings" ON public.settings;

-- Policy: Anyone can read settings (public + authenticated)
CREATE POLICY "Anyone can read settings"
ON public.settings
FOR SELECT
TO public
USING (true);

-- Policy: Only admins can insert settings
CREATE POLICY "Admins can insert settings"
ON public.settings
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy: Only admins can update settings
CREATE POLICY "Admins can update settings"
ON public.settings
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

-- Policy: Only admins can delete settings
CREATE POLICY "Admins can delete settings"
ON public.settings
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
-- 4. INSERT DEFAULT SETTINGS
-- ============================================

INSERT INTO public.settings (key, value, created_at, updated_at)
VALUES
  ('gst_rate', '0', NOW(), NOW()),
  ('extra_charges', '0', NOW(), NOW()),
  ('company_name', 'SilverLine B2B', NOW(), NOW()),
  ('company_address', '', NOW(), NOW()),
  ('company_gstin', '', NOW(), NOW()),
  ('company_phone', '', NOW(), NOW()),
  ('company_email', '', NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 5. VERIFICATION
-- ============================================

-- Check if table was created
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'settings'
ORDER BY ordinal_position;

-- Check if settings were inserted
SELECT key, value, created_at FROM settings ORDER BY key;

-- Check RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'settings';

-- Check policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'settings'
ORDER BY policyname;

-- =============================================
-- SUCCESS! Settings table created
-- Default settings inserted
-- RLS enabled with 4 policies
-- =============================================
