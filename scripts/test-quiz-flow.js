// Test quiz flow end-to-end
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const BASE_URL = 'http://localhost:3000'

async function testFlow() {
  console.log('Testing Quiz Flow End-to-End\n')
  console.log('=' .repeat(50))

  // Step 1: Start quiz - create profile
  console.log('\n1. Starting quiz (creating profile)...')
  const startRes = await fetch(`${BASE_URL}/api/quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessUnitId: 'skincoach',
      source: 'test'
    })
  })
  const startData = await startRes.json()
  console.log('   Profile created:', startData.profileId ? 'YES' : 'NO')
  if (!startData.profileId) {
    console.log('   Error:', startData.error)
    return
  }
  const profileId = startData.profileId
  console.log('   Profile ID:', profileId)

  // Step 2: Get some skin concerns to select
  console.log('\n2. Getting skin concerns...')
  const { data: attribute } = await supabase
    .from('product_attributes')
    .select('id')
    .eq('handle', 'skin_concerns')
    .single()

  const { data: concerns } = await supabase
    .from('product_attribute_options')
    .select('id, name, product_categories(handle)')
    .eq('attribute_id', attribute?.id)
    .limit(5)

  console.log('   Selected concerns:')
  concerns.forEach(c => console.log(`     - ${c.name} (${c.product_categories?.handle || 'face'})`))

  // Step 3: Save step 1 answers
  console.log('\n3. Saving step 1 answers...')
  const step1Res = await fetch(`${BASE_URL}/api/quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessUnitId: 'skincoach',
      profileId,
      step: 2,
      answers: {
        gender: 'female',
        age_group: '26-35',
        climate: 'humid'
      }
    })
  })
  const step1Data = await step1Res.json()
  console.log('   Saved:', step1Data.profile ? 'YES' : 'NO')

  // Step 4: Save step 2 answers
  console.log('\n4. Saving step 2 answers...')
  const step2Res = await fetch(`${BASE_URL}/api/quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessUnitId: 'skincoach',
      profileId,
      step: 3,
      answers: {
        skin_type: 'combination',
        skin_tone: 'medium',
        sun_exposure: 'sometimes'
      }
    })
  })
  const step2Data = await step2Res.json()
  console.log('   Saved:', step2Data.profile ? 'YES' : 'NO')

  // Step 5: Save step 3 (concerns)
  console.log('\n5. Saving step 3 (concerns)...')
  const step3Res = await fetch(`${BASE_URL}/api/quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessUnitId: 'skincoach',
      profileId,
      step: 4,
      answers: {
        concerns: concerns.map((c, i) => ({
          concern_id: c.id,
          severity: 3 + (i % 2),
          is_priority: i === 0
        }))
      }
    })
  })
  const step3Data = await step3Res.json()
  console.log('   Saved:', step3Data.profile ? 'YES' : 'NO')

  // Step 6: Save step 4 (preferences) - completes quiz
  console.log('\n6. Saving step 4 (preferences) - completing quiz...')
  const step4Res = await fetch(`${BASE_URL}/api/quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessUnitId: 'skincoach',
      profileId,
      step: 5,
      answers: {
        current_routine: 'basic',
        product_preference: 'clinical',
        monthly_budget: '100-200'
      }
    })
  })
  const step4Data = await step4Res.json()
  console.log('   Quiz completed:', step4Data.profile?.quiz_completed ? 'YES' : 'NO')

  // Step 7: Generate recommendations
  console.log('\n7. Generating recommendations...')
  const recRes = await fetch(`${BASE_URL}/api/recommendations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profileId })
  })
  const recData = await recRes.json()

  if (recData.error) {
    console.log('   Error:', recData.error)
    return
  }

  console.log('   Recommendations generated:', recData.recommendations ? 'YES' : 'NO')

  if (recData.recommendations) {
    const rec = recData.recommendations
    console.log('\n   Profile Summary:')
    console.log(`     Skin Type: ${rec.profile.skin_type}`)
    console.log(`     Age Group: ${rec.profile.age_group}`)
    console.log(`     Concerns: ${rec.profile.concerns.length}`)

    console.log('\n   Top Boosters:')
    rec.topBoosters.slice(0, 3).forEach((b, i) => {
      console.log(`     ${i + 1}. ${b.title} (Score: ${b.totalScore})`)
    })

    console.log('\n   Bundles:')
    console.log(`     6-Month: $${rec.fullRoutine.finalPrice} (${rec.fullRoutine.discount}% off) - ${rec.fullRoutine.products.length} products`)
    console.log(`     3-Month: $${rec.starterBundle.finalPrice} (${rec.starterBundle.discount}% off) - ${rec.starterBundle.products.length} products`)
    console.log(`     1-Month: $${rec.trialBundle.finalPrice} (${rec.trialBundle.discount}% off) - ${rec.trialBundle.products.length} products`)
    console.log(`     Single:  $${rec.singleProduct.finalPrice} - ${rec.singleProduct.products.length} product`)
  }

  console.log('\n' + '=' .repeat(50))
  console.log('Test complete!')
}

testFlow()
