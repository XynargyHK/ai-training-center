import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local from project root
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

(async () => {
  const { data, error } = await supabase
    .from('business_units')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Business units in database:');
    console.log('========================================');
    data.forEach(bu => {
      console.log(`Slug: '${bu.slug}'`);
      console.log(`Name: ${bu.name}`);
      console.log(`ID: ${bu.id}`);
      console.log(`Created: ${bu.created_at}`);
      console.log('---');
    });

    // Check for duplicates
    const slugCounts = {};
    data.forEach(bu => {
      slugCounts[bu.slug] = (slugCounts[bu.slug] || 0) + 1;
    });

    console.log('\nDuplicate check:');
    Object.entries(slugCounts).forEach(([slug, count]) => {
      if (count > 1) {
        console.log(`⚠️ Slug '${slug}' appears ${count} times`);
      }
    });
  }
})();
