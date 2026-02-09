-- Migration: Fix FAQ Vector Search Functions
-- Purpose: Correct column references to match actual faq_library table schema
-- Date: 2026-02-09
-- Issue: Functions referenced non-existent columns (category, priority, is_active)

-- Drop existing functions first
DROP FUNCTION IF EXISTS vector_search_faqs(UUID, vector, TEXT, FLOAT, INT);
DROP FUNCTION IF EXISTS hybrid_search_faqs(UUID, vector, TEXT, FLOAT, INT);
DROP FUNCTION IF EXISTS hybrid_search_faqs(UUID, TEXT, vector, TEXT, FLOAT, INT);

-- Recreate vector_search_faqs with CORRECT column names
CREATE OR REPLACE FUNCTION vector_search_faqs(
  p_business_unit_id UUID,
  p_query_embedding vector(1536),
  p_language TEXT DEFAULT 'en',
  p_match_threshold FLOAT DEFAULT 0.5,
  p_match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  question TEXT,
  answer TEXT,
  short_answer TEXT,
  keywords TEXT[],
  category_name TEXT,
  is_published BOOLEAN,
  language TEXT,
  country TEXT,
  reference_id UUID,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.question,
    f.answer,
    f.short_answer,
    f.keywords,
    c.name AS category_name,
    f.is_published,
    f.language,
    f.country,
    f.reference_id,
    1 - (f.embedding <=> p_query_embedding) AS similarity
  FROM faq_library f
  LEFT JOIN categories c ON f.category_id = c.id
  WHERE f.business_unit_id = p_business_unit_id
    AND f.is_published = true
    AND f.language = p_language
    AND f.embedding IS NOT NULL
    AND (1 - (f.embedding <=> p_query_embedding)) > p_match_threshold
  ORDER BY f.embedding <=> p_query_embedding
  LIMIT p_match_count;
END;
$$;

COMMENT ON FUNCTION vector_search_faqs IS 'Search FAQs using vector similarity with language filtering (fixed column names)';

-- Recreate hybrid_search_faqs with CORRECT column names
CREATE OR REPLACE FUNCTION hybrid_search_faqs(
  p_business_unit_id UUID,
  p_query_embedding vector(1536),
  p_query_text TEXT,
  p_match_threshold FLOAT DEFAULT 0.5,
  p_match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  question TEXT,
  answer TEXT,
  short_answer TEXT,
  keywords TEXT[],
  category_name TEXT,
  is_published BOOLEAN,
  language TEXT,
  country TEXT,
  reference_id UUID,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.question,
    f.answer,
    f.short_answer,
    f.keywords,
    c.name AS category_name,
    f.is_published,
    f.language,
    f.country,
    f.reference_id,
    1 - (f.embedding <=> p_query_embedding) AS similarity
  FROM faq_library f
  LEFT JOIN categories c ON f.category_id = c.id
  WHERE f.business_unit_id = p_business_unit_id
    AND f.is_published = true
    AND f.embedding IS NOT NULL
    AND (
      (1 - (f.embedding <=> p_query_embedding)) > p_match_threshold
      OR f.question ILIKE '%' || p_query_text || '%'
      OR f.answer ILIKE '%' || p_query_text || '%'
    )
  ORDER BY (1 - (f.embedding <=> p_query_embedding)) DESC
  LIMIT p_match_count;
END;
$$;

COMMENT ON FUNCTION hybrid_search_faqs IS 'Hybrid search combining vector similarity and text search (fixed column names)';
