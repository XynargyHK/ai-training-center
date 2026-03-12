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

function extractJpegs(buffer) {
  const jpegs = [];
  let i = 0;
  while (i < buffer.length - 10) {
    if (buffer[i] === 0xFF && buffer[i+1] === 0xD8 && buffer[i+2] === 0xFF) {
      let end = i + 2;
      while (end < buffer.length - 1) {
        if (buffer[end] === 0xFF && buffer[end+1] === 0xD9) { end += 2; break; }
        end++;
      }
      const data = buffer.slice(i, end);
      if (data.length > 5000) jpegs.push(data);
      i = end;
    } else { i++; }
  }
  return jpegs;
}

async function run() {
  console.log('🚀 Extracting Small Original JPEGs...');
  const buffer = fs.readFileSync(PDF_PATH);
  const raw = extractJpegs(buffer);
  
  // Deduplicate
  const unique = [];
  const seen = new Set();
  for (const data of raw) {
    const finger = data.length + '-' + data.slice(0, 50).toString('hex');
    if (!seen.has(finger)) { seen.add(finger); unique.push(data); }
  }

  console.log(`📸 Found ${unique.length} small images. AI identifying pages...`);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  for (let i = 0; i < unique.length; i++) {
    const data = unique[i];
    console.log(`⚙️  Analyzing Image ${i+1}/${unique.length}...`);
    
    try {
      const result = await model.generateContent([
        { inlineData: { mimeType: 'image/jpeg', data: data.toString('base64') } },
        'Identify the Page Number and Image Index from the BrezCode B2B User Manual (CHI). Return ONLY the code (e.g. p1i1). If multiple images on one page, count top-to-bottom.'
      ]);

      const code = result.response.text().trim().toLowerCase().match(/p\d+i\d+/) || [`px-i${i}`];
      const pxy = code[0];
      const fileName = `${pxy} - User Manual CHI.jpg`;
      const storagePath = `${BU_ID}/${fileName}`;

      console.log(`🏷️  Result: ${pxy} (${Math.round(data.length/1024)}KB)`);

      await supabase.storage.from('media-library').upload(storagePath, data, { contentType: 'image/jpeg', upsert: true });
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/media-library/${storagePath}`;

      await supabase.from('image_library').insert({
        business_unit_id: BU_ID,
        name: fileName,
        url: publicUrl,
        description: `B2B Manual - ${pxy}`,
        source_url: 'User Manual_CHI_revised.pdf',
        file_size: data.length,
        mime_type: 'image/jpeg'
      });
    } catch (e) { console.error(e); }
  }
  console.log('✨ ALL DONE! Library refreshed with small images.');
}

run();
