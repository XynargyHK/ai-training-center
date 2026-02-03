-- Vector search functions for AI Staff knowledge retrieval
-- Uses cosine similarity for semantic search

-- Function to match knowledge base entries using vector similarity
CREATE OR REPLACE FUNCTION match_knowledge(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.3,
  match_count int DEFAULT 5,
  filter_business_unit uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  topic text,
  content text,
  category text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    knowledge.id,
    knowledge.topic,
    knowledge.content,
    knowledge.category,
    1 - (knowledge.embedding <=> query_embedding) as similarity
  FROM knowledge
  WHERE
    (filter_business_unit IS NULL OR knowledge.business_unit_id = filter_business_unit)
    AND knowledge.embedding IS NOT NULL
    AND 1 - (knowledge.embedding <=> query_embedding) > match_threshold
  ORDER BY knowledge.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to match guidelines using vector similarity
CREATE OR REPLACE FUNCTION match_guidelines(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.3,
  match_count int DEFAULT 5,
  filter_business_unit uuid DEFAULT NULL,
  filter_ai_role varchar(50) DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  category text,
  ai_role varchar(50),
  similarity float,
  updated_at timestamp
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    guidelines.id,
    guidelines.title,
    guidelines.content,
    guidelines.category,
    guidelines.ai_role,
    1 - (guidelines.embedding <=> query_embedding) as similarity,
    guidelines.updated_at
  FROM guidelines
  WHERE
    (filter_business_unit IS NULL OR guidelines.business_unit_id = filter_business_unit)
    AND (filter_ai_role IS NULL OR guidelines.ai_role = filter_ai_role)
    AND guidelines.embedding IS NOT NULL
    AND 1 - (guidelines.embedding <=> query_embedding) > match_threshold
  ORDER BY guidelines.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to match FAQs using vector similarity
CREATE OR REPLACE FUNCTION match_faqs(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 3,
  filter_business_unit uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  question text,
  answer text,
  short_answer text,
  category text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    faqs.id,
    faqs.question,
    faqs.answer,
    faqs.short_answer,
    faqs.category,
    1 - (faqs.embedding <=> query_embedding) as similarity
  FROM faqs
  WHERE
    (filter_business_unit IS NULL OR faqs.business_unit_id = filter_business_unit)
    AND faqs.embedding IS NOT NULL
    AND 1 - (faqs.embedding <=> query_embedding) > match_threshold
  ORDER BY faqs.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Add comments for documentation
COMMENT ON FUNCTION match_knowledge IS 'Semantic search for knowledge base entries using vector similarity';
COMMENT ON FUNCTION match_guidelines IS 'Semantic search for guidelines with role filtering';
COMMENT ON FUNCTION match_faqs IS 'Semantic search for FAQs with high similarity threshold';
