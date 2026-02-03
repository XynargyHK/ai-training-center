#!/usr/bin/env node

/**
 * Show all FAQs and their translation status
 * This helps you understand what content needs to be translated
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables!')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function showFAQs() {
  console.log('\n📋 Fetching all FAQs from database...\n')

  // Get all FAQs
  const { data: faqs, error } = await supabase
    .from('faq_library')
    .select('id, question, answer, short_answer, language')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('❌ Error loading FAQs:', error.message)
    return
  }

  if (!faqs || faqs.length === 0) {
    console.log('⚠️  No FAQs found in database')
    return
  }

  console.log(`✅ Found ${faqs.length} FAQs\n`)

  // Check if language column exists
  const hasLanguageColumn = faqs[0].hasOwnProperty('language')

  if (!hasLanguageColumn) {
    console.log('⚠️  WARNING: Database does NOT have language column yet!')
    console.log('   You need to run the migration: sql-migrations/025_add_multi_language_support.sql\n')
  }

  // Display FAQs
  faqs.forEach((faq, index) => {
    console.log(`\n📝 FAQ #${index + 1}`)
    console.log(`   ID: ${faq.id}`)
    console.log(`   Language: ${faq.language || 'NOT SET (needs migration)'}`)
    console.log(`   Question: ${faq.question?.substring(0, 100)}${faq.question?.length > 100 ? '...' : ''}`)
    console.log(`   Answer: ${faq.answer?.substring(0, 100)}${faq.answer?.length > 100 ? '...' : ''}`)
  })

  console.log('\n\n' + '='.repeat(80))
  console.log('SUMMARY')
  console.log('='.repeat(80))

  if (!hasLanguageColumn) {
    console.log('\n❌ ACTION REQUIRED:')
    console.log('   1. Run database migration to add language support')
    console.log('   2. Use the auto-translation API to create Chinese/Vietnamese versions')
    console.log('   3. Then FAQ content will appear in different languages\n')
    console.log('   Current status: All FAQs are in English (no language filtering)')
  } else {
    // Count by language
    const languageCounts = {}
    faqs.forEach(faq => {
      const lang = faq.language || 'unknown'
      languageCounts[lang] = (languageCounts[lang] || 0) + 1
    })

    console.log('\n✅ Language breakdown:')
    Object.entries(languageCounts).forEach(([lang, count]) => {
      console.log(`   ${lang}: ${count} FAQs`)
    })
    console.log('')
  }
}

showFAQs().catch(console.error)
