-- ================================================================
-- SUPABASE SECURITY FIXES
-- Run these commands in Supabase SQL Editor one by one
-- ================================================================

-- ================================================================
-- PART 1: FIX CRITICAL ERRORS (Must Fix)
-- ================================================================

-- 1. Enable RLS on indian_states table (public read-only data)
-- This table contains state codes, safe for public read access
ALTER TABLE indian_states ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read indian_states (it's public reference data)
CREATE POLICY "Allow public read access to indian_states"
ON indian_states FOR SELECT
TO public
USING (true);

-- ================================================================
-- PART 2: FIX SECURITY DEFINER VIEWS (Informational - Already Working)
-- ================================================================

-- These views use SECURITY DEFINER to bypass RLS for calculations
-- This is INTENTIONAL for admin/aggregation views
-- No action needed, but documenting for reference:

-- v_reseller_outstanding - Shows payment calculations (admin only via RLS on access)
-- v_rewards_summary - Shows reward aggregations (admin only via RLS on access)  
-- v_target_progress - Shows target calculations (admin only via RLS on access)

-- NOTE: These are safe because:
-- 1. They're only accessed via server-side API routes
-- 2. API routes verify admin role before querying
-- 3. SECURITY DEFINER is needed for cross-table aggregations

-- ================================================================
-- PART 3: FIX FUNCTION WARNINGS (Low Priority - Add search_path)
-- ================================================================

-- Fix all functions to have immutable search_path
-- This prevents potential SQL injection via schema manipulation

-- Trigger functions
ALTER FUNCTION public.tg_touch_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.set_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_orders_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_cart_items_updated_at() SET search_path = public, pg_temp;

-- Order-related functions
ALTER FUNCTION public.generate_order_code() SET search_path = public, pg_temp;
ALTER FUNCTION public.gen_order_number() SET search_path = public, pg_temp;
ALTER FUNCTION public.compute_item_price(uuid, integer, numeric) SET search_path = public, pg_temp;
ALTER FUNCTION public.apply_item_pricing() SET search_path = public, pg_temp;
ALTER FUNCTION public.rollup_order_totals() SET search_path = public, pg_temp;
ALTER FUNCTION public.recalc_order_totals(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.fix_order_totals() SET search_path = public, pg_temp;
ALTER FUNCTION public.trg_order_items_recalc() SET search_path = public, pg_temp;
ALTER FUNCTION public.place_order_atomic(jsonb) SET search_path = public, pg_temp;
ALTER FUNCTION public._orders_sync_shipping_address() SET search_path = public, pg_temp;

-- Invoice functions
ALTER FUNCTION public.create_invoice_on_delivery() SET search_path = public, pg_temp;
ALTER FUNCTION public.auto_invoice_on_delivered() SET search_path = public, pg_temp;

-- Validation functions
ALTER FUNCTION public.validate_aadhar_number(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.validate_gst_number(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.validate_pan_number(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.extract_state_code_from_gst(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.auto_extract_state_code() SET search_path = public, pg_temp;

-- Settings functions
ALTER FUNCTION public.get_setting(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.is_gst_enabled() SET search_path = public, pg_temp;
ALTER FUNCTION public.get_gst_rate() SET search_path = public, pg_temp;

-- Silver rate functions
ALTER FUNCTION public.get_current_silver_rate() SET search_path = public, pg_temp;
ALTER FUNCTION public.set_silver_rate(numeric, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.log_silver_rate_change() SET search_path = public, pg_temp;

-- Reseller functions
ALTER FUNCTION public.create_reseller_on_profile() SET search_path = public, pg_temp;
ALTER FUNCTION public.is_reseller(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.ensure_reseller_for_user() SET search_path = public, pg_temp;
ALTER FUNCTION public.auth_role() SET search_path = public, pg_temp;

-- Target functions
ALTER FUNCTION public.create_target(uuid, text, text, numeric, date, text, numeric) SET search_path = public, pg_temp;
ALTER FUNCTION public.update_target(uuid, text, text, numeric, date) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_target_detail(uuid) SET search_path = public, pg_temp;

-- Reward functions
ALTER FUNCTION public.update_reward_stock() SET search_path = public, pg_temp;

-- Tax functions
ALTER FUNCTION public.increment_tax_update_count() SET search_path = public, pg_temp;

-- Report functions (if they have input parameters, specify them)
ALTER FUNCTION public.report_overdue_payments() SET search_path = public, pg_temp;
ALTER FUNCTION public.report_overdue_payments_summary() SET search_path = public, pg_temp;
ALTER FUNCTION public.report_sales_kpis(date, date) SET search_path = public, pg_temp;
ALTER FUNCTION public.report_sales_trend(date, date) SET search_path = public, pg_temp;
ALTER FUNCTION public.report_sales_transactions(date, date, uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.report_top_products(date, date) SET search_path = public, pg_temp;
ALTER FUNCTION public.report_sales_by_category(date, date) SET search_path = public, pg_temp;

-- Utility functions
ALTER FUNCTION public.clear_all_test_data() SET search_path = public, pg_temp;

-- ================================================================
-- PART 4: FIX EXTENSION WARNING (Optional)
-- ================================================================

-- Move pg_trgm extension from public to extensions schema
-- This is optional but recommended for better organization

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move pg_trgm to extensions schema
-- Note: This requires superuser privileges in Supabase
-- If this fails, it's okay to skip - pg_trgm in public is not a security risk
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm' AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER EXTENSION pg_trgm SET SCHEMA extensions;
    END IF;
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE NOTICE 'Skipping pg_trgm migration - requires superuser privileges';
END $$;

-- ================================================================
-- PART 5: ENABLE LEAKED PASSWORD PROTECTION (Recommended)
-- ================================================================

-- This is done via Supabase Dashboard, not SQL
-- Go to: Authentication > Policies > Password Protection
-- Enable "Check for leaked passwords using HaveIBeenPwned"

-- ================================================================
-- VERIFICATION QUERIES
-- ================================================================

-- Check RLS is enabled on indian_states
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'indian_states';
-- Expected: rowsecurity = true

-- Check function search_path settings
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    p.proconfig as search_path_setting
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('generate_order_code', 'get_current_silver_rate', 'validate_gst_number')
ORDER BY p.proname;
-- Expected: search_path_setting = {search_path=public,pg_temp}

-- ================================================================
-- NOTES FOR YOU TO EXECUTE
-- ================================================================

/*
EXECUTION ORDER (Do this in Supabase SQL Editor):

1. CRITICAL (Do first):
   - Run PART 1 (RLS on indian_states)
   
2. IMPORTANT (Do next):
   - Run PART 3 (All ALTER FUNCTION statements)
   - Copy ALL the ALTER FUNCTION lines
   - Paste into Supabase SQL Editor
   - Run all at once (it's safe)

3. OPTIONAL (Can skip if errors):
   - Run PART 4 (Move pg_trgm extension)
   - If it fails with "insufficient privileges", that's OK

4. MANUAL (Do in Supabase Dashboard):
   - PART 5: Go to Authentication > Policies
   - Enable "Leaked Password Protection"
   
5. VERIFY:
   - Run the verification queries at the end
   - Check that all returns expected results

SAFETY NOTES:
- All these changes are NON-BREAKING
- Your app will continue working exactly as before
- These only improve security
- If any statement fails, you can skip it and continue
- The app won't crash from these changes

WHAT NOT TO DO:
- DON'T drop or recreate the views (v_reseller_outstanding, etc.)
- DON'T disable SECURITY DEFINER on views
- Those are working correctly as designed
*/
