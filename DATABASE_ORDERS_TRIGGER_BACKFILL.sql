-- =====================================================
-- Orders Auto-Update Trigger & Backfill
-- =====================================================
-- This script creates a trigger to automatically update
-- orders.total_price and orders.total_weight_kg when
-- order_items are inserted/updated/deleted.
--
-- Also includes backfill queries for legacy data.
-- =====================================================

-- =====================================================
-- PART 1: Create Auto-Update Trigger
-- =====================================================

-- Function to update order totals
CREATE OR REPLACE FUNCTION public.update_order_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_order_id UUID;
  v_subtotal DECIMAL;
  v_total_weight DECIMAL;
  v_gst_rate DECIMAL;
  v_grand_total DECIMAL;
BEGIN
  -- Determine which order_id to update
  IF TG_OP = 'DELETE' THEN
    v_order_id := OLD.order_id;
  ELSE
    v_order_id := NEW.order_id;
  END IF;

  -- Get GST rate from order
  SELECT COALESCE(gst_rate_used, 3) INTO v_gst_rate
  FROM public.orders
  WHERE id = v_order_id;

  -- Calculate subtotal (sum of pre-GST item prices)
  SELECT COALESCE(SUM(price), 0) INTO v_subtotal
  FROM public.order_items
  WHERE order_id = v_order_id;

  -- Calculate total weight
  SELECT COALESCE(SUM(weight_kg), 0) INTO v_total_weight
  FROM public.order_items
  WHERE order_id = v_order_id;

  -- Calculate grand total (subtotal + GST)
  v_grand_total := v_subtotal * (1 + v_gst_rate / 100);

  -- Update order
  UPDATE public.orders
  SET 
    total_price = v_grand_total,
    total_weight_kg = v_total_weight,
    updated_at = NOW()
  WHERE id = v_order_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS order_items_update_totals ON public.order_items;

-- Create trigger
CREATE TRIGGER order_items_update_totals
  AFTER INSERT OR UPDATE OR DELETE ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_order_totals();

COMMENT ON FUNCTION public.update_order_totals() IS
'Automatically updates orders.total_price and orders.total_weight_kg when order_items change';

-- =====================================================
-- PART 2: Backfill Legacy Orders
-- =====================================================

-- Check current state
SELECT 
  'Orders with NULL or 0 total_price' as check_name,
  COUNT(*) as count
FROM public.orders
WHERE total_price IS NULL OR total_price = 0;

SELECT 
  'Orders with NULL silver_rate_used' as check_name,
  COUNT(*) as count
FROM public.orders
WHERE silver_rate_used IS NULL;

SELECT 
  'Orders with NULL gst_rate_used' as check_name,
  COUNT(*) as count
FROM public.orders
WHERE gst_rate_used IS NULL;

-- =====================================================
-- Backfill 1: Update total_price and total_weight_kg
-- =====================================================

-- Update orders that have items but missing totals
UPDATE public.orders o
SET 
  total_price = (
    SELECT SUM(oi.price) * (1 + COALESCE(o.gst_rate_used, 3) / 100)
    FROM public.order_items oi
    WHERE oi.order_id = o.id
  ),
  total_weight_kg = (
    SELECT COALESCE(SUM(oi.weight_kg), 0)
    FROM public.order_items oi
    WHERE oi.order_id = o.id
  ),
  updated_at = NOW()
WHERE 
  (total_price IS NULL OR total_price = 0)
  AND EXISTS (
    SELECT 1 FROM public.order_items oi WHERE oi.order_id = o.id
  );

-- Verify
SELECT 
  'Orders updated with totals' as result,
  COUNT(*) as count
FROM public.orders
WHERE total_price > 0;

-- =====================================================
-- Backfill 2: Default GST rate
-- =====================================================

-- Find most common GST rate
SELECT 
  gst_rate_used,
  COUNT(*) as usage_count
FROM public.orders
WHERE gst_rate_used IS NOT NULL
GROUP BY gst_rate_used
ORDER BY COUNT(*) DESC
LIMIT 1;

-- Backfill with default (adjust if needed)
UPDATE public.orders
SET 
  gst_rate_used = 3.0,
  updated_at = NOW()
WHERE gst_rate_used IS NULL;

-- =====================================================
-- Backfill 3: Silver rate from recent average
-- =====================================================

-- Find average silver rate from recent orders
SELECT 
  AVG(silver_rate_used) as avg_rate,
  MIN(silver_rate_used) as min_rate,
  MAX(silver_rate_used) as max_rate
FROM public.orders
WHERE 
  silver_rate_used IS NOT NULL
  AND created_at >= NOW() - INTERVAL '30 days';

-- Backfill with reasonable default (adjust based on above query)
-- Option 1: Use a fixed rate
UPDATE public.orders
SET 
  silver_rate_used = 150.00,  -- ⚠️ ADJUST THIS VALUE
  updated_at = NOW()
WHERE silver_rate_used IS NULL;

-- Option 2: Use current rate from silver_rates table
UPDATE public.orders o
SET 
  silver_rate_used = (
    SELECT rate_per_gram 
    FROM public.silver_rates 
    ORDER BY created_at DESC 
    LIMIT 1
  ),
  updated_at = NOW()
WHERE silver_rate_used IS NULL;

-- =====================================================
-- Backfill 4: Recalculate all totals with correct GST
-- =====================================================

-- After backfilling rates, recalculate all totals
UPDATE public.orders o
SET 
  total_price = (
    SELECT SUM(oi.price) * (1 + o.gst_rate_used / 100)
    FROM public.order_items oi
    WHERE oi.order_id = o.id
  ),
  updated_at = NOW()
WHERE EXISTS (
  SELECT 1 FROM public.order_items oi WHERE oi.order_id = o.id
);

