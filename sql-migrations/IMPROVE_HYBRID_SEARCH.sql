-- Improve Hybrid Search with better Keyword Matching
-- The previous ILIKE '%' || p_query_text || '%' is too specific.
-- This version splits the query into words and looks for any of them.

CREATE OR REPLACE FUNCTION hybrid_search_knowledge(
  p_business_unit_id UUID,
  p_query_embedding vector(1536),
  p_query_text TEXT,
  p_match_threshold FLOAT DEFAULT 0.2,
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
DECLARE
  query_words text[];
BEGIN
  -- Split query into words and clean them
  query_words := string_to_array(regexp_replace(trim(p_query_text), '[^a-zA-Z0-9\s]', '', 'g'), ' ');

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
      0.1::FLOAT AS similarity, -- Slight boost for keyword matches
      'keyword'::TEXT AS match_type
    FROM knowledge_base kb
    WHERE
      kb.business_unit_id = p_business_unit_id
      AND (
        -- Match if ANY of the words are in content or topic
        EXISTS (
          SELECT 1 FROM unnest(query_words) w 
          WHERE length(w) > 2 AND (kb.content ILIKE '%' || w || '%' OR kb.topic ILIKE '%' || w || '%')
        )
        OR kb.content ILIKE '%' || p_query_text || '%'
      )
    LIMIT p_match_count
  )
  SELECT DISTINCT ON (res.id)
    res.id,
    res.topic,
    res.content,
    res.category,
    res.keywords,
    res.similarity,
    res.match_type
  FROM (
    SELECT * FROM vector_matches
    UNION ALL
    SELECT * FROM keyword_matches
  ) res
  ORDER BY res.id, res.similarity DESC
  LIMIT p_match_count;
END;
$$;

SELECT '✅ Hybrid search improved with multi-word matching' as status;
