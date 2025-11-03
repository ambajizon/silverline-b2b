-- =============================================
-- CREATE APP_SETTINGS TABLE
-- This table stores application-wide settings like support contact info
-- =============================================

-- Create the table
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on setting_key for faster lookups
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON public.app_settings(setting_key);

-- Enable Row Level Security (RLS)
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can read settings (public access)
CREATE POLICY "Anyone can read app settings"
ON public.app_settings
FOR SELECT
TO public
USING (true);

-- RLS Policy: Service role can do everything (bypasses RLS anyway, but explicit)
CREATE POLICY "Service role full access"
ON public.app_settings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- RLS Policy: Authenticated users (admins) can INSERT
CREATE POLICY "Authenticated can insert app settings"
ON public.app_settings
FOR INSERT
TO authenticated
WITH CHECK (true);

-- RLS Policy: Authenticated users (admins) can UPDATE
CREATE POLICY "Authenticated can update app settings"
ON public.app_settings
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- RLS Policy: Authenticated users (admins) can DELETE
CREATE POLICY "Authenticated can delete app settings"
ON public.app_settings
FOR DELETE
TO authenticated
USING (true);

-- Insert default support contact
INSERT INTO public.app_settings (setting_key, setting_value)
VALUES (
  'support_contact',
  jsonb_build_object(
    'name', 'Support Team',
    'email', 'support@gujaratjewellery.com',
    'phone', '+91 98765 43210'
  )
)
ON CONFLICT (setting_key) DO NOTHING;

-- Verify the table was created and has data
SELECT 
  id,
  setting_key,
  setting_value,
  created_at,
  updated_at
FROM public.app_settings;

-- =============================================
-- SUCCESS! Table created with default values
-- =============================================
