-- Migration: Create Knowledge Base tables for Products, Services, and Policies
-- Date: 2025-12-02
-- Description: Creates structured tables for knowledge base management

-- Products table
CREATE TABLE IF NOT EXISTS kb_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_unit_id UUID REFERENCES business_units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  price DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  sku TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  specifications JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services table
CREATE TABLE IF NOT EXISTS kb_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_unit_id UUID REFERENCES business_units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  duration INTEGER, -- in minutes
  price DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Policies table
CREATE TABLE IF NOT EXISTS kb_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_unit_id UUID REFERENCES business_units(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('refund', 'return', 'shipping', 'warranty', 'privacy', 'terms', 'other')),
  content TEXT NOT NULL,
  effective_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product categories table (auto-generated)
CREATE TABLE IF NOT EXISTS kb_product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_unit_id UUID REFERENCES business_units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES kb_product_categories(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_unit_id, name)
);

-- Service categories table (auto-generated)
CREATE TABLE IF NOT EXISTS kb_service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_unit_id UUID REFERENCES business_units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES kb_service_categories(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_unit_id, name)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_kb_products_business_unit ON kb_products(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_kb_products_category ON kb_products(category);
CREATE INDEX IF NOT EXISTS idx_kb_products_name ON kb_products(name);
CREATE INDEX IF NOT EXISTS idx_kb_services_business_unit ON kb_services(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_kb_services_category ON kb_services(category);
CREATE INDEX IF NOT EXISTS idx_kb_policies_business_unit ON kb_policies(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_kb_policies_type ON kb_policies(type);

-- RLS Policies
ALTER TABLE kb_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_service_categories ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users
CREATE POLICY "kb_products_all" ON kb_products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "kb_services_all" ON kb_services FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "kb_policies_all" ON kb_policies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "kb_product_categories_all" ON kb_product_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "kb_service_categories_all" ON kb_service_categories FOR ALL USING (true) WITH CHECK (true);

-- Comments
COMMENT ON TABLE kb_products IS 'Product catalog for AI knowledge base';
COMMENT ON TABLE kb_services IS 'Service catalog for AI knowledge base';
COMMENT ON TABLE kb_policies IS 'Business policies for AI knowledge base';
