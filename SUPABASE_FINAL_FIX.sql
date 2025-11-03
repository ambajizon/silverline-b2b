-- ================================================================
-- FINAL SAFE SUPABASE SECURITY FIX
-- This checks function signatures properly
-- Copy ALL and run in Supabase SQL Editor
-- ================================================================

DO $$
DECLARE
    r record;
BEGIN
    -- Update all functions that exist (regardless of parameters)
    FOR r IN 
        SELECT 
            n.nspname as schema_name,
            p.proname as function_name,
            pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname IN (
            'tg_touch_updated_at',
            'set_updated_at',
            'update_updated_at_column',
            'update_orders_updated_at',
            'update_cart_items_updated_at',
            'generate_order_code',
            'gen_order_number',
            'apply_item_pricing',
            'rollup_order_totals',
            'recalc_order_totals',
            'fix_order_totals',
            'trg_order_items_recalc',
            'place_order_atomic',
            '_orders_sync_shipping_address',
            'create_invoice_on_delivery',
            'auto_invoice_on_delivered',
            'validate_aadhar_number',
            'validate_gst_number',
            'validate_pan_number',
            'extract_state_code_from_gst',
            'auto_extract_state_code',
            'get_setting',
            'is_gst_enabled',
            'get_gst_rate',
            'get_current_silver_rate',
            'set_silver_rate',
            'log_silver_rate_change',
            'create_reseller_on_profile',
            'is_reseller',
            'ensure_reseller_for_user',
            'auth_role',
            'create_target',
            'update_target',
            'get_target_detail',
            'update_reward_stock',
            'increment_tax_update_count',
            'report_overdue_payments',
            'report_overdue_payments_summary',
            'report_sales_kpis',
            'report_sales_trend',
            'report_sales_transactions',
            'report_top_products',
            'report_sales_by_category',
            'clear_all_test_data'
        )
    LOOP
        BEGIN
            -- Build and execute ALTER FUNCTION with correct signature
            EXECUTE format(
                'ALTER FUNCTION %I.%I(%s) SET search_path = public, pg_temp',
                r.schema_name,
                r.function_name,
                r.args
            );
            RAISE NOTICE 'Updated: %.%(%)', r.schema_name, r.function_name, r.args;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Skipped: %.%(%)', r.schema_name, r.function_name, r.args;
        END;
    END LOOP;
    
    RAISE NOTICE 'Security fixes completed successfully!';
END $$;
