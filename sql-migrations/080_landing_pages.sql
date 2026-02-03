-- Landing Pages table for dynamic content per business unit
-- Each business unit can have customized landing page content

CREATE TABLE IF NOT EXISTS landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_unit_id UUID NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,

  -- Hero Section
  announcement_text TEXT,
  hero_headline TEXT NOT NULL,
  hero_subheadline TEXT,
  hero_product_name TEXT,
  hero_benefits JSONB DEFAULT '[]'::jsonb, -- Array of benefit strings
  hero_cta_text TEXT DEFAULT 'Shop Now',
  hero_image_url TEXT,

  -- Clinical Results Section
  clinical_results JSONB DEFAULT '[]'::jsonb, -- Array of {value, label} objects

  -- Technology/Features Section
  tech_headline TEXT,
  tech_subheadline TEXT,
  tech_features JSONB DEFAULT '[]'::jsonb, -- Array of {icon, title, items} objects

  -- Performance Metrics
  performance_metrics JSONB DEFAULT '[]'::jsonb, -- Array of {value, label} objects

  -- How To Use Steps
  how_to_use_headline TEXT,
  how_to_use_steps JSONB DEFAULT '[]'::jsonb, -- Array of {icon, text} objects
  how_to_use_footer TEXT,

  -- Ingredients Section
  ingredients_headline TEXT,
  ingredients_subheadline TEXT,
  ingredients JSONB DEFAULT '[]'::jsonb, -- Array of {icon, name, description, benefits, badge} objects

  -- Pricing Section
  pricing_headline TEXT,
  pricing_subheadline TEXT,
  pricing_options JSONB DEFAULT '[]'::jsonb, -- Array of pricing option objects
  show_sold_indicator BOOLEAN DEFAULT false,
  sold_percentage INTEGER DEFAULT 0,

  -- Testimonials Section
  testimonials_headline TEXT,
  testimonials JSONB DEFAULT '[]'::jsonb, -- Array of {name, age, text, rating} objects
  testimonials_stats JSONB DEFAULT '{}'::jsonb, -- {recommend_pct, five_star_pct}

  -- FAQ Section (can also use the existing faqs table)
  landing_faqs JSONB DEFAULT '[]'::jsonb, -- Array of {question, answer} objects

  -- Trust Badges
  trust_badges JSONB DEFAULT '[]'::jsonb, -- Array of {icon, label} objects

  -- Footer
  footer_disclaimer TEXT,

  -- Theme/Styling
  primary_color TEXT DEFAULT '#4A90D9',
  secondary_color TEXT DEFAULT '#0D1B2A',

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Each business unit can only have one landing page
CREATE UNIQUE INDEX IF NOT EXISTS landing_pages_business_unit_unique
ON landing_pages(business_unit_id);

-- Index for active landing pages
CREATE INDEX IF NOT EXISTS landing_pages_active_idx
ON landing_pages(business_unit_id) WHERE is_active = true;

-- Enable RLS
ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;

-- RLS Policies - anyone can read active landing pages
CREATE POLICY "Anyone can view active landing pages"
ON landing_pages FOR SELECT
USING (is_active = true);

-- Authenticated users can manage landing pages
CREATE POLICY "Authenticated users can manage landing pages"
ON landing_pages FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
