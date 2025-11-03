-- ====================================
-- SALES TARGETS/INCENTIVES SYSTEM
-- For rewarding top-performing resellers
-- ====================================

-- Drop existing if you want fresh start
-- DROP TABLE IF EXISTS sales_targets CASCADE;
-- DROP VIEW IF EXISTS v_target_progress CASCADE;

-- Create sales targets table
CREATE TABLE IF NOT EXISTS sales_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Target Basic Info
  title VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- Who is this target for (specific reseller)
  reseller_id UUID NOT NULL REFERENCES resellers(id) ON DELETE CASCADE,
  
  -- Target Details
  target_amount DECIMAL(12, 2) NOT NULL, -- Revenue target
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Reward Information
  reward_type VARCHAR(50) NOT NULL CHECK (reward_type IN ('cash', 'item', 'both')),
  reward_cash DECIMAL(12, 2) DEFAULT 0,
  reward_item_name VARCHAR(200), -- e.g., "LED TV 55 inch", "Royal Enfield Classic 350"
  reward_item_value DECIMAL(12, 2) DEFAULT 0,
  
  -- Status Tracking
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'achieved', 'failed', 'cancelled')),
  achieved_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sales_targets_reseller ON sales_targets(reseller_id);
CREATE INDEX IF NOT EXISTS idx_sales_targets_status ON sales_targets(status);
CREATE INDEX IF NOT EXISTS idx_sales_targets_dates ON sales_targets(start_date, end_date);

-- Create view to track target progress in real-time
CREATE OR REPLACE VIEW v_target_progress AS
SELECT 
  st.id as target_id,
  st.title,
  st.description,
  st.reseller_id,
  r.shop_name as reseller_shop_name,
  r.contact_name as reseller_contact,
  r.phone as reseller_phone,
  
  -- Target Details
  st.target_amount,
  st.start_date,
  st.end_date,
  
  -- Reward Info
  st.reward_type,
  st.reward_cash,
  st.reward_item_name,
  st.reward_item_value,
  CASE 
    WHEN st.reward_type = 'cash' THEN CONCAT('Cash: ₹', st.reward_cash)
    WHEN st.reward_type = 'item' THEN CONCAT(st.reward_item_name, ' (₹', st.reward_item_value, ')')
    WHEN st.reward_type = 'both' THEN CONCAT('Cash: ₹', st.reward_cash, ' + ', st.reward_item_name)
    ELSE 'No reward'
  END as reward_display,
  
  -- Calculate current sales (delivered orders only)
  COALESCE(
    (SELECT SUM(o.total_price)
     FROM orders o
     WHERE o.reseller_id = st.reseller_id
       AND o.status = 'delivered'
       AND o.created_at >= st.start_date
       AND o.created_at <= (st.end_date + INTERVAL '1 day')
    ), 0
  ) as current_sales,
  
  -- Calculate progress percentage
  CASE 
    WHEN st.target_amount > 0 THEN
      ROUND(
        (COALESCE(
          (SELECT SUM(o.total_price)
           FROM orders o
           WHERE o.reseller_id = st.reseller_id
             AND o.status = 'delivered'
             AND o.created_at >= st.start_date
             AND o.created_at <= (st.end_date + INTERVAL '1 day')
          ), 0
        ) / st.target_amount * 100), 2
      )
    ELSE 0
  END as progress_percentage,
  
  -- Amount remaining to achieve target
  GREATEST(0, st.target_amount - COALESCE(
    (SELECT SUM(o.total_price)
     FROM orders o
     WHERE o.reseller_id = st.reseller_id
       AND o.status = 'delivered'
       AND o.created_at >= st.start_date
       AND o.created_at <= (st.end_date + INTERVAL '1 day')
    ), 0
  )) as remaining_amount,
  
  -- Check if target is achieved
  CASE 
    WHEN COALESCE(
      (SELECT SUM(o.total_price)
       FROM orders o
       WHERE o.reseller_id = st.reseller_id
         AND o.status = 'delivered'
         AND o.created_at >= st.start_date
         AND o.created_at <= (st.end_date + INTERVAL '1 day')
      ), 0
    ) >= st.target_amount THEN TRUE
    ELSE FALSE
  END as is_qualified,
  
  -- Period status
  CASE
    WHEN CURRENT_DATE < st.start_date THEN 'upcoming'
    WHEN CURRENT_DATE >= st.start_date AND CURRENT_DATE <= st.end_date THEN 'active'
    WHEN CURRENT_DATE > st.end_date THEN 'expired'
  END as period_status,
  
  -- Days remaining
  CASE
    WHEN CURRENT_DATE <= st.end_date THEN
      (st.end_date - CURRENT_DATE)::INTEGER
    ELSE 0
  END as days_remaining,
  
  -- Total days in period
  (st.end_date - st.start_date)::INTEGER as total_days,
  
  -- Status and dates
  st.status,
  st.achieved_at,
  st.created_at,
  st.updated_at
FROM sales_targets st
JOIN resellers r ON r.id = st.reseller_id;

-- Enable RLS (Row Level Security)
ALTER TABLE sales_targets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admins can manage all targets" ON sales_targets;
DROP POLICY IF EXISTS "Resellers can view own targets" ON sales_targets;

-- Policy: Admins can do everything
CREATE POLICY "Admins can manage all targets"
  ON sales_targets
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Policy: Resellers can only view their own targets (read-only)
CREATE POLICY "Resellers can view own targets"
  ON sales_targets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM resellers
      WHERE resellers.id = sales_targets.reseller_id
        AND resellers.user_id = auth.uid()
    )
  );

-- Add helpful comments
COMMENT ON TABLE sales_targets IS 'Sales targets and incentive programs for resellers';
COMMENT ON COLUMN sales_targets.reward_type IS 'Type of reward: cash, item, or both';
COMMENT ON COLUMN sales_targets.reward_item_name IS 'Name of physical reward (e.g., LED TV, Bike, Gold Coin)';
COMMENT ON VIEW v_target_progress IS 'Real-time view of target progress with sales calculations';

-- Sample data for testing (optional - remove if not needed)
/*
INSERT INTO sales_targets (
  title,
  description,
  reseller_id,
  target_amount,
  start_date,
  end_date,
  reward_type,
  reward_cash,
  reward_item_name,
  reward_item_value
) VALUES (
  'Diwali Bonanza - ₹10 Lakh Challenge',
  'Achieve ₹10 lakh sales this festive season and win a brand new Royal Enfield Classic 350!',
  '< reseller_id_here>',
  1000000,
  '2025-10-01',
  '2025-11-15',
  'both',
  50000,
  'Royal Enfield Classic 350',
  200000
);
*/
