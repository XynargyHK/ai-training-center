-- Migration: Update Vector Search Functions with Language Support
-- Purpose: Enable language-specific vector search for FAQs and knowledge base
-- Date: 2025-11-27

-- Step 1: Drop ALL existing vector search functions with their specific signatures
-- This ensures we remove all versions before recreating

-- Drop vector_search_faqs (all possible signatures)
DROP FUNCTION IF EXISTS vector_search_faqs(UUID, vector, FLOAT, INT);
DROP FUNCTION IF EXISTS vector_search_faqs(UUID, vector, TEXT, FLOAT, INT);

-- Drop hybrid_search_faqs (all possible signatures)
DROP FUNCTION IF EXISTS hybrid_search_faqs(UUID, TEXT, vector, FLOAT, INT);
DROP FUNCTION IF EXISTS hybrid_search_faqs(UUID, TEXT, vector, TEXT, FLOAT, INT);

-- Drop vector_search_knowledge (all possible signatures)
DROP FUNCTION IF EXISTS vector_search_knowledge(UUID, vector, FLOAT, INT);
DROP FUNCTION IF EXISTS vector_search_knowledge(UUID, vector, TEXT, FLOAT, INT);

-- Step 2: Recreate vector_search_faqs with language parameter
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
  keywords TEXT,
  category TEXT,
  priority INTEGER,
  is_active BOOLEAN,
  language TEXT,
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
    f.category,
    f.priority,
    f.is_active,
    f.language,
    f.reference_id,
    1 - (f.embedding <=> p_query_embedding) AS similarity
  FROM faq_library f
  WHERE f.business_unit_id = p_business_unit_id
    AND f.is_active = true
    AND f.language = p_language
    AND (1 - (f.embedding <=> p_query_embedding)) > p_match_threshold
  ORDER BY f.embedding <=> p_query_embedding
  LIMIT p_match_count;
END;
$$;

-- Add comment
COMMENT ON FUNCTION vector_search_faqs IS 'Search FAQs using vector similarity with language filtering';

