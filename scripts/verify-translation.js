const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env.local manually
const envFile = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function verify() {
  const BREAST_GUARDIAN_ID = '346db81c-0b36-4cb7-94f4-d126a3a54fa1';
  
  const { data: pages } = await supabase
    .from('landing_pages')
    .select('id, language_code, hero_headline, blocks')
    .eq('business_unit_id', BREAST_GUARDIAN_ID)
    .eq('country', 'HK');

  pages.forEach(p => {
    console.log(`\n📄 Locale: ${p.language_code}`);
    console.log(`🎯 Headline: ${p.hero_headline}`);
    if (p.blocks && p.blocks.length > 0) {
      console.log(`📦 Blocks: ${p.blocks.length} found`);
      // Print first block data as sample
      console.log(`   Sample Block Data: ${JSON.stringify(p.blocks[0].data).substring(0, 100)}...`);
    }
  });
}

verify();
