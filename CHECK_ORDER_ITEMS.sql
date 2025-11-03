-- ================================================================
-- CHECK IF ORDER ITEMS EXIST
-- Run this in Supabase SQL Editor to diagnose the issue
-- ================================================================

-- 1. Check total order_items count
SELECT COUNT(*) as total_order_items FROM order_items;

-- 2. Check if delivered orders have items
SELECT 
    o.id as order_id,
    o.order_code,
    o.status,
    COUNT(oi.id) as items_count
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
WHERE o.status = 'delivered'
GROUP BY o.id, o.order_code, o.status
ORDER BY o.created_at DESC
LIMIT 10;

-- 3. Check a sample of order_items with product names
SELECT 
    oi.id,
    oi.order_id,
    oi.product_id,
    oi.quantity,
    p.name as product_name,
    o.status as order_status
FROM order_items oi
LEFT JOIN products p ON p.id = oi.product_id
LEFT JOIN orders o ON o.id = oi.order_id
WHERE o.status = 'delivered'
LIMIT 10;

-- 4. Check which delivered orders have NO items
SELECT 
    o.id,
    o.order_code,
    o.status,
    o.total_price
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
WHERE o.status = 'delivered'
AND oi.id IS NULL;

-- ================================================================
-- RESULTS TO SHARE:
-- Please share the results of all 4 queries above
-- ================================================================
