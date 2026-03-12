-- Lower Vector Search Match Thresholds
-- The current 0.5 threshold is too strict for many semantic matches.
-- Lowering to 0.2 to ensure the AI "opens the drawer" more reliably.

CREATE OR REPLACE FUNCTION hybrid_search_knowledge(
  p_business_unit_id UUID,
  p_query_embedding vector(1536),
  p_query_text TEXT,
  p_match_threshold FLOAT DEFAULT 0.2, -- Lowered from 0.5
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
)
LANGUAGE plpgsql
AS $$
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
    WHERE
      kb.business_unit_id = p_business_unit_id
      AND kb.embedding IS NOT NULL
      AND 1 - (kb.embedding <=> p_query_embedding) > p_match_threshold
    ORDER BY kb.embedding <=> p_query_embedding
    LIMIT p_match_count
  ),
  keyword_matches AS (
    SELECT
      kb.id,
      kb.topic,
      kb.content,
      kb.category,
      kb.keywords,
      0.0::FLOAT AS similarity,
      'keyword'::TEXT AS match_type
    FROM knowledge_base kb
    WHERE
      kb.business_unit_id = p_business_unit_id
      AND (
        kb.content ILIKE '%' || p_query_text || '%'
        OR kb.topic ILIKE '%' || p_query_text || '%'
        OR kb.category ILIKE '%' || p_query_text || '%'
      )
    LIMIT p_match_count / 2
  )
  SELECT DISTINCT ON (vm.id)
    vm.id,
    vm.topic,
    vm.content,
    vm.category,
    vm.keywords,
    vm.similarity,
    vm.match_type
  FROM (
    SELECT * FROM vector_matches
    UNION
    SELECT * FROM keyword_matches
  ) vm
  ORDER BY vm.id, vm.similarity DESC
  LIMIT p_match_count;
END;
$$;

CREATE OR REPLACE FUNCTION vector_search_knowledge(
  p_business_unit_id UUID,
  p_query_embedding vector(1536),
  p_match_threshold FLOAT DEFAULT 0.2, -- Lowered from 0.5
  p_match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  topic TEXT,
  content TEXT,
  category TEXT,
  keywords TEXT[],
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
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
  WHERE
    kb.business_unit_id = p_business_unit_id
    AND kb.embedding IS NOT NULL
    AND 1 - (kb.embedding <=> p_query_embedding) > p_match_threshold
  ORDER BY kb.embedding <=> p_query_embedding
  LIMIT p_match_count;
END;
$$;

SELECT '✅ Search thresholds lowered to 0.2' as status;
