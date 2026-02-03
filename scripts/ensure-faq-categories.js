require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const FAQ_CATEGORIES = [
  { name: 'pricing', icon: '💰', color: '#10B981', description: 'Pricing and payment questions' },
  { name: 'products', icon: '📦', color: '#3B82F6', description: 'Product information' },
  { name: 'shipping', icon: '🚚', color: '#8B5CF6', description: 'Shipping and delivery' },
  { name: 'returns', icon: '↩️', color: '#EF4444', description: 'Returns and refunds' },
  { name: 'product results', icon: '⭐', color: '#F59E0B', description: 'Product effectiveness' },
  { name: 'ingredients', icon: '🧪', color: '#06B6D4', description: 'Product ingredients' },
  { name: 'general', icon: '📋', color: '#6B7280', description: 'General information' }
];

async function ensureCategories() {
  console.log('🔍 Checking FAQ categories...\n');

  // Get all business units
  const { data: businessUnits, error: buError } = await supabase
    .from('business_units')
    .select('id, slug, name');

  if (buError) {
    console.error('Error loading business units:', buError);
    process.exit(1);
  }

  console.log(`Found ${businessUnits.length} business units\n`);

  for (const bu of businessUnits) {
    console.log(`\n📌 ${bu.name} (${bu.slug})`);

    for (const category of FAQ_CATEGORIES) {
      // Check if category exists
      const { data: existing } = await supabase
        .from('categories')
        .select('id, name')
        .eq('business_unit_id', bu.id)
        .eq('name', category.name)
        .single();

      if (existing) {
        console.log(`  ✓ ${category.name} - exists`);
      } else {
        // Create category
        const { error: insertError } = await supabase
          .from('categories')
          .insert({
            business_unit_id: bu.id,
            name: category.name,
            description: category.description,
            icon: category.icon,
            color: category.color
          });

        if (insertError) {
          console.error(`  ✗ ${category.name} - error:`, insertError.message);
        } else {
          console.log(`  ✓ ${category.name} - created`);
        }
      }
    }
  }

  console.log('\n✅ Done!');
}

ensureCategories().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
