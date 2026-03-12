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
  console.log('🚀 Final Attempt: Page-Aware Extraction...');
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const data = new Uint8Array(fs.readFileSync(PDF_PATH));
  const pdf = await pdfjs.getDocument({ data }).promise;

  // Clear library for BrezCode
  console.log('🧹 Cleaning old records...');
  await supabase.from('image_library').delete().eq('business_unit_id', BU_ID);

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const ops = await page.getOperatorList();
    let imgIdx = 1;

    for (let i = 0; i < ops.fnArray.length; i++) {
      const fn = ops.fnArray[i];
      if (fn === pdfjs.OPS.paintImageXObject || fn === pdfjs.OPS.paintInlineImageXObject || fn === pdfjs.OPS.paintImageMaskXObject) {
        const name = ops.argsArray[i][0];
        let img;
        try {
          img = await page.objs.get(name) || await page.commonObjs.get(name);
        } catch (e) { continue; }

        if (!img) continue;

        let buffer;
        if (img.data) {
          // If it's a Uint8Array, it might be raw or JPEG
          buffer = Buffer.from(img.data);
        } else if (img.bitmap) {
          // Some versions return a bitmap
          continue; // Cannot easily convert to buffer without canvas
        }

        if (!buffer || buffer.length < 1000) continue;

        const pxy = `p${p}i${imgIdx}`;
        const fileName = `${pxy} - User Manual CHI.jpg`;
        const storagePath = `${BU_ID}/${fileName}`;

        console.log(`📸 Saving ${pxy}...`);

        const { error: uploadError } = await supabase.storage
          .from('media-library')
          .upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: true });

        if (uploadError) continue;

        const publicUrl = `${supabaseUrl}/storage/v1/object/public/media-library/${storagePath}`;

        await supabase.from('image_library').insert({
          business_unit_id: BU_ID,
          name: fileName,
          url: publicUrl,
          description: `Manual Page ${p}, Image ${imgIdx}`,
          source_url: 'User Manual_CHI_revised.pdf',
          file_size: buffer.length,
          mime_type: 'image/jpeg',
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
