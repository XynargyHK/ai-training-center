-- Migration 106: Unify order status fields
-- Ensures status and fulfillment_status always have the same value
-- The 'status' field is now the primary field used by the application

-- Fix any orders where status != fulfillment_status
-- Use fulfillment_status as the source of truth since it was being updated by admin
UPDATE orders
SET status = fulfillment_status
WHERE status != fulfillment_status
  AND fulfillment_status IS NOT NULL;

-- Fix any orders still showing 'pending' or 'not_fulfilled'
UPDATE orders
SET status = 'processing', fulfillment_status = 'processing'
WHERE status IN ('pending', 'not_fulfilled', 'not-fulfilled')
   OR fulfillment_status IN ('pending', 'not_fulfilled', 'not-fulfilled');

-- Verify the fix
SELECT
  status,
  fulfillment_status,
  COUNT(*) as count
FROM orders
GROUP BY status, fulfillment_status
ORDER BY count DESC;

SELECT 'Migration 106 Complete: Unified status fields' AS result;
