-- ============================================================================
-- ADD APPOINTMENT FEATURE FLAGS TO BUSINESS UNIT SETTINGS
-- Allows business owners to enable/disable appointment features
-- ============================================================================

-- Add appointment feature flags
ALTER TABLE business_unit_settings
ADD COLUMN IF NOT EXISTS enable_appointments BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS appointments_require_confirmation BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS appointments_allow_room_selection BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS appointments_send_reminders BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS appointments_booking_window_days INT DEFAULT 30; -- How many days ahead can users book

-- Add appointment business hours configuration
ALTER TABLE business_unit_settings
ADD COLUMN IF NOT EXISTS appointments_business_hours JSONB DEFAULT '{
  "monday": {"open": "09:00", "close": "18:00", "enabled": true},
  "tuesday": {"open": "09:00", "close": "18:00", "enabled": true},
  "wednesday": {"open": "09:00", "close": "18:00", "enabled": true},
  "thursday": {"open": "09:00", "close": "18:00", "enabled": true},
  "friday": {"open": "09:00", "close": "18:00", "enabled": true},
  "saturday": {"open": "10:00", "close": "16:00", "enabled": true},
  "sunday": {"open": "10:00", "close": "16:00", "enabled": false}
}';

-- Add appointment UI preferences
ALTER TABLE business_unit_settings
ADD COLUMN IF NOT EXISTS appointments_ui_config JSONB DEFAULT '{
  "calendar_view": "week",
  "slot_duration_minutes": 60,
  "show_provider_photos": true,
  "show_prices": true,
  "require_phone": false,
  "require_email": true,
  "allow_cancellation_hours_before": 24
}';

-- Add comments
COMMENT ON COLUMN business_unit_settings.enable_appointments IS 'Master switch to enable/disable appointment booking module';
COMMENT ON COLUMN business_unit_settings.appointments_require_confirmation IS 'If true, provider must confirm bookings. If false, auto-confirm';
COMMENT ON COLUMN business_unit_settings.appointments_allow_room_selection IS 'Allow users to choose specific room (vs auto-assign)';
COMMENT ON COLUMN business_unit_settings.appointments_business_hours IS 'JSON config for weekly business hours';
COMMENT ON COLUMN business_unit_settings.appointments_ui_config IS 'JSON config for booking UI preferences';
