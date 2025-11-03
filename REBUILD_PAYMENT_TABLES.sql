-- =====================================================
-- REBUILD PAYMENT TABLES - Complete Schema
-- =====================================================
-- Run this in Supabase SQL Editor to recreate all
-- payment-related tables and views
-- =====================================================

-- =====================================================
-- STEP 1: Drop existing objects (clean slate)
-- =====================================================

DROP VIEW IF EXISTS public.v_reseller_outstanding CASCADE;
DROP TRIGGER IF EXISTS orders_create_invoice_on_delivery ON public.orders;
DROP FUNCTION IF EXISTS public.create_invoice_on_delivery() CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TYPE IF EXISTS public.payment_kind CASCADE;

-- =====================================================
-- STEP 2: Create payment_kind ENUM
-- =====================================================

CREATE TYPE public.payment_kind AS ENUM (
  'invoice',    -- Amounts owed by reseller (order deliveries)
  'payment',    -- Amounts paid by reseller
  'adjustment'  -- Manual adjustments (corrections, discounts, etc.)
);

COMMENT ON TYPE public.payment_kind IS 
'Type of payment entry: invoice (owed), payment (received), adjustment (manual correction)';

-- =====================================================
-- STEP 3: Create payments table
-- =====================================================

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id UUID NOT NULL REFERENCES public.resellers(id) ON DELETE CASCADE,
  kind public.payment_kind NOT NULL DEFAULT 'payment',
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT,
  transaction_id TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_payments_reseller ON public.payments(reseller_id);
CREATE INDEX idx_payments_kind ON public.payments(kind);
CREATE INDEX idx_payments_date ON public.payments(payment_date);
CREATE INDEX idx_payments_created ON public.payments(created_at);

COMMENT ON TABLE public.payments IS 
'Ledger table tracking all financial transactions with resellers. Includes invoices (amounts owed) and payments (amounts received).';

COMMENT ON COLUMN public.payments.kind IS 
'Type of entry: invoice (amount owed), payment (amount received), adjustment (manual correction)';

COMMENT ON COLUMN public.payments.amount IS 
'Transaction amount. Always positive. For invoices, this is amount owed. For payments, this is amount received.';

COMMENT ON COLUMN public.payments.payment_method IS 
'Payment method: cash, bank_transfer, upi, cheque, etc.';

COMMENT ON COLUMN public.payments.transaction_id IS 
'External transaction reference: UPI ID, cheque number, bank reference, etc.';

-- =====================================================
-- STEP 4: Create v_reseller_outstanding view
-- =====================================================

CREATE OR REPLACE VIEW public.v_reseller_outstanding AS
SELECT 
  r.id as reseller_id,
  r.shop_name,
  r.contact_name,
  r.phone,
  -- Total invoiced (orders delivered)
  COALESCE(SUM(CASE WHEN p.kind = 'invoice' THEN p.amount ELSE 0 END), 0) as invoiced,
  -- Total received (payments)
  COALESCE(SUM(CASE WHEN p.kind = 'payment' THEN p.amount ELSE 0 END), 0) as received,
  -- Total adjustments
  COALESCE(SUM(CASE WHEN p.kind = 'adjustment' THEN p.amount ELSE 0 END), 0) as adjustments,
  -- Outstanding balance (positive = reseller owes, negative = we owe reseller)
  COALESCE(
    SUM(
      CASE 
        WHEN p.kind = 'invoice' THEN p.amount
        WHEN p.kind = 'payment' THEN -p.amount
        WHEN p.kind = 'adjustment' THEN p.amount
        ELSE 0
      END
    ), 
    0
  ) as outstanding,
  -- Last payment info
  MAX(CASE WHEN p.kind = 'payment' THEN p.payment_date END) as last_payment_date,
  MAX(CASE WHEN p.kind = 'payment' THEN p.amount END) as last_payment_amount,
  -- Order count
  COUNT(DISTINCT CASE WHEN p.kind = 'invoice' THEN p.id END) as invoice_count,
  COUNT(DISTINCT CASE WHEN p.kind = 'payment' THEN p.id END) as payment_count
FROM public.resellers r
LEFT JOIN public.payments p ON p.reseller_id = r.id
GROUP BY r.id, r.shop_name, r.contact_name, r.phone;

-- Grant permissions
GRANT SELECT ON public.v_reseller_outstanding TO authenticated;

COMMENT ON VIEW public.v_reseller_outstanding IS 
'Aggregates invoices and payments per reseller. Outstanding = invoiced - received + adjustments.';

-- =====================================================
-- STEP 5: Create trigger function
-- =====================================================
-- Auto-creates invoice entry when order is delivered

