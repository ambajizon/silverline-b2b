-- ================================================================
-- CHECK IF ORDER ITEMS EXIST (FIXED VERSION)
-- Run this in Supabase SQL Editor
-- ================================================================

-- 1. First, let's see the actual structure of order_items table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'order_items' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check total order_items count
SELECT COUNT(*) as total_order_items FROM order_items;

-- 3. Check if delivered orders have items
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

-- 4. Check a sample of order_items (without quantity for now)
SELECT 
    oi.*,
    p.name as product_name,
    o.status as order_status
FROM order_items oi
LEFT JOIN products p ON p.id = oi.product_id
LEFT JOIN orders o ON o.id = oi.order_id
WHERE o.status = 'delivered'
LIMIT 5;

-- 5. Check which delivered orders have NO items
SELECT 
    o.id,
    o.order_code,
    o.status,
    o.total_price
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
WHERE o.status = 'delivered'
AND oi.id IS NULL
LIMIT 10;

-- ================================================================
-- Run Query 1 first to see the actual column names!
-- ================================================================
