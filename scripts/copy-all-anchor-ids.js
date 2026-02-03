require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Helper function to generate anchor slug from name
function toAnchorSlug(name) {
  if (!name) return undefined
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

async function copyAllAnchorIds() {
  try {
    // Get all business units
    const { data: businessUnits } = await supabase
      .from('business_units')
      .select('id, slug')

    for (const bu of businessUnits || []) {
      console.log(`\n=== Processing ${bu.slug} ===`)

      // Get all landing pages for this business unit
      const { data: pages } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('business_unit_id', bu.id)
        .order('country')
        .order('language_code')

      if (!pages || pages.length === 0) {
        console.log('  No landing pages found')
        continue
      }

      // Group pages by country
      const pagesByCountry = {}
      pages.forEach(page => {
        if (!pagesByCountry[page.country]) {
          pagesByCountry[page.country] = []
        }
        pagesByCountry[page.country].push(page)
      })

      // For each country, find EN version and copy anchors to other languages
      for (const [country, countryPages] of Object.entries(pagesByCountry)) {
        const enPage = countryPages.find(p => p.language_code === 'en')

        if (!enPage) {
          console.log(`  ${country}: No EN version found, skipping`)
          continue
        }

        // Extract anchor IDs from EN version
        const enAnchors = enPage.blocks?.map(block =>
          block.data?.anchor_id || toAnchorSlug(block.name)
        ) || []

        console.log(`  ${country}/en: ${enPage.blocks?.length || 0} blocks`)

        // Update all non-EN pages for this country
        for (const page of countryPages) {
          if (page.language_code === 'en') continue

          console.log(`    Updating ${country}/${page.language_code}...`)

          const updatedBlocks = page.blocks?.map((block, idx) => {
            const enAnchor = enAnchors[idx]
            if (enAnchor) {
              return {
                ...block,
                data: {
                  ...block.data,
                  anchor_id: enAnchor
                }
              }
            }
            return block
          })

          const { error: updateError } = await supabase
            .from('landing_pages')
            .update({ blocks: updatedBlocks })
            .eq('id', page.id)

          if (updateError) {
            console.error(`      Error updating ${country}/${page.language_code}:`, updateError)
          } else {
            console.log(`      ✅ Updated ${updatedBlocks?.length || 0} blocks`)
          }
        }
      }
    }

    console.log('\n✅ All done!')

  } catch (err) {
    console.error('Error:', err)
  }
}

copyAllAnchorIds()
