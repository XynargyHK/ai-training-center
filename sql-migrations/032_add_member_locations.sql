-- Real-time location tracking for trip members

CREATE TABLE IF NOT EXISTS split_member_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES split_members(id) ON DELETE CASCADE,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(member_id)
);

-- Enable Supabase Realtime on this table
ALTER PUBLICATION supabase_realtime ADD TABLE split_member_locations;
