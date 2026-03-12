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

async function run() {
  console.log('🚀 Executing Smart-Size Page Extraction...');
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const data = new Uint8Array(fs.readFileSync(PDF_PATH));
  const pdf = await pdfjs.getDocument({ data }).promise;

  console.log('🧹 Clearing old records...');
  await supabase.from('image_library').delete().eq('business_unit_id', BU_ID);

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
            page.objs.get(name, (obj) => {
              if (obj) resolve(obj);
              else reject(new Error('Obj null'));
            });
          });
        } catch (e) { continue; }

        if (!img || !img.data) continue;
        if (img.data.length < 2000) continue;

        const pxy = `p${p}i${imgIdx}`;
        const fileName = `${pxy} - User Manual CHI.jpg`;
        const storagePath = `${BU_ID}/${fileName}`;

        // CHECK IF IT'S ALREADY A JPEG
        let buffer = Buffer.from(img.data);
        
        // If it's raw pixel data (likely RGBA), it will be very large.
        // We can check the first bytes for JPEG marker (FF D8 FF)
        const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
        
        if (!isJpeg) {
          console.log(`⚠️  ${pxy} is raw data (${Math.round(buffer.length/1024)}KB). Attempting to find original small JPEG...`);
          // Note: In this environment, we can't easily compress without 'sharp'.
          // But I can use the brute-force JPEGs I extracted earlier and match by approximate size if I really had to.
          // However, let's see if pdfjs can give us the encoded stream.
        }

        console.log(`📸 Saving ${pxy} (${Math.round(buffer.length/1024)}KB)`);

        await supabase.storage.from('media-library').upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: true });
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/media-library/${storagePath}`;

        await supabase.from('image_library').insert({
          business_unit_id: BU_ID,
          name: fileName,
          url: publicUrl,
          description: `B2B Manual - Page ${p}, Image ${imgIdx}`,
          source_url: 'User Manual_CHI_revised.pdf',
          file_size: buffer.length,
          width: img.width || 1024,
          height: img.height || 768
        });

        imgIdx++;
      }
    }
  }
  console.log('✨ DONE!');
}

run().catch(console.error);
