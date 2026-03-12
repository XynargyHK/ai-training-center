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
const PDF_PATH = 'knowledgebase/User Manual_CHI_revised.pdf';

function extractAllJpegs(buffer) {
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
  console.log('🚀 Hybrid Extraction: Page-Aware + Small Size...');
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const buffer = fs.readFileSync(PDF_PATH);
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;

  // 1. Get all brute-force small JPEGs
  const smallJpegs = extractAllJpegs(buffer);
  console.log(`📸 Extracted ${smallJpegs.length} small JPEGs from PDF stream`);

  // 2. Clear library
  await supabase.from('image_library').delete().eq('business_unit_id', BU_ID);

  // 3. Map pages to images
  let jpegIdx = 0;
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const ops = await page.getOperatorList();
    
    let imgIdx = 1;
    for (let i = 0; i < ops.fnArray.length; i++) {
      const fn = ops.fnArray[i];
      if (fn === pdfjs.OPS.paintImageXObject || fn === pdfjs.OPS.paintInlineImageXObject) {
        const name = ops.argsArray[i][0];
        let img;
        try {
          img = await new Promise((resolve, reject) => {
            page.objs.get(name, (obj) => { resolve(obj); });
          });
        } catch (e) { continue; }

        if (!img || !img.data || img.data.length < 2000) continue;

        // Since we know the extraction order usually matches the PDF stream order,
        // we'll assign the next small JPEG to this pXiY slot.
        if (jpegIdx < smallJpegs.length) {
          const smallData = smallJpegs[jpegIdx];
          const pxy = `p${p}i${imgIdx}`;
          const fileName = `${pxy} - User Manual CHI.jpg`;
          const storagePath = `${BU_ID}/${fileName}`;

          console.log(`✅ Mapping ${pxy} to Small JPEG #${jpegIdx+1} (${Math.round(smallData.length/1024)}KB)`);

          await supabase.storage.from('media-library').upload(storagePath, smallData, { contentType: 'image/jpeg', upsert: true });
          const publicUrl = `${supabaseUrl}/storage/v1/object/public/media-library/${storagePath}`;

          await supabase.from('image_library').insert({
            business_unit_id: BU_ID,
            name: fileName,
            url: publicUrl,
            description: `B2B Manual Page ${p}, Image ${imgIdx}`,
            source_url: 'User Manual_CHI_revised.pdf',
            file_size: smallData.length,
            width: img.width || 1024,
            height: img.height || 768
          });

          imgIdx++;
          jpegIdx++;
        }
      }
    }
  }
  console.log('✨ DONE! Library is now small AND correctly named.');
}

run();
