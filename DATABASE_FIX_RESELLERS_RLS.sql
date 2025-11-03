-- Fix RLS Policies for Resellers Table
-- This allows resellers to update their own records including logo_url

-- ============================================
-- OPTION 1: Allow resellers to update ALL their own fields
-- ============================================

-- Drop existing UPDATE policy if it exists
DROP POLICY IF EXISTS "Resellers can update own profile" ON resellers;

-- Create new UPDATE policy that allows resellers to update their own record
CREATE POLICY "Resellers can update own profile"
ON resellers
FOR UPDATE
TO authenticated
USING (
  -- User must be the owner of this reseller record
  user_id = auth.uid()
  AND
  -- User must have reseller role
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'reseller'
  )
)
WITH CHECK (
  -- User must be the owner of this reseller record
  user_id = auth.uid()
);

-- ============================================
-- OPTION 2: More restrictive - Allow only specific fields
-- (Use this if you want to prevent resellers from changing status, etc.)
-- ============================================

-- Uncomment below if you want to be more restrictive:

/*
DROP POLICY IF EXISTS "Resellers can update own profile fields" ON resellers;

CREATE POLICY "Resellers can update own profile fields"
ON resellers
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'reseller'
  )
)
WITH CHECK (
  user_id = auth.uid()
  -- Add additional checks here if needed
  -- For example: AND status = 'approved' (prevents status change)
);
*/

-- ============================================
-- Verify the policies are working
-- ============================================

-- Check all policies on resellers table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'resellers'
ORDER BY policyname;

-- ============================================
-- Test the policy (run as reseller user)
-- ============================================

/*
-- This should work now:
UPDATE resellers 
SET logo_url = 'https://example.com/logo.png',
    updated_at = NOW()
WHERE user_id = auth.uid();

-- Check if it updated:
SELECT id, user_id, shop_name, logo_url, updated_at
FROM resellers
WHERE user_id = auth.uid();
*/

-- ============================================
-- Notes
-- ============================================

-- This policy allows resellers to:
-- ✅ UPDATE their own logo_url
-- ✅ UPDATE their own profile fields (shop_name, contact_name, etc.)
-- ✅ UPDATE their own updated_at timestamp
--
-- This policy prevents resellers from:
-- ❌ UPDATING other resellers' records
-- ❌ CHANGING their user_id (enforced by WITH CHECK)
--
-- Admin users should use service role to update any reseller record
-- (bypasses RLS entirely)

-- ============================================
-- Rollback (if needed)
-- ============================================

-- To remove the policy:
-- DROP POLICY IF EXISTS "Resellers can update own profile" ON resellers;