CREATE OR REPLACE FUNCTION public.create_invoice_on_delivery()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create invoice when status changes TO 'delivered'
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
    INSERT INTO public.payments (
      reseller_id, 
      kind, 
      amount, 
      payment_date,
      note
    )
    VALUES (
      NEW.reseller_id,
      'invoice'::payment_kind,
      NEW.total_price,
      CURRENT_DATE,
      'Invoice for Order #' || COALESCE(NEW.order_code, NEW.id::text)
    );
    
    RAISE NOTICE 'Created invoice for order % (reseller %, amount %)', 
      COALESCE(NEW.order_code, NEW.id::text), 
      NEW.reseller_id,
      NEW.total_price;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.create_invoice_on_delivery() IS
'Auto-creates an invoice entry in payments table when order status changes to delivered';

-- =====================================================
-- STEP 6: Create trigger on orders table
-- =====================================================

CREATE TRIGGER orders_create_invoice_on_delivery
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.create_invoice_on_delivery();

COMMENT ON TRIGGER orders_create_invoice_on_delivery ON public.orders IS
'Automatically creates invoice when order is marked as delivered';

-- =====================================================
-- STEP 7: Enable RLS and create policies
-- =====================================================

-- Enable RLS on payments table
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Policy: Admin can view all payments
CREATE POLICY "Admin can view all payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admin can insert payments
CREATE POLICY "Admin can insert payments"
  ON public.payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admin can update payments
CREATE POLICY "Admin can update payments"
  ON public.payments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admin can delete payments
CREATE POLICY "Admin can delete payments"
  ON public.payments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Reseller can view own payments/invoices
CREATE POLICY "Reseller can view own payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (
    reseller_id IN (
      SELECT id FROM public.resellers
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- STEP 8: Create updated_at trigger
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- STEP 9: Verification queries
-- =====================================================

-- Check if payments table exists
SELECT 
  '✅ payments table exists' as status
WHERE EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'payments'
);

-- Check if view exists
SELECT 
  '✅ v_reseller_outstanding view exists' as status
WHERE EXISTS (
  SELECT 1 FROM information_schema.views
  WHERE table_schema = 'public' AND table_name = 'v_reseller_outstanding'
);

-- Check if trigger exists
SELECT 
  '✅ Trigger orders_create_invoice_on_delivery exists' as status
WHERE EXISTS (
  SELECT 1 FROM information_schema.triggers
  WHERE trigger_schema = 'public' 
    AND trigger_name = 'orders_create_invoice_on_delivery'
);

-- Check RLS is enabled
SELECT 
  '✅ RLS enabled on payments' as status
WHERE EXISTS (
  SELECT 1 FROM pg_tables
  WHERE schemaname = 'public' 
    AND tablename = 'payments'
    AND rowsecurity = true
);

-- List all payment policies
SELECT 
  policyname as "Policy Name",
  CASE cmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'w' THEN 'INSERT'
    WHEN 'u' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
  END as "Command"
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'payments'
ORDER BY policyname;

-- Test the view (should return empty results if no data)
SELECT 
  reseller_id,
  shop_name,
  invoiced,
  received,
  outstanding
FROM public.v_reseller_outstanding
LIMIT 5;

-- =====================================================
-- STEP 10: Sample data (optional - for testing)
-- =====================================================

-- Uncomment below to add sample payment data

/*
-- Sample: Add test payment for a reseller
INSERT INTO public.payments (
  reseller_id,
  kind,
  amount,
  payment_method,
  transaction_id,
  note
)
SELECT 
  id as reseller_id,
  'payment'::payment_kind as kind,
  50000.00 as amount,
  'bank_transfer' as payment_method,
  'TXN123456' as transaction_id,
  'Test payment' as note
FROM public.resellers
LIMIT 1;
*/

-- =====================================================
-- DONE! Payment system is ready
-- =====================================================
-- 
-- ✅ Tables created:
--    - payments (with RLS policies)
--
-- ✅ Views created:
--    - v_reseller_outstanding
--
-- ✅ Triggers created:
--    - orders_create_invoice_on_delivery
--
-- ✅ Functions created:
--    - create_invoice_on_delivery()
--    - update_updated_at_column()
--
-- ✅ Enums created:
--    - payment_kind (invoice, payment, adjustment)
--
-- ✅ RLS enabled with policies for:
--    - Admin: full access to all payments
--    - Reseller: view own payments only
--
-- The system will now:
--    1. Auto-create invoices when orders are delivered
--    2. Track payments from resellers
--    3. Calculate outstanding balances
--    4. Show payment history in admin panel
--
-- Next: Test by marking an order as 'delivered'
-- =====================================================
