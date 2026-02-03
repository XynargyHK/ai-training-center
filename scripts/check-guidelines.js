import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

(async () => {
  // Get all guidelines with business unit info
  const { data: guidelines, error } = await supabase
    .from('guidelines')
    .select(`
      *,
      business_units (slug, name)
    `)
    .order('created_at');

  if (error) {
    console.error('Error:', error);
  } else {
    console.log(`Total guidelines: ${guidelines.length || 0}\n`);

    // Group by business unit
    const byBusinessUnit = {};
    guidelines.forEach(g => {
      const buSlug = g.business_units.slug || 'unknown';
      if (!byBusinessUnit[buSlug]) {
        byBusinessUnit[buSlug] = [];
      }
      byBusinessUnit[buSlug].push(g);
    });

    Object.entries(byBusinessUnit).forEach(([slug, items]) => {
      console.log(`\n========== ${slug.toUpperCase()} (${items.length} guidelines) ==========`);
      items.forEach(g => {
        console.log(`  - [${g.category}] ${g.title}`);
      });
    });
  }
})();
