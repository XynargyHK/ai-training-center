/**
 * AUTOMATIC MIGRATION SCRIPT
 * Run this to migrate all localStorage data to Supabase automatically
 */

const BUSINESS_UNIT_ID = '77313e61-2a19-4f3e-823b-80390dde8bd2' // SkinCoach
const API_URL = 'http://localhost:3000/api/auto-migrate-data'

// Sample product data structure (will be replaced by actual localStorage data)
const sampleKnowledgeEntries = [
  {
    id: '1',
    category: 'Product Information',
    topic: 'Booster Serum - Vitamin C',
    content: 'Premium Vitamin C Booster Serum with 20% L-Ascorbic Acid. Price: $45. Benefits: Brightens skin, reduces dark spots, boosts collagen production. Usage: Apply 2-3 drops to clean face morning and evening.',
    keywords: ['vitamin c', 'serum', 'brightening', 'anti-aging', 'booster'],
    confidence: 1.0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    category: 'Product Information',
    topic: 'Booster Serum - Hyaluronic Acid',
    content: 'Hyaluronic Acid Booster Serum for intense hydration. Price: $38. Benefits: Deep hydration, plumps skin, reduces fine lines. Usage: Apply 3-4 drops to damp skin twice daily.',
    keywords: ['hyaluronic acid', 'serum', 'hydration', 'moisturizer', 'booster'],
    confidence: 1.0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    category: 'Product Information',
    topic: 'Booster Serum - Niacinamide',
    content: 'Niacinamide 10% Booster Serum for pore refinement. Price: $35. Benefits: Minimizes pores, controls oil, evens skin tone. Usage: Apply 2-3 drops after cleansing, before moisturizer.',
    keywords: ['niacinamide', 'serum', 'pores', 'oil control', 'booster'],
    confidence: 1.0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

async function migrateData() {
  try {
    console.log('🚀 Starting automatic data migration...\n')

    // Send data to migration API
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        knowledgeEntries: sampleKnowledgeEntries,
        businessUnitId: BUSINESS_UNIT_ID
      })
    })

    const result = await response.json()

    if (result.success) {
      console.log('✅ Migration successful!\n')
      console.log('Results:')
      console.log(`  - Total entries: ${result.results.totalReceived}`)
      console.log(`  - Migrated: ${result.results.migrated}`)
      console.log(`  - Skipped: ${result.results.skipped}`)
      console.log(`  - Final count in database: ${result.results.finalCount}`)

      if (result.results.errors.length > 0) {
        console.log('\n⚠️  Errors:')
        result.results.errors.forEach(err => {
          console.log(`  - ${err.topic}: ${err.error}`)
        })
      }
    } else {
      console.error('❌ Migration failed:', result.error)
    }

    // Verify data
    console.log('\n📊 Verifying migrated data...')
    const verifyResponse = await fetch(`${API_URL}?businessUnitId=${BUSINESS_UNIT_ID}`)
    const verifyResult = await verifyResponse.json()

    if (verifyResult.success) {
      console.log(`✅ Verified: ${verifyResult.totalEntries} entries in Supabase`)
      console.log('\nSample entries:')
      verifyResult.entries.slice(0, 3).forEach((entry, i) => {
        console.log(`  ${i + 1}. ${entry.title} (${entry.category})`)
      })
    }

    console.log('\n🎉 Migration complete!')

  } catch (error) {
    console.error('💥 Migration script error:', error.message)
  }
}

// Run migration
migrateData()
