/**
 * Migrate customer_concerns to use product_attribute_options IDs
 *
 * This script:
 * 1. Reads the ID mapping from concern-id-mapping.json
 * 2. Updates all customer_concerns.concern_id to new option IDs
 * 3. Updates the foreign key constraint if needed
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrate() {
  console.log('=== Migrating customer_concerns to use new option IDs ===\n');

  // Load the mapping
  const mappingFile = 'scripts/concern-id-mapping.json';
  if (!fs.existsSync(mappingFile)) {
    console.error('ERROR: Mapping file not found! Run migrate-concerns-to-attributes.js first.');
    return;
  }

  const mappingData = JSON.parse(fs.readFileSync(mappingFile, 'utf-8'));
  const idMapping = mappingData.mapping;

  console.log(`Loaded ${Object.keys(idMapping).length} ID mappings\n`);

  // Get all customer_concerns
  const { data: customerConcerns, error } = await supabase
    .from('customer_concerns')
    .select('id, profile_id, concern_id, category');

  if (error) {
    console.error('Error fetching customer_concerns:', error);
    return;
  }

  console.log(`Found ${customerConcerns?.length || 0} customer_concerns to migrate\n`);

  if (!customerConcerns || customerConcerns.length === 0) {
    console.log('No customer_concerns to migrate.');
    return;
  }

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const concern of customerConcerns) {
    const newId = idMapping[concern.concern_id];

    if (!newId) {
      // Check if already using new ID
      const isAlreadyNew = Object.values(idMapping).includes(concern.concern_id);
      if (isAlreadyNew) {
        console.log(`  - Already migrated: ${concern.id}`);
        skipped++;
        continue;
      }

      console.log(`  ! No mapping for concern_id: ${concern.concern_id}`);
      skipped++;
      continue;
    }

    // Update to new ID
    const { error: updateError } = await supabase
      .from('customer_concerns')
      .update({ concern_id: newId })
      .eq('id', concern.id);

    if (updateError) {
      console.log(`  x Error updating ${concern.id}: ${updateError.message}`);
      errors++;
    } else {
      console.log(`  ✓ Updated: ${concern.id} (${concern.concern_id} -> ${newId})`);
      updated++;
    }
  }

  console.log(`\n=== Migration Summary ===`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped (already migrated or no mapping): ${skipped}`);
  console.log(`Errors: ${errors}`);
  console.log(`\nTotal processed: ${customerConcerns.length}`);
}

migrate().catch(console.error);
