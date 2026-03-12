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

async function copyToTW() {
  const BREAST_GUARDIAN_ID = '346db81c-0b36-4cb7-94f4-d126a3a54fa1';
  
  console.log('🔍 Fetching Breast Guardian HK/EN page...');
  const { data: enPage, error: enError } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('business_unit_id', BREAST_GUARDIAN_ID)
    .eq('country', 'HK')
    .eq('language_code', 'en')
    .single();

  if (enError || !enPage) {
    console.error('❌ Error fetching EN page:', enError);
    return;
  }

  // Identify the TW record (it might be "tw" or "TW")
  console.log('🔍 Looking for existing HK/TW or HK/tw page...');
  const { data: twPages } = await supabase
    .from('landing_pages')
    .select('id, language_code')
    .eq('business_unit_id', BREAST_GUARDIAN_ID)
    .eq('country', 'HK')
    .in('language_code', ['TW', 'tw']);

  if (!twPages || twPages.length === 0) {
    console.log('✨ No TW page found, creating a new one with code "TW"...');
    const { id, created_at, updated_at, ...copyData } = enPage;
    const { error: insertError } = await supabase
      .from('landing_pages')
      .insert({
        ...copyData,
        language_code: 'TW',
        is_active: true,
        slug: enPage.slug ? `${enPage.slug}-tw` : null
      });
    if (insertError) console.error('❌ Insert Error:', insertError);
    else console.log('✅ Created HK/TW page from EN content.');
  } else {
    // Update existing TW/tw records
    for (const twPage of twPages) {
      console.log(`🔄 Updating existing ${twPage.language_code} page (ID: ${twPage.id})...`);
      const { id, created_at, updated_at, ...copyData } = enPage;
      const { error: updateError } = await supabase
        .from('landing_pages')
        .update({
          ...copyData,
          language_code: twPage.language_code,
          is_active: true
        })
        .eq('id', twPage.id);
      
      if (updateError) console.error(`❌ Update Error for ${twPage.id}:`, updateError);
      else console.log(`✅ Successfully updated Breast Guardian ${twPage.language_code} landing page.`);
    }
  }

  // Clean up any "zh-TW" that I accidentally created earlier
  console.log('🗑️ Cleaning up any accidental "zh-TW" pages...');
  await supabase
    .from('landing_pages')
    .delete()
    .eq('business_unit_id', BREAST_GUARDIAN_ID)
    .eq('language_code', 'zh-TW');
}

copyToTW();
