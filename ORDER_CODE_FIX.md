# Order Code Duplicate Error - FIXED ✅

## Problem
Error: `duplicate key value violates unique constraint "orders_order_code_key"`

The order code generation was using random numbers that could occasionally create duplicates.

## Solution Implemented

### Frontend Fix (Code Updated)
Updated `apps/web/app/(reseller)/reseller/cart/actions.ts` with:
- **Timestamp-based codes** instead of random dates
- **Uniqueness check** before inserting
- **Retry logic** (up to 5 attempts)
- Format: `ORD-{timestamp}-{random5digits}`

Example: `ORD-1730225678901-42315`

### Database Fix (Run This SQL)

**Option 1: Create Better RPC Function**

Run this in your Supabase SQL Editor:

```sql
-- Create a function that generates guaranteed unique order codes
CREATE OR REPLACE FUNCTION generate_order_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
  attempts INT := 0;
BEGIN
  LOOP
    -- Generate code with timestamp + sequential counter
    new_code := 'ORD-' || 
                TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                LPAD(FLOOR(RANDOM() * 99999)::TEXT, 5, '0');
    
    -- Check if code exists
    SELECT EXISTS(
      SELECT 1 FROM orders WHERE order_code = new_code
    ) INTO code_exists;
    
    -- If unique, return it
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
    
    -- Prevent infinite loop
    attempts := attempts + 1;
    IF attempts > 10 THEN
      RAISE EXCEPTION 'Could not generate unique order code after 10 attempts';
    END IF;
  END LOOP;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION generate_order_code() TO authenticated;
```

**Option 2: Use Sequence-Based Codes (Better)**

This guarantees uniqueness using PostgreSQL sequences:

```sql
-- Create a sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1000;

-- Create function using sequence
CREATE OR REPLACE FUNCTION generate_order_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  seq_num TEXT;
BEGIN
  seq_num := LPAD(NEXTVAL('order_number_seq')::TEXT, 6, '0');
  RETURN 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || seq_num;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION generate_order_code() TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE order_number_seq TO authenticated;
```

This will generate codes like:
- `ORD-20251029-001000`
- `ORD-20251029-001001`
- `ORD-20251029-001002`

**Option 3: Simple Auto-Increment (Simplest)**

```sql
CREATE OR REPLACE FUNCTION generate_order_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  max_code TEXT;
  order_num INT;
BEGIN
  -- Get the highest order number today
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(order_code FROM '\d+$') AS INTEGER)
  ), 0)
  INTO order_num
  FROM orders
  WHERE order_code LIKE 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-%';
  
  -- Increment and return
  RETURN 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD((order_num + 1)::TEXT, 4, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION generate_order_code() TO authenticated;
```

## Which Option to Choose?

### ✅ Option 2 (Sequence-Based) - RECOMMENDED
- **Pros:** Guaranteed unique, fast, no collisions
- **Cons:** None
- **Best for:** Production systems

### Option 1 (Random with Check)
- **Pros:** Simple, readable codes
- **Cons:** Small chance of collision (already handles retries)
- **Best for:** Low-volume systems

### Option 3 (Daily Auto-Increment)
- **Pros:** Clean codes (ORD-20251029-0001)
- **Cons:** Requires locking, can have race conditions
- **Best for:** Development/testing

## Testing

After running the SQL:

1. **Clear your browser cache** or use incognito
2. **Try placing an order** again
3. **Should work without duplicate errors**

### Test Query
```sql
-- See recent order codes
SELECT order_code, created_at 
FROM orders 
ORDER BY created_at DESC 
LIMIT 10;
```

## Rollback (If Needed)

If something goes wrong, remove the function:

```sql
DROP FUNCTION IF EXISTS generate_order_code();
```

The code will still work using the timestamp fallback.

## Status

✅ **Frontend Fixed** - Code updated with better generation logic
⏳ **Database** - Run one of the SQL options above for best results

**Current behavior without SQL:**
- Generates: `ORD-1730225678901-42315` (timestamp-based)
- Checks uniqueness before inserting
- Retries up to 5 times if duplicate

**After running Option 2 SQL:**
- Generates: `ORD-20251029-001234` (sequence-based)
- Guaranteed unique
- No retries needed
