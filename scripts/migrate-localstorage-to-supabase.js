const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const BUSINESS_UNIT_ID = '77313e61-2a19-4f3e-823b-80390dde8bd2'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function migrateLocalStorageData() {
  try {
    console.log('🔍 Checking for localStorage data to migrate...\n')

    // Fetch current data from the data-sync API to see what's in "localStorage"
    const response = await fetch('http://localhost:3010/api/data-sync?businessUnit=skincoach&dataType=knowledge')
    const knowledgeData = await response.json()

    console.log('📊 Knowledge entries found:', knowledgeData.length)

    if (knowledgeData.length === 0) {
      console.log('ℹ️  No localStorage data found to migrate')
      return
    }

    // Show what we found
    console.log('\n📋 Data to migrate:')
    knowledgeData.slice(0, 5).forEach((entry, i) => {
      console.log(`  ${i + 1}. ${entry.topic || entry.title || 'Untitled'}`)
      console.log(`     Category: ${entry.category}`)
      console.log(`     Content: ${entry.content?.substring(0, 60)}...`)
    })

    console.log('\n⚡ Starting migration to Supabase...\n')

    const results = {
      total: knowledgeData.length,
      migrated: 0,
      skipped: 0,
      errors: []
    }

    for (const entry of knowledgeData) {
      try {
        // Check if already exists in Supabase
        const { data: existing } = await supabase
          .from('knowledge_base')
          .select('id')
          .eq('business_unit_id', BUSINESS_UNIT_ID)
          .eq('title', entry.topic || entry.title)
          .single()

        if (existing) {
          console.log(`⏭️  Skipped (exists): ${entry.topic || entry.title}`)
          results.skipped++
          continue
        }

        // Migrate to Supabase
        const supabaseEntry = {
          business_unit_id: BUSINESS_UNIT_ID,
          category: entry.category || 'General',
          topic: entry.topic,
          title: entry.topic || entry.title || 'Untitled',
          content: entry.content || '',
          keywords: entry.keywords || [],
          raw_data: {
            originalId: entry.id,
            confidence: entry.confidence,
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt
          },
          source_type: 'localstorage',
          confidence: entry.confidence || 1.0,
          status: 'active',
          is_active: true,
          version: 1
        }

        const { error } = await supabase
          .from('knowledge_base')
          .insert(supabaseEntry)

        if (error) {
          console.error(`❌ Error: ${entry.topic || 'Unknown'} - ${error.message}`)
          results.errors.push({ entry: entry.topic, error: error.message })
        } else {
          console.log(`✅ Migrated: ${entry.topic || entry.title}`)
          results.migrated++
        }

      } catch (err) {
        console.error(`❌ Exception:`, err.message)
        results.errors.push({ entry: entry.topic || 'Unknown', error: err.message })
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('📊 MIGRATION COMPLETE')
    console.log('='.repeat(60))
    console.log(`Total entries: ${results.total}`)
    console.log(`Migrated: ${results.migrated}`)
    console.log(`Skipped: ${results.skipped}`)
    console.log(`Errors: ${results.errors.length}`)

    if (results.errors.length > 0) {
      console.log('\n⚠️  Errors:')
      results.errors.forEach(err => {
        console.log(`  - ${err.entry}: ${err.error}`)
      })
    }

    // Verify
    const { count } = await supabase
      .from('knowledge_base')
      .select('*', { count: 'exact', head: true })
      .eq('business_unit_id', BUSINESS_UNIT_ID)

    console.log(`\n✨ Total knowledge base entries in Supabase: ${count}`)

  } catch (error) {
    console.error('💥 Migration error:', error.message)
  }
}

migrateLocalStorageData()
