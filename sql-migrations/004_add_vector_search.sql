-- ============================================================================
-- Migration 004: Add Vector Search with pgvector
-- This enables semantic search using OpenAI embeddings
-- ============================================================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to knowledge_base table
-- OpenAI text-embedding-3-small produces 1536-dimensional vectors
ALTER TABLE knowledge_base
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create index for fast similarity search using HNSW (Hierarchical Navigable Small World)
-- This is faster and more accurate than IVFFlat for most use cases
CREATE INDEX IF NOT EXISTS knowledge_base_embedding_idx
ON knowledge_base
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Add metadata columns for tracking embeddings
ALTER TABLE knowledge_base
ADD COLUMN IF NOT EXISTS embedding_model TEXT DEFAULT 'text-embedding-3-small';

ALTER TABLE knowledge_base
ADD COLUMN IF NOT EXISTS embedded_at TIMESTAMPTZ;

-- Create function for hybrid search (vector + keyword)
-- This combines semantic search with traditional keyword matching for best results
CREATE OR REPLACE FUNCTION hybrid_search_knowledge(
  p_business_unit_id UUID,
  p_query_embedding vector(1536),
  p_query_text TEXT,
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
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH vector_matches AS (
    -- Semantic search using embeddings
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
    -- Keyword search using full-text search
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
  -- Combine and deduplicate results
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

-- Create simpler vector-only search function
CREATE OR REPLACE FUNCTION vector_search_knowledge(
  p_business_unit_id UUID,
  p_query_embedding vector(1536),
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

-- Add the same vector support to guidelines table
ALTER TABLE guidelines
ADD COLUMN IF NOT EXISTS embedding vector(1536);

ALTER TABLE guidelines
ADD COLUMN IF NOT EXISTS embedding_model TEXT DEFAULT 'text-embedding-3-small';

ALTER TABLE guidelines
ADD COLUMN IF NOT EXISTS embedded_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS guidelines_embedding_idx
ON guidelines
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Add vector support to training_data table
ALTER TABLE training_data
ADD COLUMN IF NOT EXISTS embedding vector(1536);

ALTER TABLE training_data
ADD COLUMN IF NOT EXISTS embedding_model TEXT DEFAULT 'text-embedding-3-small';

ALTER TABLE training_data
ADD COLUMN IF NOT EXISTS embedded_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS training_data_embedding_idx
ON training_data
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

SELECT '✅ Vector search enabled successfully!' AS status;
SELECT '📊 pgvector extension installed' AS info;
SELECT '🔍 HNSW indexes created for fast similarity search' AS info;
SELECT '⚡ Hybrid search function available' AS info;
