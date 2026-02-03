const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixUsEnBlocks() {
  // Get skincoach business unit
  const { data: bu, error: buError } = await supabase
    .from('business_units')
    .select('id, name')
    .eq('slug', 'skincoach')
    .single();

  if (buError || !bu) {
    console.error('Error fetching business unit:', buError);
    return;
  }

  console.log('Business Unit:', bu.name, bu.id);

  // Get HK/en blocks (source of correct English content)
  const { data: hkEn, error: hkError } = await supabase
    .from('landing_pages')
    .select('id, blocks')
    .eq('business_unit_id', bu.id)
    .eq('country', 'HK')
    .eq('language_code', 'en')
    .single();

  if (hkError) {
    console.error('Error fetching HK/en:', hkError);
    return;
  }

  // Get US/en blocks
  const { data: usEn, error: usError } = await supabase
    .from('landing_pages')
    .select('id, blocks')
    .eq('business_unit_id', bu.id)
    .eq('country', 'US')
    .eq('language_code', 'en')
    .single();

  if (usError) {
    console.error('Error fetching US/en:', usError);
    return;
  }

  if (!hkEn?.blocks || !usEn?.blocks) {
    console.error('Could not find blocks');
    return;
  }

  console.log('\nHK/en has', hkEn.blocks.length, 'blocks');
  console.log('US/en has', usEn.blocks.length, 'blocks');

  // Check HK/en blocks 1 and 2 content
  console.log('\n=== HK/en Block 1 heading:', hkEn.blocks[0]?.data?.heading || '(no heading)');
  console.log('=== HK/en Block 2 heading:', hkEn.blocks[1]?.data?.heading || '(no heading)');

  const chineseRegex = /[\u4e00-\u9fff]/;

  // Verify HK/en blocks 1 and 2 are English
  const block1Ok = !chineseRegex.test(JSON.stringify(hkEn.blocks[0]?.data || {}));
  const block2Ok = !chineseRegex.test(JSON.stringify(hkEn.blocks[1]?.data || {}));

  console.log('\nHK/en Block 1 is English:', block1Ok);
  console.log('HK/en Block 2 is English:', block2Ok);

  if (!block1Ok || !block2Ok) {
    console.error('\nError: HK/en blocks also contain Chinese. Cannot use as source.');
    return;
  }

  // Create fixed blocks array for US/en
  const fixedBlocks = [...usEn.blocks];

  // Replace blocks 0 and 1 with the HK/en versions (keeping the same block ID)
  fixedBlocks[0] = {
    ...hkEn.blocks[0],
    id: usEn.blocks[0].id // Keep the original US/en block ID
  };
  fixedBlocks[1] = {
    ...hkEn.blocks[1],
    id: usEn.blocks[1].id // Keep the original US/en block ID
  };

  console.log('\n=== Will update US/en blocks ===');
  console.log('Block 1 new heading:', fixedBlocks[0].data?.heading);
  console.log('Block 2 new heading:', fixedBlocks[1].data?.heading);

  // Ask for confirmation
  console.log('\nTo apply fix, run with --apply flag');

  if (process.argv.includes('--apply')) {
    console.log('\nApplying fix...');

    const { error } = await supabase
      .from('landing_pages')
      .update({ blocks: fixedBlocks })
      .eq('id', usEn.id);

    if (error) {
      console.error('Error updating:', error);
    } else {
      console.log('Successfully fixed US/en blocks!');
    }
  }
}

fixUsEnBlocks().catch(console.error);
