-- Add translation fields to categories table for FAQ category names
-- Each category can have translated names for different languages

ALTER TABLE categories
ADD COLUMN IF NOT EXISTS name_tw TEXT,
ADD COLUMN IF NOT EXISTS name_cn TEXT,
ADD COLUMN IF NOT EXISTS name_vi TEXT;

-- Add default translations for common FAQ categories
-- These can be edited in the admin panel

UPDATE categories SET
  name_tw = CASE name
    WHEN 'pricing' THEN '價格'
    WHEN 'products' THEN '產品'
    WHEN 'shipping' THEN '運送'
    WHEN 'returns' THEN '退貨'
    WHEN 'product results' THEN '產品效果'
    WHEN 'ingredients' THEN '成分'
    WHEN 'general' THEN '一般問題'
    ELSE name
  END,
  name_cn = CASE name
    WHEN 'pricing' THEN '价格'
    WHEN 'products' THEN '产品'
    WHEN 'shipping' THEN '运送'
    WHEN 'returns' THEN '退货'
    WHEN 'product results' THEN '产品效果'
    WHEN 'ingredients' THEN '成分'
    WHEN 'general' THEN '一般问题'
    ELSE name
  END,
  name_vi = CASE name
    WHEN 'pricing' THEN 'Giá cả'
    WHEN 'products' THEN 'Sản phẩm'
    WHEN 'shipping' THEN 'Vận chuyển'
    WHEN 'returns' THEN 'Trả hàng'
    WHEN 'product results' THEN 'Kết quả sản phẩm'
    WHEN 'ingredients' THEN 'Thành phần'
    WHEN 'general' THEN 'Câu hỏi chung'
    ELSE name
  END
WHERE name IN ('pricing', 'products', 'shipping', 'returns', 'product results', 'ingredients', 'general');

-- Add comments
COMMENT ON COLUMN categories.name_tw IS 'Traditional Chinese (繁體中文) translation of category name';
COMMENT ON COLUMN categories.name_cn IS 'Simplified Chinese (简体中文) translation of category name';
COMMENT ON COLUMN categories.name_vi IS 'Vietnamese (Tiếng Việt) translation of category name';
