-- =============================================
-- STEP 4: CREATE HELPER FUNCTION
-- Run this after policies are created
-- =============================================

-- Function to get current silver rate
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_current_silver_rate() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_silver_rate() TO anon;

-- Test function
SELECT public.get_current_silver_rate();
