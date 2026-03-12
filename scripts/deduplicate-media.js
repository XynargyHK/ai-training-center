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

async function deduplicate() {
  console.log('🔍 Finding duplicate images...');

  const { data: images } = await supabase
    .from('image_library')
    .select('*')
    .eq('business_unit_id', BU_ID)
    .ilike('name', 'b2b-manual-step-%');

  if (!images || images.length === 0) {
    console.log('No images found.');
    return;
  }

  // Group by step number (e.g. step-0, step-1)
  const groups = {};
  images.forEach(img => {
    const match = img.name.match(/step-(\d+)/);
    if (match) {
      const step = match[1];
      if (!groups[step]) groups[step] = [];
      groups[step].push(img);
    }
  });

  const toDelete = [];
  const toKeep = [];

  Object.keys(groups).forEach(step => {
    const group = groups[step];
    if (group.length > 1) {
      // Keep the first one, mark others for deletion
      toKeep.push(group[0]);
      for (let i = 1; i < group.length; i++) {
        toDelete.push(group[i]);
      }
    }
  });

  console.log(`🗑️ Found ${toDelete.length} duplicates to remove.`);

  for (const img of toDelete) {
    console.log(`❌ Deleting ${img.name}...`);
    
    // 1. Delete from Storage
    const storagePath = `${BU_ID}/${img.name}`;
    const { error: storageError } = await supabase.storage
      .from('media-library')
      .remove([storagePath]);

    if (storageError) {
      console.error(`Error deleting ${img.name} from storage:`, storageError);
    }

    // 2. Delete from DB
    const { error: dbError } = await supabase
      .from('image_library')
      .delete()
      .eq('id', img.id);

    if (dbError) {
      console.error(`Error deleting ${img.name} from DB:`, dbError);
    }
  }

  console.log('✨ Deduplication complete!');
}

deduplicate();
