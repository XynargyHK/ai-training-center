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

function bruteForceExtract(buffer) {
  const images = [];
  let i = 0;
  while (i < buffer.length - 10) {
    // JPEG
    if (buffer[i] === 0xFF && buffer[i+1] === 0xD8 && buffer[i+2] === 0xFF) {
      let end = i + 2;
      while (end < buffer.length - 1) {
        if (buffer[end] === 0xFF && buffer[end+1] === 0xD9) { end += 2; break; }
        end++;
      }
      const data = buffer.slice(i, end);
      if (data.length > 5000) images.push({ data, type: 'image/jpeg' });
      i = end;
    } 
    // PNG
    else if (buffer[i] === 0x89 && buffer[i+1] === 0x50 && buffer[i+2] === 0x4E && buffer[i+3] === 0x47) {
      let end = i + 8;
      while (end < buffer.length - 8) {
        if (buffer[end] === 0x49 && buffer[end+1] === 0x45 && buffer[end+2] === 0x4E && buffer[end+3] === 0x44) { end += 8; break; }
        end++;
      }
      const data = buffer.slice(i, end);
      if (data.length > 5000) images.push({ data, type: 'image/png' });
      i = end;
    }
    else { i++; }
  }
  return images;
}

async function run() {
  console.log('🚀 BRUTE FORCE EXTRACTION...');
  const buffer = fs.readFileSync(PDF_PATH);
  const raw = bruteForceExtract(buffer);
  
  // Deduplicate
  const unique = [];
  const seen = new Set();
  for (const img of raw) {
    const finger = img.data.length + img.data.slice(0, 50).toString('hex');
    if (!seen.has(finger)) { seen.add(finger); unique.push(img); }
  }

  console.log(`📸 Found ${unique.length} unique images. AI naming in progress...`);
  
  // Clear library
  await supabase.from('image_library').delete().eq('business_unit_id', BU_ID);

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  for (let i = 0; i < unique.length; i++) {
    const img = unique[i];
    console.log(`⚙️  Analyzing Image ${i+1}...`);
    
    try {
      const result = await model.generateContent([
        { inlineData: { mimeType: img.type, data: img.data.toString('base64') } },
        'Look at this image from the BrezCode B2B User Manual (CHI). Identify the Page Number and Image Index (e.g. p1i1). Return ONLY the code.'
      ]);

      const code = result.response.text().trim().toLowerCase().match(/p\d+i\d+/) || [`px-i${i}`];
      const fileName = `${code[0]} - User Manual CHI.jpg`;
      const storagePath = `${BU_ID}/${fileName}`;

      console.log(`🏷️  Identified as: ${fileName}`);

      await supabase.storage.from('media-library').upload(storagePath, img.data, { contentType: img.type, upsert: true });
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/media-library/${storagePath}`;

      await supabase.from('image_library').insert({
        business_unit_id: BU_ID,
        name: fileName,
        url: publicUrl,
        description: `B2B Manual - ${code[0]}`,
        source_url: 'User Manual_CHI_revised.pdf',
        file_size: img.data.length
      });
    } catch (e) { console.error(e); }
  }
  console.log('✨ DONE!');
}

run();
