-- Create content_library table for multi-tenant AI content production
-- Supports 13 content categories, video production levels, repurposing chains, and performance tracking

CREATE TABLE IF NOT EXISTS content_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_unit_id UUID NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
    created_by_staff TEXT NOT NULL DEFAULT 'content_creator',

    -- Content classification
    content_type TEXT NOT NULL CHECK (content_type IN (
        'short_video', 'long_video', 'text_post', 'article', 'email',
        'visual', 'audio', 'course', 'challenge', 'coaching_drip',
        'lead_magnet', 'interactive', 'sales'
    )),
    format TEXT, -- specific format: tiktok, instagram_reel, youtube_short, blog_post, newsletter, etc.

    -- Content body
    title TEXT NOT NULL,
    hook TEXT, -- opening line / hook
    hook_formula TEXT, -- which of the 12 hook formulas was used
    body TEXT, -- main content / script
    cta TEXT, -- call to action

    -- Video production
    production_level INT CHECK (production_level BETWEEN 1 AND 5),
        -- 1: Zero production (text+music, AI 100%)
        -- 2: AI Avatar (HeyGen)
        -- 3: AI-generated video (Gemini Veo, Runway)
        -- 4: Human+AI hybrid
        -- 5: Full human production
    video_tool TEXT, -- heygen, veo, capcut, runway, manual, etc.
    video_url TEXT, -- rendered video URL

    -- Media
    media_urls JSONB DEFAULT '[]'::jsonb, -- array of image/video/audio URLs

    -- Targeting
    target_platform TEXT, -- primary platform: tiktok, youtube, linkedin, instagram, twitter, facebook, etc.
    target_audience TEXT, -- audience segment
    keywords TEXT[], -- SEO keywords / hashtags
    language TEXT NOT NULL DEFAULT 'en',

    -- Workflow status
    status TEXT NOT NULL DEFAULT 'idea' CHECK (status IN (
        'idea', 'draft', 'review', 'approved', 'rendering', 'ready',
        'scheduled', 'published', 'archived'
    )),

    -- Relationships
    parent_id UUID REFERENCES content_library(id) ON DELETE SET NULL, -- repurposed content links back to pillar
    campaign_id UUID, -- links to campaign if part of one
    sequence_order INT, -- for courses/challenges (day 1, day 2, etc.)

    -- Scheduling & publishing
    scheduled_at TIMESTAMPTZ, -- when to publish
    published_at TIMESTAMPTZ, -- when actually published

    -- Analytics
    performance JSONB DEFAULT '{}'::jsonb, -- { views, likes, shares, saves, comments, ctr, completion_rate, etc. }

    -- Flexible extras
    metadata JSONB DEFAULT '{}'::jsonb, -- thumbnail_url, duration, word_count, etc.

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_content_library_business_unit_id ON content_library(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_content_library_content_type ON content_library(content_type);
CREATE INDEX IF NOT EXISTS idx_content_library_status ON content_library(status);
CREATE INDEX IF NOT EXISTS idx_content_library_parent_id ON content_library(parent_id);
CREATE INDEX IF NOT EXISTS idx_content_library_campaign_id ON content_library(campaign_id);
CREATE INDEX IF NOT EXISTS idx_content_library_target_platform ON content_library(target_platform);
CREATE INDEX IF NOT EXISTS idx_content_library_scheduled_at ON content_library(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_content_library_created_at ON content_library(created_at DESC);

-- Composite index for cron worker: find content ready to publish
CREATE INDEX IF NOT EXISTS idx_content_library_publish_queue
    ON content_library(scheduled_at, status)
    WHERE status IN ('ready', 'scheduled');

-- Enable Row Level Security
ALTER TABLE content_library ENABLE ROW LEVEL SECURITY;

-- Service role bypass policy (Supabase service_role key bypasses RLS, but explicit policy is good practice)
CREATE POLICY "Service role full access on content_library"
    ON content_library
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_content_library_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_content_library_updated_at
    BEFORE UPDATE ON content_library
    FOR EACH ROW
    EXECUTE FUNCTION update_content_library_updated_at();
