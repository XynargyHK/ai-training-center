-- Migration: Add 5 Core Section fields to landing_pages
-- Implements the universal landing page structure:
-- 1. Hero Section (already exists)
-- 2. Problem / Story Section
-- 3. Solution / How It Works Section
-- 4. Proof / Trust Section (enhanced)
-- 5. CTA / Offer Section

-- SECTION 2: Problem / Story
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS problem_section_enabled BOOLEAN DEFAULT false;
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS problem_headline TEXT;
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS problem_subheadline TEXT;
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS problem_variant TEXT DEFAULT 'emotional';
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS problem_statements JSONB DEFAULT '[]'::jsonb;
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS story_blocks JSONB DEFAULT '[]'::jsonb;
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS pain_points JSONB DEFAULT '[]'::jsonb;

-- SECTION 3: Solution / How It Works
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS solution_section_enabled BOOLEAN DEFAULT false;
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS solution_headline TEXT;
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS solution_subheadline TEXT;
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS solution_variant TEXT DEFAULT '3-step';
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS solution_steps JSONB DEFAULT '[]'::jsonb;
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS solution_features JSONB DEFAULT '[]'::jsonb;
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS solution_video_url TEXT;

-- SECTION 4: Proof / Trust (enhanced)
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS proof_section_enabled BOOLEAN DEFAULT true;
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS proof_headline TEXT;
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS proof_subheadline TEXT;
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS proof_variant TEXT DEFAULT 'social';
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS science_claims JSONB DEFAULT '[]'::jsonb;
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS expert_quotes JSONB DEFAULT '[]'::jsonb;
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS partner_logos JSONB DEFAULT '[]'::jsonb;

-- SECTION 5: CTA / Offer
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS offer_section_enabled BOOLEAN DEFAULT true;
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS offer_headline TEXT;
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS offer_subheadline TEXT;
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS offer_variant TEXT DEFAULT 'buy';
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS offer_cta_text TEXT DEFAULT 'Buy Now';
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS offer_cta_url TEXT DEFAULT '#shop';
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS offer_urgency_text TEXT;
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS guarantee_text TEXT;
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS guarantee_icon TEXT DEFAULT '🛡️';

-- Comments
COMMENT ON COLUMN landing_pages.problem_section_enabled IS 'Enable/disable the Problem/Story section';
COMMENT ON COLUMN landing_pages.problem_variant IS 'Style: emotional, fear-based, aspirational, educational';
COMMENT ON COLUMN landing_pages.pain_points IS 'Array of {icon, title, description}';
COMMENT ON COLUMN landing_pages.story_blocks IS 'Array of {type, content, image_url, author}';
COMMENT ON COLUMN landing_pages.solution_variant IS 'Style: 3-step, visual-cards, video-based';
COMMENT ON COLUMN landing_pages.solution_steps IS 'Array of {step_number, icon, title, description, image_url}';
COMMENT ON COLUMN landing_pages.solution_features IS 'Array of {icon, title, description, benefits}';
COMMENT ON COLUMN landing_pages.proof_variant IS 'Primary proof type: social, clinical, expert';
COMMENT ON COLUMN landing_pages.expert_quotes IS 'Array of {name, title, organization, quote, image_url}';
COMMENT ON COLUMN landing_pages.partner_logos IS 'Array of {name, image_url, link}';
COMMENT ON COLUMN landing_pages.offer_variant IS 'CTA type: buy, book, quiz, contact';
