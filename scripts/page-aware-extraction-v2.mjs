(async () => {
  const { createClient } = require('@supabase/supabase-js');
  const fs = require('fs');
  const path = require('path');
  
  // Load env vars
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

  try {
    const { getDocument, OPS } = await import('pdfjs-dist/build/pdf.mjs');
    
    const data = new Uint8Array(fs.readFileSync(PDF_PATH));
    const loadingTask = getDocument({ 
      data,
      useSystemFonts: true,
      disableFontFace: true,
      isEvalSupported: false
    });
    const pdf = await loadingTask.promise;
    
    console.log(`📄 PDF Loaded: ${pdf.numPages} pages`);

    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const ops = await page.getOperatorList();
      
      let imgIdx = 1;
      
      for (let i = 0; i < ops.fnArray.length; i++) {
        if (ops.fnArray[i] === OPS.paintImageXObject || ops.fnArray[i] === OPS.paintInlineImageXObject) {
          const name = ops.argsArray[i][0];
          let img;
          try {
            img = await page.objs.get(name);
          } catch (e) {
            console.warn(`Could not get image ${name} on page ${p}`);
            continue;
          }
          
          if (!img || !img.data) continue;

          // Convert to JPEG if possible, or just buffer
          const buffer = Buffer.from(img.data);
          if (buffer.length < 2000) continue; // Skip tiny icons

          const pxy = `p${p}i${imgIdx}`;
          const fileName = `${pxy} - User Manual CHI.jpg`;
          const storagePath = `${BU_ID}/${fileName}`;
          
          console.log(`📸 Extracting ${pxy} (${Math.round(buffer.length/1024)}KB)`);

          // Upload to storage
          const { error: uploadError } = await supabase.storage
            .from('media-library')
            .upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: true });

          if (uploadError) {
            console.error('Upload error:', uploadError);
            continue;
          }

          const publicUrl = `${supabaseUrl}/storage/v1/object/public/media-library/${storagePath}`;

          // DB Entry
          await supabase.from('image_library').upsert({
            business_unit_id: BU_ID,
            name: fileName,
            url: publicUrl,
            description: `Manual Page ${p}, Image ${imgIdx}`,
            source_url: 'User Manual_CHI_revised.pdf',
            mime_type: 'image/jpeg',
            file_size: buffer.length,
            width: img.width || 1024,
            height: img.height || 768
          }, { onConflict: 'url' });

          console.log(`✅ Saved: ${fileName}`);
          imgIdx++;
        }
      }
    }
    console.log('✨ ALL DONE!');
  } catch (err) {
    console.error('CRITICAL ERROR:', err);
  }
})();
