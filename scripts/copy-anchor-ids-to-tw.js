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

async function copyAnchorIds() {
  try {
    // Get business unit ID
    const { data: bu } = await supabase
      .from('business_units')
      .select('id')
      .eq('slug', 'skincoach')
      .single()

    if (!bu) {
      console.error('Skincoach business unit not found')
      return
    }

    // 1. Get HK/EN landing page
    const { data: enPage, error: enError } = await supabase
      .from('landing_pages')
      .select('*')
      .eq('business_unit_id', bu.id)
      .eq('country', 'HK')
      .eq('language_code', 'en')
      .single()

    if (enError) {
      console.error('Error loading HK/EN page:', enError)
      return
    }

    console.log('HK/EN blocks found:', enPage.blocks?.length || 0)

    // Show anchor IDs from EN (auto-generated from names)
    const enAnchors = []
    enPage.blocks?.forEach((block, idx) => {
      const anchorId = block.data?.anchor_id || toAnchorSlug(block.name)
      enAnchors.push(anchorId)
      console.log(`  Block ${idx}: ${block.name} -> anchor: ${anchorId}`)
    })

    // 2. Get HK/TW landing page (stored as 'tw' not 'zh-TW')
    const { data: twPage, error: twError } = await supabase
      .from('landing_pages')
      .select('*')
      .eq('business_unit_id', bu.id)
      .eq('country', 'HK')
      .eq('language_code', 'tw')
      .single()

    if (twError) {
      console.error('Error loading HK/TW page:', twError)
      return
    }

    console.log('\nHK/TW blocks found:', twPage.blocks?.length || 0)

    // 3. Copy anchor_id from EN to TW (match by index)
    const updatedBlocks = twPage.blocks?.map((block, idx) => {
      const enAnchor = enAnchors[idx]

      if (enAnchor) {
        console.log(`  Setting anchor "${enAnchor}" for TW block ${idx}: ${block.name}`)
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

    // 4. Update HK/TW page with new blocks
    const { error: updateError } = await supabase
      .from('landing_pages')
      .update({ blocks: updatedBlocks })
      .eq('id', twPage.id)

    if (updateError) {
      console.error('Error updating HK/TW page:', updateError)
      return
    }

    console.log('\n✅ Successfully copied anchor IDs from HK/EN to HK/TW!')

  } catch (err) {
    console.error('Error:', err)
  }
}

copyAnchorIds()
