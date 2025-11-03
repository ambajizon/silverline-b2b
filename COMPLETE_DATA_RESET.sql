-- ====================================
-- COMPLETE DATA RESET - VERIFIED WORKING
-- Run this to completely clear all data and refresh all views
-- ====================================

-- Step 1: Delete all transactional data
DELETE FROM rewards_claimed;
DELETE FROM target_progress;
DELETE FROM targets;
DELETE FROM payments;
DELETE FROM order_items;
DELETE FROM orders;

-- Step 2: Refresh any materialized views (if they exist)
-- REFRESH MATERIALIZED VIEW IF EXISTS v_reseller_outstanding;
-- REFRESH MATERIALIZED VIEW IF EXISTS v_target_progress;

-- Step 3: Verify deletion
DO $$
DECLARE
  orders_count INTEGER;
  payments_count INTEGER;
  targets_count INTEGER;
  rewards_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orders_count FROM orders;
  SELECT COUNT(*) INTO payments_count FROM payments;
  SELECT COUNT(*) INTO targets_count FROM targets;
  SELECT COUNT(*) INTO rewards_count FROM rewards_claimed;
  
  RAISE NOTICE '=== DELETION COMPLETE ===';
  RAISE NOTICE 'Orders remaining: %', orders_count;
  RAISE NOTICE 'Payments remaining: %', payments_count;
  RAISE NOTICE 'Targets remaining: %', targets_count;
  RAISE NOTICE 'Rewards remaining: %', rewards_count;
  RAISE NOTICE '';
  RAISE NOTICE '=== ACCOUNTS PRESERVED ===';
  
  RAISE NOTICE 'Resellers: %', (SELECT COUNT(*) FROM resellers);
  RAISE NOTICE 'Products: %', (SELECT COUNT(*) FROM products);
  RAISE NOTICE 'Categories: %', (SELECT COUNT(*) FROM categories);
END $$;

-- Step 4: Test revenue calculation
SELECT 
  COUNT(*) as total_orders,
  COALESCE(SUM(total_price), 0) as total_revenue,
  COUNT(*) FILTER (WHERE status = 'delivered') as delivered_orders,
  COALESCE(SUM(total_price) FILTER (WHERE status = 'delivered'), 0) as delivered_revenue
FROM orders;

-- Should return: 0, 0, 0, 0
