-- ========================================
-- Migration 105: Fix Business Unit IDs
-- ========================================
-- Sets business_unit_id on orders and customer_profiles that are missing it
-- Defaults to 'skincoach' business unit
-- ========================================

-- Get skincoach business unit ID
DO $$
DECLARE
  v_skincoach_id UUID;
BEGIN
  SELECT id INTO v_skincoach_id FROM business_units WHERE slug = 'skincoach';

  IF v_skincoach_id IS NOT NULL THEN
    -- Update orders missing business_unit_id
    UPDATE orders
    SET business_unit_id = v_skincoach_id
    WHERE business_unit_id IS NULL;

    RAISE NOTICE 'Updated orders with skincoach business_unit_id: %', v_skincoach_id;

    -- Update customer_profiles missing business_unit_id
    UPDATE customer_profiles
    SET business_unit_id = v_skincoach_id
    WHERE business_unit_id IS NULL;

    RAISE NOTICE 'Updated customer_profiles with skincoach business_unit_id: %', v_skincoach_id;
  ELSE
    RAISE NOTICE 'skincoach business unit not found';
  END IF;
END $$;

-- Also fix fulfillment_status
UPDATE orders
SET fulfillment_status = 'processing'
WHERE fulfillment_status IN ('not_fulfilled', 'not-fulfilled');

SELECT 'Migration 105 Complete: Fixed business_unit_ids and fulfillment_status' AS status;
