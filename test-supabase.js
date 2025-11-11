// Test Supabase Connection
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key:', supabaseAnonKey ? 'Present' : 'Missing')

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const BUSINESS_UNIT_ID = '77313e61-2a19-4f3e-823b-80390dde8bd2' // skincoach

async function testConnection() {
  console.log('\n=== Testing Supabase Connection ===\n')

  // Test FAQs
  console.log('1. Loading FAQs...')
  const { data: faqData, error: faqError } = await supabase
    .from('faq_library')
    .select(`
      *,
      categories (
        id,
        name,
        icon,
        color
      )
    `)
    .eq('business_unit_id', BUSINESS_UNIT_ID)
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (faqError) {
    console.error('❌ Error loading FAQs:', faqError)
  } else {
    console.log(`✅ Loaded ${faqData.length} FAQs`)
    if (faqData.length > 0) {
      console.log('First FAQ:', {
        id: faqData[0].id,
        question: faqData[0].question.substring(0, 50) + '...',
        category: faqData[0].categories?.name
      })
    }
  }

  // Test Canned Messages
  console.log('\n2. Loading Canned Messages...')
  const { data: cannedData, error: cannedError } = await supabase
    .from('canned_messages')
    .select(`
      *,
      categories (
        id,
        name,
        icon,
        color
      )
    `)
    .eq('business_unit_id', BUSINESS_UNIT_ID)
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (cannedError) {
    console.error('❌ Error loading canned messages:', cannedError)
  } else {
    console.log(`✅ Loaded ${cannedData.length} canned messages`)
    if (cannedData.length > 0) {
      console.log('First message:', {
        id: cannedData[0].id,
        title: cannedData[0].title,
        category: cannedData[0].categories?.name
      })
    }
  }

  // Test Knowledge Base
  console.log('\n3. Loading Knowledge Base...')
  const { data: knowledgeData, error: knowledgeError } = await supabase
    .from('knowledge_base')
    .select('*')
    .eq('business_unit_id', BUSINESS_UNIT_ID)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (knowledgeError) {
    console.error('❌ Error loading knowledge:', knowledgeError)
  } else {
    console.log(`✅ Loaded ${knowledgeData.length} knowledge entries`)
    if (knowledgeData.length > 0) {
      console.log('First entry:', {
        id: knowledgeData[0].id,
        topic: knowledgeData[0].topic,
        category: knowledgeData[0].category
      })
    }
  }

  // Test Categories
  console.log('\n4. Loading Categories...')
  const { data: categoriesData, error: categoriesError } = await supabase
    .from('categories')
    .select('*')
    .eq('business_unit_id', BUSINESS_UNIT_ID)
    .order('name', { ascending: true })

  if (categoriesError) {
    console.error('❌ Error loading categories:', categoriesError)
  } else {
    console.log(`✅ Loaded ${categoriesData.length} categories`)
    console.log('Categories:', categoriesData.map(c => c.name).join(', '))
  }

  console.log('\n=== Test Complete ===\n')
}

testConnection().catch(console.error)
