-- =============================================
-- STEP 5: INSERT DEFAULT RATE
-- Run this last
-- =============================================

-- Insert default rate (₹0.00 per gram)
INSERT INTO public.silver_rates (rate_per_gram, updated_by)
VALUES (0.00, NULL)
ON CONFLICT DO NOTHING;

-- Verify
SELECT * FROM public.silver_rates;

-- Test function
SELECT public.get_current_silver_rate() as current_rate;
