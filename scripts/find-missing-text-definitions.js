const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function findMissingTextDefinitions() {
  console.log('=== FINDING ALL MISSING TEXT DEFINITIONS ===\n')

  const { data: page } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('business_unit_id', '77313e61-2a19-4f3e-823b-80390dde8bd2')
    .single()

  if (!page) {
    console.log('No landing page found')
    return
  }

  const issues = []

  // Check HERO SLIDES
  const slides = page.hero_slides || []
  slides.forEach((slide, index) => {
    const slideNum = index + 1

    // Headline
    if (!slide.headline_font_family) issues.push(`Slide ${slideNum}: headline_font_family NOT SET`)
    if (!slide.headline_font_size && slideNum > 1) issues.push(`Slide ${slideNum}: headline_font_size NOT SET`)
    if (!slide.headline_color && slide.headline_color !== '#ffffff') issues.push(`Slide ${slideNum}: headline_color NOT SET`)
    if (slide.headline_bold === undefined) issues.push(`Slide ${slideNum}: headline_bold NOT SET`)
    if (slide.headline_italic === undefined) issues.push(`Slide ${slideNum}: headline_italic NOT SET`)
    if (!slide.headline_text_align) issues.push(`Slide ${slideNum}: headline_text_align NOT SET`)

    // Subheadline
    if (slide.subheadline && !slide.subheadline_font_family) issues.push(`Slide ${slideNum}: subheadline_font_family NOT SET`)
    if (slide.subheadline && !slide.subheadline_font_size && slideNum !== 9) issues.push(`Slide ${slideNum}: subheadline_font_size NOT SET`)
    if (slide.subheadline && !slide.subheadline_color) issues.push(`Slide ${slideNum}: subheadline_color NOT SET`)
    if (slide.subheadline && slide.subheadline_bold === undefined) issues.push(`Slide ${slideNum}: subheadline_bold NOT SET`)
    if (slide.subheadline && slide.subheadline_italic === undefined) issues.push(`Slide ${slideNum}: subheadline_italic NOT SET`)
    if (slide.subheadline && !slide.subheadline_text_align && slideNum !== 2 && slideNum !== 9) issues.push(`Slide ${slideNum}: subheadline_text_align NOT SET`)

    // Content/Features
    if (slide.features && slide.features.length > 0) {
      if (slide.content_bold === undefined) issues.push(`Slide ${slideNum}: content_bold NOT SET`)
      if (slide.content_italic === undefined) issues.push(`Slide ${slideNum}: content_italic NOT SET`)
    }
  })

  // Check STEPS BLOCKS
  const blocks = page.blocks || []
  const stepsBlocks = blocks.filter(b => b.type === 'steps')
  stepsBlocks.forEach((block, blockIdx) => {
    const steps = block.data.steps || []
    steps.forEach((step, stepIdx) => {
      if (step.text_bold === undefined) issues.push(`Steps Block "${block.name}" Step ${stepIdx + 1}: text_bold NOT SET`)
      if (step.text_italic === undefined) issues.push(`Steps Block "${block.name}" Step ${stepIdx + 1}: text_italic NOT SET`)
    })
  })

  // Check PRICING BLOCKS
  const pricingBlocks = blocks.filter(b => b.type === 'pricing')
  pricingBlocks.forEach(block => {
    if (block.data.product_name && !block.data.product_name_font_family) {
      issues.push(`Pricing Block "${block.name}": product_name_font_family NOT SET`)
    }
    if (block.data.product_name && !block.data.product_name_font_size) {
      issues.push(`Pricing Block "${block.name}": product_name_font_size NOT SET`)
    }
    if (block.data.product_name && !block.data.product_name_color) {
      issues.push(`Pricing Block "${block.name}": product_name_color NOT SET`)
    }
    if (block.data.features && !block.data.features_font_family) {
      issues.push(`Pricing Block "${block.name}": features_font_family NOT SET`)
    }
    if (block.data.features && !block.data.features_font_size) {
      issues.push(`Pricing Block "${block.name}": features_font_size NOT SET`)
    }
    if (block.data.features && !block.data.features_color) {
      issues.push(`Pricing Block "${block.name}": features_color NOT SET`)
    }
  })

  // Check ACCORDION BLOCKS
  const accordionBlocks = blocks.filter(b => b.type === 'accordion')
  accordionBlocks.forEach(block => {
    // Accordion items have their own text, need to check if they have font controls
  })

  // Check TESTIMONIALS BLOCKS
  const testimonialBlocks = blocks.filter(b => b.type === 'testimonials')
  testimonialBlocks.forEach(block => {
    if (block.data.heading && !block.data.heading_font_family) {
      issues.push(`Testimonials Block "${block.name}": heading_font_family NOT SET`)
    }
  })

  console.log(`Found ${issues.length} missing text definitions:\n`)
  issues.forEach(issue => console.log(`  ✗ ${issue}`))

  if (issues.length === 0) {
    console.log('  ✓ All text definitions are complete!')
  }
}

findMissingTextDefinitions()
