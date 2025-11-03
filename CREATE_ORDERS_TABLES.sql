-- ============================================
-- Orders System Database Schema
-- ============================================

-- 1. ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id UUID NOT NULL REFERENCES resellers(id) ON DELETE CASCADE,
  order_code TEXT NOT NULL UNIQUE,
  
  -- Order Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_making', 'dispatched', 'delivered', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
  
  -- Pricing (snapshot at order time)
  total_weight_kg NUMERIC(10, 3) NOT NULL,
  subtotal NUMERIC(12, 2) NOT NULL,
  discount_amount NUMERIC(12, 2) DEFAULT 0,
  global_loop_amount NUMERIC(12, 2) DEFAULT 0,
  taxable_amount NUMERIC(12, 2) NOT NULL,
  gst_amount NUMERIC(12, 2) NOT NULL,
  total_price NUMERIC(12, 2) NOT NULL,
  
  -- GST Breakdown (for Indian compliance)
  cgst_amount NUMERIC(12, 2),
  sgst_amount NUMERIC(12, 2),
  igst_amount NUMERIC(12, 2),
  
  -- Additional Info
  notes TEXT,
  cancelled_reason TEXT,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for orders
CREATE INDEX idx_orders_reseller_id ON orders(reseller_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_order_code ON orders(order_code);

-- 2. ORDER ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  
  -- Product snapshot (preserve data at order time)
  product_name TEXT NOT NULL,
  product_image TEXT,
  
  -- Weight & Ranges
  weight_kg NUMERIC(10, 3) NOT NULL,
  weight_ranges JSONB, -- Store selected weight ranges for multi-range products
  
  -- Pricing snapshot
  silver_rate NUMERIC(10, 2) NOT NULL,
  base_price NUMERIC(12, 2) NOT NULL,
  deduction_amount NUMERIC(12, 2) NOT NULL,
  labor_charges NUMERIC(12, 2) NOT NULL,
  discount_amount NUMERIC(12, 2) DEFAULT 0,
  global_loop_amount NUMERIC(12, 2) DEFAULT 0,
  gst_rate NUMERIC(5, 2) NOT NULL,
  gst_amount NUMERIC(12, 2) NOT NULL,
  item_total NUMERIC(12, 2) NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for order_items
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- 3. CART ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Weight & Configuration
  weight_kg NUMERIC(10, 3) NOT NULL,
  weight_ranges JSONB, -- Store selected weight ranges
  
  -- Price snapshot (cached for performance)
  price_snapshot JSONB NOT NULL, -- Full PriceBreakdown object
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint: One cart item per product per user
  UNIQUE(user_id, product_id)
);

-- Indexes for cart_items
CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: CART_ITEMS
-- ============================================

-- Users can view their own cart
CREATE POLICY "Users can view own cart"
  ON cart_items FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert to their own cart
CREATE POLICY "Users can add to own cart"
  ON cart_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own cart
CREATE POLICY "Users can update own cart"
  ON cart_items FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete from their own cart
CREATE POLICY "Users can delete from own cart"
  ON cart_items FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES: ORDERS
-- ============================================

-- Resellers can view their own orders
CREATE POLICY "Resellers can view own orders"
  ON orders FOR SELECT
  USING (
    reseller_id IN (
      SELECT id FROM resellers WHERE user_id = auth.uid()
    )
  );

-- Resellers can create orders (for their own reseller account)
CREATE POLICY "Resellers can create own orders"
  ON orders FOR INSERT
  WITH CHECK (
    reseller_id IN (
      SELECT id FROM resellers WHERE user_id = auth.uid()
    )
  );

-- Resellers can update their pending orders (for cancellation)
CREATE POLICY "Resellers can update own pending orders"
  ON orders FOR UPDATE
  USING (
    reseller_id IN (
      SELECT id FROM resellers WHERE user_id = auth.uid()
    )
    AND status = 'pending'
  );

-- Admins can view all orders
CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can update all orders
CREATE POLICY "Admins can update all orders"
  ON orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- RLS POLICIES: ORDER_ITEMS
-- ============================================

-- Users can view order items for orders they can see
CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders
      WHERE reseller_id IN (
        SELECT id FROM resellers WHERE user_id = auth.uid()
      )
    )
  );

-- Resellers can create order items (during order creation)
CREATE POLICY "Resellers can create order items"
  ON order_items FOR INSERT
  WITH CHECK (
    order_id IN (
      SELECT id FROM orders
      WHERE reseller_id IN (
        SELECT id FROM resellers WHERE user_id = auth.uid()
      )
    )
  );

-- Admins can view all order items
CREATE POLICY "Admins can view all order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function: Update orders.updated_at timestamp
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update orders.updated_at on UPDATE
CREATE TRIGGER trigger_update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_orders_updated_at();

-- Function: Update cart_items.updated_at timestamp
CREATE OR REPLACE FUNCTION update_cart_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update cart_items.updated_at on UPDATE
CREATE TRIGGER trigger_update_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_cart_items_updated_at();

-- ============================================
-- FUNCTION: Generate Order Code
-- ============================================
CREATE OR REPLACE FUNCTION generate_order_code()
RETURNS TEXT AS $$
DECLARE
  today_prefix TEXT;
  last_sequence INTEGER;
  new_sequence INTEGER;
  new_code TEXT;
BEGIN
  -- Format: ORD-YYYYMMDD-XXXX
  today_prefix := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-';
  
  -- Get last order code for today
  SELECT COALESCE(
    MAX(CAST(SUBSTRING(order_code FROM LENGTH(today_prefix) + 1) AS INTEGER)),
    0
  )
  INTO last_sequence
  FROM orders
  WHERE order_code LIKE today_prefix || '%';
  
  -- Increment sequence
  new_sequence := last_sequence + 1;
  
  -- Generate new code with zero-padded sequence
  new_code := today_prefix || LPAD(new_sequence::TEXT, 4, '0');
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Uncomment below to insert test data
/*
-- Test order
INSERT INTO orders (
  reseller_id,
  order_code,
  status,
  payment_status,
  total_weight_kg,
  subtotal,
  discount_amount,
  global_loop_amount,
  taxable_amount,
  gst_amount,
  total_price
) VALUES (
  (SELECT id FROM resellers LIMIT 1),
  generate_order_code(),
  'pending',
  'unpaid',
  1.000,
  65200.00,
  6520.00,
  1304.00,
  59984.00,
  1799.00,
  61783.00
);
*/

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check tables exist
SELECT 
  tablename,
  schemaname
FROM pg_tables
WHERE tablename IN ('orders', 'order_items', 'cart_items')
ORDER BY tablename;

-- Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('orders', 'order_items', 'cart_items')
ORDER BY tablename, policyname;

-- Test order code generation
SELECT generate_order_code() AS sample_order_code;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Orders system tables created successfully!';
  RAISE NOTICE '📦 Tables: orders, order_items, cart_items';
  RAISE NOTICE '🔐 RLS policies enabled and configured';
  RAISE NOTICE '🔧 Functions and triggers created';
  RAISE NOTICE '🚀 Ready to implement cart and checkout flow!';
END $$;
