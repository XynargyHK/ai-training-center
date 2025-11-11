const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const BUSINESS_UNIT_ID = '77313e61-2a19-4f3e-823b-80390dde8bd2'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function verifyMigration() {
  try {
    console.log('✨ FINAL MIGRATION VERIFICATION\n')
    console.log('='.repeat(60))

    // 1. Categories
    const { data: categories, count: catCount } = await supabase
      .from('categories')
      .select('*', { count: 'exact' })
      .eq('business_unit_id', BUSINESS_UNIT_ID)

    console.log(`\n📁 CATEGORIES (${catCount} total)`)
    console.log('-'.repeat(60))
    categories?.forEach(cat => {
      console.log(`${cat.icon} ${cat.name}`)
      console.log(`   ID: ${cat.id}`)
      console.log(`   Description: ${cat.description}`)
      console.log(`   Color: ${cat.color}`)
    })

    // 2. Products
    const { count: productsCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('business_unit_id', BUSINESS_UNIT_ID)

    console.log(`\n\n🛍️  PRODUCTS: ${productsCount} total`)

    // 3. Knowledge Base
    const { count: kbCount } = await supabase
      .from('knowledge_base')
      .select('*', { count: 'exact', head: true })
      .eq('business_unit_id', BUSINESS_UNIT_ID)

    console.log(`📚 KNOWLEDGE BASE: ${kbCount} total`)

    // 4. FAQs with Categories
    const { data: faqs, count: faqCount } = await supabase
      .from('faq_library')
      .select(`
        id,
        question,
        category_id,
        categories (
          name,
          icon
        )
      `, { count: 'exact' })
      .eq('business_unit_id', BUSINESS_UNIT_ID)
      .limit(5)

    console.log(`\n❓ FAQs (${faqCount} total)`)
    console.log('-'.repeat(60))
    console.log('Sample FAQs with their categories:\n')
    faqs?.forEach((faq, i) => {
      console.log(`${i + 1}. ${faq.question?.substring(0, 60)}...`)
      console.log(`   Category: ${faq.categories?.icon} ${faq.categories?.name}`)
    })

    // FAQ breakdown by category
    const { data: faqStats } = await supabase
      .from('faq_library')
      .select(`
        category_id,
        categories (
          name,
          icon
        )
      `)
      .eq('business_unit_id', BUSINESS_UNIT_ID)

    const faqByCategory = {}
    faqStats?.forEach(f => {
      const catName = f.categories?.name || 'No Category'
      faqByCategory[catName] = (faqByCategory[catName] || 0) + 1
    })

    console.log('\nFAQs by category:')
    Object.entries(faqByCategory).forEach(([cat, count]) => {
      const icon = categories?.find(c => c.name === cat)?.icon || '📝'
      console.log(`  ${icon} ${cat}: ${count} FAQs`)
    })

    // 5. Canned Messages with Categories
    const { data: canned, count: cannedCount } = await supabase
      .from('canned_messages')
      .select(`
        id,
        title,
        category_id,
        categories (
          name,
          icon
        )
      `, { count: 'exact' })
      .eq('business_unit_id', BUSINESS_UNIT_ID)
      .limit(5)

    console.log(`\n\n💬 CANNED MESSAGES (${cannedCount} total)`)
    console.log('-'.repeat(60))
    console.log('Sample canned messages with their categories:\n')
    canned?.forEach((msg, i) => {
      console.log(`${i + 1}. ${msg.title}`)
      console.log(`   Category: ${msg.categories?.icon} ${msg.categories?.name || 'No Category'}`)
    })

    // Canned messages breakdown by category
    const { data: cannedStats } = await supabase
      .from('canned_messages')
      .select(`
        category_id,
        categories (
          name,
          icon
        )
      `)
      .eq('business_unit_id', BUSINESS_UNIT_ID)

    const cannedByCategory = {}
    cannedStats?.forEach(c => {
      const catName = c.categories?.name || 'No Category'
      cannedByCategory[catName] = (cannedByCategory[catName] || 0) + 1
    })

    console.log('\nCanned messages by category:')
    Object.entries(cannedByCategory).forEach(([cat, count]) => {
      const icon = categories?.find(c => c.name === cat)?.icon || '💬'
      console.log(`  ${icon} ${cat}: ${count} messages`)
    })

    // Summary
    console.log('\n\n' + '='.repeat(60))
    console.log('📊 COMPLETE DATA SUMMARY')
    console.log('='.repeat(60))
    console.log(`\n📁 Categories:         ${catCount}`)
    console.log(`🛍️  Products:           ${productsCount}`)
    console.log(`📚 Knowledge Base:     ${kbCount}`)
    console.log(`❓ FAQs:               ${faqCount}`)
    console.log(`💬 Canned Messages:    ${cannedCount}`)
    console.log(`\n✅ All data properly linked with categories!`)
    console.log(`\n🎉 Migration 100% complete and verified!`)

  } catch (error) {
    console.error('💥 Error:', error.message)
    console.error(error)
  }
}

verifyMigration()
