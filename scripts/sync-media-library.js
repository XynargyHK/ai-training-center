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
  console.log('🔄 Syncing Media Library...');

  // 1. List files in the 'library/' subfolder
  const { data: files, error: listError } = await supabase.storage
    .from('media-library')
    .list(`${BU_ID}/library`);

  if (listError) {
    console.error('List error:', listError);
    return;
  }

  console.log(`📸 Found ${files.length} files in subfolder`);

  for (const file of files) {
    if (file.name === '.emptyFolderPlaceholder') continue;

    const oldPath = `${BU_ID}/library/${file.name}`;
    const newPath = `${BU_ID}/${file.name}`;

    console.log(`🚚 Moving ${file.name} to root...`);
    
    // Copy to new location
    const { error: copyError } = await supabase.storage
      .from('media-library')
      .copy(oldPath, newPath);

    if (copyError) {
      console.error('Copy error:', copyError);
      continue;
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/media-library/${newPath}`;

    // 2. Register in database
    console.log(`📝 Registering ${file.name} in database...`);
    const { error: dbError } = await supabase
      .from('image_library')
      .upsert({
        business_unit_id: BU_ID,
        name: file.name,
        url: publicUrl,
        file_size: file.metadata?.size || 0,
        mime_type: file.metadata?.mimetype || 'image/jpeg',
        description: 'Extracted from B2B User Manual',
        source_url: 'User Manual_CHI_revised.pdf',
        category: 'diagram'
      }, { onConflict: 'url' });

    if (dbError) {
      console.error('DB error:', dbError);
    }
  }

  console.log('✨ Sync complete!');
}

sync();
