-- =============================================
-- CREATE SILVER_RATES TABLE
-- This table stores silver rate history for order calculations
-- Admin updates the rate, visible to all resellers
-- =============================================

-- Create the silver_rates table
CREATE TABLE IF NOT EXISTS public.silver_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rate_per_gram DECIMAL(10, 2) NOT NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_silver_rates_created_at ON public.silver_rates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_silver_rates_updated_by ON public.silver_rates(updated_by);

-- Add comments for documentation
COMMENT ON TABLE public.silver_rates IS 'Stores silver rate history - admins update, resellers view for order calculations';
COMMENT ON COLUMN public.silver_rates.rate_per_gram IS 'Silver rate per gram in rupees (₹)';
COMMENT ON COLUMN public.silver_rates.updated_by IS 'Admin user who updated this rate';

-- Enable Row Level Security (RLS)
ALTER TABLE public.silver_rates ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Policy 1: Anyone (including resellers) can READ silver rates
-- This allows resellers to see the current rate on their dashboard
CREATE POLICY "Anyone can read silver rates"
ON public.silver_rates
FOR SELECT
TO public
USING (true);

-- Policy 2: Authenticated users can READ silver rates
CREATE POLICY "Authenticated users can read silver rates"
ON public.silver_rates
FOR SELECT
TO authenticated
USING (true);

-- Policy 3: Only admins can INSERT new silver rates
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

-- Policy 4: Only admins can UPDATE silver rates
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

-- Policy 5: Only admins can DELETE silver rates
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

-- =============================================
-- INSERT INITIAL RATE
-- =============================================

-- Insert a default silver rate (₹0.00 per gram)
-- Admin should update this to the actual rate
INSERT INTO public.silver_rates (rate_per_gram, updated_by)
VALUES (0.00, NULL)
ON CONFLICT DO NOTHING;

-- =============================================
-- HELPER FUNCTION: Get Current Silver Rate
-- =============================================

-- Function to get the latest silver rate
CREATE OR REPLACE FUNCTION public.get_current_silver_rate()
RETURNS DECIMAL(10, 2)
LANGUAGE sql
STABLE
AS $$
  SELECT rate_per_gram
  FROM public.silver_rates
  ORDER BY created_at DESC
  LIMIT 1;
$$;

-- Grant execute permission to all authenticated users
GRANT EXECUTE ON FUNCTION public.get_current_silver_rate() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_silver_rate() TO anon;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check if table was created
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE tablename = 'silver_rates';

-- Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'silver_rates'
ORDER BY policyname;

-- Check current silver rate
SELECT 
  id,
  rate_per_gram,
  updated_by,
  created_at,
  updated_at
FROM public.silver_rates
ORDER BY created_at DESC
LIMIT 10;

-- Test the helper function
SELECT public.get_current_silver_rate() as current_rate;

-- =============================================
-- SUCCESS! Silver rates table created
-- =============================================

/*
NEXT STEPS:
1. Admin should update the silver rate via Settings page
2. Rate will automatically appear on all reseller dashboards
3. Rate is used for order amount calculations
4. Full history is maintained in the table
*/
