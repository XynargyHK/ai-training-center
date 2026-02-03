/**
 * Auto-assign Booster Concerns using Gemini AI
 *
 * Analyzes booster names/descriptions and suggests which skin concerns they address
 * Uses Gemini to intelligently match boosters to concerns based on skincare knowledge
 */

const { createClient } = require('@supabase/supabase-js')
const { GoogleGenerativeAI } = require('@google/generative-ai')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY)

// Get all concerns for reference
async function getConcerns(businessUnitId) {
  const { data } = await supabase
    .from('skin_concerns')
    .select('id, name, handle, category')
    .eq('business_unit_id', businessUnitId)
    .eq('is_active', true)
    .order('category')
    .order('display_order')

  return data || []
}

// Get all boosters
async function getBoosters(businessUnitId) {
  const { data } = await supabase
    .from('products')
    .select(`
      id, title, description, tagline,
      hero_benefit, key_actives, face_benefits, body_benefits, eye_benefits,
      product_category_mapping(product_categories(handle))
    `)
    .eq('business_unit_id', businessUnitId)
    .is('deleted_at', null)

  // Filter to boosters only
  const { data: boosterType } = await supabase
    .from('product_types')
    .select('id')
    .eq('is_addon', true)
    .single()

  // Also check metadata.is_addon
  const boosters = (data || []).filter(p =>
    p.product_type_id === boosterType?.id ||
    p.metadata?.is_addon === true
  )

  return boosters
}

// Use Gemini to suggest concerns for a booster
async function suggestConcerns(booster, concerns) {
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash'
  const model = genAI.getGenerativeModel({ model: modelName })

  // Build concern list grouped by category
  const concernsByCategory = concerns.reduce((acc, c) => {
    if (!acc[c.category]) acc[c.category] = []
    acc[c.category].push(c.name)
    return acc
  }, {})

  const concernList = Object.entries(concernsByCategory)
    .map(([cat, names]) => `${cat.toUpperCase()}: ${names.join(', ')}`)
    .join('\n')

  // Get booster's categories
  const boosterCategories = booster.product_category_mapping
    ?.map(m => m.product_categories?.handle)
    .filter(Boolean) || []

  const prompt = `You are a skincare expert. Analyze this booster product and determine which skin concerns it addresses.

BOOSTER:
Name: ${booster.title}
${booster.tagline ? `Tagline: ${booster.tagline}` : ''}
${booster.description ? `Description: ${booster.description}` : ''}
${booster.hero_benefit ? `Hero Benefit: ${booster.hero_benefit}` : ''}
${booster.key_actives ? `Key Actives: ${booster.key_actives}` : ''}
${booster.face_benefits ? `Face Benefits: ${booster.face_benefits}` : ''}
${booster.eye_benefits ? `Eye Benefits: ${booster.eye_benefits}` : ''}
${booster.body_benefits ? `Body Benefits: ${booster.body_benefits}` : ''}
Categories: ${boosterCategories.join(', ') || 'Not specified'}

AVAILABLE CONCERNS:
${concernList}

Based on the booster's name, ingredients, and benefits, identify which concerns this booster addresses.
For each concern, rate effectiveness from 1-5 (5 = highly effective, primary use case).

IMPORTANT RULES:
1. Only select concerns that the booster ACTUALLY addresses based on its properties
2. Select 2-8 concerns maximum per booster
3. Mark 1-2 concerns as "primary" (main use case)
4. Consider the booster's category - face boosters primarily address face concerns, etc.
5. Be conservative - don't assign concerns without evidence

Return ONLY a JSON array with this exact format:
[
  {"concern": "Acne", "effectiveness": 5, "isPrimary": true},
  {"concern": "Oiliness", "effectiveness": 4, "isPrimary": false}
]

If the booster doesn't clearly address any concerns, return an empty array: []`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()

    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      console.log(`  No JSON found in response for ${booster.title}`)
      return []
    }

    const suggestions = JSON.parse(jsonMatch[0])

    // Map concern names to IDs
    const mapped = suggestions.map(s => {
      const concern = concerns.find(c =>
        c.name.toLowerCase() === s.concern.toLowerCase() ||
        c.handle === s.concern.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      )
      if (!concern) {
        console.log(`  Warning: Concern "${s.concern}" not found`)
        return null
      }
      return {
        concernId: concern.id,
        concernName: concern.name,
        effectiveness: Math.min(5, Math.max(1, s.effectiveness || 3)),
        isPrimary: s.isPrimary || false
      }
    }).filter(Boolean)

    return mapped
  } catch (error) {
    console.error(`  Error analyzing ${booster.title}:`, error.message)
    return []
  }
}

// Save concern mappings
async function saveMappings(boosterId, mappings) {
  if (mappings.length === 0) return 0

  // Delete existing mappings
  await supabase
    .from('booster_concern_mapping')
    .delete()
    .eq('product_id', boosterId)

  // Insert new mappings
  const inserts = mappings.map(m => ({
    product_id: boosterId,
    concern_id: m.concernId,
    effectiveness_rating: m.effectiveness,
    is_primary: m.isPrimary
  }))

  const { error } = await supabase
    .from('booster_concern_mapping')
    .insert(inserts)

  if (error) {
    console.error(`  Error saving mappings:`, error.message)
    return 0
  }

  return inserts.length
}

async function main() {
  console.log('Auto-assigning booster concerns using Gemini AI...\n')

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

  // Load data
  const concerns = await getConcerns(bu.id)
  console.log(`Loaded ${concerns.length} concerns`)

  const boosters = await getBoosters(bu.id)
  console.log(`Found ${boosters.length} boosters to analyze\n`)

  if (boosters.length === 0) {
    console.log('No boosters found. Make sure products are marked as addons.')
    process.exit(0)
  }

  let totalMappings = 0
  let processedCount = 0

  for (const booster of boosters) {
    processedCount++
    console.log(`[${processedCount}/${boosters.length}] Analyzing: ${booster.title}`)

    const suggestions = await suggestConcerns(booster, concerns)

    if (suggestions.length > 0) {
      const saved = await saveMappings(booster.id, suggestions)
      totalMappings += saved

      console.log(`  → ${saved} concerns assigned:`)
      suggestions.forEach(s => {
        const star = s.isPrimary ? '★' : '☆'
        console.log(`    ${star} ${s.concernName} (${'★'.repeat(s.effectiveness)})`)
      })
    } else {
      console.log(`  → No concerns assigned`)
    }

    // Rate limiting - Gemini has 15 RPM for free tier
    await new Promise(resolve => setTimeout(resolve, 4500))
  }

  console.log('\n' + '='.repeat(50))
  console.log(`Done! Assigned ${totalMappings} total concern mappings`)
  console.log(`Processed ${processedCount} boosters`)
}

// Run with --dry-run flag to just see suggestions without saving
const isDryRun = process.argv.includes('--dry-run')
if (isDryRun) {
  console.log('DRY RUN MODE - No changes will be saved\n')
}

main().catch(console.error)
