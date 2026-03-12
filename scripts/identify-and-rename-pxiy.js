const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const envFile = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => {
  const match = envFile.match(new RegExp(`${key}=(.*)`));
  return match ? match[1].trim() : null;
};

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const googleKey = getEnv('GOOGLE_GEMINI_API_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(googleKey);

const BU_ID = '43890556-457d-40ea-8544-a86b82943c18';

async function renameCorrectly() {
  console.log('🔄 Re-identifying images with pXiY naming...');

  // 1. Get all images for this BU
  const { data: images } = await supabase
    .from('image_library')
    .select('*')
    .eq('business_unit_id', BU_ID);

  if (!images || images.length === 0) {
    console.log('No images found.');
    return;
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  for (const img of images) {
    console.log(`🧐 Analyzing ${img.name}...`);
    
    try {
      // Download image data
      const response = await fetch(img.url);
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');

      // Ask Gemini to identify the page and index
      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: img.mime_type || 'image/jpeg',
            data: base64
          }
        },
        'This is an image from the BrezCode B2B User Manual (CHI). Identify its exact Page Number and Image Index on that page. Return ONLY the code like "p1i1" or "p5i2". If you are unsure, guess based on the content flow.'
      ]);

      const code = result.response.text().trim().toLowerCase().match(/p\d+i\d+/);
      const pxy = code ? code[0] : `px-ref-${Math.random().toString(36).substring(2,5)}`;
      
      const newName = `User Manual CHI ${pxy}.jpg`;
      const oldPath = `${BU_ID}/${img.name}`;
      const newPath = `${BU_ID}/${newName}`;

      console.log(`🏷️ Result: ${pxy} -> Renaming to ${newName}`);

      // 1. Move in storage
      const { error: moveError } = await supabase.storage
        .from('media-library')
        .move(oldPath, newPath);

      if (moveError && !moveError.message.includes('already exists')) {
        console.error('Move error:', moveError);
        continue;
      }

      const newUrl = `${supabaseUrl}/storage/v1/object/public/media-library/${newPath}`;

      // 2. Update in DB
      await supabase
        .from('image_library')
        .update({ 
          name: newName,
          url: newUrl,
          description: `BrezCode B2B Manual ${pxy}`
        })
        .eq('id', img.id);

      console.log(`✅ Success`);
    } catch (err) {
      console.error(`Failed to process ${img.name}:`, err);
    }
  }

  console.log('✨ All images renamed correctly!');
}

renameCorrectly();
