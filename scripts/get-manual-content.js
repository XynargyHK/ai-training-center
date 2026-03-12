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

async function getContent() {
  console.log('🔍 Searching for BrezCode manual content...');
  const { data, error } = await supabase
    .from('knowledge_base')
    .select('id, topic, content, file_path')
    .ilike('file_path', '%User Manual_CHI_revised.pdf%')
    .limit(1);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('❌ No manual content found in database.');
    return;
  }

  console.log('✅ Found Manual:', data[0].file_path);
  console.log('\n--- CONTENT PREVIEW ---\n');
  console.log(data[0].content.substring(0, 1000));
  
  // Save to temporary file for Gemini to process
  fs.writeFileSync('manual_extracted.txt', data[0].content);
  console.log('\n✅ Full content saved to manual_extracted.txt');
}

getContent();
