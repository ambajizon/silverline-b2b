-- =====================================================
-- CRITICAL: Add 'kind' column to payments table
-- =====================================================
-- This migration adds the 'kind' column which is REQUIRED
-- for the ledger system to work correctly.
--
-- Run this in Supabase SQL Editor BEFORE using the 
-- payments/ledger system!
-- =====================================================

-- Step 1: Create the ENUM type if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_kind') THEN
    CREATE TYPE public.payment_kind AS ENUM ('invoice','payment','adjustment');
    RAISE NOTICE 'Created payment_kind enum type';
  ELSE
    RAISE NOTICE 'payment_kind enum type already exists';
  END IF;
END$$;

-- Step 2: Add the 'kind' column if it doesn't exist
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS kind public.payment_kind;

-- Step 3: Set default value for existing rows (assume they are payments)
UPDATE public.payments 
SET kind = 'payment' 
WHERE kind IS NULL;

-- Step 4: Make the column NOT NULL
ALTER TABLE public.payments 
  ALTER COLUMN kind SET NOT NULL;

-- Step 5: Set default for new rows
ALTER TABLE public.payments 
  ALTER COLUMN kind SET DEFAULT 'payment';

-- =====================================================
-- Verify the changes
-- =====================================================
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'payments' 
  AND column_name = 'kind';

-- Expected output:
-- column_name | data_type    | is_nullable | column_default
-- kind        | USER-DEFINED | NO          | 'payment'::payment_kind

-- =====================================================
-- NEXT STEP: Create the view
-- =====================================================
-- After running this migration, you need to create the
-- v_reseller_outstanding view. Run this:
-- =====================================================

DROP VIEW IF EXISTS public.v_reseller_outstanding;

CREATE OR REPLACE VIEW public.v_reseller_outstanding AS
SELECT 
  r.id as reseller_id,
  r.shop_name,
  COALESCE(SUM(CASE WHEN p.kind = 'invoice' THEN p.amount ELSE 0 END), 0) as invoiced,
  COALESCE(SUM(CASE WHEN p.kind = 'payment' THEN p.amount ELSE 0 END), 0) as received,
  COALESCE(
    SUM(CASE WHEN p.kind = 'invoice' THEN p.amount ELSE -p.amount END), 
    0
  ) as outstanding
FROM public.resellers r
LEFT JOIN public.payments p ON p.reseller_id = r.id
GROUP BY r.id, r.shop_name;

-- Grant permissions
GRANT SELECT ON public.v_reseller_outstanding TO authenticated;

COMMENT ON VIEW public.v_reseller_outstanding IS 
'Aggregates invoices and payments per reseller. Outstanding = invoiced - received.';

-- =====================================================
-- NEXT STEP: Create the trigger
-- =====================================================
-- This trigger auto-creates invoice entries when an
-- order is marked as delivered.
-- =====================================================

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.create_invoice_on_delivery()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create invoice when status changes TO 'delivered'
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
    INSERT INTO public.payments (reseller_id, kind, amount, note)
    VALUES (
      NEW.reseller_id,
      'invoice'::payment_kind,
      NEW.total_price,
      'Invoice for Order #' || COALESCE(NEW.order_number, NEW.id::text)
    );
    
    RAISE NOTICE 'Created invoice for order % (reseller %)', NEW.id, NEW.reseller_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS orders_create_invoice_on_delivery ON public.orders;

-- Create the trigger
CREATE TRIGGER orders_create_invoice_on_delivery
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.create_invoice_on_delivery();

COMMENT ON FUNCTION public.create_invoice_on_delivery() IS
'Auto-creates an invoice entry in payments table when order status changes to delivered';

-- =====================================================
-- RLS Policies for v_reseller_outstanding
-- =====================================================

-- Enable RLS on the view (if needed)
-- Note: Views inherit RLS from underlying tables by default

-- Policy: Admin can view all balances
CREATE POLICY IF NOT EXISTS "Admin can view all reseller balances"
  ON public.resellers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Reseller can view own balance
CREATE POLICY IF NOT EXISTS "Reseller can view own balance"
  ON public.resellers FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
  );

-- Policy: Admin can insert payments
CREATE POLICY IF NOT EXISTS "Admin can record payments"
  ON public.payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admin can view all payments
CREATE POLICY IF NOT EXISTS "Admin can view all payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Reseller can view own payments
CREATE POLICY IF NOT EXISTS "Reseller can view own payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (
    reseller_id IN (
      SELECT id FROM public.resellers
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- Test the setup
-- =====================================================

-- Check if kind column exists and has correct type
SELECT 
  'kind column exists' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name = 'payments' 
        AND column_name = 'kind'
    ) THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as result;

-- Check if view exists
SELECT 
  'v_reseller_outstanding exists' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.views
      WHERE table_schema = 'public' 
        AND table_name = 'v_reseller_outstanding'
    ) THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as result;

-- Check if trigger exists
SELECT 
  'Trigger exists' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers
      WHERE trigger_schema = 'public' 
        AND trigger_name = 'orders_create_invoice_on_delivery'
    ) THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as result;

-- Sample query to verify view works
SELECT 
  reseller_id,
  shop_name,
  invoiced,
  received,
  outstanding
FROM public.v_reseller_outstanding
LIMIT 5;

-- =====================================================
-- DONE!
-- =====================================================
-- After running this migration:
-- 1. ✅ kind column added to payments
-- 2. ✅ v_reseller_outstanding view created
-- 3. ✅ Trigger created for auto-invoicing
-- 4. ✅ RLS policies in place
--
-- You can now use the payments/ledger system!
-- =====================================================
