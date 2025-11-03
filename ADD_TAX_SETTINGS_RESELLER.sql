-- =============================================
-- ADD TAX SETTINGS TO RESELLER PROFILE
-- Adds GST/PAN/Aadhar fields + Update tracking
-- =============================================

-- ============================================
-- 1. ADD TAX COLUMNS TO RESELLERS TABLE
-- ============================================

ALTER TABLE public.resellers
ADD COLUMN IF NOT EXISTS has_gst BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS gst_number TEXT,
ADD COLUMN IF NOT EXISTS pan_number TEXT,
ADD COLUMN IF NOT EXISTS aadhar_number TEXT,
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS pan_holder_type TEXT CHECK (pan_holder_type IN ('individual', 'proprietorship', 'partnership', 'company', 'trust', 'huf')),
ADD COLUMN IF NOT EXISTS tax_info_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tax_info_submitted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS tax_info_update_count INTEGER DEFAULT 0;

-- Add comments
COMMENT ON COLUMN public.resellers.has_gst IS 'Whether reseller has GST registration';
COMMENT ON COLUMN public.resellers.gst_number IS 'GST registration number (15 chars)';
COMMENT ON COLUMN public.resellers.pan_number IS 'PAN card number (10 chars, mandatory if no GST)';
COMMENT ON COLUMN public.resellers.aadhar_number IS 'Aadhar card number (12 digits, optional)';
COMMENT ON COLUMN public.resellers.business_name IS 'Firm name or Individual name';
COMMENT ON COLUMN public.resellers.pan_holder_type IS 'Type of PAN holder';
COMMENT ON COLUMN public.resellers.tax_info_verified IS 'Admin verified tax information';
COMMENT ON COLUMN public.resellers.tax_info_submitted_at IS 'When tax info was first submitted';
COMMENT ON COLUMN public.resellers.tax_info_update_count IS 'Number of times tax info was updated';

-- ============================================
-- 2. CREATE TAX INFO UPDATE HISTORY TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.tax_info_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id UUID NOT NULL REFERENCES public.resellers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- What changed
  has_gst BOOLEAN,
  gst_number TEXT,
  pan_number TEXT,
  aadhar_number TEXT,
  business_name TEXT,
  pan_holder_type TEXT,
  
  -- Metadata
  update_type TEXT NOT NULL CHECK (update_type IN ('initial_submission', 'update', 'admin_correction')),
  updated_by_admin BOOLEAN DEFAULT false,
  admin_notes TEXT,
  ip_address TEXT,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tax_updates_reseller ON public.tax_info_updates(reseller_id);
CREATE INDEX IF NOT EXISTS idx_tax_updates_created ON public.tax_info_updates(created_at DESC);

-- Add comments
COMMENT ON TABLE public.tax_info_updates IS 'Audit trail for reseller tax information changes';
COMMENT ON COLUMN public.tax_info_updates.update_type IS 'Type of update: initial_submission, update, admin_correction';

-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.tax_info_updates ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CREATE RLS POLICIES FOR TAX_INFO_UPDATES
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Resellers can view own tax update history" ON public.tax_info_updates;
DROP POLICY IF EXISTS "Resellers can insert own tax updates" ON public.tax_info_updates;
DROP POLICY IF EXISTS "Admins can view all tax updates" ON public.tax_info_updates;
DROP POLICY IF EXISTS "Admins can insert tax updates" ON public.tax_info_updates;

-- Policy: Resellers can view their own tax update history
CREATE POLICY "Resellers can view own tax update history"
ON public.tax_info_updates
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy: Resellers can insert their own tax updates
CREATE POLICY "Resellers can insert own tax updates"
ON public.tax_info_updates
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND updated_by_admin = false
);

-- Policy: Admins can view all tax updates
CREATE POLICY "Admins can view all tax updates"
ON public.tax_info_updates
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy: Admins can insert tax updates (corrections)
CREATE POLICY "Admins can insert tax updates"
ON public.tax_info_updates
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ============================================
-- 5. CREATE VALIDATION FUNCTIONS
-- ============================================

-- Function to validate GST number format
CREATE OR REPLACE FUNCTION validate_gst_number(gst TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- GST format: 2 digits (state) + 10 chars (PAN) + 1 char + 1 char + 1 char
  RETURN gst ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to validate PAN number format
CREATE OR REPLACE FUNCTION validate_pan_number(pan TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- PAN format: 5 chars + 4 digits + 1 char (e.g., ABCDE1234F)
  RETURN pan ~ '^[A-Z]{5}[0-9]{4}[A-Z]{1}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to validate Aadhar number format
CREATE OR REPLACE FUNCTION validate_aadhar_number(aadhar TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Aadhar format: 12 digits (can have spaces)
  RETURN aadhar ~ '^[0-9]{12}$' OR aadhar ~ '^[0-9]{4}\s[0-9]{4}\s[0-9]{4}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 6. CREATE TRIGGER TO UPDATE COUNT
-- ============================================

-- Function to increment update count
CREATE OR REPLACE FUNCTION increment_tax_update_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.resellers
  SET 
    tax_info_update_count = COALESCE(tax_info_update_count, 0) + 1,
    tax_info_submitted_at = COALESCE(tax_info_submitted_at, NOW())
  WHERE id = NEW.reseller_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trg_increment_tax_update_count ON public.tax_info_updates;
CREATE TRIGGER trg_increment_tax_update_count
AFTER INSERT ON public.tax_info_updates
FOR EACH ROW
EXECUTE FUNCTION increment_tax_update_count();

-- ============================================
-- 7. VERIFICATION QUERIES
-- ============================================

-- Check new columns were added
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'resellers'
  AND column_name IN ('has_gst', 'gst_number', 'pan_number', 'aadhar_number', 'business_name', 'pan_holder_type', 'tax_info_verified', 'tax_info_submitted_at', 'tax_info_update_count')
ORDER BY ordinal_position;

-- Check tax_info_updates table
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'tax_info_updates'
ORDER BY ordinal_position;

-- Check RLS is enabled
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('resellers', 'tax_info_updates');

-- Check policies
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('resellers', 'tax_info_updates')
ORDER BY tablename, policyname;

-- =============================================
-- SUCCESS! Tax settings schema created
-- ✓ 9 new columns added to resellers table
-- ✓ tax_info_updates tracking table created
-- ✓ RLS policies created
-- ✓ Validation functions created
-- ✓ Auto-increment trigger created
-- =============================================
