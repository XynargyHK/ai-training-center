// Check categories table structure
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const BUSINESS_UNIT_ID = '77313e61-2a19-4f3e-823b-80390dde8bd2'

async function checkCategories() {
  console.log('\n=== CATEGORIES TABLE ===\n')

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('business_unit_id', BUSINESS_UNIT_ID)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log(`Total categories: ${data.length}\n`)

  // Group by type
  const faqCategories = data.filter(c => c.type === 'faq')
  const cannedCategories = data.filter(c => c.type === 'canned_message')
  const noType = data.filter(c => !c.type)

  console.log('FAQ Categories:', faqCategories.length)
  faqCategories.forEach(c => {
    console.log(`  - ${c.name} (type: ${c.type || 'NULL'})`)
  })

  console.log('\nCanned Message Categories:', cannedCategories.length)
  cannedCategories.forEach(c => {
    console.log(`  - ${c.name} (type: ${c.type || 'NULL'})`)
  })

  console.log('\nCategories with NO TYPE:', noType.length)
  noType.forEach(c => {
    console.log(`  - ${c.name} (type: ${c.type || 'NULL'})`)
  })

  // Check FAQs - what categories do they use?
  console.log('\n=== FAQ CATEGORY USAGE ===\n')
  const { data: faqs } = await supabase
    .from('faq_library')
    .select('id, question, category_id, categories(name)')
    .eq('business_unit_id', BUSINESS_UNIT_ID)
    .limit(5)

  faqs.forEach(faq => {
    console.log(`FAQ: ${faq.question.substring(0, 50)}...`)
    console.log(`  Category: ${faq.categories?.name || 'NULL'}`)
  })

  // Check canned messages - what categories do they use?
  console.log('\n=== CANNED MESSAGE CATEGORY USAGE ===\n')
  const { data: canned } = await supabase
    .from('canned_messages')
    .select('id, title, category_id, categories(name)')
    .eq('business_unit_id', BUSINESS_UNIT_ID)
    .limit(5)

  canned.forEach(msg => {
    console.log(`Canned: ${msg.title}`)
    console.log(`  Category: ${msg.categories?.name || 'NULL'}`)
  })
}

checkCategories().catch(console.error)
