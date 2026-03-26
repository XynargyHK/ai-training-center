-- Add WhatsApp configuration fields to business_unit_settings
ALTER TABLE business_unit_settings 
ADD COLUMN IF NOT EXISTS whatsapp_phone_number_id TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_business_account_id TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_access_token TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_verify_token TEXT;

-- Add index for faster lookup by phone number ID (used in webhooks)
CREATE INDEX IF NOT EXISTS idx_bus_settings_whatsapp_phone_id ON business_unit_settings(whatsapp_phone_number_id);
