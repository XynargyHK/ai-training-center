const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load env vars manually
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

const BU_ID = '43890556-457d-40ea-8544-a86b82943c18'; // BrezCode
const PDF_PATH = 'knowledgebase/User Manual_CHI_revised.pdf';

function extractImagesFromBuffer(buffer) {
  const images = [];
  let i = 0;
  
  // Scanners for JPEG and PNG
  while (i < buffer.length - 8) {
    // JPEG SOI: FF D8 FF
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
      if (data.length > 5000) { // Lower threshold to 5KB
        images.push({ data, mimeType: 'image/jpeg', ext: 'jpg' });
      }
      i = end;
    } 
    // PNG Signature: 89 50 4E 47 0D 0A 1A 0A
    else if (buffer[i] === 0x89 && buffer[i+1] === 0x50 && buffer[i+2] === 0x4E && buffer[i+3] === 0x47) {
      let end = i + 8;
      while (end < buffer.length - 8) {
        // PNG IEND chunk
        if (buffer[end] === 0x49 && buffer[end+1] === 0x45 && buffer[end+2] === 0x4E && buffer[end+3] === 0x44) {
          end += 8;
          break;
        }
        end++;
      }
      const data = buffer.slice(i, end);
      if (data.length > 5000) {
        images.push({ data, mimeType: 'image/png', ext: 'png' });
      }
      i = end;
    }
    else {
      i++;
    }
  }
  return images;
}

async function generateDescription(imageBuffer, mimeType) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: imageBuffer.toString('base64')
        }
      },
      'Describe this image from a professional medical/beauty equipment manual. What tablet UI or process is shown? Be specific.'
    ]);
    return result.response.text().trim();
  } catch (err) {
    return 'B2B Manual Screenshot';
  }
}

async function run() {
  console.log('🚀 Starting deep extraction from:', PDF_PATH);
  if (!fs.existsSync(PDF_PATH)) {
    console.error('File not found!');
    return;
  }

  const buffer = fs.readFileSync(PDF_PATH);
  const rawImages = extractImagesFromBuffer(buffer);
  console.log(`📸 Found ${rawImages.length} candidate images in PDF`);

  const uniqueImages = [];
  const seen = new Set();
  for (const img of rawImages) {
    const fingerprint = `${img.data.length}-${img.data.slice(0, 100).toString('hex')}`;
    if (!seen.has(fingerprint)) {
      seen.add(fingerprint);
      uniqueImages.push(img);
    }
  }
  console.log(`🎯 ${uniqueImages.length} unique images after filtering`);

  const results = [];
  for (let i = 0; i < uniqueImages.length; i++) {
    const img = uniqueImages[i];
    
    // Use MD5 or unique fingerprint to skip re-processing
    const fingerprint = `auto-ext-${img.data.length}`;
    
    const { data: existing } = await supabase
      .from('image_library')
      .select('id')
      .eq('business_unit_id', BU_ID)
      .ilike('name', `%${fingerprint}%`)
      .maybeSingle();

    if (existing) {
      console.log(`⏩ Skipping image ${i+1} (already in DB)`);
      continue;
    }

    const shortId = Math.random().toString(36).substring(2, 6);
    const fileName = `b2b-auto-${i}-${img.data.length}-${shortId}.${img.ext}`;
    const storagePath = `${BU_ID}/${fileName}`;

    console.log(`⚙️ Processing image ${i+1}/${uniqueImages.length}...`);
    
    const { error: uploadError } = await supabase.storage
      .from('media-library')
      .upload(storagePath, img.data, { contentType: img.mimeType });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      continue;
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/media-library/${storagePath}`;
    const description = await generateDescription(img.data, img.mimeType);

    const { error: dbError } = await supabase
      .from('image_library')
      .insert({
        business_unit_id: BU_ID,
        name: fileName,
        url: publicUrl,
        description: description,
        mime_type: img.mimeType,
        file_size: img.data.length,
        width: 1024, height: 768
      });

    if (!dbError) {
      console.log(`✅ Saved ${fileName}`);
      results.push({ name: fileName, url: publicUrl });
    }
  }

  console.log('\n✨ DONE! Extracted', results.length, 'new images.');
}

run();
