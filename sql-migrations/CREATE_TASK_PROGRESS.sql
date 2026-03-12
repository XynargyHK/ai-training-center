-- SQL Migration: Task Progress Tracking
-- Enables real-time progress bars for long-running AI tasks.

CREATE TABLE IF NOT EXISTS public.task_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_unit_id UUID REFERENCES public.business_units(id) ON DELETE CASCADE,
    task_name TEXT NOT NULL, -- e.g., 'pdf-ingestion'
    status TEXT DEFAULT 'processing', -- 'processing', 'completed', 'failed'
    progress_percent INTEGER DEFAULT 0,
    current_step TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_progress ENABLE ROW LEVEL SECURITY;

-- Allow users to view their BU's tasks
CREATE POLICY "Users can view their BU's tasks" ON public.task_progress
    FOR SELECT USING (
        business_unit_id = (SELECT business_unit_id FROM users WHERE id = auth.uid())
    );

-- Allow public read for checking status
CREATE POLICY "Public read access for task status" ON public.task_progress
    FOR SELECT TO anon, authenticated USING (true);

SELECT '✅ Task progress table created' as status;
