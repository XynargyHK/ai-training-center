const fs = require('fs');

async function inspect() {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const data = new Uint8Array(fs.readFileSync('knowledgebase/User Manual_CHI_revised.pdf'));
  const loadingTask = pdfjs.getDocument({ data });
  const pdf = await loadingTask.promise;
  
  console.log('--- INSPECTING PAGE 1 ---');
  const page = await pdf.getPage(1);
  const ops = await page.getOperatorList();
  
  for (let i = 0; i < ops.fnArray.length; i++) {
    const fn = ops.fnArray[i];
    // List of all operators
    // console.log(`Op ${i}: ${fn}`);
    if (fn === pdfjs.OPS.paintImageXObject || fn === pdfjs.OPS.paintInlineImageXObject) {
      console.log(`FOUND IMAGE OBJECT AT OP ${i}`);
    }
  }
}

inspect().catch(console.error);
