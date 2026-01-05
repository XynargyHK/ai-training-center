// ============================================================================
// Block Registry - Available block types and their configurations
// ============================================================================

import type { LandingPageBlock } from '@/types/landing-page-blocks'

/**
 * Block type configuration
 */
export interface BlockTypeConfig {
  type: string                    // Unique type identifier
  label: string                   // Display name
  icon: string                    // Icon/emoji for UI
  description: string             // Short description
  defaultData: Record<string, any> // Default data when creating new block
  category: 'content' | 'social' | 'interactive'  // Block category
}

/**
 * Registry of all available block types
 */
export const BLOCK_TYPES: Record<string, BlockTypeConfig> = {
  split: {
    type: 'split',
    label: 'Split',
    icon: '⬌',
    description: 'Text alongside image - perfect for features and benefits',
    category: 'content',
    defaultData: {
      layout: 'image-right',
      image_url: '',
      headline: '',
      content: '',
      cta_text: '',
      cta_url: ''
    }
  },

  card: {
    type: 'card',
    label: 'Card',
    icon: '🎴',
    description: 'Grid of cards - ideal for testimonials and reviews',
    category: 'social',
    defaultData: {
      layout: 'grid-3',
      cards: [
        {
          image_url: '',
          title: '',
          content: '',
          rating: 5,
          badge: 'Verified Customer',
          author: ''
        }
      ]
    }
  },

  accordion: {
    type: 'accordion',
    label: 'Accordion',
    icon: '📋',
    description: 'Collapsible sections - great for FAQs and detailed content',
    category: 'interactive',
    defaultData: {
      items: [
        {
          title: '',
          content: ''
        }
      ]
    }
  },

  pricing: {
    type: 'pricing',
    label: 'Price',
    icon: '💰',
    description: 'Product pricing with plan options',
    category: 'content',
    defaultData: {
      // Product name
      product_name: 'Product Name',
      product_name_font_size: '2rem',
      product_name_font_family: 'Josefin Sans',
      product_name_color: '#000000',

      // Features
      features: [
        'Feature 1',
        'Feature 2',
        'Feature 3',
        'Feature 4'
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
          title: '1 Month (2 Treatments)',
          original_price: 99,
          discounted_price: 79
        },
        {
          title: '3 Months (6 Treatments)',
          original_price: 199,
          discounted_price: 149
        },
        {
          title: '6 Months (12 Treatments)',
          original_price: 299,
          discounted_price: 199
        }
      ],

      // CTA button
      cta_text: 'Buy Now & SAVE',
      currency_symbol: '$',
      background_color: '#ffffff'
    }
  },

  testimonials: {
    type: 'testimonials',
    label: 'Testimonials',
    icon: '⭐',
    description: 'Customer reviews carousel with before/after images',
    category: 'social',
    defaultData: {
      heading: 'Customer Reviews',
      heading_font_size: '2.5rem',
      heading_font_family: 'Josefin Sans',
      heading_color: '#000000',
      background_color: '#ffffff',
      autoplay: false,
      autoplay_interval: 5000,
      testimonials: [
        {
          image_url: '',
          name: 'Emily R.',
          age: '28',
          location: 'California',
          rating: 5,
          benefits: [
            'Reduce the appearance of Acne scars & uneven texture',
            'Delivers youthful glow after just 1 treatment',
            'Virtually painless & completely safe'
          ],
          content: 'I\'ve tried lasers, peels, and every serum imaginable. What surprised me was how smooth my skin felt after just one micro-infusion treatment. My acne scars look noticeably softer, and my makeup sits so much better now. It feels like my skincare is finally doing something.'
        },
        {
          image_url: '',
          name: 'Laura M.',
          age: '45',
          location: 'New York',
          rating: 5,
          benefits: [
            'Reduces the appearance of Fine lines & early sagging!',
            'Delivers youthful glow after just 2 treatments!'
          ],
          content: 'I\'m very cautious about treatments — I don\'t want injectables, but regular skincare wasn\'t enough anymore. This gave me a visible tightening effect without irritation. After 2 treatments, the fine lines around my mouth and eyes looked less pronounced. My skin just looks healthier.'
        },
        {
          image_url: '',
          name: 'Jessica T.',
          age: '40',
          location: 'Texas',
          rating: 5,
          benefits: [
            'Reduces the look of large pores & dull skin',
            'Delivers youthful glow after just 2 treatments!'
          ],
          content: 'My skin tone has always been uneven, especially after years of sun exposure. After using this system, my skin looked brighter almost immediately, and over time my pores looked more refined. It gave me that fresh, rested look I hadn\'t seen in years.'
        }
      ]
    }
  },

  steps: {
    type: 'steps',
    label: 'Text/Image Grid',
    icon: '📝',
    description: 'Flexible grid layout combining text and images - vertical or horizontal',
    category: 'content',
    defaultData: {
      heading: 'HOW TO USE',
      heading_font_size: '2.5rem',
      heading_font_family: 'Josefin Sans',
      heading_color: '#000000',
      background_color: '#ffffff',
      overall_layout: 'vertical',
      steps: [
        {
          background_url: '',
          background_type: 'image',
          image_width: '400px',
          text_content: 'Step 1 instructions go here...',
          text_position: 'right',
          text_font_size: '1rem',
          text_font_family: 'Cormorant Garamond',
          text_color: '#000000',
          text_bold: false,
          text_italic: false,
          text_align: 'left'
        }
      ]
    }
  },

  static_banner: {
    type: 'static_banner',
    label: 'Static Banner',
    icon: '🖼️',
    description: 'Full-width banner with background image/video and text overlay',
    category: 'content',
    defaultData: {
      background_url: '',
      background_type: 'image',
      background_color: '#1e293b',
      headline: 'Your Headline Here',
      headline_font_size: 'clamp(1.875rem, 5vw, 3.75rem)',
      headline_font_family: 'Josefin Sans',
      headline_color: '#ffffff',
      headline_bold: false,
      headline_italic: false,
      headline_text_align: 'center',
      subheadline: 'Your Subheadline',
      subheadline_font_size: 'clamp(1.125rem, 2.5vw, 1.25rem)',
      subheadline_font_family: 'Josefin Sans',
      subheadline_color: '#ffffff',
      subheadline_bold: false,
      subheadline_italic: false,
      subheadline_text_align: 'center',
      content: '',
      content_font_size: 'clamp(1rem, 2vw, 1.125rem)',
      content_font_family: 'Josefin Sans',
      content_color: '#ffffff',
      content_bold: false,
      content_italic: false,
      content_text_align: 'center',
      cta_text: 'SHOP NOW',
      cta_url: '/livechat/shop'
    }
  },

  policies: {
    type: 'policies',
    label: 'Policies',
    icon: '📜',
    description: 'Legal policies - Terms of Service, Privacy, Refund, Shipping',
    category: 'content',
    defaultData: {
      company_name: '',
      brand_name: '',
      website_url: '',
      contact_email: '',
      contact_address: '',
      governing_state: '',
      effective_date: '',
      liability_cap: '$500',
      refund_days: '30',
      refund_processing_days: '7-10',
      warranty_months: '12',
      restocking_fee: '$10',
      return_address: '',
      processing_days: '1-3',
      domestic_shipping_days: '2-5 business days',
      international_shipping_days: '7-14 business days',
      free_shipping_threshold: '$50',
      shipping_carriers: 'USPS, DHL, FedEx',
      cutoff_time: '2:00 PM EST',
      warehouse_location: 'United States',
      policies: {
        terms_of_service: { enabled: true, content: '' },
        privacy_policy: { enabled: true, content: '' },
        refund_policy: { enabled: true, content: '' },
        shipping_policy: { enabled: true, content: '' }
      }
    }
  }
}

/**
 * Get block type configuration by type
 */
export function getBlockTypeConfig(type: string): BlockTypeConfig | undefined {
  return BLOCK_TYPES[type]
}

/**
 * Get all block types as array
 */
export function getAllBlockTypes(): BlockTypeConfig[] {
  return Object.values(BLOCK_TYPES)
}

/**
 * Get block types by category
 */
export function getBlockTypesByCategory(category: string): BlockTypeConfig[] {
  return Object.values(BLOCK_TYPES).filter(block => block.category === category)
}

/**
 * Create a new block instance with default data
 */
export function createNewBlock(type: string, name: string, order: number): LandingPageBlock | null {
  const config = getBlockTypeConfig(type)
  if (!config) return null

  // Use config label + "Block" as the default name
  const defaultName = `${config.label} Block`

  return {
    id: crypto.randomUUID(),
    type: config.type,
    name: name || defaultName,
    order,
    data: JSON.parse(JSON.stringify(config.defaultData)) // Deep clone
  }
}
