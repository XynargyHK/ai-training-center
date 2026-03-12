const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envFile = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function runMigration() {
  const sql = fs.readFileSync(path.join(__dirname, '../sql-migrations/095_multiple_pages_per_locale.sql'), 'utf8');
  
  console.log('🚀 Running migration 095...');
  
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error('❌ Migration failed:', error);
  } else {
    console.log('✅ Migration 095 completed successfully!');
  }
}

runMigration();
