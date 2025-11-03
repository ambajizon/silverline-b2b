-- =============================================
-- INSERT TEST DATA FOR 7-DAY TREND
-- Run this to test the reseller trend chart
-- =============================================

-- Delete existing test data (optional - comment out if you want to keep current data)
-- DELETE FROM silver_rates;

-- Insert rates for past 7 days with realistic variations
INSERT INTO silver_rates (rate_per_gram, created_at, updated_by)
VALUES 
  -- 6 days ago
  (80.00, NOW() - INTERVAL '6 days', NULL),
  
  -- 5 days ago (slight increase)
  (81.50, NOW() - INTERVAL '5 days', NULL),
  
  -- 4 days ago (increase)
  (82.00, NOW() - INTERVAL '4 days', NULL),
  
  -- 3 days ago (bigger jump)
  (83.50, NOW() - INTERVAL '3 days', NULL),
  
  -- 2 days ago (slight increase)
  (84.00, NOW() - INTERVAL '2 days', NULL),
  
  -- Yesterday (increase)
  (85.00, NOW() - INTERVAL '1 day', NULL),
  
  -- Today (current rate)
  (86.00, NOW(), NULL);

-- Verify inserted data
SELECT 
  id,
  rate_per_gram,
  rate_per_gram * 10 as rate_per_10g,
  created_at,
  DATE(created_at) as date_only,
  updated_by
FROM silver_rates
ORDER BY created_at DESC;

-- =============================================
-- EXPECTED RESULT
-- =============================================
-- After running this:
-- - Admin history will show 7 entries
-- - Reseller trend chart will display with 7 points
-- - Chart will show upward trend from ₹800 to ₹860 per 10g
-- =============================================
