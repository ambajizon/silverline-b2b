-- ====================================
-- REWARDS MANAGEMENT SYSTEM
-- Track rewards/prizes for target achievements
-- ====================================

-- Create rewards catalog table
CREATE TABLE IF NOT EXISTS rewards_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reward Details
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL, -- 'electronics', 'vehicle', 'cash', 'jewelry', 'voucher', 'other'
  
  -- Value
  cash_value DECIMAL(12, 2) NOT NULL,
  
  -- Inventory (if physical item)
  is_physical BOOLEAN DEFAULT true,
  total_stock INTEGER DEFAULT 0,
  available_stock INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  image_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create rewards claimed/given table
CREATE TABLE IF NOT EXISTS rewards_claimed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to target (if from target achievement)
  target_id UUID REFERENCES targets(id) ON DELETE SET NULL,
  
  -- Reward details
  reward_catalog_id UUID REFERENCES rewards_catalog(id) ON DELETE SET NULL,
  reward_name VARCHAR(200) NOT NULL, -- Store name in case catalog item deleted
  reward_type VARCHAR(50) NOT NULL, -- 'cash', 'item', 'both'
  cash_amount DECIMAL(12, 2) DEFAULT 0,
  item_value DECIMAL(12, 2) DEFAULT 0,
  
  -- Who got it
  reseller_id UUID NOT NULL REFERENCES resellers(id) ON DELETE CASCADE,
  
  -- Delivery tracking
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'delivered', 'cancelled')),
  claimed_date DATE DEFAULT CURRENT_DATE,
  approved_date DATE,
  delivered_date DATE,
  
  -- Delivery details
  delivery_method VARCHAR(100), -- 'hand_delivery', 'courier', 'bank_transfer', 'pickup'
  tracking_number VARCHAR(200),
  delivery_address TEXT,
  delivery_notes TEXT,
  
  -- Approvals
  approved_by UUID REFERENCES auth.users(id),
  delivered_by UUID REFERENCES auth.users(id),
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_rewards_catalog_category ON rewards_catalog(category);
CREATE INDEX IF NOT EXISTS idx_rewards_catalog_active ON rewards_catalog(is_active);
CREATE INDEX IF NOT EXISTS idx_rewards_claimed_reseller ON rewards_claimed(reseller_id);
CREATE INDEX IF NOT EXISTS idx_rewards_claimed_target ON rewards_claimed(target_id);
CREATE INDEX IF NOT EXISTS idx_rewards_claimed_status ON rewards_claimed(status);

-- Create view for rewards summary
CREATE OR REPLACE VIEW v_rewards_summary AS
SELECT 
  rc.id as claim_id,
  rc.reward_name,
  rc.reward_type,
  rc.cash_amount,
  rc.item_value,
  (rc.cash_amount + rc.item_value) as total_value,
  
  -- Reseller info
  r.shop_name as reseller_shop,
  r.contact_name as reseller_contact,
  r.phone as reseller_phone,
  
  -- Target info (if applicable)
  t.name as target_name,
  t.goal as target_goal,
  
  -- Status
  rc.status,
  rc.claimed_date,
  rc.approved_date,
  rc.delivered_date,
  
  -- Delivery
  rc.delivery_method,
  rc.tracking_number,
  
  -- Days since claimed
  CASE
    WHEN rc.status = 'delivered' THEN 
      (rc.delivered_date - rc.claimed_date)::INTEGER
    ELSE
      (CURRENT_DATE - rc.claimed_date)::INTEGER
  END as days_since_claimed,
  
  -- Status display
  CASE
    WHEN rc.status = 'pending' THEN '⏳ Pending Approval'
    WHEN rc.status = 'approved' THEN '✅ Approved'
    WHEN rc.status = 'processing' THEN '📦 Processing'
    WHEN rc.status = 'delivered' THEN '🎉 Delivered'
    WHEN rc.status = 'cancelled' THEN '❌ Cancelled'
  END as status_display,
  
  rc.created_at,
  rc.updated_at
FROM rewards_claimed rc
JOIN resellers r ON r.id = rc.reseller_id
LEFT JOIN targets t ON t.id = rc.target_id;

-- Enable RLS
ALTER TABLE rewards_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards_claimed ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Admins manage rewards catalog" ON rewards_catalog;
DROP POLICY IF EXISTS "Everyone can view active rewards" ON rewards_catalog;
DROP POLICY IF EXISTS "Admins manage claimed rewards" ON rewards_claimed;
DROP POLICY IF EXISTS "Resellers view own rewards" ON rewards_claimed;

-- Policies for rewards_catalog
CREATE POLICY "Admins manage rewards catalog"
  ON rewards_catalog
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Everyone can view active rewards"
  ON rewards_catalog
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Policies for rewards_claimed
CREATE POLICY "Admins manage claimed rewards"
  ON rewards_claimed
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Resellers view own rewards"
  ON rewards_claimed
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM resellers
      WHERE resellers.id = rewards_claimed.reseller_id
        AND resellers.user_id = auth.uid()
    )
  );

-- Function to auto-update stock when reward is claimed
CREATE OR REPLACE FUNCTION update_reward_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reward_catalog_id IS NOT NULL AND NEW.status = 'approved' THEN
    UPDATE rewards_catalog
    SET available_stock = available_stock - 1,
        updated_at = now()
    WHERE id = NEW.reward_catalog_id
      AND available_stock > 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trg_update_reward_stock ON rewards_claimed;
CREATE TRIGGER trg_update_reward_stock
  AFTER UPDATE ON rewards_claimed
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_reward_stock();

-- Add comments
COMMENT ON TABLE rewards_catalog IS 'Catalog of available rewards/prizes';
COMMENT ON TABLE rewards_claimed IS 'Track rewards claimed by resellers';
COMMENT ON VIEW v_rewards_summary IS 'Summary view of all claimed rewards';

-- Sample rewards catalog data
INSERT INTO rewards_catalog (name, description, category, cash_value, is_physical, total_stock, available_stock, is_active) VALUES
('Samsung 55" LED TV', '4K Ultra HD Smart TV with built-in streaming apps', 'electronics', 75000, true, 5, 5, true),
('Royal Enfield Classic 350', 'Iconic motorcycle in black color', 'vehicle', 200000, true, 2, 2, true),
('iPhone 15 Pro', '256GB, all colors available', 'electronics', 130000, true, 3, 3, true),
('Gold Coin 10g', '24K pure gold coin with certificate', 'jewelry', 60000, true, 10, 10, true),
('Cash Voucher ₹50,000', 'Direct bank transfer', 'cash', 50000, false, 0, 0, true),
('Cash Voucher ₹25,000', 'Direct bank transfer', 'cash', 25000, false, 0, 0, true),
('MacBook Air M3', '13-inch, 8GB RAM, 256GB SSD', 'electronics', 115000, true, 2, 2, true),
('Vacation Package - Goa', '3 nights 4 days for 2 people, 5-star resort', 'voucher', 80000, false, 0, 0, true),
('Hero Splendor Plus', 'Fuel-efficient bike', 'vehicle', 75000, true, 3, 3, true),
('Diamond Pendant Set', '18K gold with diamonds, 5g', 'jewelry', 150000, true, 2, 2, true)
ON CONFLICT DO NOTHING;
