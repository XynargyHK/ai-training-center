const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkFAQs() {
  console.log('\n📊 Checking FAQs for Breast Guardian...\n')

  const breastGuardianId = '346db81c-0b36-4cb7-94f4-d126a3a54fa1'

  // Get all FAQs for breast-guardian
  const { data, error } = await supabase
    .from('faq_library')
    .select('*')
    .eq('business_unit_id', breastGuardianId)

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  console.log(`✅ Found ${data.length} FAQs for Breast Guardian`)
  console.log('\nFAQ List:')
  data.forEach((faq, index) => {
    console.log(`\n${index + 1}. [${faq.category}] ${faq.question}`)
    console.log(`   Answer: ${faq.answer.substring(0, 100)}...`)
  })

  // Get unique categories
  const categories = [...new Set(data.map(f => f.category))]
  console.log(`\n📁 Categories: ${categories.join(', ')}`)
}

checkFAQs()
