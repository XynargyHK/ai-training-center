// Check booster-concern mappings
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  // Get the skin_concerns attribute
  const { data: attr } = await supabase
    .from('product_attributes')
    .select('id')
    .eq('handle', 'skin_concerns')
    .single();

  // Get all mappings grouped by concern
  const { data: mappings } = await supabase
    .from('product_attribute_values')
    .select('option_id, product_id, products(title), product_attribute_options(name)')
    .eq('attribute_id', attr.id);

  // Group by concern
  const byConcern = {};
  mappings.forEach(m => {
    const concern = m.product_attribute_options?.name || 'Unknown';
    if (!byConcern[concern]) byConcern[concern] = [];
    byConcern[concern].push(m.products?.title);
  });

  console.log('=== Boosters per Concern ===\n');
  Object.keys(byConcern).sort().forEach(concern => {
    console.log(`${concern}: ${byConcern[concern].length} boosters`);
    byConcern[concern].forEach(b => console.log(`  - ${b}`));
    console.log('');
  });

  // Summary stats
  console.log('\n=== Summary ===');
  console.log('Total mappings:', mappings.length);
  console.log('Concerns with mappings:', Object.keys(byConcern).length);

  const counts = Object.values(byConcern).map(arr => arr.length);
  console.log('Min boosters per concern:', Math.min(...counts));
  console.log('Max boosters per concern:', Math.max(...counts));
  console.log('Avg boosters per concern:', (counts.reduce((a, b) => a + b, 0) / counts.length).toFixed(1));
}

check();
