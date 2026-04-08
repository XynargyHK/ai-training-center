-- Create WhatsApp conversations table for AI memory
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_unit_id UUID REFERENCES business_units(id) ON DELETE CASCADE,
    wa_chat_id TEXT NOT NULL, -- The sender's phone number or chat ID
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast history lookup
CREATE INDEX IF NOT EXISTS idx_wa_conv_chat_id ON whatsapp_conversations(wa_chat_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wa_conv_bu_id ON whatsapp_conversations(business_unit_id);
