-- ============================================================================
-- AI TRAINING CENTER - SUPABASE DATABASE SCHEMA
-- Multi-tenant SaaS Platform for AI Chatbot Training & Deployment
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE TABLES (Multi-tenancy & Auth)
-- ============================================================================

-- Business Units (Tenants)
CREATE TABLE business_units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic Info
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- for subdomain: {slug}.yourdomain.com
  email TEXT,
  phone TEXT,

  -- API Access
  api_key TEXT UNIQUE NOT NULL, -- Generated: bu_live_abc123
  webhook_secret TEXT NOT NULL, -- Generated per tenant

  -- Subscription & Limits
  subscription_tier TEXT DEFAULT 'free', -- free, starter, pro, enterprise
  monthly_message_limit INTEGER DEFAULT 100,
  messages_used_this_month INTEGER DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,
  trial_ends_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (Linked to Business Units)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  business_unit_id UUID REFERENCES business_units(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'member', -- owner, admin, member, viewer
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Business Unit Settings (All configurable settings)
CREATE TABLE business_unit_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_unit_id UUID REFERENCES business_units(id) ON DELETE CASCADE UNIQUE,

  -- LLM Configuration
  llm_provider TEXT DEFAULT 'openai', -- openai, anthropic, ollama
  llm_model TEXT DEFAULT 'gpt-4o',
  llm_temperature DECIMAL(3,2) DEFAULT 0.7,
  llm_max_tokens INTEGER DEFAULT 2048,
  llm_api_key TEXT, -- Encrypted

  -- AI Behavior
  ai_personality TEXT DEFAULT 'professional',
  default_language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',

  -- Response Configuration
  max_response_length INTEGER DEFAULT 500,
  enable_markdown BOOLEAN DEFAULT true,
  enable_emojis BOOLEAN DEFAULT false,

  -- Knowledge Base
  kb_matching_threshold DECIMAL(3,2) DEFAULT 0.7,
  kb_max_entries_per_response INTEGER DEFAULT 5,

  -- Conversation
  conversation_timeout_minutes INTEGER DEFAULT 30,
  enable_conversation_history BOOLEAN DEFAULT true,
  max_history_messages INTEGER DEFAULT 10,

  -- Features
  enable_training_mode BOOLEAN DEFAULT true,
  enable_analytics BOOLEAN DEFAULT true,
  enable_human_handoff BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- MODULE 1: AI BRAIN (Chatbot)
-- ============================================================================

-- Knowledge Base
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_unit_id UUID REFERENCES business_units(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  topic TEXT,
  content TEXT NOT NULL,
  keywords TEXT[],
  product_data JSONB, -- For e-commerce module integration
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Staff (Trained AI Profiles)
CREATE TABLE ai_staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_unit_id UUID REFERENCES business_units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL, -- coach, sales, support, scientist
  avatar_url TEXT,
  personality TEXT,
  system_prompt TEXT,
  training_memory JSONB DEFAULT '{}',
  total_conversations INTEGER DEFAULT 0,
  avg_satisfaction_score DECIMAL(3,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training Guidelines
CREATE TABLE training_guidelines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_unit_id UUID REFERENCES business_units(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- general, roleplay, canned, faq
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training Scenarios
CREATE TABLE training_scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_unit_id UUID REFERENCES business_units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  customer_type TEXT NOT NULL, -- angry, confused, happy, skeptical, etc.
  scenario_text TEXT NOT NULL,
  success_criteria TEXT[],
  difficulty TEXT DEFAULT 'medium', -- easy, medium, hard
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training Sessions (History)
CREATE TABLE training_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_unit_id UUID REFERENCES business_units(id) ON DELETE CASCADE,
  scenario_id UUID REFERENCES training_scenarios(id) ON DELETE SET NULL,
  ai_staff_id UUID REFERENCES ai_staff(id) ON DELETE SET NULL,
  conversation JSONB NOT NULL,
  feedback TEXT[],
  score INTEGER,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CONVERSATIONS (Cross-module)
-- ============================================================================

-- Conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_unit_id UUID REFERENCES business_units(id) ON DELETE CASCADE,
  channel TEXT NOT NULL, -- web, whatsapp, instagram, sms, email
  customer_id TEXT NOT NULL,
  customer_metadata JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active', -- active, resolved, waiting, escalated
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL, -- customer, ai, agent, system
  sender_id TEXT,
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text', -- text, image, video, audio, file
  media_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES for Performance
-- ============================================================================

-- Business Units
CREATE INDEX idx_business_units_api_key ON business_units(api_key);
CREATE INDEX idx_business_units_slug ON business_units(slug);

-- Users
CREATE INDEX idx_users_business_unit ON users(business_unit_id);
CREATE INDEX idx_users_email ON users(email);

-- Knowledge Base
CREATE INDEX idx_knowledge_base_business_unit ON knowledge_base(business_unit_id);
CREATE INDEX idx_knowledge_base_category ON knowledge_base(category);
CREATE INDEX idx_knowledge_base_keywords ON knowledge_base USING GIN(keywords);

-- AI Staff
CREATE INDEX idx_ai_staff_business_unit ON ai_staff(business_unit_id);

-- Conversations
CREATE INDEX idx_conversations_business_unit ON conversations(business_unit_id);
CREATE INDEX idx_conversations_customer ON conversations(customer_id);
CREATE INDEX idx_conversations_channel ON conversations(channel);

-- Messages
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE business_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_unit_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_guidelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Users
CREATE POLICY "Users can view their own business unit"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can view members of their business unit"
  ON users FOR SELECT
  USING (business_unit_id IN (
    SELECT business_unit_id FROM users WHERE id = auth.uid()
  ));

-- RLS Policies for Knowledge Base
CREATE POLICY "Users can view their business unit's knowledge base"
  ON knowledge_base FOR ALL
  USING (business_unit_id IN (
    SELECT business_unit_id FROM users WHERE id = auth.uid()
  ));

-- RLS Policies for AI Staff
CREATE POLICY "Users can manage their business unit's AI staff"
  ON ai_staff FOR ALL
  USING (business_unit_id IN (
    SELECT business_unit_id FROM users WHERE id = auth.uid()
  ));

-- RLS Policies for Conversations
CREATE POLICY "Users can view their business unit's conversations"
  ON conversations FOR ALL
  USING (business_unit_id IN (
    SELECT business_unit_id FROM users WHERE id = auth.uid()
  ));

-- RLS Policies for Messages
CREATE POLICY "Users can view messages from their business unit's conversations"
  ON messages FOR ALL
  USING (conversation_id IN (
    SELECT id FROM conversations WHERE business_unit_id IN (
      SELECT business_unit_id FROM users WHERE id = auth.uid()
    )
  ));

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_business_units_updated_at BEFORE UPDATE ON business_units
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_base_updated_at BEFORE UPDATE ON knowledge_base
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_staff_updated_at BEFORE UPDATE ON ai_staff
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate API key
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := 'bu_live_';
  i INTEGER;
BEGIN
  FOR i IN 1..32 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to generate webhook secret
CREATE OR REPLACE FUNCTION generate_webhook_secret()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := 'whsec_';
  i INTEGER;
BEGIN
  FOR i IN 1..40 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate API keys for new business units
CREATE OR REPLACE FUNCTION generate_business_unit_keys()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.api_key IS NULL OR NEW.api_key = '' THEN
    NEW.api_key := generate_api_key();
  END IF;
  IF NEW.webhook_secret IS NULL OR NEW.webhook_secret = '' THEN
    NEW.webhook_secret := generate_webhook_secret();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_business_unit_keys
  BEFORE INSERT ON business_units
  FOR EACH ROW
  EXECUTE FUNCTION generate_business_unit_keys();

-- ============================================================================
-- SEED DATA (Optional - for development)
-- ============================================================================

-- Insert a demo business unit (you can remove this in production)
-- INSERT INTO business_units (name, slug, email, subscription_tier)
-- VALUES ('Demo Company', 'demo', 'demo@example.com', 'pro');

-- ============================================================================
-- NOTES
-- ============================================================================
--
-- To apply this schema to your Supabase project:
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Create a new query
-- 3. Paste this entire file
-- 4. Run the query
--
-- Or use Supabase CLI:
-- supabase db push
--
-- ============================================================================
