const fs = require('fs')
const https = require('http')

const req = https.get('http://localhost:3001/api/knowledge?action=load_faqs', (res) => {
  let data = ''
  res.on('data', chunk => data += chunk)
  res.on('end', () => {
    const json = JSON.parse(data)
    console.log(`Total FAQs: ${json.data.length}`)
    console.log('\nFirst 5 FAQs with business_unit_id:')
    json.data.slice(0, 5).forEach((f, i) => {
      console.log(`${i+1}. [BU: ${f.business_unit_id || 'NULL'}] [${f.category}] ${f.question.substring(0, 60)}...`)
    })

    const bgFaqs = json.data.filter(f => f.business_unit_id === '346db81c-0b36-4cb7-94f4-d126a3a54fa1')
    console.log(`\n\nBreast Guardian FAQs (UUID match): ${bgFaqs.length}`)

    const nullBU = json.data.filter(f => !f.business_unit_id)
    console.log(`FAQs with NULL business_unit_id: ${nullBU.length}`)
  })
})
