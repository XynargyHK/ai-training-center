-- ========================================
-- Migration 104: Fix Order Status
-- ========================================
-- Updates all orders with 'not-fulfilled' status to 'processing'
-- ========================================

-- Update fulfillment_status
UPDATE orders
SET fulfillment_status = 'processing'
WHERE fulfillment_status = 'not-fulfilled' OR fulfillment_status = 'not_fulfilled';

-- Update status field as well
UPDATE orders
SET status = 'processing'
WHERE status = 'not-fulfilled' OR status = 'not_fulfilled';

SELECT 'Migration 104 Complete: Updated not-fulfilled orders to processing' AS status;
