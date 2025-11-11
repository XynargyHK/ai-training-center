require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)
const BUSINESS_UNIT_ID = '77313e61-2a19-4f3e-823b-80390dde8bd2' // skincoach

async function syncGuidelines() {
  console.log('📚 Syncing guidelines from JSON to Supabase...\n')

  // Read guidelines from JSON file
  const guidelinesPath = path.join(__dirname, '..', 'data', 'business-units', 'skincoach', 'guidelines.json')
  const guidelinesData = JSON.parse(fs.readFileSync(guidelinesPath, 'utf8'))

  console.log(`Found ${guidelinesData.length} guidelines in JSON file\n`)

  // Delete all existing guidelines for this business unit
  console.log('🗑️  Deleting existing guidelines...')
  const { error: deleteError } = await supabase
    .from('guidelines')
    .delete()
    .eq('business_unit_id', BUSINESS_UNIT_ID)

  if (deleteError) {
    console.error('❌ Error deleting guidelines:', deleteError)
    process.exit(1)
  }
  console.log('✅ Existing guidelines deleted\n')

  // Insert all guidelines from JSON (let Supabase auto-generate UUIDs)
  console.log('📝 Inserting guidelines...')
  for (const guideline of guidelinesData) {
    const { error: insertError } = await supabase
      .from('guidelines')
      .insert({
        business_unit_id: BUSINESS_UNIT_ID,
        category: guideline.category,
        title: guideline.title,
        content: guideline.content
      })

    if (insertError) {
      console.error(`❌ Error inserting guideline "${guideline.title}":`, insertError)
    } else {
      console.log(`✅ Inserted: [${guideline.category.toUpperCase()}] ${guideline.title}`)
    }
  }

  console.log('\n🎉 Guidelines sync completed!')

  // Verify the results
  const { data: verifyData, error: verifyError } = await supabase
    .from('guidelines')
    .select('id, category, title')
    .eq('business_unit_id', BUSINESS_UNIT_ID)
    .order('category')

  if (verifyError) {
    console.error('❌ Error verifying guidelines:', verifyError)
  } else {
    console.log(`\n📊 Total guidelines in database: ${verifyData.length}`)
    console.log('\nGuidelines by category:')
    const byCategory = verifyData.reduce((acc, g) => {
      acc[g.category] = (acc[g.category] || 0) + 1
      return acc
    }, {})
    Object.entries(byCategory).forEach(([category, count]) => {
      console.log(`  - ${category}: ${count}`)
    })
  }
}

syncGuidelines().catch(console.error)
