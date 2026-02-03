// Seed landing page content for business units
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// SkinCoach landing page content
const skincoachLandingPage = {
  // Multiple announcements that rotate every 5 seconds
  announcements: [
    'KOREAN CLINIC-GRADE FORMULA | The Same Regeneration Cocktail Used in $500 Facials',
    'FREE SHIPPING ON ORDERS OVER $99',
    'LIMITED TIME: 60% OFF - Only 17% Stock Left!'
  ],

  hero_headline: 'Defeat Fine Lines From The Root',
  hero_subheadline: 'Reclaim Youthful Radiance. Rediscover Your Confident Self.',
  hero_product_name: 'Korean PDRN + GHK-Cu + Goji Exosomes Triple Regeneration Micro-Infusion Kit',
  hero_benefits: [
    "Instantly reduces crow's feet, smile lines & forehead wrinkles",
    '30x absorption - delivers actives deep into skin',
    '5-minute treatment, painless, at-home care'
  ],
  hero_cta_text: 'Shop Now - 60% OFF',

  clinical_results: [
    { value: '94%', label: "Crow's Feet\nImproved" },
    { value: '97%', label: 'Smile Lines\nSoftened' },
    { value: '90%', label: 'Forehead\nSmoothed' }
  ],

  tech_headline: 'Dual Technology. Reverse Skin Aging.',
  tech_subheadline: 'Professional-grade ingredients delivered deep into your skin with micro-infusion technology',
  tech_features: [
    {
      icon: '🧪',
      title: 'Triple Regeneration Serum',
      items: [
        'PDRN Salmon DNA - Cell Repair',
        'GHK-Cu Copper Peptide - Collagen Rebuild',
        'Goji Exosomes - Glass Skin Glow'
      ]
    },
    {
      icon: '✨',
      title: 'Micro-Infusion Device',
      items: [
        '0.25mm Medical-Grade Needles',
        '300% Absorption Boost',
        'Safe & Painless'
      ]
    }
  ],

  performance_metrics: [
    { value: '30x', label: 'Absorption\nvs Creams' },
    { value: '15x', label: 'Penetration\nvs Home Devices' },
    { value: '15x', label: 'Value vs\nClinic' }
  ],

  how_to_use_headline: 'Simple 4 Steps',
  how_to_use_steps: [
    { icon: '①', text: 'Pour serum' },
    { icon: '②', text: 'Wait 1-2 min' },
    { icon: '③', text: 'Press on face' },
    { icon: '④', text: 'Apply remaining' }
  ],
  how_to_use_footer: '5 minutes | Twice monthly | Safe & painless',

  ingredients_headline: 'Triple Active Formula',
  ingredients_subheadline: 'The 2024-2025 "Regeneration Cocktail" trending in Korean luxury clinics',
  ingredients: [
    {
      icon: '🧬',
      name: 'PDRN 3%',
      description: 'Deep-sea salmon DNA regeneration factor',
      benefits: [
        'Activates cell repair at molecular level',
        'Boosts collagen & elastin production',
        'Creates plumper, denser skin'
      ]
    },
    {
      icon: '🔷',
      name: 'GHK-Cu Copper Tripeptide',
      description: 'Activates 4,000+ genes for skin remodeling',
      benefits: [
        'Firms & tightens loose skin',
        'Reduces fine lines & deep wrinkles',
        'Evens skin tone & fades dark spots'
      ],
      badge: '💡 Blue serum = Proof of authentic concentration'
    },
    {
      icon: '🫐',
      name: 'Goji Berry Exosomes',
      description: 'Korean glass-skin secret ingredient',
      benefits: [
        'Delivers "water glow" effect',
        'Powerful antioxidant protection',
        'Enhances penetration of other actives'
      ]
    }
  ],

  pricing_headline: 'Limited Time Offer',
  pricing_subheadline: 'Choose your package',
  pricing_options: [
    {
      id: '4-month',
      label: '4-Month Supply',
      sessions: 8,
      originalPrice: 399,
      salePrice: 199,
      perSession: 25,
      discount: 60,
      popular: true
    },
    {
      id: '3-month',
      label: '3-Month Supply',
      sessions: 6,
      originalPrice: 299,
      salePrice: 149,
      perSession: 25,
      discount: 50,
      popular: false
    },
    {
      id: '1-month',
      label: '1-Month Trial',
      sessions: 2,
      originalPrice: 99,
      salePrice: 99,
      perSession: 50,
      discount: 0,
      popular: false
    }
  ],
  show_sold_indicator: true,
  sold_percentage: 83,

  testimonials_headline: 'Customer Reviews',
  testimonials: [
    {
      name: 'Jane L.',
      age: '30s',
      text: 'My skin is noticeably firmer, fine lines less visible',
      rating: 5
    },
    {
      name: 'Christy T.',
      age: '40s',
      text: 'Visible improvement in 3 months. Friends keep asking what I did',
      rating: 5
    },
    {
      name: 'Annie P.',
      age: '30s',
      text: 'Eye area improved the most. Results exceeded expectations',
      rating: 5
    },
    {
      name: 'Emily S.',
      age: '45',
      text: 'After 6 weeks, the fine lines around my eyes visibly reduced. My skin feels so much firmer.',
      rating: 5
    }
  ],
  testimonials_stats: {
    recommend_pct: 98,
    five_star_pct: 91
  },

  landing_faqs: [
    {
      question: 'What is PDRN?',
      answer: "Salmon DNA-derived regeneration factor that activates cell repair and boosts collagen production. It's the #1 ingredient in Korean 'baby skin' facials."
    },
    {
      question: 'When will I see results?',
      answer: 'Hydration and glow from first use. Visible firming and wrinkle reduction in 4-6 weeks. Dramatic transformation by week 8-12.'
    },
    {
      question: 'Does it hurt?',
      answer: 'Mild tingling that fades in seconds. Safe and painless. Much gentler than professional microneedling.'
    },
    {
      question: 'Why is the serum blue?',
      answer: "The blue color comes from Copper Tripeptide-1 (GHK-Cu). This is proof of authentic, properly concentrated copper peptide. Beware of colorless 'copper peptide' products."
    },
    {
      question: 'Suitable for sensitive skin?',
      answer: 'Yes! All three ingredients have anti-inflammatory properties. This formula is excellent for sensitive, rosacea-prone, or post-procedure skin.'
    },
    {
      question: 'How often should I use it?',
      answer: 'Every two weeks for best results. Each session takes only 5 minutes.'
    }
  ],

  trust_badges: [
    { icon: '🇰🇷', label: 'Made in Korea' },
    { icon: '🛡️', label: 'Medical-Grade' },
    { icon: '🔄', label: '30-Day Guarantee' },
    { icon: '🚚', label: 'Free Shipping' }
  ],

  footer_disclaimer: 'Our products are not intended to diagnose, cure, or prevent specific diseases or medical conditions.',

  primary_color: '#4A90D9',
  secondary_color: '#0D1B2A',
  is_active: true
}

