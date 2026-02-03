const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixLocaleContent() {
  const { data: bu } = await supabase
    .from('business_units')
    .select('id, name')
    .eq('slug', 'skincoach')
    .single();

  console.log('Business Unit:', bu.name);

  // Get all three locales
  const { data: usEn } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('business_unit_id', bu.id)
    .eq('country', 'US')
    .eq('language_code', 'en')
    .single();

  const { data: hkEn } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('business_unit_id', bu.id)
    .eq('country', 'HK')
    .eq('language_code', 'en')
    .single();

  const { data: hkZh } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('business_unit_id', bu.id)
    .eq('country', 'HK')
    .eq('language_code', 'zh')
    .single();

  console.log('US/en ID:', usEn?.id);
  console.log('HK/en ID:', hkEn?.id);
  console.log('HK/zh ID:', hkZh?.id);

  // Fields that have Chinese content in US/en that should go to HK/zh
  const chineseFieldsInUsEn = [
    'announcements',
    'menu_items',
    'hero_slides'
  ];

  console.log('\n=== Chinese content to move from US/en to HK/zh ===');
  chineseFieldsInUsEn.forEach(field => {
    console.log(`${field}:`, JSON.stringify(usEn[field])?.substring(0, 100) + '...');
  });

  console.log('\n=== English content to restore to US/en (from HK/en) ===');
  chineseFieldsInUsEn.forEach(field => {
    console.log(`${field}:`, JSON.stringify(hkEn[field])?.substring(0, 100) + '...');
  });

  if (!process.argv.includes('--apply')) {
    console.log('\nRun with --apply to make changes');
    return;
  }

  console.log('\n=== Applying fixes ===');

  // Step 1: Copy Chinese content from US/en to HK/zh
  const hkZhUpdate = {};
  chineseFieldsInUsEn.forEach(field => {
    hkZhUpdate[field] = usEn[field];
  });

  console.log('Updating HK/zh with Chinese content...');
  const { error: hkZhError } = await supabase
    .from('landing_pages')
    .update(hkZhUpdate)
    .eq('id', hkZh.id);

  if (hkZhError) {
    console.error('Error updating HK/zh:', hkZhError);
    return;
  }
  console.log('HK/zh updated successfully!');

  // Step 2: Restore English content to US/en from HK/en
  const usEnUpdate = {};
  chineseFieldsInUsEn.forEach(field => {
    usEnUpdate[field] = hkEn[field];
  });

  console.log('Updating US/en with English content...');
  const { error: usEnError } = await supabase
    .from('landing_pages')
    .update(usEnUpdate)
    .eq('id', usEn.id);

  if (usEnError) {
    console.error('Error updating US/en:', usEnError);
    return;
  }
  console.log('US/en updated successfully!');

  console.log('\n=== Done! ===');
  console.log('- HK/zh now has Chinese announcements, menu_items, hero_slides');
  console.log('- US/en now has English announcements, menu_items, hero_slides');
}

fixLocaleContent().catch(console.error);
