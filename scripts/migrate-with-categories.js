const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const BUSINESS_UNIT_ID = '77313e61-2a19-4f3e-823b-80390dde8bd2'
const DATA_DIR = 'C:\\Users\\Denny\\ai-training-center\\data\\business-units\\skincoach'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function migrateWithCategories() {
  try {
    console.log('🚀 Migrating data with proper category linking...\n')

    const results = {
      faqCategories: { migrated: 0, skipped: 0, errors: [] },
      cannedCategories: { migrated: 0, skipped: 0, errors: [] },
      faqs: { migrated: 0, updated: 0, skipped: 0, errors: [] },
      cannedMessages: { migrated: 0, updated: 0, skipped: 0, errors: [] }
    }

    // Category ID mappings
    const faqCategoryMap = {}
    const cannedCategoryMap = {}

    // 1. Create FAQ Categories
    console.log('📁 Creating FAQ Categories...')
    const faqCategoriesPath = `${DATA_DIR}\\faq_categories.json`
    if (fs.existsSync(faqCategoriesPath)) {
      const faqCategories = JSON.parse(fs.readFileSync(faqCategoriesPath, 'utf-8'))
      console.log(`   Found ${faqCategories.length} FAQ categories\n`)

      for (const categoryName of faqCategories) {
        try {
          const { data: existing } = await supabase
            .from('categories')
            .select('id, name')
            .eq('business_unit_id', BUSINESS_UNIT_ID)
            .eq('name', categoryName)
            .single()

          if (existing) {
            console.log(`   ⏭️  Skipped: ${categoryName}`)
            faqCategoryMap[categoryName] = existing.id
            results.faqCategories.skipped++
            continue
          }

          const { data: newCategory } = await supabase
            .from('categories')
            .insert({
              business_unit_id: BUSINESS_UNIT_ID,
              name: categoryName,
              description: `FAQ category for ${categoryName}`,
              icon: getCategoryIcon(categoryName),
              color: getCategoryColor(categoryName),
              sort_order: faqCategories.indexOf(categoryName)
            })
            .select()
            .single()

          faqCategoryMap[categoryName] = newCategory.id
          console.log(`   ✅ Created: ${categoryName}`)
          results.faqCategories.migrated++
        } catch (err) {
          console.error(`   ❌ Error: ${err.message}`)
          results.faqCategories.errors.push(err.message)
        }
      }
    }

    // 2. Create Canned Message Categories
    console.log('\n📁 Creating Canned Message Categories...')
    const cannedCategoriesPath = `${DATA_DIR}\\canned_categories.json`
    if (fs.existsSync(cannedCategoriesPath)) {
      const cannedCategories = JSON.parse(fs.readFileSync(cannedCategoriesPath, 'utf-8'))
      console.log(`   Found ${cannedCategories.length} canned message categories\n`)

      for (const categoryName of cannedCategories) {
        try {
          const { data: existing } = await supabase
            .from('categories')
            .select('id, name')
            .eq('business_unit_id', BUSINESS_UNIT_ID)
            .eq('name', categoryName)
            .single()

          if (existing) {
            console.log(`   ⏭️  Skipped: ${categoryName}`)
            cannedCategoryMap[categoryName] = existing.id
            results.cannedCategories.skipped++
            continue
          }

          const { data: newCategory } = await supabase
            .from('categories')
            .insert({
              business_unit_id: BUSINESS_UNIT_ID,
              name: categoryName,
              description: `Canned message category for ${categoryName}`,
              icon: getCategoryIcon(categoryName),
              color: getCategoryColor(categoryName),
              sort_order: cannedCategories.indexOf(categoryName)
            })
            .select()
            .single()

          cannedCategoryMap[categoryName] = newCategory.id
          console.log(`   ✅ Created: ${categoryName}`)
          results.cannedCategories.migrated++
        } catch (err) {
          console.error(`   ❌ Error: ${err.message}`)
          results.cannedCategories.errors.push(err.message)
        }
      }
    }

    // 3. Update FAQs with category_id
    console.log('\n❓ Updating FAQs with category links...')
    const faqsPath = `${DATA_DIR}\\faqs.json`
    if (fs.existsSync(faqsPath)) {
      const faqs = JSON.parse(fs.readFileSync(faqsPath, 'utf-8'))
      console.log(`   Found ${faqs.length} FAQs\n`)

      for (const faq of faqs) {
        try {
          // Check if FAQ already exists
          const { data: existing } = await supabase
            .from('faq_library')
            .select('id')
            .eq('business_unit_id', BUSINESS_UNIT_ID)
            .eq('question', faq.question)
            .single()

          const categoryId = faqCategoryMap[faq.category] || null

          if (existing) {
            // Update existing FAQ with category_id
            await supabase
              .from('faq_library')
              .update({ category_id: categoryId })
              .eq('id', existing.id)

            console.log(`   🔄 Updated: ${faq.question?.substring(0, 50)}... (category: ${faq.category})`)
            results.faqs.updated++
          } else {
            // Insert new FAQ with category_id
            await supabase.from('faq_library').insert({
              business_unit_id: BUSINESS_UNIT_ID,
              category_id: categoryId,
              question: faq.question,
              answer: faq.answer,
              short_answer: faq.shortAnswer,
              keywords: faq.keywords || [],
              is_published: faq.is_active !== false
            })

            console.log(`   ✅ Migrated: ${faq.question?.substring(0, 50)}... (category: ${faq.category})`)
            results.faqs.migrated++
          }
        } catch (err) {
          console.error(`   ❌ Error: ${err.message}`)
          results.faqs.errors.push(err.message)
        }
      }
    }

    // 4. Update Canned Messages with category_id
    console.log('\n💬 Updating Canned Messages with category links...')
    const cannedPath = `${DATA_DIR}\\canned_messages.json`
    if (fs.existsSync(cannedPath)) {
      const canned = JSON.parse(fs.readFileSync(cannedPath, 'utf-8'))
      console.log(`   Found ${canned.length} canned messages\n`)

      for (const msg of canned) {
        try {
          // Check if canned message already exists
          const title = msg.title || msg.scenario
          const message = msg.message || msg.template

          const { data: existing } = await supabase
            .from('canned_messages')
            .select('id')
            .eq('business_unit_id', BUSINESS_UNIT_ID)
            .eq('title', title)
            .single()

          const categoryId = cannedCategoryMap[msg.category] || null

          if (existing) {
            // Update existing message with category_id
            await supabase
              .from('canned_messages')
              .update({ category_id: categoryId })
              .eq('id', existing.id)

            console.log(`   🔄 Updated: ${title} (category: ${msg.category})`)
            results.cannedMessages.updated++
          } else {
            // Insert new message with category_id
            await supabase.from('canned_messages').insert({
              business_unit_id: BUSINESS_UNIT_ID,
              category_id: categoryId,
              title: title,
              shortcut: msg.shortcut,
              message: message,
              variables: msg.variables || [],
              tags: msg.tags || [],
              use_case: msg.useCase,
              is_active: true
            })

            console.log(`   ✅ Migrated: ${title} (category: ${msg.category})`)
            results.cannedMessages.migrated++
          }
        } catch (err) {
          console.error(`   ❌ Error: ${err.message}`)
          results.cannedMessages.errors.push(err.message)
        }
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 MIGRATION SUMMARY')
    console.log('='.repeat(60))
    console.log(`\n📁 FAQ Categories:`)
    console.log(`   Migrated: ${results.faqCategories.migrated}`)
    console.log(`   Skipped: ${results.faqCategories.skipped}`)
    console.log(`   Errors: ${results.faqCategories.errors.length}`)

    console.log(`\n📁 Canned Message Categories:`)
    console.log(`   Migrated: ${results.cannedCategories.migrated}`)
    console.log(`   Skipped: ${results.cannedCategories.skipped}`)
    console.log(`   Errors: ${results.cannedCategories.errors.length}`)

    console.log(`\n❓ FAQs:`)
    console.log(`   Migrated: ${results.faqs.migrated}`)
    console.log(`   Updated: ${results.faqs.updated}`)
    console.log(`   Skipped: ${results.faqs.skipped}`)
    console.log(`   Errors: ${results.faqs.errors.length}`)

    console.log(`\n💬 Canned Messages:`)
    console.log(`   Migrated: ${results.cannedMessages.migrated}`)
    console.log(`   Updated: ${results.cannedMessages.updated}`)
    console.log(`   Skipped: ${results.cannedMessages.skipped}`)
    console.log(`   Errors: ${results.cannedMessages.errors.length}`)

    console.log('\n🎉 MIGRATION COMPLETE!')

  } catch (error) {
    console.error('💥 Migration error:', error.message)
    console.error(error)
  }
}

// Helper functions
function getCategoryIcon(categoryName) {
  const icons = {
    'pricing': '💰',
    'products': '🛍️',
    'shipping': '📦',
    'returns': '↩️',
    'product results': '✨',
    'ingredients': '🧪',
    'beauty tips': '💄',
    'product recommendations': '⭐',
    'skincare advice': '🌟',
    'general responses': '💬'
  }
  return icons[categoryName.toLowerCase()] || '📁'
}

function getCategoryColor(categoryName) {
  const colors = {
    'pricing': '#4CAF50',
    'products': '#2196F3',
    'shipping': '#FF9800',
    'returns': '#F44336',
    'product results': '#9C27B0',
    'ingredients': '#00BCD4',
    'beauty tips': '#E91E63',
    'product recommendations': '#FFC107',
    'skincare advice': '#8BC34A',
    'general responses': '#607D8B'
  }
  return colors[categoryName.toLowerCase()] || '#9E9E9E'
}

migrateWithCategories()
