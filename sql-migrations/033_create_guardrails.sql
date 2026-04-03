-- Guardrails = Experience — living prompt that grows from feedback
-- Shared across all AI Staff, with optional BU-specific rules

CREATE TABLE IF NOT EXISTS guardrails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_unit_id UUID,  -- NULL = shared across all BUs
  agent_name TEXT,         -- NULL = shared across all agents
  type TEXT NOT NULL CHECK (type IN ('positive', 'negative')),
  rule TEXT NOT NULL,
  source TEXT NOT NULL,    -- admin_explicit, barge_in, evaluator, peer_review, customer_reaction, tool_failure, ab_test, default
  severity TEXT NOT NULL CHECK (severity IN ('red_flag', 'warning', 'suggestion')),
  pattern TEXT DEFAULT '', -- for fast input/output matching
  active BOOLEAN DEFAULT TRUE,
  hit_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guardrails_active ON guardrails(active) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_guardrails_bu ON guardrails(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_guardrails_severity ON guardrails(severity);
