const { createClient } = require('@supabase/supabase-js')
const { randomUUID } = require('crypto')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function addFAQAccordion() {
  console.log('🔍 Looking for SkinCoach landing page...')

  // Get SkinCoach business unit
  const { data: businessUnit, error: buError } = await supabase
    .from('business_units')
    .select('id, name')
    .eq('name', 'SkinCoach')
    .single()

  if (buError || !businessUnit) {
    console.error('❌ Business unit not found:', buError)
    return
  }

  console.log('✅ Found business unit:', businessUnit.name, businessUnit.id)

  // Get or create landing page
  let { data: landingPage, error: lpError } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('business_unit_id', businessUnit.id)
    .maybeSingle()

  // Create landing page if it doesn't exist
  if (!landingPage) {
    console.log('📝 Creating new landing page...')
    const { data: newPage, error: createError } = await supabase
      .from('landing_pages')
      .insert({
        business_unit_id: businessUnit.id,
        hero_headline: 'Welcome',
        hero_subheadline: 'Discover our products',
        hero_cta_text: 'Shop Now',
        blocks: [],
        is_published: false,
        menu_items: [],
        announcements: []
      })
      .select()
      .single()

    if (createError || !newPage) {
      console.error('❌ Failed to create landing page:', createError)
      return
    }

    landingPage = newPage
    console.log('✅ Created landing page:', landingPage.id)
  } else {
    console.log('✅ Found landing page:', landingPage.id)
  }

  // Parse existing blocks
  const existingBlocks = landingPage.blocks || []
  console.log(`📦 Current blocks: ${existingBlocks.length}`)

  // Create FAQ accordion block
  const faqAccordion = {
    id: randomUUID(),
    type: 'accordion',
    name: 'FAQ Accordion',
    order: existingBlocks.length,
    data: {
      heading: 'Frequently Asked Questions',
      heading_font_size: '2.5rem',
      heading_font_family: 'Josefin Sans',
      heading_color: '#000000',
      background_color: '#ffffff',
      items: [
        {
          title: 'When will I see the results?',
          content: 'The micro-infusion treatment serves as a highly efficient skin-enhancing procedure, yielding a noticeable increase in radiance, a reduction in fine lines, and an overall refreshed complexion within the following day or two. Engaging in multiple sessions enhances these skin benefits progressively over time. This swift and user-friendly home facial is particularly well-suited for perform one or two days before important events, ensuring a heightened boost to your skin\'s complexion when it matters most.'
        },
        {
          title: 'How often can I do the treatment?',
          content: 'We recommend a Micro-Infusion treatment every 2 weeks for the best results!'
        },
        {
          title: 'Does it hurt?',
          content: 'The sensation is similar to a minor pinprick, and it\'s virtually painless. The ultra-fine needles, measuring a mere 0.5mm in length and thinner than human hair, ensure a treatment experience with minimal discomfort. While there might be a slight initial unease or occasional pinprick, users tend to react to the sensation swiftly as they starting the treatment.'
        },
        {
          title: 'When is the best time to do micro-infusion?',
          content: 'We suggest performing the treatment in the evening before bedtime. It is advisable to refrain from sun exposure and makeup application for the following 24 hours post-treatment.'
        },
        {
          title: 'What are the serum ingredients?',
          content: 'Water, Butylene Glycol, Glycerin, Copper Tripeptide-1, Sodium Hyaluronate, Hydrolyzed Sclerotium Gum, Sodium DNA(PDRN), Saccharide Isomerate, Citric Acid, Sodium Citrate, Lycium Barbarum Callus (Goji Exosome) Culture Extract, Isomalt, Lecithin, Propanediol, 1,2-Hexanediol, Caprylhydroxamic Acid'
        },
        {
          title: 'Can you use it around the eyes, lips and on the neck?',
          content: 'If you\'re wondering whether you can use the Micro Infusion System (MIS) around your eyes, lips, and neck, the answer is yes! Using MIS is an excellent method for addressing eye bags, wrinkles, fine lines, and saggy skin. It\'s safe to use on any areas of your skin that require extra attention.'
        }
      ]
    }
  }

  // Add the new block
  const updatedBlocks = [...existingBlocks, faqAccordion]

  // Update landing page
  const { error: updateError } = await supabase
    .from('landing_pages')
    .update({ blocks: updatedBlocks })
    .eq('id', landingPage.id)

  if (updateError) {
    console.error('❌ Failed to update landing page:', updateError)
    return
  }

  console.log('✅ FAQ Accordion added successfully!')
  console.log(`📊 Total blocks now: ${updatedBlocks.length}`)
  console.log('\n📋 FAQ Items added:')
  faqAccordion.data.items.forEach((item, i) => {
    console.log(`  ${i + 1}. ${item.title}`)
  })
}

addFAQAccordion()
  .then(() => {
    console.log('\n✨ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
