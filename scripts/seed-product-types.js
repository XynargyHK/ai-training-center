require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const productTypes = [
  { name: 'Device', handle: 'device', description: 'Skincare devices and tools', is_addon: false, display_order: 1 },
  { name: 'Micro-infusion Needles', handle: 'micro-infusion-needles', description: 'Micro-infusion needle cartridges', is_addon: false, display_order: 2 },
  { name: 'Cleanser', handle: 'cleanser', description: 'Cleansing products', is_addon: false, display_order: 3 },
  { name: 'Shampoo', handle: 'shampoo', description: 'Hair cleansing products', is_addon: false, display_order: 4 },
  { name: 'Toner', handle: 'toner', description: 'Toning products', is_addon: false, display_order: 5 },
  { name: 'Serum', handle: 'serum', description: 'Concentrated treatment serums', is_addon: false, display_order: 6 },
  { name: 'Cream', handle: 'cream', description: 'Moisturizing creams', is_addon: false, display_order: 7 },
  { name: 'Lotion', handle: 'lotion', description: 'Lightweight moisturizing lotions', is_addon: false, display_order: 8 },
  { name: 'Booster', handle: 'booster', description: 'Add-on boosters to enhance other products', is_addon: true, display_order: 9 },
  { name: 'Mask', handle: 'mask', description: 'Face and body masks', is_addon: false, display_order: 10 },
  { name: 'Oil', handle: 'oil', description: 'Treatment oils', is_addon: false, display_order: 11 },
  { name: 'Supplement', handle: 'supplement', description: 'Oral supplements', is_addon: false, display_order: 12 },
];

async function seedProductTypes() {
  // Get all business units
  const { data: businessUnits } = await supabase
    .from('business_units')
    .select('id, name, slug');

  console.log('Business units found:', businessUnits?.length);

  for (const bu of businessUnits || []) {
    console.log(`\n--- Seeding product types for ${bu.name} (${bu.slug}) ---`);

    // Get categories for this business unit
    const { data: categories } = await supabase
      .from('product_categories')
      .select('id, handle, name')
      .eq('business_unit_id', bu.id)
      .eq('is_active', true);

    console.log('Categories available:', categories?.map(c => c.handle).join(', ') || 'none');

    for (const type of productTypes) {
      // Check if already exists
      const { data: existing } = await supabase
        .from('product_types')
        .select('id')
        .eq('business_unit_id', bu.id)
        .eq('handle', type.handle)
        .single();

      if (existing) {
        console.log('  Already exists:', type.name);
        continue;
      }

      const { data, error } = await supabase
        .from('product_types')
        .insert({
          business_unit_id: bu.id,
          name: type.name,
          handle: type.handle,
          description: type.description,
          is_addon: type.is_addon,
          display_order: type.display_order,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.log('  Error creating', type.name, ':', error.message);
      } else {
        console.log('  Created:', type.name, type.is_addon ? '(add-on)' : '');
      }
    }
  }

  // Show summary
  const { data: allTypes } = await supabase
    .from('product_types')
    .select('id, name, handle, is_addon, business_unit_id')
    .order('display_order');

  console.log('\n=== All Product Types ===');
  allTypes?.forEach(t => {
    console.log(`  - ${t.name} ${t.is_addon ? '(ADD-ON)' : ''} [${t.business_unit_id.substring(0, 8)}]`);
  });
}

seedProductTypes().catch(console.error);
