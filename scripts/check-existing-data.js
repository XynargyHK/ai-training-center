const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const BUSINESS_UNIT_ID = '77313e61-2a19-4f3e-823b-80390dde8bd2'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkExistingData() {
  try {
    console.log('🔍 Checking for existing data in SkinCoach business unit...\n')

    // Check knowledge_base
    const { data: knowledgeBase, count: kbCount } = await supabase
      .from('knowledge_base')
      .select('*', { count: 'exact' })
      .eq('business_unit_id', BUSINESS_UNIT_ID)
      .order('created_at', { ascending: false })
      .limit(50)

    console.log(`📚 Knowledge Base: ${kbCount} entries found\n`)

    if (knowledgeBase && knowledgeBase.length > 0) {
      console.log('Sample entries:')
      knowledgeBase.slice(0, 10).forEach((entry, i) => {
        console.log(`\n${i + 1}. ${entry.title || entry.topic || 'Untitled'}`)
        console.log(`   Category: ${entry.category}`)
        console.log(`   Content: ${entry.content?.substring(0, 100) || 'N/A'}...`)
        console.log(`   Keywords: ${entry.keywords?.join(', ') || 'N/A'}`)
        console.log(`   Source: ${entry.source_type || 'unknown'}`)
      })
    }

    // Check localStorage structure
    console.log('\n\n🗄️  Checking localStorage-style data...')
    const { data: rawData } = await supabase
      .from('knowledge_base')
      .select('raw_data, category, topic, title')
      .eq('business_unit_id', BUSINESS_UNIT_ID)
      .not('raw_data', 'is', null)
      .limit(10)

    if (rawData && rawData.length > 0) {
      console.log('\nFound entries with raw_data:')
      rawData.forEach((entry, i) => {
        console.log(`\n${i + 1}. ${entry.title || entry.topic}`)
        console.log(`   Raw data:`, JSON.stringify(entry.raw_data, null, 2))
      })
    }

    // Analyze categories
    console.log('\n\n📊 Data Analysis:')
    const categories = {}
    knowledgeBase?.forEach(entry => {
      const cat = entry.category || 'Uncategorized'
      categories[cat] = (categories[cat] || 0) + 1
    })

    console.log('\nCategories found:')
    Object.entries(categories).forEach(([cat, count]) => {
      console.log(`  - ${cat}: ${count} entries`)
    })

    // Check for file uploads
    console.log('\n\n📁 File Information:')
    const { data: files } = await supabase
      .from('knowledge_base')
      .select('file_name, source_type')
      .eq('business_unit_id', BUSINESS_UNIT_ID)
      .not('file_name', 'is', null)

    if (files && files.length > 0) {
      console.log(`Found ${files.length} file-based entries:`)
      const filesByType = {}
      files.forEach(f => {
        const type = f.source_type || 'unknown'
        filesByType[type] = (filesByType[type] || 0) + 1
      })
      Object.entries(filesByType).forEach(([type, count]) => {
        console.log(`  - ${type}: ${count} files`)
      })
    }

    console.log('\n\n💡 What we can migrate:')
    console.log('  - Knowledge base entries can be categorized into FAQs')
    console.log('  - Product information already in products table')
    console.log('  - File-based content available for organization')

  } catch (error) {
    console.error('💥 Error:', error.message)
  }
}

checkExistingData()
