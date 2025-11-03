-- ⚠️ OPTIONAL MIGRATION: Add 'active' status to resellers table
-- Only run this if you want to support 'active' as a distinct status from 'approved'

-- Current constraint allows: 'pending', 'approved', 'rejected', 'suspended'
-- This migration adds: 'active' to the allowed values

-- Step 1: Drop the existing check constraint
ALTER TABLE resellers 
DROP CONSTRAINT IF EXISTS resellers_status_check;

-- Step 2: Add new check constraint with 'active' included
ALTER TABLE resellers 
ADD CONSTRAINT resellers_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'suspended', 'active'));

-- Step 3: Verify the constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'resellers'::regclass 
AND conname = 'resellers_status_check';

-- Note: After running this migration, you'll need to:
-- 1. Uncomment 'active' status in UpdateStatusDropdown.tsx
-- 2. Add 'active' to validStatuses array in update-status/route.ts
-- 3. Update the access control logic to include 'active'
-- 4. Add 'active' back to ResellerStatus type in types/resellers.ts
