-- Scheduled Tasks — universal scheduler for any action
-- Not WhatsApp-specific. Any tool can be scheduled.

CREATE TABLE IF NOT EXISTS scheduled_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_unit_id UUID,

  -- What to do
  tool_name TEXT NOT NULL,          -- e.g. 'send_message', 'search_web'
  arguments JSONB NOT NULL,         -- e.g. {"to": "852...", "message": "Hello", "channels": ["whatsapp"]}

  -- When to do it
  scheduled_at TIMESTAMPTZ NOT NULL,
  timezone TEXT DEFAULT 'Asia/Hong_Kong',
  recurrence TEXT,                  -- null=once, 'daily', 'weekly', 'monthly', cron expression

  -- Who created it
  created_by TEXT,                  -- staff name or 'admin'
  campaign_id UUID,                 -- optional: part of a campaign

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  result JSONB,
  error TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  executed_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ           -- for recurring tasks
);

CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_pending ON scheduled_tasks(status, scheduled_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_bu ON scheduled_tasks(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_campaign ON scheduled_tasks(campaign_id);
