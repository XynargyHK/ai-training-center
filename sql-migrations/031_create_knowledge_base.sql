-- Knowledge Base / RAG — vector search per business unit
-- Requires pgvector extension in Supabase

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS knowledge_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_unit_id UUID,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(768),  -- Gemini text-embedding-004 = 768 dims
  metadata JSONB DEFAULT '{}',
  source TEXT DEFAULT 'manual',  -- manual, scrape, upload
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_docs_bu ON knowledge_docs(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_embedding ON knowledge_docs USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
