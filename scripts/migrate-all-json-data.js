const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const BUSINESS_UNIT_ID = '77313e61-2a19-4f3e-823b-80390dde8bd2'
const DATA_DIR = 'C:\\Users\\Denny\\ai-training-center\\data\\business-units\\skincoach'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function migrateAllData() {
  try {
    console.log('🚀 Migrating ALL JSON data to Supabase...\n')

    const results = {
      knowledge: { migrated: 0, skipped: 0, errors: [] },
      faqs: { migrated: 0, skipped: 0, errors: [] },
      cannedMessages: { migrated: 0, skipped: 0, errors: [] },
      categories: { migrated: 0, skipped: 0, errors: [] }
    }

    // 1. Migrate Knowledge Base
    console.log('📚 Migrating Knowledge Base...')
    const knowledgePath = `${DATA_DIR}\\knowledge.json`
    if (fs.existsSync(knowledgePath)) {
      const knowledge = JSON.parse(fs.readFileSync(knowledgePath, 'utf-8'))
      console.log(`   Found ${knowledge.length} entries\n`)

      for (const entry of knowledge) {
        try {
          const { data: existing } = await supabase
            .from('knowledge_base')
            .select('id')
            .eq('business_unit_id', BUSINESS_UNIT_ID)
            .eq('title', entry.topic || entry.title)
            .single()

          if (existing) {
            console.log(`   ⏭️  Skipped: ${entry.topic || entry.title}`)
            results.knowledge.skipped++
            continue
          }

          await supabase.from('knowledge_base').insert({
            business_unit_id: BUSINESS_UNIT_ID,
            category: entry.category || 'General',
            topic: entry.topic,
            title: entry.topic || entry.title,
            content: entry.content || '',
            keywords: entry.keywords || [],
            raw_data: entry,
            source_type: 'json_file',
            confidence: entry.confidence || 1.0,
            is_active: true
          })

          console.log(`   ✅ Migrated: ${entry.topic || entry.title}`)
          results.knowledge.migrated++
        } catch (err) {
          console.error(`   ❌ Error: ${err.message}`)
          results.knowledge.errors.push(err.message)
        }
      }
    }

    // 2. Migrate FAQs
    console.log('\n❓ Migrating FAQs...')
    const faqsPath = `${DATA_DIR}\\faqs.json`
    if (fs.existsSync(faqsPath)) {
      const faqs = JSON.parse(fs.readFileSync(faqsPath, 'utf-8'))
      console.log(`   Found ${faqs.length} FAQs\n`)

      for (const faq of faqs) {
        try {
          const { data: existing } = await supabase
            .from('faq_library')
            .select('id')
            .eq('business_unit_id', BUSINESS_UNIT_ID)
            .eq('question', faq.question)
            .single()

          if (existing) {
            console.log(`   ⏭️  Skipped: ${faq.question?.substring(0, 50)}...`)
            results.faqs.skipped++
            continue
          }

          await supabase.from('faq_library').insert({
            business_unit_id: BUSINESS_UNIT_ID,
            category_id: null,
            question: faq.question,
            answer: faq.answer,
            short_answer: faq.shortAnswer,
            keywords: faq.keywords || [],
            is_published: true
          })

          console.log(`   ✅ Migrated: ${faq.question?.substring(0, 50)}...`)
          results.faqs.migrated++
        } catch (err) {
          console.error(`   ❌ Error: ${err.message}`)
          results.faqs.errors.push(err.message)
        }
      }
    }

    // 3. Migrate Canned Messages
    console.log('\n💬 Migrating Canned Messages...')
    const cannedPath = `${DATA_DIR}\\canned_messages.json`
    if (fs.existsSync(cannedPath)) {
      const canned = JSON.parse(fs.readFileSync(cannedPath, 'utf-8'))
      console.log(`   Found ${canned.length} canned messages\n`)

      for (const msg of canned) {
        try {
          const { data: existing } = await supabase
            .from('canned_messages')
            .select('id')
            .eq('business_unit_id', BUSINESS_UNIT_ID)
            .eq('title', msg.title)
            .single()

          if (existing) {
            console.log(`   ⏭️  Skipped: ${msg.title}`)
            results.cannedMessages.skipped++
            continue
          }

          await supabase.from('canned_messages').insert({
            business_unit_id: BUSINESS_UNIT_ID,
            category_id: null,
            title: msg.title,
            shortcut: msg.shortcut,
            message: msg.message,
            variables: msg.variables || [],
            tags: msg.tags || [],
            use_case: msg.useCase,
            is_active: true
          })

          console.log(`   ✅ Migrated: ${msg.title}`)
          results.cannedMessages.migrated++
        } catch (err) {
          console.error(`   ❌ Error: ${err.message}`)
          results.cannedMessages.errors.push(err.message)
        }
      }
    }

    // 4. Migrate Categories (if any custom ones)
    console.log('\n📁 Migrating Categories...')
    const categoriesPath = `${DATA_DIR}\\canned_categories.json`
    if (fs.existsSync(categoriesPath)) {
      const categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf-8'))
      console.log(`   Found ${categories.length} categories\n`)

      for (const cat of categories) {
        try {
          const { data: existing } = await supabase
            .from('categories')
            .select('id')
            .eq('business_unit_id', BUSINESS_UNIT_ID)
            .eq('name', cat.name)
            .single()

          if (existing) {
            console.log(`   ⏭️  Skipped: ${cat.name}`)
            results.categories.skipped++
            continue
          }

          await supabase.from('categories').insert({
            business_unit_id: BUSINESS_UNIT_ID,
            name: cat.name,
            description: cat.description,
            icon: cat.icon,
            color: cat.color,
            sort_order: cat.sortOrder || 0
          })

          console.log(`   ✅ Migrated: ${cat.name}`)
          results.categories.migrated++
        } catch (err) {
          console.error(`   ❌ Error: ${err.message}`)
          results.categories.errors.push(err.message)
        }
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 MIGRATION SUMMARY')
    console.log('='.repeat(60))
    console.log(`\n📚 Knowledge Base:`)
    console.log(`   Migrated: ${results.knowledge.migrated}`)
    console.log(`   Skipped: ${results.knowledge.skipped}`)
    console.log(`   Errors: ${results.knowledge.errors.length}`)

    console.log(`\n❓ FAQs:`)
    console.log(`   Migrated: ${results.faqs.migrated}`)
    console.log(`   Skipped: ${results.faqs.skipped}`)
    console.log(`   Errors: ${results.faqs.errors.length}`)

    console.log(`\n💬 Canned Messages:`)
    console.log(`   Migrated: ${results.cannedMessages.migrated}`)
    console.log(`   Skipped: ${results.cannedMessages.skipped}`)
    console.log(`   Errors: ${results.cannedMessages.errors.length}`)

    console.log(`\n📁 Categories:`)
    console.log(`   Migrated: ${results.categories.migrated}`)
    console.log(`   Skipped: ${results.categories.skipped}`)
    console.log(`   Errors: ${results.categories.errors.length}`)

    console.log('\n🎉 MIGRATION COMPLETE!')

  } catch (error) {
    console.error('💥 Migration error:', error.message)
    console.error(error)
  }
}

migrateAllData()
