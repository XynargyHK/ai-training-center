const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrate() {
  const businessUnitId = '77313e61-2a19-4f3e-823b-80390dde8bd2';

  // Get the Skin Concerns attribute
  const { data: attr } = await supabase
    .from('product_attributes')
    .select('id')
    .eq('business_unit_id', businessUnitId)
    .eq('handle', 'skin_concerns')
    .single();

  if (!attr) {
    console.log('Skin Concerns attribute not found');
    return;
  }
  console.log('Skin Concerns attribute ID:', attr.id);

  // Delete existing options to replace with correct ones
  await supabase
    .from('product_attribute_options')
    .delete()
    .eq('attribute_id', attr.id);
  console.log('Deleted old options');

  // Get categories
  const { data: cats } = await supabase
    .from('product_categories')
    .select('id, name')
    .eq('business_unit_id', businessUnitId);

  const categoryMap = {};
  cats.forEach(c => categoryMap[c.name] = c.id);
  console.log('Categories:', Object.keys(categoryMap).join(', '));

  // Get existing skin concerns
  const { data: concerns } = await supabase
    .from('skin_concerns')
    .select('*')
    .eq('business_unit_id', businessUnitId)
    .order('name');

  console.log('Found', concerns?.length, 'existing skin concerns');

  // Map concerns to categories
  const concernToCategory = {
    // Face concerns
    'Acne': 'Face',
    'Dryness': 'Face',
    'Dullness': 'Face',
    'Eczema': 'Face',
    'Fine Lines/Wrinkles': 'Face',
    'Large Pores': 'Face',
    'Oiliness': 'Face',
    'Pigmentation/Dark Spots': 'Face',
    'Psoriasis': 'Face',
    'Rashes': 'Face',
    'Redness/Rosacea': 'Face',
    'Sagging': 'Face',
    'Sensitivity': 'Face',
    'Uneven Texture': 'Face',

    // Eye concerns
    "Crow's Feet": 'Eye',
    'Dark Circles': 'Eye',
    'Eye Bags': 'Eye',

    // Body concerns
    'Cellulite': 'Body',
    'Cysts/Nodules': 'Body',
    'Dry Skin': 'Body',
    'Stretch Marks': 'Body',
    'Underarm Odor': 'Body',
    'Varicose Veins': 'Body',

    // Scalp concerns
    'Dandruff': 'Scalp',
    'Dry Scalp': 'Scalp',
    'Hair Loss/Thinning': 'Scalp',
    'Oily Scalp': 'Scalp',
    'Premature Graying': 'Scalp',
    'Scalp Acne': 'Scalp',
    'Scalp Irritation': 'Scalp'
  };

  // Insert options with category mapping
  let order = 0;
  for (const concern of (concerns || [])) {
    const categoryName = concernToCategory[concern.name];
    const categoryId = categoryName ? categoryMap[categoryName] : null;

    const { error } = await supabase
      .from('product_attribute_options')
      .insert({
        attribute_id: attr.id,
        name: concern.name,
        handle: concern.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        category_id: categoryId,
        display_order: order++
      });

    if (error) {
      console.log('Error adding', concern.name, ':', error.message);
    } else {
      console.log('Added:', concern.name, '->', categoryName || 'No category');
    }
  }

  console.log('\nDone! Migrated', order, 'skin concerns to attribute options');
}

migrate();
