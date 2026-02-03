require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SKINCOACH_BU_ID = '77313e61-2a19-4f3e-823b-80390dde8bd2';

async function categorizeProducts() {
  console.log('🚀 Auto-categorizing products based on benefit fields...\n');

  // 1. Get all product categories for SkinCoach
  const { data: categories, error: catError } = await supabase
    .from('product_categories')
    .select('id, name, handle')
    .eq('business_unit_id', SKINCOACH_BU_ID);

  if (catError) {
    console.error('Error fetching categories:', catError);
    return;
  }

  console.log('📂 Available categories:');
  categories.forEach(c => console.log(`  - ${c.name} (handle: ${c.handle})`));

  // Map category handles to benefit field names (case-insensitive)
  const categoryMap = {
    'face': categories.find(c => c.handle.toLowerCase() === 'face'),
    'body': categories.find(c => c.handle.toLowerCase() === 'body'),
    'eye': categories.find(c => c.handle.toLowerCase() === 'eye'),
    'scalp': categories.find(c => c.handle.toLowerCase() === 'scalp' || c.handle.toLowerCase() === 'hair'),
  };

  console.log('\n📊 Category mapping:');
  Object.entries(categoryMap).forEach(([key, cat]) => {
    console.log(`  ${key} benefit -> ${cat ? `${cat.name} (${cat.id})` : 'NOT FOUND'}`);
  });

  // 2. Get all products for SkinCoach with their benefit fields
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select(`
      id,
      title,
      face_benefits,
      body_benefits,
      hair_benefits,
      eye_benefits,
      product_category_mapping(category_id)
    `)
    .eq('business_unit_id', SKINCOACH_BU_ID)
    .is('deleted_at', null);

  if (prodError) {
    console.error('Error fetching products:', prodError);
    return;
  }

  console.log(`\n📦 Found ${products.length} products to process\n`);

  let updated = 0;
  let skipped = 0;

  for (const product of products) {
    const existingCatIds = product.product_category_mapping?.map(m => m.category_id) || [];
    const newCategoryIds = new Set();

    // Check each benefit field and add corresponding category
    // If the field has any content (not null, not empty), add the category
    if (product.face_benefits && product.face_benefits.trim().length > 0 && categoryMap.face) {
      newCategoryIds.add(categoryMap.face.id);
    }
    if (product.body_benefits && product.body_benefits.trim().length > 0 && categoryMap.body) {
      newCategoryIds.add(categoryMap.body.id);
    }
    if (product.eye_benefits && product.eye_benefits.trim().length > 0 && categoryMap.eye) {
      newCategoryIds.add(categoryMap.eye.id);
    }
    if (product.hair_benefits && product.hair_benefits.trim().length > 0 && categoryMap.scalp) {
      newCategoryIds.add(categoryMap.scalp.id);
    }

    // Convert to array
    const newCatArray = Array.from(newCategoryIds);

    // Check if there are any changes needed
    const existingSet = new Set(existingCatIds);
    const hasChanges = newCatArray.length !== existingCatIds.length ||
                       newCatArray.some(id => !existingSet.has(id));

    if (hasChanges && newCatArray.length > 0) {
      // Delete existing mappings first
      if (existingCatIds.length > 0) {
        const { error: delError } = await supabase
          .from('product_category_mapping')
          .delete()
          .eq('product_id', product.id);

        if (delError) {
          console.error(`❌ Error deleting old mappings for ${product.title}:`, delError);
          continue;
        }
      }

      // Insert new mappings
      const mappings = newCatArray.map(categoryId => ({
        product_id: product.id,
        category_id: categoryId
      }));

      const { error: insertError } = await supabase
        .from('product_category_mapping')
        .insert(mappings);

      if (insertError) {
        console.error(`❌ Error updating ${product.title}:`, insertError);
      } else {
        const catNames = newCatArray.map(id => {
          const cat = categories.find(c => c.id === id);
          return cat?.name || id;
        });
        console.log(`✅ ${product.title}`);
        console.log(`   Face: ${product.face_benefits ? '✓' : '✗'}, Body: ${product.body_benefits ? '✓' : '✗'}, Eye: ${product.eye_benefits ? '✓' : '✗'}, Hair: ${product.hair_benefits ? '✓' : '✗'}`);
        console.log(`   → Categories: ${catNames.join(', ')}`);
        updated++;
      }
    } else if (newCatArray.length === 0) {
      console.log(`⚠️  ${product.title} - No benefit fields have content, skipping`);
      skipped++;
    } else {
      const catNames = existingCatIds.map(id => {
        const cat = categories.find(c => c.id === id);
        return cat?.name || id;
      });
      console.log(`⏭️  ${product.title} - Already correctly categorized: ${catNames.join(', ')}`);
      skipped++;
    }
  }

  console.log(`\n✨ Done!`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${products.length}`);
}

categorizeProducts().catch(console.error);
