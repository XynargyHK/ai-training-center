-- ============================================
-- Migration 062: Add unique constraint on user_id
-- ============================================
-- Prevents duplicate profiles for the same user

-- First, delete duplicate profiles keeping only the most recent one per user_id
DELETE FROM customer_profiles a
USING customer_profiles b
WHERE a.user_id = b.user_id
  AND a.user_id IS NOT NULL
  AND a.created_at < b.created_at;

-- Now add unique constraint on user_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_profiles_user_id_unique
ON customer_profiles(user_id)
WHERE user_id IS NOT NULL;
