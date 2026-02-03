const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function syncFilenames() {
  const { data: bu } = await supabase
    .from('business_units')
    .select('id, name')
    .eq('slug', 'skincoach')
    .single();

  console.log('Business Unit:', bu.name);

  // Get all three locales
  const { data: usEn } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('business_unit_id', bu.id)
    .eq('country', 'US')
    .eq('language_code', 'en')
    .single();

  const { data: hkEn } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('business_unit_id', bu.id)
    .eq('country', 'HK')
    .eq('language_code', 'en')
    .single();

  const { data: hkZh } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('business_unit_id', bu.id)
    .eq('country', 'HK')
    .eq('language_code', 'zh')
    .single();

  console.log('US/en ID:', usEn?.id);
  console.log('HK/en ID:', hkEn?.id);
  console.log('HK/zh ID:', hkZh?.id);

  // Build a map of URL -> original_filename from US/en
  const filenameMap = new Map();

  function extractFilenames(obj, path = '') {
    if (!obj) return;

    if (Array.isArray(obj)) {
      obj.forEach((item, idx) => extractFilenames(item, `${path}[${idx}]`));
    } else if (typeof obj === 'object') {
      // Check if this object has both a URL field and original_filename
      const urlFields = ['background_url', 'image_url', 'video_url', 'logo_url', 'poster_url', 'url'];

      urlFields.forEach(urlField => {
        if (obj[urlField] && obj.original_filename) {
          filenameMap.set(obj[urlField], obj.original_filename);
          console.log(`Found: ${obj.original_filename} -> ${obj[urlField].substring(0, 60)}...`);
        }
      });

      // Recurse into nested objects
      Object.values(obj).forEach((val, idx) => {
        if (typeof val === 'object') {
          extractFilenames(val, `${path}.${Object.keys(obj)[idx]}`);
        }
      });
    }
  }

  console.log('\n=== Extracting filenames from US/en ===');
  extractFilenames(usEn);
  console.log(`\nFound ${filenameMap.size} filename mappings`);

  // Function to add original_filename to objects that have matching URLs
  function addFilenames(obj) {
    if (!obj) return obj;

    if (Array.isArray(obj)) {
      return obj.map(item => addFilenames(item));
    } else if (typeof obj === 'object') {
      const newObj = { ...obj };

      const urlFields = ['background_url', 'image_url', 'video_url', 'logo_url', 'poster_url', 'url'];

      urlFields.forEach(urlField => {
        if (newObj[urlField] && filenameMap.has(newObj[urlField]) && !newObj.original_filename) {
          newObj.original_filename = filenameMap.get(newObj[urlField]);
        }
      });

      // Recurse into nested objects
      Object.keys(newObj).forEach(key => {
        if (typeof newObj[key] === 'object') {
          newObj[key] = addFilenames(newObj[key]);
        }
      });

      return newObj;
    }
    return obj;
  }

  // Apply filenames to HK/en and HK/zh
  console.log('\n=== Applying filenames to HK/en ===');
  const hkEnUpdated = addFilenames(hkEn);

  console.log('\n=== Applying filenames to HK/zh ===');
  const hkZhUpdated = addFilenames(hkZh);

  // Fields to update (ones that might contain media with filenames)
  const fieldsToUpdate = [
    'blocks',
    'hero_slides',
    'hero_static_bg',
    'logo_url'
  ];

  if (!process.argv.includes('--apply')) {
    console.log('\n=== Preview: Fields to update ===');

    // Check blocks for filenames
    console.log('\nHK/en blocks with filenames:');
    if (hkEnUpdated.blocks) {
      hkEnUpdated.blocks.forEach((block, i) => {
        const blockStr = JSON.stringify(block);
        if (blockStr.includes('original_filename')) {
          console.log(`  Block ${i+1} (${block.type}): has original_filename`);
        }
      });
    }

    console.log('\nHK/zh blocks with filenames:');
    if (hkZhUpdated.blocks) {
      hkZhUpdated.blocks.forEach((block, i) => {
        const blockStr = JSON.stringify(block);
        if (blockStr.includes('original_filename')) {
          console.log(`  Block ${i+1} (${block.type}): has original_filename`);
        }
      });
    }

    console.log('\nRun with --apply to save changes');
    return;
  }

  console.log('\n=== Saving changes ===');

  // Update HK/en
  const hkEnUpdate = {};
  fieldsToUpdate.forEach(field => {
    if (hkEnUpdated[field] !== undefined) {
      hkEnUpdate[field] = hkEnUpdated[field];
    }
  });

  const { error: hkEnError } = await supabase
    .from('landing_pages')
    .update(hkEnUpdate)
    .eq('id', hkEn.id);

  if (hkEnError) {
    console.error('Error updating HK/en:', hkEnError);
  } else {
    console.log('HK/en updated with filenames!');
  }

  // Update HK/zh
  const hkZhUpdate = {};
  fieldsToUpdate.forEach(field => {
    if (hkZhUpdated[field] !== undefined) {
      hkZhUpdate[field] = hkZhUpdated[field];
    }
  });

  const { error: hkZhError } = await supabase
    .from('landing_pages')
    .update(hkZhUpdate)
    .eq('id', hkZh.id);

  if (hkZhError) {
    console.error('Error updating HK/zh:', hkZhError);
  } else {
    console.log('HK/zh updated with filenames!');
  }

  console.log('\n=== Done! ===');
}

syncFilenames().catch(console.error);
