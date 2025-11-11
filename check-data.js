// Check what data exists in database
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const BUSINESS_UNIT_ID = '77313e61-2a19-4f3e-823b-80390dde8bd2' // skincoach

async function checkData() {
  console.log('\n=== Checking Database Tables ===\n')

  // Check FAQs - NO FILTERS
  console.log('1. Checking faq_library table...')
  const { data: allFAQs, error: faqError } = await supabase
    .from('faq_library')
    .select('id, question, business_unit_id')
    .limit(5)

  if (faqError) {
    console.error('❌ Error:', faqError.message)
  } else {
    console.log(`   Total FAQs in table: ${allFAQs.length}`)
    if (allFAQs.length > 0) {
      console.log('   Sample:', allFAQs[0])
    }
  }

  // Check by business unit
  const { data: businessFAQs } = await supabase
    .from('faq_library')
    .select('id')
    .eq('business_unit_id', BUSINESS_UNIT_ID)

  console.log(`   FAQs for business_unit ${BUSINESS_UNIT_ID}: ${businessFAQs?.length || 0}`)

  // Check canned messages
  console.log('\n2. Checking canned_messages table...')
  const { data: allCanned, error: cannedError } = await supabase
    .from('canned_messages')
    .select('id, title, business_unit_id')
    .limit(5)

  if (cannedError) {
    console.error('❌ Error:', cannedError.message)
  } else {
    console.log(`   Total canned messages in table: ${allCanned.length}`)
    if (allCanned.length > 0) {
      console.log('   Sample:', allCanned[0])
    }
  }

  const { data: businessCanned } = await supabase
    .from('canned_messages')
    .select('id')
    .eq('business_unit_id', BUSINESS_UNIT_ID)

  console.log(`   Canned messages for business_unit ${BUSINESS_UNIT_ID}: ${businessCanned?.length || 0}`)

  // Check knowledge base
  console.log('\n3. Checking knowledge_base table...')
  const { data: allKnowledge, error: knowledgeError } = await supabase
    .from('knowledge_base')
    .select('id, topic, business_unit_id')
    .limit(5)

  if (knowledgeError) {
    console.error('❌ Error:', knowledgeError.message)
  } else {
    console.log(`   Total knowledge entries in table: ${allKnowledge.length}`)
    if (allKnowledge.length > 0) {
      console.log('   Sample:', allKnowledge[0])
    }
  }

  const { data: businessKnowledge } = await supabase
    .from('knowledge_base')
    .select('id')
    .eq('business_unit_id', BUSINESS_UNIT_ID)

  console.log(`   Knowledge entries for business_unit ${BUSINESS_UNIT_ID}: ${businessKnowledge?.length || 0}`)

  console.log('\n=== Check Complete ===\n')
}

checkData().catch(console.error)
