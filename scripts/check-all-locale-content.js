const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAllContent() {
  const { data: bu } = await supabase
    .from('business_units')
    .select('id, name')
    .eq('slug', 'skincoach')
    .single();

  console.log('Business Unit:', bu.name);

  // Get US/en full content
  const { data: usEn } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('business_unit_id', bu.id)
    .eq('country', 'US')
    .eq('language_code', 'en')
    .single();

  // Get HK/zh full content
  const { data: hkZh } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('business_unit_id', bu.id)
    .eq('country', 'HK')
    .eq('language_code', 'zh')
    .single();

  const chineseRegex = /[\u4e00-\u9fff]/;

  console.log('\n========== US/en - Checking ALL fields for Chinese ==========');

  function findChineseInObject(obj, path = '') {
    if (!obj) return;

    Object.entries(obj).forEach(([key, val]) => {
      const currentPath = path ? `${path}.${key}` : key;

      if (typeof val === 'string' && chineseRegex.test(val)) {
        console.log(`[CHINESE] ${currentPath}: "${val.substring(0, 80)}..."`);
      } else if (Array.isArray(val)) {
        val.forEach((item, idx) => {
          if (typeof item === 'object') {
            findChineseInObject(item, `${currentPath}[${idx}]`);
          } else if (typeof item === 'string' && chineseRegex.test(item)) {
            console.log(`[CHINESE] ${currentPath}[${idx}]: "${item.substring(0, 80)}..."`);
          }
        });
      } else if (typeof val === 'object' && val !== null) {
        findChineseInObject(val, currentPath);
      }
    });
  }

  findChineseInObject(usEn);

  console.log('\n========== HK/zh - Checking ALL fields for Chinese ==========');
  findChineseInObject(hkZh);

  // Show hero fields comparison
  console.log('\n========== Hero Fields Comparison ==========');
  console.log('US/en hero_headline:', usEn?.hero_headline);
  console.log('US/en hero_subheadline:', usEn?.hero_subheadline?.substring(0, 50));
  console.log('US/en hero_static_headline:', usEn?.hero_static_headline);
  console.log('US/en hero_static_content:', usEn?.hero_static_content?.substring(0, 50));

  console.log('\nHK/zh hero_headline:', hkZh?.hero_headline);
  console.log('HK/zh hero_subheadline:', hkZh?.hero_subheadline?.substring(0, 50));
  console.log('HK/zh hero_static_headline:', hkZh?.hero_static_headline);
  console.log('HK/zh hero_static_content:', hkZh?.hero_static_content?.substring(0, 50));
}

checkAllContent().catch(console.error);