-- Step 3: Recreate hybrid_search_faqs with language parameter
CREATE OR REPLACE FUNCTION hybrid_search_faqs(
  p_business_unit_id UUID,
  p_query_text TEXT,
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
  keywords TEXT,
  category TEXT,
  priority INTEGER,
  is_active BOOLEAN,
  language TEXT,
  reference_id UUID,
  similarity FLOAT,
  text_rank FLOAT,
  combined_score FLOAT
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
    f.category,
    f.priority,
    f.is_active,
    f.language,
    f.reference_id,
    (1 - (f.embedding <=> p_query_embedding)) AS similarity,
    ts_rank(
      to_tsvector('english', f.question || ' ' || f.answer || ' ' || COALESCE(f.keywords, '')),
      plainto_tsquery('english', p_query_text)
    ) AS text_rank,
    (
      (1 - (f.embedding <=> p_query_embedding)) * 0.7 +
      ts_rank(
        to_tsvector('english', f.question || ' ' || f.answer || ' ' || COALESCE(f.keywords, '')),
        plainto_tsquery('english', p_query_text)
      ) * 0.3
    ) AS combined_score
  FROM faq_library f
  WHERE f.business_unit_id = p_business_unit_id
    AND f.is_active = true
    AND f.language = p_language
    AND (
      (1 - (f.embedding <=> p_query_embedding)) > p_match_threshold
      OR to_tsvector('english', f.question || ' ' || f.answer || ' ' || COALESCE(f.keywords, '')) @@ plainto_tsquery('english', p_query_text)
    )
  ORDER BY combined_score DESC
  LIMIT p_match_count;
END;
$$;

-- Add comment
COMMENT ON FUNCTION hybrid_search_faqs IS 'Hybrid search combining vector similarity and text search with language filtering';

-- Step 4: Recreate vector_search_knowledge with language parameter
CREATE OR REPLACE FUNCTION vector_search_knowledge(
  p_business_unit_id UUID,
  p_query_embedding vector(1536),
  p_language TEXT DEFAULT 'en',
  p_match_threshold FLOAT DEFAULT 0.5,
  p_match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  category TEXT,
  topic TEXT,
  content TEXT,
  title TEXT,
  keywords TEXT,
  url TEXT,
  is_active BOOLEAN,
  language TEXT,
  reference_id UUID,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    k.id,
    k.category,
    k.topic,
    k.content,
    k.title,
    k.keywords,
    k.url,
    k.is_active,
    k.language,
    k.reference_id,
    1 - (k.embedding <=> p_query_embedding) AS similarity
  FROM knowledge_base k
  WHERE k.business_unit_id = p_business_unit_id
    AND k.is_active = true
    AND k.language = p_language
    AND (1 - (k.embedding <=> p_query_embedding)) > p_match_threshold
  ORDER BY k.embedding <=> p_query_embedding
  LIMIT p_match_count;
END;
$$;

-- Add comment
COMMENT ON FUNCTION vector_search_knowledge IS 'Search knowledge base using vector similarity with language filtering';

-- Step 5: Create helper function to get all translations for a reference_id
CREATE OR REPLACE FUNCTION get_faq_translations(
  p_reference_id UUID,
  p_business_unit_id UUID
)
RETURNS TABLE (
  id UUID,
  question TEXT,
  answer TEXT,
  short_answer TEXT,
  language TEXT,
  is_active BOOLEAN
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
    f.language,
    f.is_active
  FROM faq_library f
  WHERE f.reference_id = p_reference_id
    AND f.business_unit_id = p_business_unit_id
  ORDER BY f.language;
END;
$$;

-- Add comment
COMMENT ON FUNCTION get_faq_translations IS 'Get all language translations for a specific FAQ';

-- Step 6: Create helper function to check if translation exists
CREATE OR REPLACE FUNCTION has_faq_translation(
  p_reference_id UUID,
  p_language TEXT,
  p_business_unit_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM faq_library
    WHERE reference_id = p_reference_id
      AND language = p_language
      AND business_unit_id = p_business_unit_id
  ) INTO v_exists;

  RETURN v_exists;
END;
$$;

-- Add comment
COMMENT ON FUNCTION has_faq_translation IS 'Check if a FAQ has a translation in a specific language';

-- Step 7: Create function to get translation statistics
CREATE OR REPLACE FUNCTION get_translation_statistics(
  p_business_unit_id UUID
)
RETURNS TABLE (
  content_type TEXT,
  language TEXT,
  count BIGINT,
  total_references BIGINT,
  coverage_percentage NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  -- FAQ statistics
  SELECT
    'faq_library'::TEXT AS content_type,
    f.language,
    COUNT(*)::BIGINT AS count,
    (SELECT COUNT(DISTINCT reference_id) FROM faq_library WHERE business_unit_id = p_business_unit_id)::BIGINT AS total_references,
    ROUND(
      (COUNT(*)::NUMERIC / NULLIF((SELECT COUNT(DISTINCT reference_id) FROM faq_library WHERE business_unit_id = p_business_unit_id), 0)) * 100,
      2
    ) AS coverage_percentage
  FROM faq_library f
  WHERE f.business_unit_id = p_business_unit_id
  GROUP BY f.language

  UNION ALL

  -- Canned messages statistics
  SELECT
    'canned_messages'::TEXT AS content_type,
    c.language,
    COUNT(*)::BIGINT AS count,
    (SELECT COUNT(DISTINCT reference_id) FROM canned_messages WHERE business_unit_id = p_business_unit_id)::BIGINT AS total_references,
    ROUND(
      (COUNT(*)::NUMERIC / NULLIF((SELECT COUNT(DISTINCT reference_id) FROM canned_messages WHERE business_unit_id = p_business_unit_id), 0)) * 100,
      2
    ) AS coverage_percentage
  FROM canned_messages c
  WHERE c.business_unit_id = p_business_unit_id
  GROUP BY c.language

  UNION ALL

  -- Guidelines statistics
  SELECT
    'guidelines'::TEXT AS content_type,
    g.language,
    COUNT(*)::BIGINT AS count,
    (SELECT COUNT(DISTINCT reference_id) FROM guidelines WHERE business_unit_id = p_business_unit_id)::BIGINT AS total_references,
    ROUND(
      (COUNT(*)::NUMERIC / NULLIF((SELECT COUNT(DISTINCT reference_id) FROM guidelines WHERE business_unit_id = p_business_unit_id), 0)) * 100,
      2
    ) AS coverage_percentage
  FROM guidelines g
  WHERE g.business_unit_id = p_business_unit_id
  GROUP BY g.language

  ORDER BY content_type, language;
END;
$$;

-- Add comment
COMMENT ON FUNCTION get_translation_statistics IS 'Get translation coverage statistics for all content types';

-- Verification queries (commented out - uncomment to test)
-- SELECT * FROM get_translation_statistics('your-business-unit-id');
-- SELECT * FROM vector_search_faqs('your-business-unit-id', array_fill(0, ARRAY[1536])::vector, 'en', 0.5, 10);
