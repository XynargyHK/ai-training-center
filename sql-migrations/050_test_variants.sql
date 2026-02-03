-- Test creating products and variants tables
DROP TABLE IF EXISTS product_variants CASCADE;
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

ALTER TABLE products ADD CONSTRAINT products_business_unit_handle_key UNIQUE (business_unit_id, handle);

CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  barcode VARCHAR(100),
  ean VARCHAR(100),
  inventory_quantity INTEGER DEFAULT 0,
  allow_backorder BOOLEAN DEFAULT false,
  manage_inventory BOOLEAN DEFAULT true,
  weight DECIMAL(10, 2),
  length DECIMAL(10, 2),
  height DECIMAL(10, 2),
  width DECIMAL(10, 2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

ALTER TABLE product_variants ADD CONSTRAINT product_variants_product_sku_key UNIQUE (product_id, sku);
