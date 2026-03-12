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

const BU_ID = '43890556-457d-40ea-8544-a86b82943c18';

async function sync() {
  console.log('🔄 Registering images in database...');

  // 1. List files in root
  const { data: files, error: listError } = await supabase.storage
    .from('media-library')
    .list(BU_ID);

  if (listError) {
    console.error('List error:', listError);
    return;
  }

  console.log(`📸 Found ${files.length} files in root storage`);

  for (const file of files) {
    if (file.name === '.emptyFolderPlaceholder' || file.name === 'library') continue;

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/media-library/${BU_ID}/${file.name}`;

    // Check if already registered
    const { data: existing } = await supabase
      .from('image_library')
      .select('id')
      .eq('url', publicUrl)
      .maybeSingle();

    if (existing) {
      console.log(`⏩ ${file.name} already registered`);
      continue;
    }

    // 2. Register in database
    console.log(`📝 Registering ${file.name}...`);
    const { error: dbError } = await supabase
      .from('image_library')
      .insert({
        business_unit_id: BU_ID,
        name: file.name,
        url: publicUrl,
        file_size: file.metadata?.size || 0,
        mime_type: file.metadata?.mimetype || 'image/jpeg',
        description: 'Extracted from B2B User Manual',
        source_url: 'User Manual_CHI_revised.pdf',
        category: 'diagram',
        width: 1024, // Fallback
        height: 768  // Fallback
      });

    if (dbError) {
      console.error('DB error:', dbError);
    } else {
      console.log(`✅ Saved ${file.name}`);
    }
  }

  console.log('✨ Sync complete!');
}

sync();
