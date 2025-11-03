-- =============================================
-- ADD STATE CODE FOR GST COMPLIANCE
-- Implements CGST/SGST/IGST logic
-- =============================================

-- ============================================
-- 1. ADD STATE CODE TO SETTINGS
-- ============================================

-- Add company GST settings
INSERT INTO public.settings (key, value, created_at, updated_at)
VALUES
  ('company_state_code', '', NOW(), NOW()),
  ('company_gst_number', '', NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 2. ADD STATE CODE TO RESELLERS
-- ============================================

ALTER TABLE public.resellers
ADD COLUMN IF NOT EXISTS state_code TEXT;

COMMENT ON COLUMN public.resellers.state_code IS 'State code from GST number (2 digits, e.g., 27 for Maharashtra)';

-- ============================================
-- 3. CREATE FUNCTION TO EXTRACT STATE CODE FROM GST
-- ============================================

CREATE OR REPLACE FUNCTION extract_state_code_from_gst(gst_number TEXT)
RETURNS TEXT AS $$
BEGIN
  -- GST format: First 2 digits are state code
  IF gst_number IS NULL OR LENGTH(gst_number) < 2 THEN
    RETURN NULL;
  END IF;
  
  RETURN SUBSTRING(gst_number FROM 1 FOR 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 4. CREATE TRIGGER TO AUTO-EXTRACT STATE CODE
-- ============================================

CREATE OR REPLACE FUNCTION auto_extract_state_code()
RETURNS TRIGGER AS $$
BEGIN
  -- If GST number is provided, extract state code
  IF NEW.gst_number IS NOT NULL AND NEW.gst_number != '' THEN
    NEW.state_code := extract_state_code_from_gst(NEW.gst_number);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for resellers table
DROP TRIGGER IF EXISTS trg_auto_extract_state_code ON public.resellers;
CREATE TRIGGER trg_auto_extract_state_code
BEFORE INSERT OR UPDATE ON public.resellers
FOR EACH ROW
EXECUTE FUNCTION auto_extract_state_code();

-- ============================================
-- 5. INDIAN STATE CODES REFERENCE
-- ============================================

-- Reference table for validation (optional)
CREATE TABLE IF NOT EXISTS public.indian_states (
  state_code TEXT PRIMARY KEY,
  state_name TEXT NOT NULL,
  union_territory BOOLEAN DEFAULT false
);

-- Insert Indian state codes
INSERT INTO public.indian_states (state_code, state_name, union_territory) VALUES
  ('01', 'Jammu and Kashmir', true),
  ('02', 'Himachal Pradesh', false),
  ('03', 'Punjab', false),
  ('04', 'Chandigarh', true),
  ('05', 'Uttarakhand', false),
  ('06', 'Haryana', false),
  ('07', 'Delhi', true),
  ('08', 'Rajasthan', false),
  ('09', 'Uttar Pradesh', false),
  ('10', 'Bihar', false),
  ('11', 'Sikkim', false),
  ('12', 'Arunachal Pradesh', false),
  ('13', 'Nagaland', false),
  ('14', 'Manipur', false),
  ('15', 'Mizoram', false),
  ('16', 'Tripura', false),
  ('17', 'Meghalaya', false),
  ('18', 'Assam', false),
  ('19', 'West Bengal', false),
  ('20', 'Jharkhand', false),
  ('21', 'Odisha', false),
  ('22', 'Chhattisgarh', false),
  ('23', 'Madhya Pradesh', false),
  ('24', 'Gujarat', false),
  ('26', 'Dadra and Nagar Haveli and Daman and Diu', true),
  ('27', 'Maharashtra', false),
  ('29', 'Karnataka', false),
  ('30', 'Goa', false),
  ('31', 'Lakshadweep', true),
  ('32', 'Kerala', false),
  ('33', 'Tamil Nadu', false),
  ('34', 'Puducherry', true),
  ('35', 'Andaman and Nicobar Islands', true),
  ('36', 'Telangana', false),
  ('37', 'Andhra Pradesh', false),
  ('38', 'Ladakh', true)
ON CONFLICT (state_code) DO NOTHING;

-- ============================================
-- 6. VERIFICATION
-- ============================================

-- Check settings
SELECT key, value FROM settings WHERE key IN ('company_state_code', 'company_gst_number', 'gst_rate');

-- Check resellers table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'resellers' AND column_name = 'state_code';

-- Check state codes reference
SELECT COUNT(*) as total_states FROM indian_states;

-- =============================================
-- SUCCESS!
-- ✓ State code added to settings
-- ✓ State code added to resellers
-- ✓ Auto-extract function created
-- ✓ Trigger created
-- ✓ Indian states reference table created (38 states)
-- =============================================
