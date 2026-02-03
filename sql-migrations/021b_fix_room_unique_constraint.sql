-- ============================================
-- FIX ROOM UNIQUE CONSTRAINT FOR OUTLETS
-- ============================================
-- Changes unique constraint from (business_unit_id, room_number)
-- to (outlet_id, room_number) so each outlet can have Room 101, etc.

-- Drop old unique constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'treatment_rooms_business_unit_id_room_number_key'
      AND table_name = 'treatment_rooms'
  ) THEN
    ALTER TABLE treatment_rooms
    DROP CONSTRAINT treatment_rooms_business_unit_id_room_number_key;
    RAISE NOTICE 'Dropped old unique constraint on (business_unit_id, room_number)';
  END IF;
END $$;

-- Add new unique constraint on (outlet_id, room_number)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'treatment_rooms_outlet_id_room_number_key'
      AND table_name = 'treatment_rooms'
  ) THEN
    ALTER TABLE treatment_rooms
    ADD CONSTRAINT treatment_rooms_outlet_id_room_number_key
    UNIQUE (outlet_id, room_number);
    RAISE NOTICE 'Added new unique constraint on (outlet_id, room_number)';
  END IF;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✓ Room unique constraint updated';
  RAISE NOTICE 'Each outlet can now have its own Room 101, Room 102, etc.';
  RAISE NOTICE 'Example: Downtown location can have Room 101 AND Uptown location can also have Room 101';
END $$;