-- =====================================================
-- PART 3: Verification Queries
-- =====================================================

-- Check 1: Orders with proper totals
SELECT 
  COUNT(*) as total_orders,
  COUNT(CASE WHEN total_price > 0 THEN 1 END) as orders_with_price,
  COUNT(CASE WHEN total_weight_kg > 0 THEN 1 END) as orders_with_weight,
  COUNT(CASE WHEN silver_rate_used IS NOT NULL THEN 1 END) as orders_with_silver_rate,
  COUNT(CASE WHEN gst_rate_used IS NOT NULL THEN 1 END) as orders_with_gst_rate
FROM public.orders;

-- Check 2: Sample orders with all fields
SELECT 
  id,
  order_number,
  status,
  total_price,
  total_weight_kg,
  silver_rate_used,
  gst_rate_used,
  created_at
FROM public.orders
ORDER BY created_at DESC
LIMIT 10;

-- Check 3: Verify totals match item sums
SELECT 
  o.id,
  o.order_number,
  o.total_price as stored_total,
  SUM(oi.price) as items_subtotal,
  o.gst_rate_used,
  SUM(oi.price) * (1 + o.gst_rate_used / 100) as calculated_total,
  ABS(o.total_price - (SUM(oi.price) * (1 + o.gst_rate_used / 100))) as difference
FROM public.orders o
JOIN public.order_items oi ON oi.order_id = o.id
GROUP BY o.id, o.order_number, o.total_price, o.gst_rate_used
HAVING ABS(o.total_price - (SUM(oi.price) * (1 + o.gst_rate_used / 100))) > 0.01
ORDER BY difference DESC
LIMIT 10;

-- Expected: No rows (or very small differences due to rounding)

-- Check 4: Orders with meta snapshots
SELECT 
  o.id,
  o.order_number,
  oi.meta->>'product_name' as product_name,
  oi.meta->>'rate_per_gm' as rate_per_gm,
  oi.meta->>'deduction_pct' as deduction_pct,
  oi.weight_kg,
  oi.price as pre_gst_amount
FROM public.orders o
JOIN public.order_items oi ON oi.order_id = o.id
ORDER BY o.created_at DESC
LIMIT 5;

-- Expected: Meta should contain product_name, rate_per_gm, etc.

-- =====================================================
-- PART 4: Test Trigger
-- =====================================================

-- Test 1: Insert new order item (trigger should auto-update order)
DO $$
DECLARE
  v_test_order_id UUID;
  v_test_product_id UUID;
  v_before_total DECIMAL;
  v_after_total DECIMAL;
BEGIN
  -- Get a test order
  SELECT id INTO v_test_order_id
  FROM public.orders
  ORDER BY created_at DESC
  LIMIT 1;

  -- Get a test product
  SELECT id INTO v_test_product_id
  FROM public.products
  LIMIT 1;

  IF v_test_order_id IS NULL OR v_test_product_id IS NULL THEN
    RAISE NOTICE 'No test data available';
    RETURN;
  END IF;

  -- Get total before
  SELECT total_price INTO v_before_total
  FROM public.orders
  WHERE id = v_test_order_id;

  RAISE NOTICE 'Order % total before: %', v_test_order_id, v_before_total;

  -- Insert test item
  INSERT INTO public.order_items (order_id, product_id, weight_kg, price, meta)
  VALUES (
    v_test_order_id,
    v_test_product_id,
    0.1,
    1000,
    '{"product_name": "Test Item", "rate_per_gm": 150}'::jsonb
  );

  -- Get total after
  SELECT total_price INTO v_after_total
  FROM public.orders
  WHERE id = v_test_order_id;

  RAISE NOTICE 'Order % total after: %', v_test_order_id, v_after_total;

  -- Verify trigger worked
  IF v_after_total > v_before_total THEN
    RAISE NOTICE '✅ Trigger working correctly! Total increased.';
  ELSE
    RAISE NOTICE '❌ Trigger may not be working. Total did not increase.';
  END IF;

  -- Cleanup test item
  DELETE FROM public.order_items
  WHERE order_id = v_test_order_id
    AND product_id = v_test_product_id
    AND price = 1000;

  RAISE NOTICE 'Test item cleaned up.';
END $$;

-- =====================================================
-- Summary Report
-- =====================================================

SELECT '========================================' as report;
SELECT 'Orders Backfill & Trigger Setup Complete' as report;
SELECT '========================================' as report;

SELECT 
  'Total Orders' as metric,
  COUNT(*) as value
FROM public.orders
UNION ALL
SELECT 
  'Orders with total_price > 0',
  COUNT(*)
FROM public.orders
WHERE total_price > 0
UNION ALL
SELECT 
  'Orders with silver_rate_used',
  COUNT(*)
FROM public.orders
WHERE silver_rate_used IS NOT NULL
UNION ALL
SELECT 
  'Orders with gst_rate_used',
  COUNT(*)
FROM public.orders
WHERE gst_rate_used IS NOT NULL;

SELECT '========================================' as report;
SELECT 'Sample Recent Orders:' as report;
SELECT '========================================' as report;

SELECT 
  order_number,
  status,
  TO_CHAR(total_price, 'FM₹999,999,999.00') as total,
  TO_CHAR(total_weight_kg * 1000, 'FM999,999 gm') as weight,
  TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') as created
FROM public.orders
ORDER BY created_at DESC
LIMIT 5;

-- =====================================================
-- DONE!
-- =====================================================
-- ✅ Trigger created for auto-updating totals
-- ✅ Legacy orders backfilled
-- ✅ All orders have proper totals
-- ✅ Rate snapshots populated
--
-- Next: Test by placing a new order!
-- =====================================================
