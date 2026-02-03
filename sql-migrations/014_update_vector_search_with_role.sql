-- Update vector search functions to support role-based filtering
-- Each AI staff role (coach, sales, customer-service, scientist) gets role-specific results

-- Drop existing functions to recreate with role parameter
DROP FUNCTION IF EXISTS vector_search_knowledge(UUID, vector(1536), FLOAT, INT);
DROP FUNCTION IF EXISTS hybrid_search_knowledge(UUID, vector(1536), TEXT, FLOAT, INT);
DROP FUNCTION IF EXISTS vector_search_guidelines(UUID, vector(1536), FLOAT, INT);
DROP FUNCTION IF EXISTS vector_search_training_data(UUID, vector(1536), FLOAT, INT);
DROP FUNCTION IF EXISTS hybrid_search_faqs(UUID, vector(1536), TEXT, FLOAT, INT);

-- ============================================
-- KNOWLEDGE BASE - Vector Search with Role
-- ============================================
CREATE OR REPLACE FUNCTION vector_search_knowledge(
  p_business_unit_id UUID,
  p_query_embedding vector(1536),
  p_ai_role VARCHAR(50) DEFAULT NULL,
  p_match_threshold FLOAT DEFAULT 0.5,
  p_match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  topic TEXT,
  content TEXT,
  category TEXT,
  keywords TEXT[],
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.topic,
    kb.content,
    kb.category,
    kb.keywords,
    1 - (kb.embedding <=> p_query_embedding) AS similarity
  FROM knowledge_base kb
  WHERE kb.business_unit_id = p_business_unit_id
    AND (kb.ai_role = p_ai_role OR kb.ai_role IS NULL OR p_ai_role IS NULL)
    AND 1 - (kb.embedding <=> p_query_embedding) > p_match_threshold
  ORDER BY kb.embedding <=> p_query_embedding
  LIMIT p_match_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- KNOWLEDGE BASE - Hybrid Search with Role
-- ============================================
CREATE OR REPLACE FUNCTION hybrid_search_knowledge(
  p_business_unit_id UUID,
  p_query_embedding vector(1536),
  p_query_text TEXT,
  p_ai_role VARCHAR(50) DEFAULT NULL,
  p_match_threshold FLOAT DEFAULT 0.5,
  p_match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  topic TEXT,
  content TEXT,
  category TEXT,
  keywords TEXT[],
  similarity FLOAT,
  match_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH vector_matches AS (
    SELECT
      kb.id,
      kb.topic,
      kb.content,
      kb.category,
      kb.keywords,
      1 - (kb.embedding <=> p_query_embedding) AS similarity,
      'vector'::TEXT AS match_type
    FROM knowledge_base kb
    WHERE kb.business_unit_id = p_business_unit_id
      AND (kb.ai_role = p_ai_role OR kb.ai_role IS NULL OR p_ai_role IS NULL)
      AND 1 - (kb.embedding <=> p_query_embedding) > p_match_threshold
  ),
  keyword_matches AS (
    SELECT
      kb.id,
      kb.topic,
      kb.content,
      kb.category,
      kb.keywords,
      0.7::FLOAT AS similarity,
      'keyword'::TEXT AS match_type
    FROM knowledge_base kb
    WHERE kb.business_unit_id = p_business_unit_id
      AND (kb.ai_role = p_ai_role OR kb.ai_role IS NULL OR p_ai_role IS NULL)
      AND (
        kb.content ILIKE '%' || p_query_text || '%'
        OR kb.topic ILIKE '%' || p_query_text || '%'
        OR EXISTS (
          SELECT 1 FROM unnest(kb.keywords) kw
          WHERE kw ILIKE '%' || p_query_text || '%'
        )
      )
  )
  SELECT DISTINCT ON (v.id)
    v.id, v.topic, v.content, v.category, v.keywords, v.similarity, v.match_type
  FROM (
    SELECT * FROM vector_matches
    UNION
    SELECT * FROM keyword_matches
  ) v
  ORDER BY v.id, v.similarity DESC
  LIMIT p_match_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- GUIDELINES - Vector Search with Role
-- ============================================
CREATE OR REPLACE FUNCTION vector_search_guidelines(
  p_business_unit_id UUID,
  p_query_embedding vector(1536),
  p_ai_role VARCHAR(50) DEFAULT NULL,
  p_match_threshold FLOAT DEFAULT 0.5,
  p_match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  category TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id,
    g.title,
    g.content,
    g.category,
    1 - (g.embedding <=> p_query_embedding) AS similarity
  FROM guidelines g
  WHERE g.business_unit_id = p_business_unit_id
    AND (g.ai_role = p_ai_role OR g.ai_role IS NULL OR p_ai_role IS NULL)
    AND 1 - (g.embedding <=> p_query_embedding) > p_match_threshold
  ORDER BY g.embedding <=> p_query_embedding
  LIMIT p_match_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRAINING DATA - Vector Search with Role
-- ============================================
CREATE OR REPLACE FUNCTION vector_search_training_data(
  p_business_unit_id UUID,
  p_query_embedding vector(1536),
  p_ai_role VARCHAR(50) DEFAULT NULL,
  p_match_threshold FLOAT DEFAULT 0.5,
  p_match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  question TEXT,
  answer TEXT,
  category TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    td.id,
    td.question,
    td.answer,
    td.category,
    1 - (td.embedding <=> p_query_embedding) AS similarity
  FROM training_data td
  WHERE td.business_unit_id = p_business_unit_id
    AND td.active = true
    AND (td.ai_role = p_ai_role OR td.ai_role IS NULL OR p_ai_role IS NULL)
    AND 1 - (td.embedding <=> p_query_embedding) > p_match_threshold
  ORDER BY td.embedding <=> p_query_embedding
  LIMIT p_match_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FAQs - Hybrid Search with Role
-- ============================================
CREATE OR REPLACE FUNCTION hybrid_search_faqs(
  p_business_unit_id UUID,
  p_query_embedding vector(1536),
  p_query_text TEXT,
  p_ai_role VARCHAR(50) DEFAULT NULL,
  p_match_threshold FLOAT DEFAULT 0.7,
  p_match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  question TEXT,
  answer TEXT,
  short_answer TEXT,
  category TEXT,
  similarity FLOAT,
  match_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH vector_matches AS (
    SELECT
      f.id,
      f.question,
      f.answer,
      f.short_answer,
      f.category,
      1 - (f.embedding <=> p_query_embedding) AS similarity,
      'vector'::TEXT AS match_type
    FROM faqs f
    WHERE f.business_unit_id = p_business_unit_id
      AND f.is_active = true
      AND (f.ai_role = p_ai_role OR f.ai_role IS NULL OR p_ai_role IS NULL)
      AND 1 - (f.embedding <=> p_query_embedding) > p_match_threshold
  ),
  keyword_matches AS (
    SELECT
      f.id,
      f.question,
      f.answer,
      f.short_answer,
      f.category,
      0.75::FLOAT AS similarity,
      'keyword'::TEXT AS match_type
    FROM faqs f
    WHERE f.business_unit_id = p_business_unit_id
      AND f.is_active = true
      AND (f.ai_role = p_ai_role OR f.ai_role IS NULL OR p_ai_role IS NULL)
      AND (
        f.question ILIKE '%' || p_query_text || '%'
        OR f.answer ILIKE '%' || p_query_text || '%'
      )
  )
  SELECT DISTINCT ON (v.id)
    v.id, v.question, v.answer, v.short_answer, v.category, v.similarity, v.match_type
  FROM (
    SELECT * FROM vector_matches
    UNION
    SELECT * FROM keyword_matches
  ) v
  ORDER BY v.id, v.similarity DESC
  LIMIT p_match_count;
END;
$$ LANGUAGE plpgsql;

-- Add helpful comments
COMMENT ON FUNCTION vector_search_knowledge IS 'Vector search knowledge base with optional role filtering. NULL role returns all entries.';
COMMENT ON FUNCTION hybrid_search_knowledge IS 'Hybrid search (vector + keyword) with role filtering.';
COMMENT ON FUNCTION vector_search_guidelines IS 'Vector search guidelines with role filtering.';
COMMENT ON FUNCTION vector_search_training_data IS 'Vector search training data with role filtering.';
COMMENT ON FUNCTION hybrid_search_faqs IS 'Hybrid FAQ search with role filtering.';
