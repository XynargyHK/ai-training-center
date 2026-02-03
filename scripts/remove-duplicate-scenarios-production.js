/**
 * Remove duplicate scenarios from production database
 * Run with: node scripts/remove-duplicate-scenarios-production.js
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') })

// Use production credentials from Railway environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function removeDuplicatesForBusinessUnit(businessUnitSlug) {
  console.log(`\n🔍 Finding duplicate scenarios in ${businessUnitSlug}...\n`)

  // Get business unit ID
  const { data: businessUnit, error: buError } = await supabase
    .from('business_units')
    .select('id, name, slug')
    .eq('slug', businessUnitSlug)
    .single()

  if (buError || !businessUnit) {
    console.error(`❌ Could not find ${businessUnitSlug} business unit:`, buError)
    return
  }

  console.log(`✓ Found business unit: ${businessUnit.name} (${businessUnit.id})\n`)

  // Load all scenarios for this business unit
  const { data: scenarios, error: scenariosError } = await supabase
    .from('training_scenarios')
    .select('*')
    .eq('business_unit_id', businessUnit.id)
    .order('created_at', { ascending: true })

  if (scenariosError) {
    console.error('❌ Error loading scenarios:', scenariosError)
    return
  }

  console.log(`📋 Total scenarios: ${scenarios.length}\n`)

  // Group scenarios by name to find duplicates
  const scenarioGroups = {}
  for (const scenario of scenarios) {
    const key = scenario.name
    if (!scenarioGroups[key]) {
      scenarioGroups[key] = []
    }
    scenarioGroups[key].push(scenario)
  }

  // Find and remove duplicates
  let totalDeleted = 0
  for (const [name, group] of Object.entries(scenarioGroups)) {
    if (group.length > 1) {
      console.log(`🔍 Found ${group.length} duplicates of "${name}"`)

      // Keep the first one (oldest), delete the rest
      const toKeep = group[0]
      const toDelete = group.slice(1)

      console.log(`  ✓ Keeping: ${toKeep.id} (created: ${toKeep.created_at})`)

      for (const scenario of toDelete) {
        console.log(`  🗑️  Deleting: ${scenario.id} (created: ${scenario.created_at})`)

        const { error: deleteError } = await supabase
          .from('training_scenarios')
          .delete()
          .eq('id', scenario.id)

        if (deleteError) {
          console.error(`    ❌ Error deleting ${scenario.id}:`, deleteError)
        } else {
          console.log(`    ✓ Deleted successfully`)
          totalDeleted++
        }
      }
      console.log()
    }
  }

  console.log(`\n✅ Cleanup complete for ${businessUnitSlug}!`)
  console.log(`   - Total scenarios before: ${scenarios.length}`)
  console.log(`   - Duplicates removed: ${totalDeleted}`)
  console.log(`   - Unique scenarios remaining: ${scenarios.length - totalDeleted}`)

  // Verify the cleanup
  const { data: remainingScenarios, error: verifyError } = await supabase
    .from('training_scenarios')
    .select('name')
    .eq('business_unit_id', businessUnit.id)

  if (!verifyError) {
    console.log(`\n📊 Remaining scenarios:`)
    const uniqueNames = [...new Set(remainingScenarios.map(s => s.name))]
    uniqueNames.forEach(name => {
      const count = remainingScenarios.filter(s => s.name === name).length
      console.log(`   - ${name} (${count})`)
    })
  }
}

async function main() {
  console.log('🧹 Removing duplicate scenarios from PRODUCTION database...')
  console.log(`📍 Supabase URL: ${supabaseUrl}\n`)

  // Clean up both business units
  await removeDuplicatesForBusinessUnit('skincoach')
  await removeDuplicatesForBusinessUnit('breast-guardian')

  console.log('\n✅ All business units cleaned!')
}

main().catch(console.error)
