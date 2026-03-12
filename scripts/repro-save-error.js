const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => {
  const match = envFile.match(new RegExp(`${key}=(.*)`));
  return match ? match[1].trim() : null;
};

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(supabaseUrl, supabaseKey);

const BU_ID = '43890556-457d-40ea-8544-a86b82943c18'; // BrezCode

async function testSave() {
  console.log('🧪 Testing Landing Page Save...');
  
  // Try to update the "user" page we found earlier
  const payload = {
    business_unit_id: BU_ID,
    country: 'HK',
    language_code: 'tw',
    slug: 'user',
    hero_headline: 'Test Save ' + new Date().toISOString(),
    is_active: true
  };

  console.log('Attempting update for user page...');
  const { data, error } = await supabase
    .from('landing_pages')
    .update(payload)
    .eq('business_unit_id', BU_ID)
    .eq('country', 'HK')
    .eq('language_code', 'tw')
    .eq('slug', 'user')
    .select();

  if (error) {
    console.error('❌ Update Error:', error);
  } else {
    console.log('✅ Update Success:', data);
  }

  // Try to create a NEW page
  const newSlug = 'test-' + Math.random().toString(36).substring(2, 7);
  console.log(`Attempting to create new page with slug: ${newSlug}`);
  const { data: newData, error: newError } = await supabase
    .from('landing_pages')
    .insert({
      business_unit_id: BU_ID,
      country: 'HK',
      language_code: 'tw',
      slug: newSlug,
      hero_headline: 'New Page Test',
      is_active: true
    })
    .select();

  if (newError) {
    console.error('❌ Insert Error:', newError);
  } else {
    console.log('✅ Insert Success:', newData);
  }
}

testSave();
