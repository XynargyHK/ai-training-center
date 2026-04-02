-- Split Bills feature — Splitwise-style trip expense sharing
-- Tables: trips, members, expenses, shares

-- Trips
CREATE TABLE IF NOT EXISTS split_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_by_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Members in a trip
CREATE TABLE IF NOT EXISTS split_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES split_trips(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trip_id, phone)
);

-- Expenses
CREATE TABLE IF NOT EXISTS split_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES split_trips(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'HKD',
  paid_by UUID REFERENCES split_members(id),
  expense_date DATE DEFAULT CURRENT_DATE,
  photo_url TEXT,
  split_mode TEXT DEFAULT 'equal', -- 'equal', 'parts', 'amount'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual shares per expense
CREATE TABLE IF NOT EXISTS split_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID REFERENCES split_expenses(id) ON DELETE CASCADE,
  member_id UUID REFERENCES split_members(id),
  share_amount DECIMAL(12,2) NOT NULL,
  parts INTEGER DEFAULT 1, -- for 'parts' mode: 1x, 2x, 3x
  included BOOLEAN DEFAULT TRUE,
  UNIQUE(expense_id, member_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_split_members_trip ON split_members(trip_id);
CREATE INDEX IF NOT EXISTS idx_split_expenses_trip ON split_expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_split_shares_expense ON split_shares(expense_id);
CREATE INDEX IF NOT EXISTS idx_split_trips_slug ON split_trips(slug);
