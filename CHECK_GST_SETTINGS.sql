-- =============================================
-- CHECK AND FIX GST SETTINGS
-- Run this to diagnose and fix GST persistence issues
-- =============================================

-- ============================================
-- 1. CHECK IF SETTINGS TABLE EXISTS
-- ============================================
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'settings'
ORDER BY ordinal_position;

-- ============================================
-- 2. CHECK CURRENT GST SETTING
-- ============================================
SELECT * FROM settings WHERE key = 'gst_rate';

-- ============================================
-- 3. CHECK ALL SETTINGS
-- ============================================
SELECT key, value, updated_at FROM settings ORDER BY key;

-- ============================================
-- 4. FIX: ENSURE GST_RATE EXISTS
-- ============================================
INSERT INTO settings (key, value, updated_at)
VALUES ('gst_rate', '3', NOW())
ON CONFLICT (key) 
DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = EXCLUDED.updated_at;

-- ============================================
-- 5. VERIFY IT WAS SAVED
-- ============================================
SELECT key, value, updated_at FROM settings WHERE key = 'gst_rate';

-- ============================================
-- 6. TEST UPDATE
-- ============================================
-- Try updating it manually
UPDATE settings 
SET value = '5', updated_at = NOW() 
WHERE key = 'gst_rate';

-- Check if update worked
SELECT key, value, updated_at FROM settings WHERE key = 'gst_rate';

-- ============================================
-- 7. CHECK TABLE CONSTRAINTS
-- ============================================
SELECT
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'settings'
  AND tc.table_schema = 'public';

-- ============================================
-- EXPECTED RESULTS:
-- ============================================
-- 1. Settings table should have: id, key (unique), value, created_at, updated_at
-- 2. gst_rate should exist with value '3' (or '0' if disabled)
-- 3. Update should change the value
-- 4. Should have UNIQUE constraint on 'key' column
-- =============================================
