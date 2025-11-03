-- ====================================
-- DATABASE FUNCTION: Clear All Test Data
-- Creates a stored procedure that can be called to clear all data
-- ====================================

CREATE OR REPLACE FUNCTION clear_all_test_data()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  orders_count INTEGER;
  payments_count INTEGER;
  targets_count INTEGER;
  rewards_count INTEGER;
  order_items_count INTEGER;
  result json;
BEGIN
  -- Get counts before deletion
  SELECT COUNT(*) INTO orders_count FROM orders;
  SELECT COUNT(*) INTO payments_count FROM payments;
  SELECT COUNT(*) INTO targets_count FROM targets;
  SELECT COUNT(*) INTO rewards_count FROM rewards_claimed;
  SELECT COUNT(*) INTO order_items_count FROM order_items;
  
  -- Delete in correct order (child tables first)
  DELETE FROM rewards_claimed;
  DELETE FROM target_progress;
  DELETE FROM targets;
  DELETE FROM payments;
  DELETE FROM order_items;
  DELETE FROM orders;
  
  -- Return counts
  result := json_build_object(
    'success', true,
    'deleted', json_build_object(
      'orders', orders_count,
      'order_items', order_items_count,
      'payments', payments_count,
      'targets', targets_count,
      'rewards', rewards_count
    ),
    'message', 'Successfully cleared all test data'
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permission to authenticated users (admin only)
GRANT EXECUTE ON FUNCTION clear_all_test_data() TO authenticated;

-- Test the function (comment out in production)
-- SELECT clear_all_test_data();
