-- ========================================
-- Migration 027: Create Profile Tables
-- ========================================
-- Creates user_profiles and companies tables for the Profile system
-- Links companies to business_units
-- ========================================

-- ========================================
-- PART 1: Create Companies Table
-- ========================================

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Required Fields
  company_legal_name TEXT NOT NULL,
  registration_number TEXT NOT NULL,
  country_of_registration TEXT NOT NULL,
  business_license_url TEXT,
  company_type TEXT NOT NULL CHECK (company_type IN ('sole_proprietor', 'partnership', 'private_limited', 'public', 'non_profit', 'other')),
  industry_type TEXT NOT NULL,
  year_established INTEGER,
  company_email TEXT NOT NULL,
  company_phone TEXT NOT NULL,

  -- Registered Address (Required)
  registered_address_street TEXT NOT NULL,
  registered_address_city TEXT NOT NULL,
  registered_address_state TEXT,
  registered_address_postal TEXT NOT NULL,
  registered_address_country TEXT NOT NULL,

  -- Optional Fields
  trading_name TEXT,
  company_website TEXT,
  company_description TEXT,
  number_of_employees TEXT,
  annual_revenue_range TEXT,
  tax_id TEXT,

  -- Operating Address (Optional)
  operating_address_street TEXT,
  operating_address_city TEXT,
  operating_address_state TEXT,
  operating_address_postal TEXT,
  operating_address_country TEXT,

  -- Social Media (Optional)
  social_facebook TEXT,
  social_instagram TEXT,
  social_twitter TEXT,
  social_linkedin TEXT,
  social_youtube TEXT,
  social_tiktok TEXT,

  -- Brand Identity (Optional)
  brand_logo_url TEXT,
  brand_colors JSONB,
  brand_tagline TEXT,
  brand_personality TEXT,
  brand_values JSONB,

  -- Communication Guidelines (Optional)
  communication_tone TEXT,
  communication_greeting TEXT,
  communication_sign_off TEXT,
  communication_languages JSONB,

  -- Legal Documents (Optional)
  legal_documents JSONB,

  -- Policies (Optional)
  policy_refunds TEXT,
  policy_returns TEXT,
  policy_warranty TEXT,
  policy_shipping TEXT,

  -- AI Guidelines (Optional)
  ai_topics_to_avoid JSONB,
  ai_competitors_never_mention JSONB,
  ai_escalation_rules TEXT,

  -- Banking Info (Optional)
  bank_name TEXT,
  bank_account_name TEXT,
  bank_account_number TEXT,
  bank_swift_code TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for companies
CREATE INDEX IF NOT EXISTS idx_companies_legal_name ON companies(company_legal_name);
CREATE INDEX IF NOT EXISTS idx_companies_registration ON companies(registration_number);
CREATE INDEX IF NOT EXISTS idx_companies_created_by ON companies(created_by);

SELECT 'Part 1/4: Companies table created' AS status;

-- ========================================
-- PART 2: Create User Profiles Table
-- ========================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,

  -- Required Fields
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  country_code TEXT DEFAULT '+1',
  role_in_company TEXT NOT NULL CHECK (role_in_company IN ('owner', 'director', 'manager', 'administrator', 'other')),
  profile_photo_url TEXT,

  -- Optional Fields
  preferred_name TEXT,
  job_title TEXT,
  department TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say') OR gender IS NULL),
  nationality TEXT,
  languages_spoken JSONB,
  linkedin_url TEXT,
  bio TEXT,
  timezone TEXT,

  -- ID Documents (Optional)
  id_type TEXT,
  id_number TEXT,
  id_front_image_url TEXT,
  id_back_image_url TEXT,
  id_expiry DATE,

  -- Address (Optional)
  address_street TEXT,
  address_city TEXT,
  address_state TEXT,
  address_postal TEXT,
  address_country TEXT,

  -- Professional (Optional)
  years_experience INTEGER,
  areas_of_expertise JSONB,
  certifications JSONB,

  -- Preferences (Optional)
  communication_style TEXT,
  notification_preferences JSONB,

  -- Emergency Contact (Optional)
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one profile per user
  UNIQUE(user_id)
);

-- Create indexes for user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_company_id ON user_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

SELECT 'Part 2/4: User profiles table created' AS status;

-- ========================================
-- PART 3: Add company_id to business_units
-- ========================================

ALTER TABLE business_units ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_business_units_company_id ON business_units(company_id);

SELECT 'Part 3/4: Added company_id to business_units' AS status;

-- ========================================
-- PART 4: Enable RLS Policies
-- ========================================

-- Enable RLS on companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Companies: Users can read companies they belong to or created
CREATE POLICY "Users can view their companies" ON companies
  FOR SELECT
  USING (
    created_by = auth.uid() OR
    id IN (SELECT company_id FROM user_profiles WHERE user_id = auth.uid())
  );

-- Companies: Users can insert companies
CREATE POLICY "Users can create companies" ON companies
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Companies: Users can update companies they created
CREATE POLICY "Users can update their companies" ON companies
  FOR UPDATE
  USING (created_by = auth.uid());

-- Companies: Users can delete companies they created
CREATE POLICY "Users can delete their companies" ON companies
  FOR DELETE
  USING (created_by = auth.uid());

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- User Profiles: Users can view their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT
  USING (user_id = auth.uid());

-- User Profiles: Users can insert their own profile
CREATE POLICY "Users can create own profile" ON user_profiles
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- User Profiles: Users can update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE
  USING (user_id = auth.uid());

-- User Profiles: Users can delete their own profile
CREATE POLICY "Users can delete own profile" ON user_profiles
  FOR DELETE
  USING (user_id = auth.uid());

-- Allow anon access for development (can be removed in production)
CREATE POLICY "Allow anon read companies" ON companies
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "Allow anon insert companies" ON companies
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update companies" ON companies
  FOR UPDATE TO anon
  USING (true);

CREATE POLICY "Allow anon read profiles" ON user_profiles
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "Allow anon insert profiles" ON user_profiles
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update profiles" ON user_profiles
  FOR UPDATE TO anon
  USING (true);

SELECT 'Part 4/4: RLS policies enabled' AS status;

-- ========================================
-- PART 5: Create updated_at triggers
-- ========================================

-- Trigger function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for companies
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

SELECT 'Part 5/5: Triggers created' AS status;

-- ========================================
-- MIGRATION COMPLETE
-- ========================================

SELECT '========================================' AS status;
SELECT 'Migration 027 Complete!' AS status;
SELECT 'Tables created: companies, user_profiles' AS status;
SELECT 'business_units now has company_id column' AS status;
SELECT '========================================' AS status;
