-- ================================================================
-- SAFE SUPABASE SECURITY FIX
-- This version checks if functions exist before altering them
-- Copy ALL of this and run in Supabase SQL Editor
-- ================================================================

DO $$
DECLARE
    func_exists boolean;
BEGIN
    -- Trigger functions
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'tg_touch_updated_at') THEN
        ALTER FUNCTION public.tg_touch_updated_at() SET search_path = public, pg_temp;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
        ALTER FUNCTION public.set_updated_at() SET search_path = public, pg_temp;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_temp;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_orders_updated_at') THEN
        ALTER FUNCTION public.update_orders_updated_at() SET search_path = public, pg_temp;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_cart_items_updated_at') THEN
        ALTER FUNCTION public.update_cart_items_updated_at() SET search_path = public, pg_temp;
    END IF;

    -- Order-related functions
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_order_code') THEN
        ALTER FUNCTION public.generate_order_code() SET search_path = public, pg_temp;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'gen_order_number') THEN
        ALTER FUNCTION public.gen_order_number() SET search_path = public, pg_temp;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'apply_item_pricing') THEN
        ALTER FUNCTION public.apply_item_pricing() SET search_path = public, pg_temp;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'rollup_order_totals') THEN
        ALTER FUNCTION public.rollup_order_totals() SET search_path = public, pg_temp;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'fix_order_totals') THEN
        ALTER FUNCTION public.fix_order_totals() SET search_path = public, pg_temp;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trg_order_items_recalc') THEN
        ALTER FUNCTION public.trg_order_items_recalc() SET search_path = public, pg_temp;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = '_orders_sync_shipping_address') THEN
        ALTER FUNCTION public._orders_sync_shipping_address() SET search_path = public, pg_temp;
    END IF;

    -- Invoice functions
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_invoice_on_delivery') THEN
        ALTER FUNCTION public.create_invoice_on_delivery() SET search_path = public, pg_temp;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'auto_invoice_on_delivered') THEN
        ALTER FUNCTION public.auto_invoice_on_delivered() SET search_path = public, pg_temp;
    END IF;

    -- Validation functions
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'validate_aadhar_number') THEN
        ALTER FUNCTION public.validate_aadhar_number(text) SET search_path = public, pg_temp;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'validate_gst_number') THEN
        ALTER FUNCTION public.validate_gst_number(text) SET search_path = public, pg_temp;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'validate_pan_number') THEN
        ALTER FUNCTION public.validate_pan_number(text) SET search_path = public, pg_temp;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'extract_state_code_from_gst') THEN
        ALTER FUNCTION public.extract_state_code_from_gst(text) SET search_path = public, pg_temp;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'auto_extract_state_code') THEN
        ALTER FUNCTION public.auto_extract_state_code() SET search_path = public, pg_temp;
    END IF;

    -- Settings functions
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_setting') THEN
        ALTER FUNCTION public.get_setting(text) SET search_path = public, pg_temp;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_gst_enabled') THEN
        ALTER FUNCTION public.is_gst_enabled() SET search_path = public, pg_temp;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_gst_rate') THEN
        ALTER FUNCTION public.get_gst_rate() SET search_path = public, pg_temp;
    END IF;

    -- Silver rate functions
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_current_silver_rate') THEN
        ALTER FUNCTION public.get_current_silver_rate() SET search_path = public, pg_temp;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'log_silver_rate_change') THEN
        ALTER FUNCTION public.log_silver_rate_change() SET search_path = public, pg_temp;
    END IF;

    -- Reseller functions
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_reseller_on_profile') THEN
        ALTER FUNCTION public.create_reseller_on_profile() SET search_path = public, pg_temp;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'ensure_reseller_for_user') THEN
        ALTER FUNCTION public.ensure_reseller_for_user() SET search_path = public, pg_temp;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'auth_role') THEN
        ALTER FUNCTION public.auth_role() SET search_path = public, pg_temp;
    END IF;

    -- Target functions
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_reward_stock') THEN
        ALTER FUNCTION public.update_reward_stock() SET search_path = public, pg_temp;
    END IF;

    -- Tax functions
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'increment_tax_update_count') THEN
        ALTER FUNCTION public.increment_tax_update_count() SET search_path = public, pg_temp;
    END IF;

    -- Utility functions
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'clear_all_test_data') THEN
        ALTER FUNCTION public.clear_all_test_data() SET search_path = public, pg_temp;
    END IF;

    RAISE NOTICE 'Security fixes applied successfully! Only existing functions were updated.';
END $$;

-- ================================================================
-- DONE! This will only update functions that actually exist.
-- ================================================================
