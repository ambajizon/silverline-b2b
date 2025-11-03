-- ================================================================
-- PART 3 ONLY: FIX FUNCTION WARNINGS
-- Copy ALL of this and run in Supabase SQL Editor
-- ================================================================

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

-- Report functions
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
-- DONE! That's all you need to run.
-- ================================================================
