-- ============================================================================
-- FINAL RLS SETUP (Correct Pattern)
-- Run this in Supabase Dashboard: SQL Editor
-- ============================================================================

-- === ENABLE RLS ON ALL RELEVANT TABLES ===
ALTER TABLE public.training_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canned_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guidelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_units ENABLE ROW LEVEL SECURITY;

-- === DROP OLD POLICIES (clean slate) ===
DROP POLICY IF EXISTS "anon_read_training_scenarios" ON public.training_scenarios;
DROP POLICY IF EXISTS "anon_read_ai_staff" ON public.ai_staff;
DROP POLICY IF EXISTS "anon_read_training_sessions" ON public.training_sessions;
DROP POLICY IF EXISTS "anon_read_faq_library" ON public.faq_library;
DROP POLICY IF EXISTS "anon_read_canned_messages" ON public.canned_messages;
DROP POLICY IF EXISTS "anon_read_categories" ON public.categories;
DROP POLICY IF EXISTS "anon_read_knowledge_base" ON public.knowledge_base;
DROP POLICY IF EXISTS "anon_read_guidelines" ON public.guidelines;
DROP POLICY IF EXISTS "anon_read_training_data" ON public.training_data;
DROP POLICY IF EXISTS "anon_read_business_units" ON public.business_units;

DROP POLICY IF EXISTS "temp public read: training_scenarios" ON public.training_scenarios;
DROP POLICY IF EXISTS "temp public read: ai_staff" ON public.ai_staff;
DROP POLICY IF EXISTS "temp public read: training_sessions" ON public.training_sessions;
DROP POLICY IF EXISTS "temp public read: faq_library" ON public.faq_library;
DROP POLICY IF EXISTS "temp public read: canned_messages" ON public.canned_messages;
DROP POLICY IF EXISTS "temp public read: categories" ON public.categories;
DROP POLICY IF EXISTS "temp public read: knowledge_base" ON public.knowledge_base;
DROP POLICY IF EXISTS "temp public read: guidelines" ON public.guidelines;
DROP POLICY IF EXISTS "temp public read: training_data" ON public.training_data;
DROP POLICY IF EXISTS "temp public read: business_units" ON public.business_units;

-- === TEMP: ALLOW ANON TO READ (for UI lookups) ===
CREATE POLICY "anon_read_training_scenarios" ON public.training_scenarios FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_ai_staff" ON public.ai_staff FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_training_sessions" ON public.training_sessions FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_faq_library" ON public.faq_library FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_canned_messages" ON public.canned_messages FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_categories" ON public.categories FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_knowledge_base" ON public.knowledge_base FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_guidelines" ON public.guidelines FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_training_data" ON public.training_data FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_business_units" ON public.business_units FOR SELECT TO anon USING (true);

-- === VERIFICATION ===
SELECT
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'training_scenarios', 'ai_staff', 'training_sessions',
    'faq_library', 'canned_messages', 'categories',
    'knowledge_base', 'guidelines', 'training_data', 'business_units'
  )
ORDER BY tablename;
