require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fix() {
  const buId = '346db81c-0b36-4cb7-94f4-d126a3a54fa1';
  const correctFaceCatId = '5119155b-765e-478a-9180-cc7df84ad7bc';

  // Get the Skin Concerns attribute
  const { data: attr } = await supabase
    .from('product_attributes')
    .select('id')
    .eq('business_unit_id', buId)
    .eq('handle', 'skin-concerns')
    .single();

  if (!attr) {
    console.log('No Skin Concerns attribute found');
    return;
  }
  console.log('Attribute ID:', attr.id);

  // Get the correct Face options (from category 5119155b...)
  const { data: faceOptions } = await supabase
    .from('product_attribute_options')
    .select('id, name, handle')
    .eq('category_id', correctFaceCatId);

  console.log('\nCorrect Face options:', faceOptions?.length);
  const optionMap = {};
  faceOptions?.forEach(o => {
    optionMap[o.name.toLowerCase()] = o.id;
    console.log(' -', o.name, '->', o.id);
  });

  // Get boosters
  const { data: products } = await supabase
    .from('products')
    .select('id, title, product_types(is_addon)')
    .eq('business_unit_id', buId);

  const boosters = products?.filter(p => p.product_types?.is_addon);
  console.log('\nBoosters:', boosters?.length);
  boosters?.forEach(b => console.log(' -', b.title));

  // Delete existing attribute values for boosters
  const boosterIds = boosters?.map(b => b.id) || [];
  if (boosterIds.length > 0) {
    await supabase
      .from('product_attribute_values')
      .delete()
      .in('product_id', boosterIds);
    console.log('\nDeleted old attribute values');
  }

  // Map boosters to their concerns (matching exact option names)
  const boosterConcernMap = {
    'Anti-Acne Booster': ['acne', 'oiliness', 'large pores'],
    'Hydration Booster': ['dryness', 'dullness'],
    'Brightening Booster': ['pigmentation/dark spots', 'dullness', 'uneven texture'],
    'Anti-Aging Booster': ['fine lines/wrinkles', 'sagging', 'dullness']
  };

  // Insert new attribute values
  const inserts = [];
  for (const booster of boosters || []) {
    const concerns = boosterConcernMap[booster.title] || [];
    console.log('\nProcessing:', booster.title);
    for (const concern of concerns) {
      const optionId = optionMap[concern];
      if (optionId) {
        inserts.push({
          product_id: booster.id,
          attribute_id: attr.id,
          option_id: optionId
        });
        console.log('  ✓', concern, '->', optionId);
      } else {
        console.log('  ✗ MISSING:', concern);
      }
    }
  }

  if (inserts.length > 0) {
    const { error } = await supabase
      .from('product_attribute_values')
      .insert(inserts);
    if (error) {
      console.error('\nInsert error:', error);
    } else {
      console.log('\n✅ Inserted', inserts.length, 'attribute values');
    }
  } else {
    console.log('\nNo values to insert');
  }
}

fix().catch(console.error);
