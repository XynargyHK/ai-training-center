/**
 * Seed Skin Concerns
 * Populates the skin_concerns table with 30 concerns across 4 categories
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// 30 Skin Concerns organized by category
const CONCERNS = [
  // Face (11)
  { name: 'Acne', handle: 'acne', category: 'face', display_order: 1 },
  { name: 'Redness/Rosacea', handle: 'redness-rosacea', category: 'face', display_order: 2 },
  { name: 'Pigmentation/Dark Spots', handle: 'pigmentation', category: 'face', display_order: 3 },
  { name: 'Sagging', handle: 'sagging', category: 'face', display_order: 4 },
  { name: 'Fine Lines/Wrinkles', handle: 'fine-lines', category: 'face', display_order: 5 },
  { name: 'Uneven Texture', handle: 'uneven-texture', category: 'face', display_order: 6 },
  { name: 'Large Pores', handle: 'large-pores', category: 'face', display_order: 7 },
  { name: 'Dullness', handle: 'dullness', category: 'face', display_order: 8 },
  { name: 'Dryness', handle: 'dryness-face', category: 'face', display_order: 9 },
  { name: 'Oiliness', handle: 'oiliness', category: 'face', display_order: 10 },
  { name: 'Sensitivity', handle: 'sensitivity', category: 'face', display_order: 11 },

  // Eye (3)
  { name: 'Eye Bags', handle: 'eye-bags', category: 'eye', display_order: 1 },
  { name: 'Dark Circles', handle: 'dark-circles', category: 'eye', display_order: 2 },
  { name: "Crow's Feet", handle: 'crows-feet', category: 'eye', display_order: 3 },

  // Body (9)
  { name: 'Stretch Marks', handle: 'stretch-marks', category: 'body', display_order: 1 },
  { name: 'Cellulite', handle: 'cellulite', category: 'body', display_order: 2 },
  { name: 'Eczema', handle: 'eczema', category: 'body', display_order: 3 },
  { name: 'Psoriasis', handle: 'psoriasis', category: 'body', display_order: 4 },
  { name: 'Varicose Veins', handle: 'varicose-veins', category: 'body', display_order: 5 },
  { name: 'Cysts/Nodules', handle: 'cysts-nodules', category: 'body', display_order: 6 },
  { name: 'Rashes', handle: 'rashes', category: 'body', display_order: 7 },
  { name: 'Underarm Odor', handle: 'underarm-odor', category: 'body', display_order: 8 },
  { name: 'Dry Skin', handle: 'dryness-body', category: 'body', display_order: 9 },

  // Scalp/Hair (7)
  { name: 'Hair Loss/Thinning', handle: 'hair-loss', category: 'scalp', display_order: 1 },
  { name: 'Dandruff', handle: 'dandruff', category: 'scalp', display_order: 2 },
  { name: 'Scalp Acne', handle: 'scalp-acne', category: 'scalp', display_order: 3 },
  { name: 'Scalp Irritation', handle: 'scalp-irritation', category: 'scalp', display_order: 4 },
  { name: 'Oily Scalp', handle: 'oily-scalp', category: 'scalp', display_order: 5 },
  { name: 'Dry Scalp', handle: 'dry-scalp', category: 'scalp', display_order: 6 },
  { name: 'Premature Graying', handle: 'premature-graying', category: 'scalp', display_order: 7 },
]

async function main() {
  console.log('Seeding skin concerns...\n')

  // Get SkinCoach business unit
  const { data: bu } = await supabase
    .from('business_units')
    .select('id')
    .eq('slug', 'skincoach')
    .single()

  if (!bu) {
    console.error('SkinCoach business unit not found!')
    process.exit(1)
  }

  console.log(`Business unit: ${bu.id}\n`)

  // Check if concerns already exist
  const { data: existing } = await supabase
    .from('skin_concerns')
    .select('id')
    .eq('business_unit_id', bu.id)
    .limit(1)

  if (existing && existing.length > 0) {
    console.log('Concerns already exist. Deleting old data first...')
    await supabase
      .from('skin_concerns')
      .delete()
      .eq('business_unit_id', bu.id)
  }

  // Insert concerns
  const inserts = CONCERNS.map(c => ({
    ...c,
    business_unit_id: bu.id,
    is_active: true
  }))

  const { data, error } = await supabase
    .from('skin_concerns')
    .insert(inserts)
    .select()

  if (error) {
    console.error('Error inserting concerns:', error)
    process.exit(1)
  }

  // Summary
  const faceConcerns = data.filter(c => c.category === 'face')
  const eyeConcerns = data.filter(c => c.category === 'eye')
  const bodyConcerns = data.filter(c => c.category === 'body')
  const scalpConcerns = data.filter(c => c.category === 'scalp')

  console.log('Seeded concerns successfully!\n')
  console.log('Summary:')
  console.log(`  Face:  ${faceConcerns.length} concerns`)
  console.log(`  Eye:   ${eyeConcerns.length} concerns`)
  console.log(`  Body:  ${bodyConcerns.length} concerns`)
  console.log(`  Scalp: ${scalpConcerns.length} concerns`)
  console.log(`  ─────────────────`)
  console.log(`  Total: ${data.length} concerns`)

  console.log('\nConcerns by category:')
  console.log('\nFACE:', faceConcerns.map(c => c.name).join(', '))
  console.log('\nEYE:', eyeConcerns.map(c => c.name).join(', '))
  console.log('\nBODY:', bodyConcerns.map(c => c.name).join(', '))
  console.log('\nSCALP:', scalpConcerns.map(c => c.name).join(', '))
}

main()
