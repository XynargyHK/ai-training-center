const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkAllTextFields() {
  console.log('=== COMPLETE TEXT FIELD ANALYSIS ===\n')

  const { data: page } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('business_unit_id', '77313e61-2a19-4f3e-823b-80390dde8bd2')
    .single()

  if (!page) {
    console.log('No landing page found')
    return
  }

  // ===== HERO SLIDES =====
  console.log('━━━━━ HERO SLIDES ━━━━━\n')

  const slides = page.hero_slides || []
  slides.forEach((slide, index) => {
    console.log(`┌─ SLIDE ${index + 1}: "${slide.headline || 'NO HEADLINE'}" ─┐`)
    console.log(`│ Type: ${slide.is_price_banner ? 'PRICE BANNER' : 'REGULAR SLIDE'}`)
    console.log(`│ Carousel: ${slide.is_carousel !== false ? 'YES' : 'NO (Static Banner)'}`)
    console.log(`│`)

    // HEADLINE
    console.log(`│ ┌── HEADLINE TEXT ──`)
    console.log(`│ │ Content: "${slide.headline || 'NOT SET'}"`)
    console.log(`│ │ Font Family: ${slide.headline_font_family || 'NOT SET (default: Josefin Sans)'}`)
    console.log(`│ │ Font Size: ${slide.headline_font_size || 'NOT SET (default: 2.5rem)'}`)
    console.log(`│ │ Color: ${slide.headline_color || 'NOT SET (default: #000000)'}`)
    console.log(`│ │ Bold: ${slide.headline_bold || 'NOT SET (default: false)'}`)
    console.log(`│ │ Italic: ${slide.headline_italic || 'NOT SET (default: false)'}`)
    console.log(`│ │ Alignment: ${slide.headline_text_align || 'NOT SET (default: center)'}`)
    console.log(`│ └──`)

    // SUBHEADLINE
    console.log(`│ ┌── SUBHEADLINE TEXT ──`)
    console.log(`│ │ Content: "${slide.subheadline || 'NOT SET'}"`)
    console.log(`│ │ Font Family: ${slide.subheadline_font_family || 'NOT SET (default: Josefin Sans)'}`)
    console.log(`│ │ Font Size: ${slide.subheadline_font_size || 'NOT SET (default: 1.25rem)'}`)
    console.log(`│ │ Color: ${slide.subheadline_color || 'NOT SET (default: #000000)'}`)
    console.log(`│ │ Bold: ${slide.subheadline_bold || 'NOT SET (default: false)'}`)
    console.log(`│ │ Italic: ${slide.subheadline_italic || 'NOT SET (default: false)'}`)
    console.log(`│ │ Alignment: ${slide.subheadline_text_align || 'NOT SET (default: center)'}`)
    console.log(`│ └──`)

    // CONTENT (Features text)
    if (slide.features && slide.features.length > 0) {
      console.log(`│ ┌── FEATURES/CONTENT TEXT ──`)
      console.log(`│ │ Features Count: ${slide.features.length}`)
      slide.features.forEach((f, i) => {
        console.log(`│ │   ${i + 1}. "${f}"`)
      })
      console.log(`│ │ Font Family: ${slide.content_font_family || 'NOT SET (default: Cormorant Garamond)'}`)
      console.log(`│ │ Font Size: ${slide.content_font_size || 'NOT SET (default: clamp(1rem, 2vw, 1.125rem))'}`)
      console.log(`│ │ Color: ${slide.content_color || 'NOT SET (default: #374151)'}`)
      console.log(`│ │ Bold: ${slide.content_bold || 'NOT SET (default: false)'}`)
      console.log(`│ │ Italic: ${slide.content_italic || 'NOT SET (default: false)'}`)
      console.log(`│ │ Alignment: ${slide.content_text_align || 'NOT SET (default: left)'}`)
      console.log(`│ └──`)
    }

    console.log(`└────────────────────────────┘\n`)
  })

  // ===== STEPS BLOCK =====
  console.log('\n━━━━━ STEPS BLOCKS ━━━━━\n')

  const blocks = page.blocks || []
  const stepsBlocks = blocks.filter(b => b.type === 'steps')

  stepsBlocks.forEach((block, blockIdx) => {
    console.log(`┌─ STEPS BLOCK: "${block.name}" ─┐`)
    console.log(`│`)

    // HEADING
    console.log(`│ ┌── BLOCK HEADING ──`)
    console.log(`│ │ Content: "${block.data.heading || 'NOT SET'}"`)
    console.log(`│ │ Font Family: ${block.data.heading_font_family || 'NOT SET (default: Josefin Sans)'}`)
    console.log(`│ │ Font Size: ${block.data.heading_font_size || 'NOT SET (default: 2.5rem)'}`)
    console.log(`│ │ Color: ${block.data.heading_color || 'NOT SET (default: #000000)'}`)
    console.log(`│ └──`)
    console.log(`│`)

    // STEPS
    const steps = block.data.steps || []
    steps.forEach((step, stepIdx) => {
      console.log(`│ ┌── STEP ${stepIdx + 1} TEXT ──`)
      console.log(`│ │ Content: "${step.text_content?.substring(0, 60) || 'NOT SET'}..."`)
      console.log(`│ │ Position: ${step.text_position || 'NOT SET'}`)
      console.log(`│ │ Font Family: ${step.text_font_family || 'NOT SET (default: Cormorant Garamond)'}`)
      console.log(`│ │ Font Size: ${step.text_font_size || 'NOT SET (default: clamp(1rem, 2vw, 1.125rem))'}`)
      console.log(`│ │ Color: ${step.text_color || 'NOT SET (default: #374151)'}`)
      console.log(`│ │ Bold: ${step.text_bold || 'NOT SET (default: false)'}`)
      console.log(`│ │ Italic: ${step.text_italic || 'NOT SET (default: false)'}`)
      console.log(`│ │ Alignment: ${step.text_align || 'NOT SET (default: left)'}`)
      console.log(`│ │ Media: ${step.background_url ? step.background_type + ' (' + step.image_width + ')' : 'NONE'}`)
      console.log(`│ └──`)
      console.log(`│`)
    })

    console.log(`└────────────────────────────┘\n`)
  })

  // ===== PRICING BLOCKS =====
  const pricingBlocks = blocks.filter(b => b.type === 'pricing')
  if (pricingBlocks.length > 0) {
    console.log('\n━━━━━ PRICING BLOCKS ━━━━━\n')

    pricingBlocks.forEach(block => {
      console.log(`┌─ PRICING BLOCK: "${block.name}" ─┐`)
      console.log(`│`)
      console.log(`│ ┌── PRODUCT NAME ──`)
      console.log(`│ │ Content: "${block.data.product_name || 'NOT SET'}"`)
      console.log(`│ │ Font Family: ${block.data.product_name_font_family || 'NOT SET'}`)
      console.log(`│ │ Font Size: ${block.data.product_name_font_size || 'NOT SET'}`)
      console.log(`│ │ Color: ${block.data.product_name_color || 'NOT SET'}`)
      console.log(`│ └──`)
      console.log(`│`)
      console.log(`│ ┌── FEATURES TEXT ──`)
      const features = block.data.features || []
      features.forEach((f, i) => {
        console.log(`│ │   ${i + 1}. "${f}"`)
      })
      console.log(`│ │ Font Family: ${block.data.features_font_family || 'NOT SET'}`)
      console.log(`│ │ Font Size: ${block.data.features_font_size || 'NOT SET'}`)
      console.log(`│ │ Color: ${block.data.features_color || 'NOT SET'}`)
      console.log(`│ └──`)
      console.log(`│`)
      console.log(`│ ┌── PLAN HEADING ──`)
      console.log(`│ │ Content: "${block.data.plan_heading || 'NOT SET'}"`)
      console.log(`│ │ Font Family: ${block.data.plan_heading_font_family || 'NOT SET'}`)
      console.log(`│ │ Font Size: ${block.data.plan_heading_font_size || 'NOT SET'}`)
      console.log(`│ │ Color: ${block.data.plan_heading_color || 'NOT SET'}`)
      console.log(`│ └──`)
      console.log(`└────────────────────────────┘\n`)
    })
  }

  // ===== ACCORDION BLOCKS =====
  const accordionBlocks = blocks.filter(b => b.type === 'accordion')
  if (accordionBlocks.length > 0) {
    console.log('\n━━━━━ ACCORDION BLOCKS ━━━━━\n')

    accordionBlocks.forEach(block => {
      console.log(`┌─ ACCORDION BLOCK: "${block.name}" ─┐`)
      console.log(`│`)
      console.log(`│ ┌── HEADING ──`)
      console.log(`│ │ Content: "${block.data.heading || 'NOT SET'}"`)
      console.log(`│ │ Font Family: ${block.data.heading_font_family || 'NOT SET'}`)
      console.log(`│ │ Font Size: ${block.data.heading_font_size || 'NOT SET'}`)
      console.log(`│ │ Color: ${block.data.heading_color || 'NOT SET'}`)
      console.log(`│ └──`)
      console.log(`└────────────────────────────┘\n`)
    })
  }
}

checkAllTextFields()
