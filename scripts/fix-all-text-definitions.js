const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixAllTextDefinitions() {
  console.log('=== FIXING ALL TEXT DEFINITIONS ===\n')

  const { data: page } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('business_unit_id', '77313e61-2a19-4f3e-823b-80390dde8bd2')
    .single()

  if (!page) {
    console.log('No landing page found')
    return
  }

  let fixedCount = 0

  // Fix HERO SLIDES
  const slides = page.hero_slides || []
  slides.forEach((slide, index) => {
    const slideNum = index + 1

    // Headline defaults (matching rendering code defaults)
    if (!slide.headline_font_family) {
      slide.headline_font_family = 'Josefin Sans'
      console.log(`✓ Slide ${slideNum}: Set headline_font_family = Josefin Sans`)
      fixedCount++
    }
    if (!slide.headline_font_size) {
      slide.headline_font_size = '2.5rem'
      console.log(`✓ Slide ${slideNum}: Set headline_font_size = 2.5rem`)
      fixedCount++
    }
    if (!slide.headline_color) {
      slide.headline_color = '#000000'
      console.log(`✓ Slide ${slideNum}: Set headline_color = #000000`)
      fixedCount++
    }
    if (slide.headline_bold === undefined) {
      slide.headline_bold = false
      console.log(`✓ Slide ${slideNum}: Set headline_bold = false`)
      fixedCount++
    }
    if (slide.headline_italic === undefined) {
      slide.headline_italic = false
      console.log(`✓ Slide ${slideNum}: Set headline_italic = false`)
      fixedCount++
    }
    if (!slide.headline_text_align) {
      slide.headline_text_align = 'center'
      console.log(`✓ Slide ${slideNum}: Set headline_text_align = center`)
      fixedCount++
    }

    // Subheadline defaults
    if (slide.subheadline) {
      if (!slide.subheadline_font_family) {
        slide.subheadline_font_family = 'Josefin Sans'
        console.log(`✓ Slide ${slideNum}: Set subheadline_font_family = Josefin Sans`)
        fixedCount++
      }
      if (!slide.subheadline_font_size) {
        slide.subheadline_font_size = '1.25rem'
        console.log(`✓ Slide ${slideNum}: Set subheadline_font_size = 1.25rem`)
        fixedCount++
      }
      if (!slide.subheadline_color) {
        slide.subheadline_color = '#000000'
        console.log(`✓ Slide ${slideNum}: Set subheadline_color = #000000`)
        fixedCount++
      }
      if (slide.subheadline_bold === undefined) {
        slide.subheadline_bold = false
        console.log(`✓ Slide ${slideNum}: Set subheadline_bold = false`)
        fixedCount++
      }
      if (slide.subheadline_italic === undefined) {
        slide.subheadline_italic = false
        console.log(`✓ Slide ${slideNum}: Set subheadline_italic = false`)
        fixedCount++
      }
      if (!slide.subheadline_text_align) {
        slide.subheadline_text_align = 'center'
        console.log(`✓ Slide ${slideNum}: Set subheadline_text_align = center`)
        fixedCount++
      }
    }

    // Content/Features defaults (matching Features rendering defaults)
    if (slide.features && slide.features.length > 0) {
      if (slide.content_bold === undefined) {
        slide.content_bold = false
        console.log(`✓ Slide ${slideNum}: Set content_bold = false`)
        fixedCount++
      }
      if (slide.content_italic === undefined) {
        slide.content_italic = false
        console.log(`✓ Slide ${slideNum}: Set content_italic = false`)
        fixedCount++
      }
    }
  })

  // Fix STEPS BLOCKS
  const blocks = page.blocks || []
  const stepsBlocks = blocks.filter(b => b.type === 'steps')
  stepsBlocks.forEach((block) => {
    const steps = block.data.steps || []
    steps.forEach((step, stepIdx) => {
      if (step.text_bold === undefined) {
        step.text_bold = false
        console.log(`✓ Steps Block "${block.name}" Step ${stepIdx + 1}: Set text_bold = false`)
        fixedCount++
      }
      if (step.text_italic === undefined) {
        step.text_italic = false
        console.log(`✓ Steps Block "${block.name}" Step ${stepIdx + 1}: Set text_italic = false`)
        fixedCount++
      }
    })
  })

  console.log(`\n=== Fixed ${fixedCount} text definitions ===\n`)

  // Save to database
  console.log('Saving to database...')
  const { error } = await supabase
    .from('landing_pages')
    .update({
      hero_slides: slides,
      blocks: blocks
    })
    .eq('id', page.id)

  if (error) {
    console.error('Error updating:', error)
  } else {
    console.log('✓ Successfully saved all fixes to database!')
  }
}

fixAllTextDefinitions()
