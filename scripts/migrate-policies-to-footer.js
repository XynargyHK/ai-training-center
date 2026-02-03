require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migratePoliciesToFooter() {
  console.log('🚀 Migrating policies blocks to footer column...\n');

  // Get all landing pages
  const { data: pages, error: fetchError } = await supabase
    .from('landing_pages')
    .select('id, blocks, footer');

  if (fetchError) {
    console.error('❌ Fetch error:', fetchError);
    return;
  }

  console.log(`Found ${pages.length} landing pages\n`);

  let migrated = 0;
  for (const page of pages) {
    if (!page.blocks || !Array.isArray(page.blocks)) continue;

    const policiesBlock = page.blocks.find(b => b.type === 'policies');
    if (!policiesBlock) continue;

    console.log(`Found policies block in page: ${page.id}`);

    // Remove policies block from blocks array
    const newBlocks = page.blocks.filter(b => b.type !== 'policies');

    // Move policies data to footer column (merge with existing footer if any)
    const existingFooter = page.footer || {};
    const policiesData = policiesBlock.data || {};
    const mergedFooter = { ...existingFooter, ...policiesData };

    const { error: updateError } = await supabase
      .from('landing_pages')
      .update({
        blocks: newBlocks,
        footer: mergedFooter
      })
      .eq('id', page.id);

    if (updateError) {
      console.error(`❌ Update error for page ${page.id}:`, updateError);
    } else {
      console.log(`✅ Migrated policies block to footer for page: ${page.id}`);
      migrated++;
    }
  }

  console.log(`\n🎉 Done! Migrated ${migrated} policies blocks to footer column.`);
}

migratePoliciesToFooter();
