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

async function copyLandingPage() {
  const BREAST_GUARDIAN_ID = '346db81c-0b36-4cb7-94f4-d126a3a54fa1';
  
  console.log('🔍 Fetching Breast Guardian HK/EN landing page...');
  
  const { data: enPage, error: enError } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('business_unit_id', BREAST_GUARDIAN_ID)
    .eq('country', 'HK')
    .eq('language_code', 'en')
    .maybeSingle();

  if (enError) {
    console.error('❌ Error fetching HK/EN page:', enError);
    return;
  }

  if (!enPage) {
    console.error('❌ Breast Guardian HK/EN landing page not found.');
    return;
  }

  console.log('✅ Found HK/EN page. Copying to HK/TW...');

  // Prepare the data for HK/TW by copying ALL fields from EN
  const { id, created_at, updated_at, ...copyData } = enPage;
  
  const twPageData = {
    ...copyData,
    country: 'HK',
    language_code: 'zh-TW',
    is_active: true,
    slug: enPage.slug ? `${enPage.slug}-tw` : null
  };

  // Check if HK/TW already exists
  const { data: existingTw, error: existingError } = await supabase
    .from('landing_pages')
    .select('id')
    .eq('business_unit_id', BREAST_GUARDIAN_ID)
    .eq('country', 'HK')
    .eq('language_code', 'zh-TW')
    .maybeSingle();

  if (existingTw) {
    console.log(`🔄 HK/TW page already exists (ID: ${existingTw.id}). Updating...`);
    const { error: updateError } = await supabase
      .from('landing_pages')
      .update(twPageData)
      .eq('id', existingTw.id);
    
    if (updateError) {
      console.error('❌ Error updating HK/TW page:', updateError);
    } else {
      console.log('✅ Successfully updated Breast Guardian HK/TW landing page.');
    }
  } else {
    console.log('✨ Creating new HK/TW page...');
    const { error: insertError } = await supabase
      .from('landing_pages')
      .insert(twPageData);
    
    if (insertError) {
      console.error('❌ Error inserting HK/TW page:', insertError);
    } else {
      console.log('✅ Successfully created Breast Guardian HK/TW landing page.');
    }
  }
}

copyLandingPage();
