-- Fix categories table by adding type column and setting correct types

-- 1. Add type column if it doesn't exist
ALTER TABLE categories ADD COLUMN IF NOT EXISTS type VARCHAR(50);

-- 2. Set FAQ categories (based on your original faq_categories.json)
UPDATE categories SET type = 'faq' WHERE name IN (
  'pricing',
  'products',
  'shipping',
  'returns',
  'product results',
  'ingredients',
  'Product Questions'
);

-- 3. Set Canned Message categories (based on your original canned_categories.json)
UPDATE categories SET type = 'canned_message' WHERE name IN (
  'beauty tips',
  'product recommendations',
  'skincare advice',
  'general responses',
  'Greetings',
  'Closing'
);

-- 4. Verify the fix
SELECT name, type, COUNT(*)
FROM categories
WHERE business_unit_id = '77313e61-2a19-4f3e-823b-80390dde8bd2'
GROUP BY name, type
ORDER BY type, name;
