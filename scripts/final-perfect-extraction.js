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
const PDF_PATH = 'knowledgebase/User Manual_CHI_revised.pdf';

function extractImagesFromBuffer(buffer) {
  const images = [];
  let i = 0;
  while (i < buffer.length - 8) {
    if (buffer[i] === 0xFF && buffer[i + 1] === 0xD8 && buffer[i + 2] === 0xFF) {
      let end = i + 3;
      while (end < buffer.length - 1) {
        if (buffer[end] === 0xFF && buffer[end + 1] === 0xD9) {
          end += 2;
          break;
        }
        end++;
      }
      const data = buffer.slice(i, end);
      if (data.length > 10000) images.push({ data, type: 'image/jpeg', ext: 'jpg' });
      i = end;
    } else if (buffer[i] === 0x89 && buffer[i+1] === 0x50 && buffer[i+2] === 0x4E && buffer[i+3] === 0x47) {
      let end = i + 8;
      while (end < buffer.length - 8) {
        if (buffer[end] === 0x49 && buffer[end+1] === 0x45 && buffer[end+2] === 0x4E && buffer[end+3] === 0x44) {
          end += 8;
          break;
        }
        end++;
      }
      const data = buffer.slice(i, end);
      if (data.length > 10000) images.push({ data, type: 'image/png', ext: 'png' });
      i = end;
    } else {
      i++;
    }
  }
  return images;
}

async function run() {
  console.log('🚀 Starting Final Extraction & Identification...');
  const buffer = fs.readFileSync(PDF_PATH);
  const rawImages = extractImagesFromBuffer(buffer);
  
  // Deduplicate
  const uniqueImages = [];
  const seen = new Set();
  for (const img of rawImages) {
    const finger = img.data.length + '-' + img.data.slice(0, 50).toString('hex');
    if (!seen.has(finger)) { seen.add(finger); uniqueImages.push(img); }
  }
  
  console.log(`📸 Found ${uniqueImages.length} unique images. Identifying pages...`);

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  for (let i = 0; i < uniqueImages.length; i++) {
    const img = uniqueImages[i];
    console.log(`⚙️ Identifying image ${i+1}/${uniqueImages.length}...`);

    try {
      const result = await model.generateContent([
        { inlineData: { mimeType: img.type, data: img.data.toString('base64') } },
        'This is from the BrezCode B2B User Manual (CHI). What page number and image index is this? (e.g. p3i1). Return ONLY the code.'
      ]);

      const pxy = result.response.text().trim().toLowerCase().match(/p\d+i\d+/) || [`px-i${i}`];
      const code = pxy[0];
      const fileName = `User Manual CHI ${code}.jpg`;
      const storagePath = `${BU_ID}/${fileName}`;

      console.log(`🏷️  Identified as ${code}. Uploading...`);

      const { error: uploadError } = await supabase.storage
        .from('media-library')
        .upload(storagePath, img.data, { contentType: img.type, upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        continue;
      }

      const publicUrl = `${supabaseUrl}/storage/v1/object/public/media-library/${storagePath}`;

      await supabase.from('image_library').upsert({
        business_unit_id: BU_ID,
        name: fileName,
        url: publicUrl,
        description: `B2B Manual ${code}`,
        source_url: 'User Manual_CHI_revised.pdf',
        mime_type: img.type,
        file_size: img.data.length,
        width: 1024, height: 768
      }, { onConflict: 'url' });

      console.log(`✅ Saved ${fileName}`);
    } catch (err) {
      console.error('Error processing image:', err);
    }
  }
  console.log('✨ ALL DONE!');
}

run();
