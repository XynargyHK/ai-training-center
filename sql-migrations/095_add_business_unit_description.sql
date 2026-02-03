-- Add description field to business_units table for SEO metadata
-- This field will be used for meta descriptions, Open Graph tags, etc.

ALTER TABLE business_units
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add some default descriptions for existing business units
UPDATE business_units
SET description = 'AI-powered skincare solutions with personalized recommendations and expert guidance for your unique skin concerns.'
WHERE slug = 'skincoach' AND description IS NULL;

UPDATE business_units
SET description = 'Professional beauty and aesthetics services with expert consultation and treatment.'
WHERE slug = 'breast-guardian' AND description IS NULL;

UPDATE business_units
SET description = 'Advanced aesthetic treatments and beauty solutions.'
WHERE slug = 'aia' AND description IS NULL;

-- Add comment to explain the field's purpose
COMMENT ON COLUMN business_units.description IS 'SEO meta description shown in search results and social media shares';
