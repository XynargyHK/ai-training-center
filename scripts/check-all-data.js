const http = require('http')

async function checkData(endpoint, name) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:3001${endpoint}`, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          console.log(`${name}: ${json.data?.length || 0} items`)
        } catch (e) {
          console.log(`${name}: ERROR - ${e.message}`)
        }
        resolve()
      })
    })
    req.on('error', () => {
      console.log(`${name}: ERROR - connection failed`)
      resolve()
    })
  })
}

async function main() {
  console.log('\n=== DATABASE CHECK ===\n')
  await checkData('/api/knowledge?action=load_business_units', 'Business Units')
  await checkData('/api/knowledge?action=load_faqs', 'FAQs (all)')
  await checkData('/api/knowledge?action=load_faqs&businessUnitId=breast-guardian', 'FAQs (Breast Guardian)')
  await checkData('/api/knowledge?action=load_faqs&businessUnitId=skincoach', 'FAQs (SkinCoach)')
  await checkData('/api/knowledge?action=load_knowledge', 'Knowledge Base (all)')
  await checkData('/api/knowledge?action=load_knowledge&businessUnitId=breast-guardian', 'Knowledge Base (Breast Guardian)')
}

main()
