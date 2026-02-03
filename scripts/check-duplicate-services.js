// Check for duplicate services in SkinCoach
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDuplicates() {
  // Get SkinCoach business unit ID
  const { data: bu } = await supabase
    .from('business_units')
    .select('id')
    .eq('slug', 'skincoach')
    .single()

  if (!bu) {
    console.error('SkinCoach business unit not found')
    return
  }

  // Get all services
  const { data: services } = await supabase
    .from('appointment_services')
    .select('*')
    .eq('business_unit_id', bu.id)
    .order('name')

  console.log(`\nTotal services: ${services.length}\n`)

  // Group by name
  const byName = {}
  services.forEach(s => {
    if (!byName[s.name]) byName[s.name] = []
    byName[s.name].push(s)
  })

  // Show duplicates
  Object.keys(byName).forEach(name => {
    const copies = byName[name]
    console.log(`${name}: ${copies.length} ${copies.length > 1 ? 'DUPLICATES' : 'copy'}`)

    if (copies.length > 1) {
      copies.forEach((s, i) => {
        const keepLabel = i === 0 ? ' ← KEEP' : ' ← DELETE'
        console.log(`  ${i + 1}. ID: ${s.id}`)
        console.log(`     Created: ${s.created_at}${keepLabel}`)
      })
      console.log('')
    }
  })

  // List IDs to delete (keep the oldest copy)
  console.log('\n' + '='.repeat(60))
  console.log('SERVICES TO DELETE (duplicates):')
  console.log('='.repeat(60) + '\n')

  const toDelete = []
  Object.keys(byName).forEach(name => {
    const copies = byName[name]
    if (copies.length > 1) {
      // Keep the first (oldest), delete the rest
      copies.slice(1).forEach(s => {
        toDelete.push(s.id)
        console.log(`DELETE: ${s.name} (ID: ${s.id})`)
      })
    }
  })

  console.log(`\nTotal to delete: ${toDelete.length}`)

  return toDelete
}

checkDuplicates()
