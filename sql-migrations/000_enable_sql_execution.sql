-- ========================================
-- ENABLE AUTOMATIC SQL EXECUTION
-- ========================================
-- This creates an RPC function that allows executing SQL from the API
-- Run this ONCE in Supabase SQL Editor to enable fully automatic database management

-- Create function to execute arbitrary SQL
CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_query;
END;
$$;

-- Grant execute permission to authenticated users (via service role key)
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;

-- Test the function
SELECT 'RPC function exec_sql created successfully' AS status;
