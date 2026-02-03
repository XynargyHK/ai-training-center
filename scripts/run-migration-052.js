require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  const migrationPath = path.join(__dirname, '../sql-migrations/052_product_templates_dynamic_fields.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  // Split by statements (simple split - may need adjustment for complex SQL)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Running ${statements.length} SQL statements...\n`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.substring(0, 60).replace(/\n/g, ' ');

    try {
      const { error } = await supabase.rpc('exec_sql', { sql: stmt });

      if (error) {
        // Try direct query if rpc doesn't work
        const { error: directError } = await supabase.from('_migrations').select('*').limit(0);
        console.log(`${i + 1}. ${preview}...`);
        console.log(`   Note: Statement may need manual execution`);
      } else {
        console.log(`${i + 1}. OK: ${preview}...`);
      }
    } catch (e) {
      console.log(`${i + 1}. ${preview}...`);
      console.log(`   Note: ${e.message}`);
    }
  }

  console.log('\nMigration file ready. Please run in Supabase SQL Editor:');
  console.log('sql-migrations/052_product_templates_dynamic_fields.sql');
}

runMigration().catch(console.error);
