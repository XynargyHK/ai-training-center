-- ============================================
-- Migration 057: Customer Profiles & Quiz System
-- ============================================
-- Stores customer quiz responses and profile data for personalized recommendations

-- 1. Create customer_profiles table
CREATE TABLE IF NOT EXISTS customer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_unit_id UUID REFERENCES business_units(id) ON DELETE CASCADE,

  -- User link (optional - can be anonymous)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email VARCHAR(255),
  name VARCHAR(255),
  phone VARCHAR(50),

  -- Step 1: Basic Info
  gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  age_group VARCHAR(20) CHECK (age_group IN ('18-25', '26-35', '36-45', '46-55', '55+')),
  climate VARCHAR(20) CHECK (climate IN ('humid', 'dry', 'tropical', 'temperate', 'cold')),

  -- Step 2: Skin Type
  skin_type VARCHAR(20) CHECK (skin_type IN ('oily', 'dry', 'combination', 'sensitive', 'normal')),
  skin_tone VARCHAR(20) CHECK (skin_tone IN ('fair', 'medium', 'olive', 'dark')),
  sun_exposure VARCHAR(20) CHECK (sun_exposure IN ('rarely', 'sometimes', 'often')),

  -- Step 4: Lifestyle
  current_routine VARCHAR(20) CHECK (current_routine IN ('none', 'basic', 'advanced')),
  product_preference VARCHAR(20) CHECK (product_preference IN ('natural', 'clinical', 'no_preference')),
  monthly_budget VARCHAR(20) CHECK (monthly_budget IN ('0-50', '50-100', '100-200', '200+')),

  -- Quiz completion status
  quiz_completed BOOLEAN DEFAULT false,
  quiz_completed_at TIMESTAMPTZ,
  quiz_step INT DEFAULT 1,

  -- Recommendation status
  recommendation_generated BOOLEAN DEFAULT false,
  recommendation_generated_at TIMESTAMPTZ,

  -- Metadata
  source VARCHAR(50), -- 'website', 'mobile', 'chat', etc.
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create customer_concerns table (links profiles to their selected concerns)
CREATE TABLE IF NOT EXISTS customer_concerns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
  concern_id UUID NOT NULL REFERENCES skin_concerns(id) ON DELETE CASCADE,

  -- How severe is this concern for the customer (1-5)
  severity INT DEFAULT 3 CHECK (severity BETWEEN 1 AND 5),

  -- Is this a top priority concern?
  is_priority BOOLEAN DEFAULT false,

  -- Which body area category (denormalized for easy querying)
  category VARCHAR(20) CHECK (category IN ('face', 'eye', 'body', 'scalp')),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(profile_id, concern_id)
);

-- 3. Create customer_recommendations table (stores generated recommendations)
CREATE TABLE IF NOT EXISTS customer_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,

  -- Recommendation type
  recommendation_type VARCHAR(50) CHECK (recommendation_type IN (
    'full_routine', 'category_bundle', 'starter_kit', 'single_product'
  )),

  -- Bundle/offer details
  title VARCHAR(255),
  description TEXT,

  -- Pricing
  original_price DECIMAL(10,2),
  discount_percent INT,
  final_price DECIMAL(10,2),

  -- Duration (for subscription offers)
  duration_months INT,

  -- Products in this recommendation (JSON array of product IDs with quantities)
  products JSONB,

  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'accepted', 'declined', 'expired')),

  -- Offer expiry
  expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_customer_profiles_business_unit ON customer_profiles(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_email ON customer_profiles(email);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_user_id ON customer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_quiz_completed ON customer_profiles(quiz_completed);

CREATE INDEX IF NOT EXISTS idx_customer_concerns_profile ON customer_concerns(profile_id);
CREATE INDEX IF NOT EXISTS idx_customer_concerns_concern ON customer_concerns(concern_id);
CREATE INDEX IF NOT EXISTS idx_customer_concerns_category ON customer_concerns(category);

CREATE INDEX IF NOT EXISTS idx_customer_recommendations_profile ON customer_recommendations(profile_id);
CREATE INDEX IF NOT EXISTS idx_customer_recommendations_status ON customer_recommendations(status);

-- 5. Enable RLS
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_concerns ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customer_profiles
CREATE POLICY "Allow public insert to customer_profiles"
  ON customer_profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow users to view own profile"
  ON customer_profiles FOR SELECT
  USING (true);

CREATE POLICY "Allow users to update own profile"
  ON customer_profiles FOR UPDATE
  USING (true);

-- RLS Policies for customer_concerns
CREATE POLICY "Allow public insert to customer_concerns"
  ON customer_concerns FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow read customer_concerns"
  ON customer_concerns FOR SELECT
  USING (true);

CREATE POLICY "Allow update customer_concerns"
  ON customer_concerns FOR UPDATE
  USING (true);

CREATE POLICY "Allow delete customer_concerns"
  ON customer_concerns FOR DELETE
  USING (true);

-- RLS Policies for customer_recommendations
CREATE POLICY "Allow insert customer_recommendations"
  ON customer_recommendations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow read customer_recommendations"
  ON customer_recommendations FOR SELECT
  USING (true);

CREATE POLICY "Allow update customer_recommendations"
  ON customer_recommendations FOR UPDATE
  USING (true);

-- 6. Comments
COMMENT ON TABLE customer_profiles IS 'Stores customer quiz responses and profile information';
COMMENT ON TABLE customer_concerns IS 'Links customer profiles to their selected skin concerns';
COMMENT ON TABLE customer_recommendations IS 'AI-generated product recommendations for customers';

COMMENT ON COLUMN customer_profiles.quiz_step IS 'Current step in the quiz (1-4)';
COMMENT ON COLUMN customer_concerns.severity IS 'How severe this concern is for the customer (1=mild, 5=severe)';
COMMENT ON COLUMN customer_recommendations.products IS 'JSON array: [{product_id, quantity, is_addon}]';
