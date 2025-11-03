-- RPC function to ensure a reseller record exists for a user
-- Creates one if missing, returns reseller.id
-- Uses SECURITY DEFINER to bypass RLS for auto-creation

CREATE OR REPLACE FUNCTION ensure_reseller_for_user(uid uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reseller_id uuid;
  v_role text;
BEGIN
  -- 1) Check user role
  SELECT role INTO v_role
  FROM profiles
  WHERE id = uid;
  
  IF v_role IS NULL OR v_role != 'reseller' THEN
    RAISE EXCEPTION 'USER_NOT_RESELLER';
  END IF;

  -- 2) Try to find existing reseller
  SELECT id INTO v_reseller_id
  FROM resellers
  WHERE user_id = uid;
  
  -- 3) If not found, create it
  IF v_reseller_id IS NULL THEN
    INSERT INTO resellers (user_id)
    VALUES (uid)
    RETURNING id INTO v_reseller_id;
  END IF;
  
  RETURN v_reseller_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION ensure_reseller_for_user(uuid) TO authenticated;

COMMENT ON FUNCTION ensure_reseller_for_user IS 
'Ensures a reseller record exists for the given user_id. Creates one if missing. Returns reseller.id.';
