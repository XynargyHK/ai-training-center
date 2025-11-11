-- Auto-generated from Excel: knowledgebase/Booster descriptions and pricing_1762329426212.xlsx
-- Headers: Product Name, Tagline, Ingredients, Hero Benefit Summary, Key Actives, Face Benefits, Body Benefit, Hair/Scalp Benefits, Eye Benefits, Clinical Highlight, Trade Name, Cost 2ml, Retail 2ml, Retail 30ml

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_unit_id UUID REFERENCES business_units(id) ON DELETE CASCADE,

  product_name TEXT,
  tagline TEXT,
  ingredients TEXT,
  hero_benefit_summary TEXT,
  key_actives TEXT,
  face_benefits TEXT,
  body_benefit TEXT,
  hairscalp_benefits TEXT,
  eye_benefits TEXT,
  clinical_highlight TEXT,
  trade_name TEXT,
  cost_2ml DECIMAL(10,2),
  retail_2ml TEXT,
  retail_30ml TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_products_business_unit ON products(business_unit_id);

-- Column mapping for reference
-- "Product Name" = product_name
-- "Tagline" = tagline
-- "Ingredients" = ingredients
-- "Hero Benefit Summary" = hero_benefit_summary
-- "Key Actives" = key_actives
-- "Face Benefits" = face_benefits
-- "Body Benefit" = body_benefit
-- "Hair/Scalp Benefits" = hairscalp_benefits
-- "Eye Benefits" = eye_benefits
-- "Clinical Highlight" = clinical_highlight
-- "Trade Name" = trade_name
-- "Cost 2ml" = cost_2ml
-- "Retail 2ml" = retail_2ml
-- "Retail 30ml" = retail_30ml
