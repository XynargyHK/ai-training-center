const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkLocaleContent() {
  // Get skincoach business unit
  const { data: bu } = await supabase
    .from('business_units')
    .select('id, name')
    .eq('slug', 'skincoach')
    .single();

  console.log('Business Unit:', bu.name, bu.id);

  // Get HK/zh blocks
  const { data: hkZh } = await supabase
    .from('landing_pages')
    .select('id, blocks, updated_at')
    .eq('business_unit_id', bu.id)
    .eq('country', 'HK')
    .eq('language_code', 'zh')
    .single();

  console.log('\n=== HK/zh Blocks ===');
  console.log('Landing Page ID:', hkZh?.id);
  console.log('Updated:', hkZh?.updated_at);

  const chineseRegex = /[\u4e00-\u9fff]/;

  if (hkZh?.blocks && Array.isArray(hkZh.blocks)) {
    console.log(`Found ${hkZh.blocks.length} blocks:`);
    hkZh.blocks.forEach((b, i) => {
      const headline = b.data?.headline || b.data?.heading || '';
      const hasChinese = chineseRegex.test(JSON.stringify(b.data || {}));
      console.log(`  ${i+1}. ${b.type}: "${headline}" - ${hasChinese ? '[HAS CHINESE]' : '[NO CHINESE - ISSUE!]'}`);
    });

    // Show first two blocks detail
    console.log('\n--- Block 1 details ---');
    const b1 = hkZh.blocks[0];
    console.log('Type:', b1?.type);
    console.log('Heading:', b1?.data?.heading);
    if (b1?.data?.steps?.[0]) {
      console.log('First step text_content preview:', (b1.data.steps[0].text_content || '').substring(0, 100));
    }

    console.log('\n--- Block 2 details ---');
    const b2 = hkZh.blocks[1];
    console.log('Type:', b2?.type);
    console.log('Heading:', b2?.data?.heading);
    if (b2?.data?.steps?.[0]) {
      console.log('First step subheadline:', b2.data.steps[0].subheadline);
    }
  }
}

checkLocaleContent().catch(console.error);
