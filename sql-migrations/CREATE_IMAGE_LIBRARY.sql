-- SQL Migration: Create Smart Image Library
-- This table stores metadata for extracted images to make them searchable by AI.

CREATE TABLE IF NOT EXISTS public.image_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_unit_id UUID REFERENCES public.business_units(id) ON DELETE CASCADE,
    
    -- File Info
    name TEXT NOT NULL, -- Meaningful short name (e.g., 'biorhythm-sensor-placement')
    url TEXT NOT NULL, -- Public Supabase storage URL
    source_url TEXT, -- Where the image was scraped from
    
    -- Physical Specs
    width INTEGER,
    height INTEGER,
    file_size INTEGER, -- in bytes
    mime_type TEXT,
    
    -- AI Context (The Librarian part)
    alt_text TEXT,
    description TEXT, -- AI generated description of what is in the image
    category TEXT, -- e.g., 'product', 'diagram', 'testimonial'
    
    -- Search
    embedding vector(1536), -- Vector of the description/name for semantic search
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.image_library ENABLE ROW LEVEL SECURITY;

-- Allow users to view images for their business unit
DROP POLICY IF EXISTS "Users can view their BU's images" ON public.image_library;
CREATE POLICY "Users can view their BU's images" ON public.image_library
    FOR SELECT USING (
        business_unit_id = (SELECT business_unit_id FROM users WHERE id = auth.uid())
    );

-- Allow public read for production chat (siloed by BU query)
DROP POLICY IF EXISTS "Public read access for images" ON public.image_library;
CREATE POLICY "Public read access for images" ON public.image_library
    FOR SELECT TO anon, authenticated USING (true);

-- Index for BU filtering
CREATE INDEX IF NOT EXISTS idx_image_library_bu ON public.image_library(business_unit_id);

-- Hybrid search for images
CREATE OR REPLACE FUNCTION hybrid_search_images(
  p_business_unit_id UUID,
  p_query_embedding vector(1536),
  p_query_text TEXT,
  p_match_threshold FLOAT DEFAULT 0.2,
  p_match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  url TEXT,
  description TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    img.id,
    img.name,
    img.url,
    img.description,
    1 - (img.embedding <=> p_query_embedding) AS similarity
  FROM image_library img
  WHERE
    img.business_unit_id = p_business_unit_id
    AND img.embedding IS NOT NULL
    AND (
        1 - (img.embedding <=> p_query_embedding) > p_match_threshold
        OR img.name ILIKE '%' || p_query_text || '%'
        OR img.description ILIKE '%' || p_query_text || '%'
    )
  ORDER BY img.embedding <=> p_query_embedding
  LIMIT p_match_count;
END;
$$;

SELECT '✅ Smart Image Library table and search function created' as status;
