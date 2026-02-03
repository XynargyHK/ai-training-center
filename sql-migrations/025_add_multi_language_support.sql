-- Migration: Add Multi-Language Support to Content Tables
-- Purpose: Enable storing content in multiple languages (en, zh-CN, zh-TW, vi)
-- Date: 2025-11-27

-- Step 1: Add language and reference_id columns to faq_library
ALTER TABLE faq_library
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS reference_id UUID;

-- Set reference_id to id for existing rows
UPDATE faq_library SET reference_id = id WHERE reference_id IS NULL;

-- Add constraints for faq_library
ALTER TABLE faq_library
ADD CONSTRAINT faq_library_language_check CHECK (language IN ('en', 'zh-CN', 'zh-TW', 'vi')),
ADD CONSTRAINT faq_library_reference_id_not_null CHECK (reference_id IS NOT NULL);

-- Create unique constraint: one translation per language per reference
CREATE UNIQUE INDEX IF NOT EXISTS faq_library_reference_language_unique
ON faq_library(reference_id, language, business_unit_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS faq_library_language_business_unit_idx
ON faq_library(language, business_unit_id);

CREATE INDEX IF NOT EXISTS faq_library_reference_id_idx
ON faq_library(reference_id);

-- Step 2: Add language and reference_id columns to canned_messages
ALTER TABLE canned_messages
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS reference_id UUID;

-- Set reference_id to id for existing rows
UPDATE canned_messages SET reference_id = id WHERE reference_id IS NULL;

-- Add constraints for canned_messages
ALTER TABLE canned_messages
ADD CONSTRAINT canned_messages_language_check CHECK (language IN ('en', 'zh-CN', 'zh-TW', 'vi')),
ADD CONSTRAINT canned_messages_reference_id_not_null CHECK (reference_id IS NOT NULL);

-- Create unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS canned_messages_reference_language_unique
ON canned_messages(reference_id, language, business_unit_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS canned_messages_language_business_unit_idx
ON canned_messages(language, business_unit_id);

CREATE INDEX IF NOT EXISTS canned_messages_reference_id_idx
ON canned_messages(reference_id);

-- Step 3: Add language and reference_id columns to guidelines
ALTER TABLE guidelines
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS reference_id UUID;

-- Set reference_id to id for existing rows
UPDATE guidelines SET reference_id = id WHERE reference_id IS NULL;

-- Add constraints for guidelines
ALTER TABLE guidelines
ADD CONSTRAINT guidelines_language_check CHECK (language IN ('en', 'zh-CN', 'zh-TW', 'vi')),
ADD CONSTRAINT guidelines_reference_id_not_null CHECK (reference_id IS NOT NULL);

-- Create unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS guidelines_reference_language_unique
ON guidelines(reference_id, language, business_unit_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS guidelines_language_business_unit_idx
ON guidelines(language, business_unit_id);

CREATE INDEX IF NOT EXISTS guidelines_reference_id_idx
ON guidelines(reference_id);

-- Step 4: Add language and reference_id columns to knowledge_base
ALTER TABLE knowledge_base
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS reference_id UUID;

-- Set reference_id to id for existing rows
UPDATE knowledge_base SET reference_id = id WHERE reference_id IS NULL;

-- Add constraints for knowledge_base
ALTER TABLE knowledge_base
ADD CONSTRAINT knowledge_base_language_check CHECK (language IN ('en', 'zh-CN', 'zh-TW', 'vi')),
ADD CONSTRAINT knowledge_base_reference_id_not_null CHECK (reference_id IS NOT NULL);

-- Create unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS knowledge_base_reference_language_unique
ON knowledge_base(reference_id, language, business_unit_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS knowledge_base_language_business_unit_idx
ON knowledge_base(language, business_unit_id);

CREATE INDEX IF NOT EXISTS knowledge_base_reference_id_idx
ON knowledge_base(reference_id);

-- Step 5: Add language and reference_id columns to training_data
ALTER TABLE training_data
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS reference_id UUID;

-- Set reference_id to id for existing rows
UPDATE training_data SET reference_id = id WHERE reference_id IS NULL;

-- Add constraints for training_data
ALTER TABLE training_data
ADD CONSTRAINT training_data_language_check CHECK (language IN ('en', 'zh-CN', 'zh-TW', 'vi')),
ADD CONSTRAINT training_data_reference_id_not_null CHECK (reference_id IS NOT NULL);

-- Create unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS training_data_reference_language_unique
ON training_data(reference_id, language, business_unit_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS training_data_language_business_unit_idx
ON training_data(language, business_unit_id);

CREATE INDEX IF NOT EXISTS training_data_reference_id_idx
ON training_data(reference_id);

-- Step 6: Add helpful comments
COMMENT ON COLUMN faq_library.language IS 'Language code: en, zh-CN, zh-TW, vi';
COMMENT ON COLUMN faq_library.reference_id IS 'Links translations of the same FAQ across languages';
COMMENT ON COLUMN canned_messages.language IS 'Language code: en, zh-CN, zh-TW, vi';
COMMENT ON COLUMN canned_messages.reference_id IS 'Links translations of the same message across languages';
COMMENT ON COLUMN guidelines.language IS 'Language code: en, zh-CN, zh-TW, vi';
COMMENT ON COLUMN guidelines.reference_id IS 'Links translations of the same guideline across languages';
COMMENT ON COLUMN knowledge_base.language IS 'Language code: en, zh-CN, zh-TW, vi';
COMMENT ON COLUMN knowledge_base.reference_id IS 'Links translations of the same knowledge entry across languages';
COMMENT ON COLUMN training_data.language IS 'Language code: en, zh-CN, zh-TW, vi';
COMMENT ON COLUMN training_data.reference_id IS 'Links translations of the same training data across languages';

-- Verification queries (commented out - uncomment to verify after migration)
-- SELECT COUNT(*), language FROM faq_library GROUP BY language;
-- SELECT COUNT(*), language FROM canned_messages GROUP BY language;
-- SELECT COUNT(*), language FROM guidelines GROUP BY language;
-- SELECT COUNT(*), language FROM knowledge_base GROUP BY language;
-- SELECT COUNT(*), language FROM training_data GROUP BY language;
