-- Migration: Add GAINS Profile fields to user_profiles table
-- Date: 2025-12-02
-- Description: Adds fields from BNI GAINS Profile for networking/referral info

-- Add new columns to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS previous_job_type TEXT,
ADD COLUMN IF NOT EXISTS spouse_name TEXT,
ADD COLUMN IF NOT EXISTS children_info TEXT,
ADD COLUMN IF NOT EXISTS pets_info TEXT,
ADD COLUMN IF NOT EXISTS hobbies TEXT,
ADD COLUMN IF NOT EXISTS interests_activities TEXT,
ADD COLUMN IF NOT EXISTS residence_location TEXT,
ADD COLUMN IF NOT EXISTS residence_duration TEXT,
ADD COLUMN IF NOT EXISTS strong_desires TEXT,
ADD COLUMN IF NOT EXISTS secret_nobody_knows TEXT,
ADD COLUMN IF NOT EXISTS key_to_success TEXT,
ADD COLUMN IF NOT EXISTS gains_goals TEXT,
ADD COLUMN IF NOT EXISTS gains_achievements TEXT,
ADD COLUMN IF NOT EXISTS gains_interests TEXT,
ADD COLUMN IF NOT EXISTS gains_networks TEXT,
ADD COLUMN IF NOT EXISTS gains_skills TEXT;

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.previous_job_type IS 'Previous profession or career type';
COMMENT ON COLUMN user_profiles.spouse_name IS 'Spouse or partner name';
COMMENT ON COLUMN user_profiles.children_info IS 'Children information (names, ages)';
COMMENT ON COLUMN user_profiles.pets_info IS 'Pet information';
COMMENT ON COLUMN user_profiles.hobbies IS 'Personal hobbies';
COMMENT ON COLUMN user_profiles.interests_activities IS 'Interests and activities';
COMMENT ON COLUMN user_profiles.residence_location IS 'Where the user lives';
COMMENT ON COLUMN user_profiles.residence_duration IS 'How long lived at current residence';
COMMENT ON COLUMN user_profiles.strong_desires IS 'Strong desires and wishes';
COMMENT ON COLUMN user_profiles.secret_nobody_knows IS 'Interesting fact others dont know';
COMMENT ON COLUMN user_profiles.key_to_success IS 'Key factors for success';
COMMENT ON COLUMN user_profiles.gains_goals IS 'GAINS: Business and personal goals';
COMMENT ON COLUMN user_profiles.gains_achievements IS 'GAINS: Key accomplishments and achievements';
COMMENT ON COLUMN user_profiles.gains_interests IS 'GAINS: Professional and personal interests';
COMMENT ON COLUMN user_profiles.gains_networks IS 'GAINS: Groups, associations, communities';
COMMENT ON COLUMN user_profiles.gains_skills IS 'GAINS: Special skills and expertise';
