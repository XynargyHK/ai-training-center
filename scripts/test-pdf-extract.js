import { readFileSync } from 'fs'
import pdfParse from 'pdf-parse/lib/pdf-parse.js'

const pdfPath = 'knowledgebase/Code Chapter 1 to 14 20250606_1763550458248.pdf'
const pdfBuffer = readFileSync(pdfPath)

console.log(`PDF file size: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`)

try {
  const data = await pdfParse(pdfBuffer)

  console.log('\n=== PDF EXTRACTION RESULTS ===')
  console.log(`Total pages: ${data.numpages}`)
  console.log(`Total text length: ${data.text.length} characters`)
  console.log('\n=== FIRST 2000 CHARACTERS ===')
  console.log(data.text.substring(0, 2000))
  console.log('\n=== LAST 1000 CHARACTERS ===')
  console.log(data.text.substring(data.text.length - 1000))

} catch (error) {
  console.error('Error extracting PDF:', error.message)
}
