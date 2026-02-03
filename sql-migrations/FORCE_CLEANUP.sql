-- FORCE CLEANUP: Drop all vector search functions regardless of signature
-- This uses a different approach - finds and drops all functions by name

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all functions named vector_search_faqs
    FOR r IN (
        SELECT oid::regprocedure as func_signature
        FROM pg_proc
        WHERE proname = 'vector_search_faqs'
    ) LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    END LOOP;

    -- Drop all functions named hybrid_search_faqs
    FOR r IN (
        SELECT oid::regprocedure as func_signature
        FROM pg_proc
        WHERE proname = 'hybrid_search_faqs'
    ) LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    END LOOP;

    -- Drop all functions named vector_search_knowledge
    FOR r IN (
        SELECT oid::regprocedure as func_signature
        FROM pg_proc
        WHERE proname = 'vector_search_knowledge'
    ) LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    END LOOP;

    -- Drop all functions named vector_search_canned_messages
    FOR r IN (
        SELECT oid::regprocedure as func_signature
        FROM pg_proc
        WHERE proname = 'vector_search_canned_messages'
    ) LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    END LOOP;

    -- Drop all functions named hybrid_search_canned_messages
    FOR r IN (
        SELECT oid::regprocedure as func_signature
        FROM pg_proc
        WHERE proname = 'hybrid_search_canned_messages'
    ) LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    END LOOP;

    -- Drop all functions named vector_search_guidelines
    FOR r IN (
        SELECT oid::regprocedure as func_signature
        FROM pg_proc
        WHERE proname = 'vector_search_guidelines'
    ) LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    END LOOP;

    -- Drop all functions named vector_search_training_data
    FOR r IN (
        SELECT oid::regprocedure as func_signature
        FROM pg_proc
        WHERE proname = 'vector_search_training_data'
    ) LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    END LOOP;
END $$;

SELECT 'Force cleanup completed - all vector search functions removed' AS status;
