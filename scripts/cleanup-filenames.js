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

async function renameExisting() {
  console.log('🔄 Renaming existing long filenames...');

  const { data: images } = await supabase
    .from('image_library')
    .select('*')
    .eq('business_unit_id', BU_ID)
    .ilike('name', 'brezcode-b2b-step-%');

  if (!images || images.length === 0) {
    console.log('No images to rename.');
    return;
  }

  for (const img of images) {
    const oldName = img.name;
    // Extract step number and clean up
    const stepMatch = oldName.match(/step-(\d+)/);
    const stepNum = stepMatch ? stepMatch[1] : 'x';
    
    // Generate a shorter, cleaner name
    const shortId = Math.random().toString(36).substring(2, 6);
    const newName = `b2b-manual-step-${stepNum}-${shortId}.jpg`;
    
    const oldPath = `${BU_ID}/${oldName}`;
    const newPath = `${BU_ID}/${newName}`;

    console.log(`🚚 Renaming ${oldName} -> ${newName}`);

    // 1. Move in storage
    const { error: moveError } = await supabase.storage
      .from('media-library')
      .move(oldPath, newPath);

    if (moveError) {
      console.error('Move error:', moveError);
      continue;
    }

    const newUrl = `${supabaseUrl}/storage/v1/object/public/media-library/${newPath}`;

    // 2. Update in DB
    const { error: updateError } = await supabase
      .from('image_library')
      .update({ 
        name: newName,
        url: newUrl 
      })
      .eq('id', img.id);

    if (updateError) {
      console.error('DB update error:', updateError);
    }
  }

  console.log('✨ Rename complete!');
}

renameExisting();
