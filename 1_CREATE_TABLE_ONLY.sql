-- =============================================
-- STEP 1: CREATE TABLE ONLY
-- Run this first
-- =============================================

-- Create the silver_rates table
CREATE TABLE IF NOT EXISTS public.silver_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rate_per_gram DECIMAL(10, 2) NOT NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_silver_rates_created_at ON public.silver_rates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_silver_rates_updated_by ON public.silver_rates(updated_by);

-- Add comments
COMMENT ON TABLE public.silver_rates IS 'Stores silver rate history - admins update, resellers view for order calculations';
COMMENT ON COLUMN public.silver_rates.rate_per_gram IS 'Silver rate per gram in rupees (₹)';
COMMENT ON COLUMN public.silver_rates.updated_by IS 'Admin user who updated this rate';

-- Verify
SELECT * FROM public.silver_rates;
