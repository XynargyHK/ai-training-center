const http = require('http')

const req = http.get('http://localhost:3001/api/knowledge?action=load_faqs', (res) => {
  let data = ''
  res.on('data', chunk => data += chunk)
  res.on('end', () => {
    const json = JSON.parse(data)

    const sorted = json.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    console.log(`\nMost recent 10 FAQs:`)
    sorted.slice(0, 10).forEach((f, i) => {
      console.log(`${i+1}. [${f.created_at}] [BU: ${f.business_unit_id || 'NULL'}] ${f.question.substring(0, 60)}...`)
    })

    console.log(`\n\nOldest 10 FAQs:`)
    sorted.slice(-10).forEach((f, i) => {
      console.log(`${i+1}. [${f.created_at}] [BU: ${f.business_unit_id || 'NULL'}] ${f.question.substring(0, 60)}...`)
    })
  })
})
