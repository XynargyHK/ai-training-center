-- Test creating just the products table
DROP TABLE IF EXISTS products CASCADE;

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_unit_id UUID REFERENCES business_units(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  handle VARCHAR(255),
  subtitle VARCHAR(255),
  thumbnail VARCHAR(500),
  status VARCHAR(50) DEFAULT 'draft',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Add unique constraint separately
ALTER TABLE products ADD CONSTRAINT products_business_unit_handle_key UNIQUE (business_unit_id, handle);
