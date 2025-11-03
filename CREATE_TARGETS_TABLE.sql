-- Create sales targets/incentives table
CREATE TABLE IF NOT EXISTS sales_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Target details
  title VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- Who is this target for
  reseller_id UUID NOT NULL REFERENCES resellers(id) ON DELETE CASCADE,
  
  -- Target amount and period
  target_amount DECIMAL(12, 2) NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Reward details
  reward_type VARCHAR(50) NOT NULL, -- 'cash', 'item', 'both'
  reward_cash DECIMAL(12, 2) DEFAULT 0,
  reward_item VARCHAR(200), -- e.g., "LED TV 55 inch", "Royal Enfield Bike"
  reward_item_value DECIMAL(12, 2) DEFAULT 0,
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'achieved', 'failed', 'cancelled'
  achieved_at TIMESTAMP WITH TIME ZONE,
  achieved_amount DECIMAL(12, 2) DEFAULT 0,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for better performance
CREATE INDEX idx_sales_targets_reseller ON sales_targets(reseller_id);
CREATE INDEX idx_sales_targets_status ON sales_targets(status);
CREATE INDEX idx_sales_targets_dates ON sales_targets(start_date, end_date);

-- Create view to check target progress
CREATE OR REPLACE VIEW v_target_progress AS
SELECT 
  st.id,
  st.title,
  st.description,
  st.reseller_id,
  r.shop_name,
  r.contact_name,
  st.target_amount,
  st.start_date,
  st.end_date,
  st.reward_type,
  st.reward_cash,
  st.reward_item,
  st.reward_item_value,
  st.status,
  st.achieved_at,
  
  -- Calculate actual sales in the period
  COALESCE(
    (SELECT SUM(o.total_price)
     FROM orders o
     WHERE o.reseller_id = st.reseller_id
       AND o.status = 'delivered'
       AND o.created_at >= st.start_date
       AND o.created_at <= st.end_date
    ), 0
  ) as current_amount,
  
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
             AND o.created_at <= st.end_date
          ), 0
        ) / st.target_amount * 100), 2
      )
    ELSE 0
  END as progress_percentage,
  
  -- Check if target is achieved
  CASE 
    WHEN COALESCE(
      (SELECT SUM(o.total_price)
       FROM orders o
       WHERE o.reseller_id = st.reseller_id
         AND o.status = 'delivered'
         AND o.created_at >= st.start_date
         AND o.created_at <= st.end_date
      ), 0
    ) >= st.target_amount THEN true
    ELSE false
  END as is_achieved,
  
  -- Check if target is active/expired
  CASE
    WHEN now() < st.start_date THEN 'upcoming'
    WHEN now() >= st.start_date AND now() <= st.end_date THEN 'active'
    WHEN now() > st.end_date THEN 'expired'
  END as period_status,
  
  -- Days remaining
  CASE
    WHEN now() <= st.end_date THEN
      EXTRACT(DAY FROM st.end_date - now())::INTEGER
    ELSE 0
  END as days_remaining,
  
  st.created_at,
  st.updated_at
FROM sales_targets st
JOIN resellers r ON r.id = st.reseller_id;

-- Enable RLS (Row Level Security)
ALTER TABLE sales_targets ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can do everything
CREATE POLICY "Admins can manage targets"
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

-- Policy: Resellers can only view their own targets
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

-- Add comment
COMMENT ON TABLE sales_targets IS 'Sales targets and incentives for resellers';
