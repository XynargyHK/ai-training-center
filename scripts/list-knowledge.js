const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envFile = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function listKnowledge() {
  const { data, error } = await supabase
    .from('knowledge_base')
    .select('topic, file_path, created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error(error);
    return;
  }

  console.log('--- RECENT KNOWLEDGE BASE ENTRIES ---');
  data.forEach(item => {
    console.log(`- ${item.topic} (${item.file_path})`);
  });
}

listKnowledge();
