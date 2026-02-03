require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const LANDING_PAGE_ID = '7cb58d30-65a3-4fcc-8fa5-e263855b6a55'

async function moveSlide10ToBlock() {
  console.log('🔄 Moving Slide 10 to become a pricing block...\n')

  // First, get current blocks
  const { data: page, error: fetchError } = await supabase
    .from('landing_pages')
    .select('blocks, hero_slides')
    .eq('id', LANDING_PAGE_ID)
    .single()

  if (fetchError) {
    console.error('Error fetching page:', fetchError)
    return
  }

  console.log('Current blocks:', page.blocks?.length || 0)

  // Get slide 10 content
  const slide10 = page.hero_slides[9] // Index 9 is slide 10
  console.log('Slide 10 content:', slide10)

  // Create new pricing block with slide 10 content
  const newPricingBlock = {
    id: crypto.randomUUID(),
    type: 'pricing',
    name: slide10.headline || 'Micro Infusion System',
    order: 0, // Insert at beginning (before testimonials)
    data: {
      // Product name from slide headline
      product_name: slide10.headline || 'Micro Infusion System',
      product_name_font_size: '2rem',
      product_name_font_family: 'Josefin Sans',
      product_name_color: '#000000',

      // Features - we can add default ones
      features: [
        'Titanium 0.5mm microneedles',
        'Clinic-Regen BioActives',
        'Reduce multiple skin concerns',
        'Professional results at home'
      ],
      features_font_size: '1rem',
      features_font_family: 'Cormorant Garamond',
      features_color: '#374151',

      // Choose Your Plan heading
      plan_heading: 'Choose Your Plan',
      plan_heading_font_size: '1.25rem',
      plan_heading_font_family: 'Josefin Sans',
      plan_heading_color: '#000000',

      // Plan options
      plans: [
        {
          title: '1 Month Supply',
          original_price: 99,
          discounted_price: 79
        },
        {
          title: '3 Months Supply',
          original_price: 199,
          discounted_price: 149
        },
        {
          title: '6 Months Supply',
          original_price: 299,
          discounted_price: 199
        }
      ],

      // CTA button from slide
      cta_text: slide10.cta_text || 'Subscribe & SAVE',
      currency_symbol: '$',
      background_color: '#ffffff'
    }
  }

  // Update all existing block orders (increment by 1)
  const updatedBlocks = (page.blocks || []).map(block => ({
    ...block,
    order: block.order + 1
  }))

  // Add new block at the beginning
  const allBlocks = [newPricingBlock, ...updatedBlocks]

  console.log('\nNew blocks structure:')
  allBlocks.forEach((block, idx) => {
    console.log(`  ${idx + 1}. ${block.name} (${block.type}) - order: ${block.order}`)
  })

  // Update the landing page
  const { error: updateError } = await supabase
    .from('landing_pages')
    .update({ blocks: allBlocks })
    .eq('id', LANDING_PAGE_ID)

  if (updateError) {
    console.error('Error updating page:', updateError)
    return
  }

  console.log('\n✅ Successfully moved Slide 10 to pricing block!')
  console.log('   The pricing block is now at order 0 (above testimonials)')
}

moveSlide10ToBlock()
