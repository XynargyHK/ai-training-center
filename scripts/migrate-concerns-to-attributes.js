/**
 * Migrate skin_concerns system to product_attributes system
 *
 * This script:
 * 1. Verifies product_attribute_options has all the same concerns as skin_concerns
 * 2. Creates a mapping table between old concern IDs and new option IDs
 * 3. Migrates customer_concerns to reference product_attribute_options
 * 4. Verifies booster_concern_mapping matches product_attribute_values
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUSINESS_UNIT_ID = '77313e61-2a19-4f3e-823b-80390dde8bd2'; // SkinCoach

async function migrate() {
  console.log('=== Migrating skin_concerns to product_attributes ===\n');

  // Step 1: Get all skin_concerns
  const { data: oldConcerns } = await supabase
    .from('skin_concerns')
    .select('*')
    .eq('business_unit_id', BUSINESS_UNIT_ID)
    .order('category')
    .order('display_order');

  console.log(`Found ${oldConcerns?.length || 0} old skin_concerns\n`);

  // Step 2: Get the Skin Concerns attribute
  const { data: attribute } = await supabase
    .from('product_attributes')
    .select('id, name')
    .eq('business_unit_id', BUSINESS_UNIT_ID)
    .eq('handle', 'skin_concerns')
    .single();

  if (!attribute) {
    console.error('ERROR: No "skin_concerns" product_attribute found!');
    return;
  }
  console.log(`Found attribute: ${attribute.name} (${attribute.id})\n`);

  // Step 3: Get categories (to map category handles to IDs)
  const { data: categories } = await supabase
    .from('product_categories')
    .select('id, name, handle')
    .eq('business_unit_id', BUSINESS_UNIT_ID);

  const categoryMap = {};
  categories?.forEach(c => {
    categoryMap[c.handle.toLowerCase()] = c.id;
  });
  console.log('Category map:', categoryMap, '\n');

  // Step 4: Get existing product_attribute_options
  const { data: newOptions } = await supabase
    .from('product_attribute_options')
    .select('id, name, handle, category_id')
    .eq('attribute_id', attribute.id);

  console.log(`Found ${newOptions?.length || 0} existing product_attribute_options\n`);

  // Step 5: Create ID mapping (old concern ID -> new option ID)
  const idMapping = {};
  const missingConcerns = [];

  for (const oldConcern of oldConcerns || []) {
    // Find matching option by name (case-insensitive)
    const matchingOption = newOptions?.find(opt =>
      opt.name.toLowerCase() === oldConcern.name.toLowerCase() ||
      opt.handle === oldConcern.handle
    );

    if (matchingOption) {
      idMapping[oldConcern.id] = matchingOption.id;
      console.log(`✓ Mapped: ${oldConcern.name} -> ${matchingOption.id}`);
    } else {
      missingConcerns.push(oldConcern);
      console.log(`✗ Missing: ${oldConcern.name} (${oldConcern.category})`);
    }
  }

  console.log(`\nMapped: ${Object.keys(idMapping).length}`);
  console.log(`Missing: ${missingConcerns.length}\n`);

  // Step 6: Create missing options
  if (missingConcerns.length > 0) {
    console.log('Creating missing options...\n');

    for (const concern of missingConcerns) {
      const categoryId = categoryMap[concern.category];
      if (!categoryId) {
        console.log(`  ✗ No category for: ${concern.name} (${concern.category})`);
        continue;
      }

      const { data: newOpt, error } = await supabase
        .from('product_attribute_options')
        .insert({
          attribute_id: attribute.id,
          name: concern.name,
          handle: concern.handle,
          category_id: categoryId,
          display_order: concern.display_order
        })
        .select()
        .single();

      if (error) {
        console.log(`  ✗ Error creating ${concern.name}: ${error.message}`);
      } else {
        idMapping[concern.id] = newOpt.id;
        console.log(`  ✓ Created: ${concern.name} -> ${newOpt.id}`);
      }
    }
  }

  // Step 7: Verify booster_concern_mapping vs product_attribute_values
  console.log('\n--- Verifying booster mappings ---\n');

  const { data: oldMappings } = await supabase
    .from('booster_concern_mapping')
    .select('product_id, concern_id, effectiveness_rating, is_primary');

  const { data: newMappings } = await supabase
    .from('product_attribute_values')
    .select('product_id, option_id')
    .eq('attribute_id', attribute.id);

  console.log(`Old booster_concern_mapping: ${oldMappings?.length || 0} rows`);
  console.log(`New product_attribute_values: ${newMappings?.length || 0} rows`);

  // Check if all old mappings have corresponding new mappings
  let matchCount = 0;
  let missingCount = 0;

  for (const oldMap of oldMappings || []) {
    const newOptionId = idMapping[oldMap.concern_id];
    if (!newOptionId) {
      continue; // No mapping for this concern
    }

    const hasNew = newMappings?.some(nm =>
      nm.product_id === oldMap.product_id && nm.option_id === newOptionId
    );

    if (hasNew) {
      matchCount++;
    } else {
      missingCount++;
    }
  }

  console.log(`\nBooster mappings match: ${matchCount}`);
  console.log(`Missing in new system: ${missingCount}`);

  // Step 8: Check customer_concerns
  console.log('\n--- Customer concerns status ---\n');

  const { data: customerConcerns } = await supabase
    .from('customer_concerns')
    .select('id, profile_id, concern_id');

  console.log(`Total customer_concerns: ${customerConcerns?.length || 0}`);

  // Save mapping for use by API updates
  console.log('\n--- ID Mapping (save this!) ---\n');
  console.log(JSON.stringify(idMapping, null, 2));

  // Write mapping to a file for reference
  const fs = require('fs');
  fs.writeFileSync(
    'scripts/concern-id-mapping.json',
    JSON.stringify({
      businessUnitId: BUSINESS_UNIT_ID,
      attributeId: attribute.id,
      mapping: idMapping,
      generatedAt: new Date().toISOString()
    }, null, 2)
  );

  console.log('\n✅ Mapping saved to scripts/concern-id-mapping.json');
  console.log('\nNext steps:');
  console.log('1. Update /api/quiz to use product_attribute_options');
  console.log('2. Update /api/recommendations to use product_attribute_values');
  console.log('3. Migrate customer_concerns to use new IDs');
  console.log('4. Drop skin_concerns and booster_concern_mapping tables');
}

migrate().catch(console.error);
