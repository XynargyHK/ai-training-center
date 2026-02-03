-- Migration: Drop deprecated booster_functional_types system
-- These tables were superseded by the generic product_attributes system
-- Date: 2025-12-08

-- Drop the mapping table first (has foreign key to functional types)
DROP TABLE IF EXISTS booster_function_mapping CASCADE;

-- Drop the main functional types table
DROP TABLE IF EXISTS booster_functional_types CASCADE;

-- Note: The generic product_attributes system should be used instead
-- Tables: product_attributes, product_attribute_options, product_attribute_values