async function seedLandingPages() {
  try {
    console.log('Seeding landing pages...\n')

    // Get business units
    const { data: businessUnits, error: buError } = await supabase
      .from('business_units')
      .select('id, name, slug')

    if (buError) {
      console.error('Error fetching business units:', buError)
      return
    }

    console.log('Found business units:', businessUnits.map(b => b.name).join(', '))

    // Find SkinCoach
    const skincoach = businessUnits.find(b => b.slug === 'skincoach')

    if (skincoach) {
      console.log(`\nSeeding landing page for ${skincoach.name}...`)

      // Check if landing page already exists
      const { data: existing } = await supabase
        .from('landing_pages')
        .select('id')
        .eq('business_unit_id', skincoach.id)
        .single()

      if (existing) {
        // Update existing
        const { error: updateError } = await supabase
          .from('landing_pages')
          .update({
            ...skincoachLandingPage,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)

        if (updateError) {
          console.error('Error updating landing page:', updateError)
        } else {
          console.log(`✅ Updated landing page for ${skincoach.name}`)
        }
      } else {
        // Create new
        const { error: insertError } = await supabase
          .from('landing_pages')
          .insert({
            business_unit_id: skincoach.id,
            ...skincoachLandingPage
          })

        if (insertError) {
          console.error('Error creating landing page:', insertError)
        } else {
          console.log(`✅ Created landing page for ${skincoach.name}`)
        }
      }
    } else {
      console.log('⚠️ SkinCoach business unit not found')
    }

    // List other business units that don't have landing pages yet
    const otherUnits = businessUnits.filter(b => b.slug !== 'skincoach')
    if (otherUnits.length > 0) {
      console.log('\n📋 Other business units (no landing page yet):')
      otherUnits.forEach(b => {
        console.log(`   - ${b.name} (${b.slug})`)
      })
      console.log('\n   These will show a generic welcome page with links to shop.')
    }

    console.log('\n✅ Landing page seeding complete!')

  } catch (err) {
    console.error('Error:', err)
  }
}

seedLandingPages()
