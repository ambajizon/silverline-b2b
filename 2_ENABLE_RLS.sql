-- =============================================
-- STEP 2: ENABLE RLS
-- Run this after table is created
-- =============================================

-- Enable Row Level Security
ALTER TABLE public.silver_rates ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'silver_rates';
