// Show ALL data in tables (no filters)
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function showAllData() {
  console.log('\n=== ALL DATA IN TABLES (NO FILTERS) ===\n')

  // Check FAQs - NO FILTERS
  console.log('📋 FAQ LIBRARY TABLE:')
  const { data: allFAQs, error: faqError } = await supabase
    .from('faq_library')
    .select('id, question, business_unit_id')
    .limit(5)

  if (faqError) {
    console.error('❌ Error:', faqError.message)
  } else {
    console.log(`   Total FAQs: ${allFAQs.length}`)
    allFAQs.forEach((faq, i) => {
      console.log(`   ${i+1}. Question: ${faq.question.substring(0, 60)}...`)
      console.log(`      business_unit_id: ${faq.business_unit_id}`)
    })
  }

  // Check canned messages - NO FILTERS
  console.log('\n📋 CANNED MESSAGES TABLE:')
  const { data: allCanned, error: cannedError } = await supabase
    .from('canned_messages')
    .select('id, title, business_unit_id')
    .limit(5)

  if (cannedError) {
    console.error('❌ Error:', cannedError.message)
  } else {
    console.log(`   Total: ${allCanned.length}`)
    allCanned.forEach((msg, i) => {
      console.log(`   ${i+1}. Title: ${msg.title}`)
      console.log(`      business_unit_id: ${msg.business_unit_id}`)
    })
  }

  // Check knowledge base - NO FILTERS
  console.log('\n📋 KNOWLEDGE BASE TABLE:')
  const { data: allKnowledge, error: knowledgeError } = await supabase
    .from('knowledge_base')
    .select('id, topic, business_unit_id')
    .limit(5)

  if (knowledgeError) {
    console.error('❌ Error:', knowledgeError.message)
  } else {
    console.log(`   Total: ${allKnowledge.length}`)
    allKnowledge.forEach((kb, i) => {
      console.log(`   ${i+1}. Topic: ${kb.topic}`)
      console.log(`      business_unit_id: ${kb.business_unit_id}`)
    })
  }

  // Get count of ALL records
  console.log('\n📊 TOTAL COUNTS:')

  const { count: faqCount } = await supabase
    .from('faq_library')
    .select('*', { count: 'exact', head: true })
  console.log(`   Total FAQs in database: ${faqCount}`)

  const { count: cannedCount } = await supabase
    .from('canned_messages')
    .select('*', { count: 'exact', head: true })
  console.log(`   Total Canned Messages: ${cannedCount}`)

  const { count: knowledgeCount } = await supabase
    .from('knowledge_base')
    .select('*', { count: 'exact', head: true })
  console.log(`   Total Knowledge Entries: ${knowledgeCount}`)

  console.log('\n=== END ===\n')
}

showAllData().catch(console.error)
