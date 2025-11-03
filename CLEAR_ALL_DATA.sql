-- ====================================
-- CLEAR ALL DATA (TESTING RESET)
-- Run this SQL to completely clear all order/payment/target/reward data
-- Keeps reseller accounts and products intact
-- ====================================

-- Disable triggers temporarily (if any)
SET session_replication_role = 'replica';

-- Delete in correct order (child tables first)
DELETE FROM rewards_claimed;
DELETE FROM target_progress;
DELETE FROM targets;
DELETE FROM payments;
DELETE FROM order_items;
DELETE FROM orders;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Verify deletion
SELECT 'Orders remaining: ' || COUNT(*) FROM orders;
SELECT 'Payments remaining: ' || COUNT(*) FROM payments;
SELECT 'Targets remaining: ' || COUNT(*) FROM targets;
SELECT 'Rewards remaining: ' || COUNT(*) FROM rewards_claimed;

-- Show what's kept
SELECT 'Resellers: ' || COUNT(*) FROM resellers;
SELECT 'Products: ' || COUNT(*) FROM products;
SELECT 'Categories: ' || COUNT(*) FROM categories;
