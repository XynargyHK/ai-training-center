-- IVR Menu Builder — shared tree for WhatsApp text menus + Phone DTMF IVR
-- One source of truth per BU. Each node = one menu option.
-- Tree via parent_id. Root nodes (parent_id IS NULL) are entry points.

CREATE TABLE IF NOT EXISTS ivr_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_unit_id UUID NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES ivr_menus(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  label TEXT NOT NULL,
  description TEXT,
  action TEXT NOT NULL DEFAULT 'sub_menu'
    CHECK (action IN ('sub_menu', 'ai_chat', 'transfer_human', 'send_link', 'play_message', 'phone_call', 'voice_ai')),
  payload JSONB DEFAULT '{}'::jsonb,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ivr_menus_bu ON ivr_menus(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_ivr_menus_parent ON ivr_menus(parent_id);

ALTER TABLE ivr_menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON ivr_menus
  FOR ALL USING (true) WITH CHECK (true);
