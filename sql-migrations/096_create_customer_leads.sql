-- ============================================================================
-- Create Customer Leads Table
-- To store leads captured via Lead Magnet / Educational Guide blocks
-- ============================================================================

CREATE TABLE IF NOT EXISTS customer_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_unit_id UUID REFERENCES business_units(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    country TEXT,
    language_code TEXT,
    source_page_slug TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE customer_leads ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do everything
CREATE POLICY "Service role can manage all leads" ON customer_leads
    FOR ALL USING (true) WITH CHECK (true);

-- Policy: Authenticated users (admin) can view leads for their business unit
CREATE POLICY "Admins can view their leads" ON customer_leads
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (auth.users.raw_user_meta_data->>'is_super_admin')::boolean = true
        )
        OR 
        business_unit_id IN (
            SELECT id FROM business_units 
            -- Add logic here if you have multi-tenant admin roles
        )
    );

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_customer_leads_business_unit ON customer_leads(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_customer_leads_email ON customer_leads(email);
