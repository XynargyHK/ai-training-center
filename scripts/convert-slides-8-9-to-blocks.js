require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const LANDING_PAGE_ID = '7cb58d30-65a3-4fcc-8fa5-e263855b6a55'

async function convertSlidesToBlocks() {
  console.log('🔄 Converting slides 8 & 9 to Static Banner blocks...\n')

  // Get current landing page data
  const { data: page, error: fetchError } = await supabase
    .from('landing_pages')
    .select('hero_slides, blocks')
    .eq('id', LANDING_PAGE_ID)
    .single()

  if (fetchError) {
    console.error('Error fetching page:', fetchError)
    return
  }

  const slides = page.hero_slides || []
  const blocks = page.blocks || []

  console.log(`Current slides: ${slides.length}`)
  console.log(`Current blocks: ${blocks.length}`)

  // Find slides 8 and 9 (indices 7 and 8)
  if (slides.length < 9) {
    console.log('❌ Not enough slides found!')
    return
  }

  const slide8 = slides[7]
  const slide9 = slides[8]

  console.log('\n📄 Slide 8:')
  console.log(`  - Headline: ${slide8.headline}`)
  console.log(`  - is_carousel: ${slide8.is_carousel}`)
  console.log(`  - Background: ${slide8.background_url ? 'Yes' : 'No'}`)

  console.log('\n📄 Slide 9:')
  console.log(`  - Headline: ${slide9.headline}`)
  console.log(`  - is_carousel: ${slide9.is_carousel}`)
  console.log(`  - Background: ${slide9.background_url ? 'Yes' : 'No'}`)

  // Convert slides to Static Banner block data
  const convertSlideToBlockData = (slide) => ({
    background_url: slide.background_url || '',
    background_type: slide.background_type || 'image',
    background_color: slide.background_color || '#1e293b',

    headline: slide.headline || '',
    headline_font_size: slide.headline_font_size || 'clamp(1.875rem, 5vw, 3.75rem)',
    headline_font_family: slide.headline_font_family || 'Josefin Sans',
    headline_color: slide.headline_color || '#ffffff',
    headline_bold: slide.headline_bold || false,
    headline_italic: slide.headline_italic || false,
    headline_text_align: slide.headline_text_align || 'center',

    subheadline: slide.subheadline || '',
    subheadline_font_size: slide.subheadline_font_size || 'clamp(1.125rem, 2.5vw, 1.25rem)',
    subheadline_font_family: slide.subheadline_font_family || 'Josefin Sans',
    subheadline_color: slide.subheadline_color || '#ffffff',
    subheadline_bold: slide.subheadline_bold || false,
    subheadline_italic: slide.subheadline_italic || false,
    subheadline_text_align: slide.subheadline_text_align || 'center',

    content: slide.content || '',
    content_font_size: slide.content_font_size || 'clamp(1rem, 2vw, 1.125rem)',
    content_font_family: slide.content_font_family || 'Josefin Sans',
    content_color: slide.content_color || '#ffffff',
    content_bold: slide.content_bold || false,
    content_italic: slide.content_italic || false,
    content_text_align: slide.content_text_align || 'center',

    cta_text: slide.cta_text || '',
    cta_url: slide.cta_url || ''
  })

  // Create new Static Banner blocks
  const block8 = {
    id: crypto.randomUUID(),
    type: 'static_banner',
    name: slide8.headline || 'Static Banner 1',
    order: 0, // Will be updated below
    data: convertSlideToBlockData(slide8)
  }

  const block9 = {
    id: crypto.randomUUID(),
    type: 'static_banner',
    name: slide9.headline || 'Static Banner 2',
    order: 0, // Will be updated below
    data: convertSlideToBlockData(slide9)
  }

  // Find testimonials block
  const testimonialsIndex = blocks.findIndex(b => b.type === 'testimonials')

  if (testimonialsIndex === -1) {
    console.log('\n⚠️  No testimonials block found, adding at the end')
  } else {
    console.log(`\n✅ Found testimonials block at position ${testimonialsIndex}`)
  }

  // Insert blocks before testimonials (or at end if not found)
  const insertPosition = testimonialsIndex === -1 ? blocks.length : testimonialsIndex

  const updatedBlocks = [
    ...blocks.slice(0, insertPosition),
    block8,
    block9,
    ...blocks.slice(insertPosition)
  ]

  // Reorder all blocks
  const reorderedBlocks = updatedBlocks.map((block, index) => ({
    ...block,
    order: index
  }))

  // Remove slides 8 and 9 from hero_slides
  const updatedSlides = slides.filter((_, index) => index !== 7 && index !== 8)

  console.log(`\n📊 Summary:`)
  console.log(`  - New blocks count: ${reorderedBlocks.length} (was ${blocks.length})`)
  console.log(`  - New slides count: ${updatedSlides.length} (was ${slides.length})`)
  console.log(`  - Block 8 position: ${insertPosition}`)
  console.log(`  - Block 9 position: ${insertPosition + 1}`)

  // Update the landing page
  const { error: updateError } = await supabase
    .from('landing_pages')
    .update({
      hero_slides: updatedSlides,
      blocks: reorderedBlocks
    })
    .eq('id', LANDING_PAGE_ID)

  if (updateError) {
    console.error('Error updating page:', updateError)
    return
  }

  console.log('\n✅ Successfully converted slides 8 & 9 to Static Banner blocks!')
  console.log('   They are now positioned above the testimonials/reviews block')
}

convertSlidesToBlocks()
