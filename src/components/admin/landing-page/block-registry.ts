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
    label: 'Features',
    icon: '✨',
    description: 'High-impact section with text and image side-by-side. Best for key benefits.',
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

  table: {
    type: 'table',
    label: 'Table',
    icon: '📊',
    description: 'Table with customizable rows and columns',
    category: 'content',
    defaultData: {
      headline: '',
      headline_font_size: 'clamp(1.5rem, 3vw, 2rem)',
      headline_font_family: 'Josefin Sans',
      headline_color: '#000000',
      headline_bold: false,
      headline_italic: false,
      headline_align: 'center',
      subheadline: '',
      subheadline_font_size: 'clamp(1rem, 2vw, 1.25rem)',
      subheadline_font_family: 'Josefin Sans',
      subheadline_color: '#666666',
      subheadline_bold: false,
      subheadline_italic: false,
      subheadline_align: 'center',
      content: '',
      content_font_size: 'clamp(0.875rem, 1.5vw, 1rem)',
      content_font_family: 'Cormorant Garamond',
      content_color: '#374151',
      content_bold: false,
      content_italic: false,
      content_align: 'center',
      background_color: '#ffffff',
      rows: 3,
      columns: 3,
      table_data: [
        ['Header 1', 'Header 2', 'Header 3'],
        ['Row 1 Col 1', 'Row 1 Col 2', 'Row 1 Col 3'],
        ['Row 2 Col 1', 'Row 2 Col 2', 'Row 2 Col 3']
      ],
      header_bg_color: '#f3f4f6',
      header_text_color: '#000000',
      cell_bg_color: '#ffffff',
      cell_text_color: '#374151',
      border_color: '#e5e7eb'
    }
  },

  form: {
    type: 'form',
    label: 'Form',
    icon: '📝',
    // ... rest of form config
  },

  lead_magnet: {
    type: 'lead_magnet',
    label: 'Educational Guide (Lead Magnet)',
    icon: '🎁',
    description: 'High-converting hook to capture emails via professional guide downloads.',
    category: 'interactive',
    defaultData: {
      headline: '🎁 限時禮遇：專屬「乳房健康與淋巴排毒」精華指南',
      subheadline: '由專家編撰的 15 分鐘居家護理方案。僅限 BrezCode 會員免費下載，立即領取您的電子版手冊。',
      content: `<p><b>為什麼您需要這份指南？</b></p><ul><li>掌握獨家 8 步淋巴引流手法</li><li>提升護理乳液的吸收效率達 300%</li><li>建立每日 15 分鐘的健康儀式感</li></ul><p>這份指南原為內部培訓資料，現在特別開放給掃碼用戶。請立即解鎖，確保您掌握正確的居家護理細節。</p>`,
      cta_text: '立即解鎖並下載 PDF 指南',
      success_message: '恭喜！您的專屬指南已解鎖。請點擊下方按鈕開始下載，建議將此頁面加入書籤以便每日查看。',
      button_color: '#7c3aed',
      background_color: '#f9fafb',
      text_color: '#111827',
      pdf_url: ''
    }
  },

  video: {
    type: 'video',
    label: 'Video',
    icon: '🎥',
    description: 'Embed YouTube, Vimeo, or direct video files',
    category: 'content',
    defaultData: {
      headline: '',
      video_url: '',
      video_type: 'youtube',
      aspect_ratio: '16/9',
      autoplay: false,
      muted: false,
      loop: false,
      controls: true,
      max_width: '800px',
      background_color: '#ffffff'
    }
  },

  social_feed: {
    type: 'social_feed',
    label: 'Social Feed',
    icon: '📱',
    description: 'Display social media posts from Instagram, TikTok, etc.',
    category: 'social',
    defaultData: {
      headline: 'Follow Us on Social',
      layout: 'grid',
      columns: 3,
      feeds: [
        {
          id: 'post-1',
          type: 'instagram',
          url: 'https://instagram.com',
          username: '@yourbrand'
        }
      ],
      background_color: '#fafafa',
      text_color: '#000000'
    }
  },

  logo_cloud: {
    type: 'logo_cloud',
    label: 'Logo Cloud',
    icon: '🏢',
    description: 'Display partner or brand logos for trust and social proof',
    category: 'social',
    defaultData: {
      headline: 'TRUSTED BY LEADING BRANDS',
      headline_font_size: '1.25rem',
      headline_font_family: 'Josefin Sans',
      headline_color: '#6b7280',
      logos: [],
      background_color: '#ffffff',
      logo_height: '40px',
      grayscale: true,
      opacity: 0.6
    }
  },

  image_grid: {
    type: 'image_grid',
    label: 'Image Grid',
    icon: '🖼️',
    description: 'A responsive grid of images with captions',
    category: 'content',
    defaultData: {
      headline: '',
      columns: 3,
      gap: '1rem',
      images: [],
      background_color: '#ffffff'
    }
  },

  text_image_grid: {
    type: 'text_image_grid',
    label: 'Text/Image Grid',
    icon: '🖼️',
    description: 'Flexible grid of text and images. Ideal for features, services, or process steps.',
    category: 'content',
    defaultData: {
      heading: 'Our Features',
      heading_font_size: '2.5rem',
      heading_font_family: 'Josefin Sans',
      heading_color: '#000000',
      background_color: '#ffffff',
      overall_layout: 'horizontal',
      steps: [
        {
          background_url: '',
          background_type: 'image',
          image_width: '400px',
          subheadline: 'Feature Title',
          text_content: 'Feature description goes here...',
          text_position: 'above',
          text_font_size: '1rem',
          text_font_family: 'Cormorant Garamond',
          text_color: '#000000'
        }
      ]
    }
  },

  stats_grid: {
    type: 'stats_grid',
    label: 'Stats Grid',
    icon: '📈',
    description: 'Display impact numbers and statistics',
    category: 'content',
    defaultData: {
      headline: 'Our Impact in Numbers',
      stats: [
        { id: '1', value: '96%', label: 'Customer Satisfaction' },
        { id: '2', value: '10k+', label: 'Active Users' },
        { id: '3', value: '24/7', label: 'Support Available' }
      ],
      background_color: '#f9fafb'
    }
  },

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
