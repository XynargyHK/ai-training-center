-- Cleanup: Remove all old vector search function versions
-- Run this FIRST, then run 026_update_vector_search_with_language.sql

-- Drop all possible variations of vector_search_faqs
DROP FUNCTION IF EXISTS vector_search_faqs(UUID, vector, FLOAT, INT);
DROP FUNCTION IF EXISTS vector_search_faqs(UUID, vector(1536), FLOAT, INT);
DROP FUNCTION IF EXISTS vector_search_faqs(UUID, vector, TEXT, FLOAT, INT);
DROP FUNCTION IF EXISTS vector_search_faqs(UUID, vector(1536), TEXT, FLOAT, INT);

-- Drop all possible variations of hybrid_search_faqs
DROP FUNCTION IF EXISTS hybrid_search_faqs(UUID, TEXT, vector, FLOAT, INT);
DROP FUNCTION IF EXISTS hybrid_search_faqs(UUID, TEXT, vector(1536), FLOAT, INT);
DROP FUNCTION IF EXISTS hybrid_search_faqs(UUID, TEXT, vector, TEXT, FLOAT, INT);
DROP FUNCTION IF EXISTS hybrid_search_faqs(UUID, TEXT, vector(1536), TEXT, FLOAT, INT);

-- Drop all possible variations of vector_search_knowledge
DROP FUNCTION IF EXISTS vector_search_knowledge(UUID, vector, FLOAT, INT);
DROP FUNCTION IF EXISTS vector_search_knowledge(UUID, vector(1536), FLOAT, INT);
DROP FUNCTION IF EXISTS vector_search_knowledge(UUID, vector, TEXT, FLOAT, INT);
DROP FUNCTION IF EXISTS vector_search_knowledge(UUID, vector(1536), TEXT, FLOAT, INT);

-- Drop all possible variations of vector_search_canned_messages
DROP FUNCTION IF EXISTS vector_search_canned_messages(UUID, vector, FLOAT, INT);
DROP FUNCTION IF EXISTS vector_search_canned_messages(UUID, vector(1536), FLOAT, INT);

-- Drop all possible variations of hybrid_search_canned_messages
DROP FUNCTION IF EXISTS hybrid_search_canned_messages(UUID, TEXT, vector, FLOAT, INT);
DROP FUNCTION IF EXISTS hybrid_search_canned_messages(UUID, TEXT, vector(1536), FLOAT, INT);

-- Drop all possible variations of vector_search_guidelines
DROP FUNCTION IF EXISTS vector_search_guidelines(UUID, vector, FLOAT, INT);
DROP FUNCTION IF EXISTS vector_search_guidelines(UUID, vector(1536), FLOAT, INT);

-- Drop all possible variations of vector_search_training_data
DROP FUNCTION IF EXISTS vector_search_training_data(UUID, vector, FLOAT, INT);
DROP FUNCTION IF EXISTS vector_search_training_data(UUID, vector(1536), FLOAT, INT);

SELECT 'All old vector search functions dropped successfully' AS status;
