-- ====================================
-- TARGETS SYSTEM - FIXED VERSION
-- Creates 'targets' table (not 'sales_targets')
-- ====================================

-- Drop existing if needed
-- DROP TABLE IF EXISTS targets CASCADE;
-- DROP TABLE IF EXISTS target_progress CASCADE;

-- Create targets table (matching the code expectations)
CREATE TABLE IF NOT EXISTS targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Target Basic Info
  name VARCHAR(200) NOT NULL,
  terms TEXT,
  notes TEXT,
  
  -- Who is this target for
  reseller_id UUID REFERENCES resellers(id) ON DELETE CASCADE,
  open_participation BOOLEAN DEFAULT false,
  
  -- Target Details
  type VARCHAR(50) NOT NULL, -- 'sales_revenue', 'order_count', 'product_units'
  goal DECIMAL(12, 2) NOT NULL,
  deadline DATE NOT NULL,
  
  -- Reward Information
  reward_type VARCHAR(50), -- 'cash', 'item', 'both'
  reward_value DECIMAL(12, 2) DEFAULT 0,
  
  -- Status
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'suspended', 'cancelled')),
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create target_progress table for tracking
CREATE TABLE IF NOT EXISTS target_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id UUID NOT NULL REFERENCES targets(id) ON DELETE CASCADE,
  current_value DECIMAL(12, 2) DEFAULT 0,
  delta_value DECIMAL(12, 2) DEFAULT 0,
  note TEXT,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_targets_reseller ON targets(reseller_id);
CREATE INDEX IF NOT EXISTS idx_targets_status ON targets(status);
CREATE INDEX IF NOT EXISTS idx_targets_deadline ON targets(deadline);
CREATE INDEX IF NOT EXISTS idx_target_progress_target ON target_progress(target_id);

-- Enable RLS
ALTER TABLE targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE target_progress ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage all targets" ON targets;
DROP POLICY IF EXISTS "Resellers can view own targets" ON targets;
DROP POLICY IF EXISTS "Admins can manage progress" ON target_progress;
DROP POLICY IF EXISTS "Resellers can view own progress" ON target_progress;

-- Policies for targets table
CREATE POLICY "Admins can manage all targets"
  ON targets
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Resellers can view own targets"
  ON targets
  FOR SELECT
  TO authenticated
  USING (
    open_participation = true
    OR EXISTS (
      SELECT 1 FROM resellers
      WHERE resellers.id = targets.reseller_id
        AND resellers.user_id = auth.uid()
    )
  );

-- Policies for target_progress table
CREATE POLICY "Admins can manage progress"
  ON target_progress
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Resellers can view own progress"
  ON target_progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM targets t
      JOIN resellers r ON r.id = t.reseller_id
      WHERE t.id = target_progress.target_id
        AND r.user_id = auth.uid()
    )
  );

-- Add comments
COMMENT ON TABLE targets IS 'Sales targets and challenges for resellers';
COMMENT ON TABLE target_progress IS 'Progress tracking for targets';

-- Sample insert (optional - update reseller_id)
/*
INSERT INTO targets (
  name,
  terms,
  reseller_id,
  type,
  goal,
  deadline,
  reward_type,
  reward_value,
  status
) VALUES (
  'November Sales Challenge - Win LED TV!',
  'Achieve ₹5 lakh sales in November and win a 55" LED TV worth ₹75,000',
  '<paste_reseller_id_here>',
  'sales_revenue',
  500000,
  '2025-11-30',
  'item',
  75000,
  'active'
);
*/
