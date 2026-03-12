const fs = require('fs');

async function debug() {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const data = new Uint8Array(fs.readFileSync('knowledgebase/User Manual_CHI_revised.pdf'));
  const pdf = await pdfjs.getDocument({ data }).promise;
  const page = await pdf.getPage(1);
  const ops = await page.getOperatorList();
  
  console.log('Page 1 Ops length:', ops.fnArray.length);
  // Scan for image ops
  for (let i = 0; i < ops.fnArray.length; i++) {
    if (ops.fnArray[i] === pdfjs.OPS.paintImageXObject) {
      const name = ops.argsArray[i][0];
      console.log('Found paintImageXObject:', name);
      try {
        const obj = await page.objs.get(name);
        console.log('Object keys:', Object.keys(obj));
        console.log('Data length:', obj.data ? obj.data.length : 'N/A');
      } catch (e) {
        console.log('Error getting object:', name, e.message);
      }
    }
  }
}

debug();
