-- Migration 107: Delete duplicate order #21
-- Order #20 and #21 were duplicates caused by double-click

DELETE FROM order_items WHERE order_id = (SELECT id FROM orders WHERE display_id = 21);
DELETE FROM orders WHERE display_id = 21;

SELECT 'Deleted duplicate order #21' AS result;
