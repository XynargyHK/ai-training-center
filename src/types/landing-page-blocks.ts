// ============================================================================
// Landing Page Blocks - Type Definitions
// ============================================================================

/**
 * Base interface for all landing page blocks
 */
export interface LandingPageBlock {
  id: string                    // Unique identifier (UUID)
  type: string                  // Block type (split, card, accordion, etc.)
  name: string                  // User-defined label for identification
  order: number                 // Position in page (0-indexed)
  data: Record<string, any>     // Block-specific data
}

/**
 * Split Block - Text alongside image
 * Used for: Product features, benefits, content sections
 */
export interface SplitBlockData {
  layout: 'image-left' | 'image-right'    // Image position
  image_url: string                        // Image URL
  headline: string                         // Main headline
  content: string                          // Body text/description
  cta_text?: string                        // Optional call-to-action button text
  cta_url?: string                         // Optional CTA link URL
}

/**
 * Card Block - Grid of cards with images
 * Used for: Testimonials, reviews, team members, features
 */
export interface CardBlockData {
  layout: 'grid-2' | 'grid-3' | 'grid-4' | 'carousel'  // Card layout
  cards: Array<{
    image_url: string              // Card image
    title: string                  // Card title/name
    content: string                // Card content/description
    rating?: number                // Star rating (1-5)
    badge?: string                 // Badge text (e.g., "Verified Customer")
    author?: string                // Author/attribution name
  }>
}

/**
 * Accordion Block - Collapsible content sections
 * Used for: FAQs, feature details, expandable content
 */
export interface AccordionBlockData {
  items: Array<{
    title: string                  // Section title/question
    content: string                // Section content/answer
  }>
}

/**
 * Testimonials Block - Customer reviews carousel
 * Used for: Customer testimonials, reviews, social proof
 */
export interface TestimonialsBlockData {
  heading?: string                       // Section heading (e.g., "Customer Reviews")
  heading_font_size?: string             // Heading font size
  heading_font_family?: string           // Heading font family
  heading_color?: string                 // Heading color
  testimonials: Array<{
    image_url: string                    // Before/After comparison image (square)
    name: string                         // Customer name
    age?: string                         // Customer age
    location?: string                    // Customer location
    rating: number                       // Star rating (1-5)
    benefits: string[]                   // List of benefits/highlights
    content: string                      // Testimonial quote/content
  }>
  background_color?: string              // Section background color
  autoplay?: boolean                     // Auto-advance carousel
  autoplay_interval?: number             // Auto-advance interval (ms)
}

/**
 * Pricing Block - Tiered pricing tables
 * Used for: Subscription plans, service packages, product options
 */
export interface PricingBlockData {
  headline?: string                       // Section headline (e.g., "Subscription Plans")
  subheadline?: string                    // Section subheadline/description
  tiers: Array<{
    name: string                          // Tier name (e.g., "Basic", "Pro")
    price: number                         // Monthly price
    currency: string                      // Currency (e.g., "USD", "HKD")
    frequency: 'monthly' | 'yearly' | 'one-time' // Billing frequency
    features: string[]                    // List of features included
    cta_text: string                      // Tier button text
    cta_url: string                       // Tier button link
    is_popular?: boolean                  // Highlight this tier
  }>
  background_color?: string              // Section background color
}

/**
 * Steps Block - Sequential steps or feature grid
 * Used for: How-to guides, implementation processes, core features
 */
export interface StepsBlockData {
  headline?: string                       // Section headline (e.g., "How it Works")
  subheadline?: string                    // Section subheadline/description
  steps: Array<{
    title: string                         // Step/Feature title
    description: string                   // Step/Feature description
    image_url?: string                    // Step/Feature image
    icon?: string                         // Optional icon name
  }>
  layout: 'steps' | 'grid'                // Display style
  background_color?: string              // Section background color
}

/**
 * Static Banner Block - Full-width background with overlay content
 * Used for: Heroes, CTAs, product showcases, sections
 */
export interface StaticBannerBlockData {
  headline: string                        // Main headline
  subheadline?: string                    // Subheadline/description
  cta_text?: string                       // Primary button text
  cta_url?: string                        // Primary button link
  background_url: string                  // Background image/video URL
  background_type: 'image' | 'video'      // Background type
  overlay_opacity: number                 // Darken overlay (0-1)
  text_align: 'left' | 'center' | 'right' // Text alignment
}

/**
 * Table Block - Customizable data table
 * Used for: Comparison charts, product specs, detailed data
 */
export interface TableBlockData {
  headline?: string                       // Table headline
  subheadline?: string                    // Table description
  rows: string[][]                        // 2D array of cell content
  header_row?: boolean                    // First row is header
  background_color?: string               // Section background color
}

/**
 * Form Block - Interactive data collection
 * Used for: Lead capture, registration, sign-offs, surveys
 */
export interface FormBlockData {
  headline: string                        // Form title
  subheadline?: string                    // Form description
  fields: Array<{
    id: string                            // Field unique ID
    label: string                         // Field label
    type: 'text' | 'email' | 'tel' | 'textarea' | 'checkbox' | 'select'
    placeholder: string                   // Input placeholder
    required: boolean                     // Is mandatory
    options?: string[]                    // Options for select
  }>
  submit_button_text: string              // Button label
  submit_button_color?: string            // Button color hex
  success_message: string                 // Post-submit text
  redirect_url?: string                   // Optional post-submit redirect
  background_color?: string               // Form container color
}

/**
 * Video Block - Embedded video content
 * Used for: Product demos, tutorials, interviews
 */
export interface VideoBlockData {
  headline?: string                       // Optional title
  video_url: string                       // URL or ID (YouTube/Vimeo)
  video_type: 'youtube' | 'vimeo' | 'direct'
  aspect_ratio: '16/9' | '4/3' | '1/1' | '9/16'
  autoplay: boolean
  muted: boolean
  loop: boolean
  controls: boolean
  max_width?: string                      // Constrain video width
}

/**
 * Social Feed Block - Social media post grid
 * Used for: Instagram feed, TikTok showcase, social proof
 */
export interface SocialFeedBlockData {
  headline: string                        // Section title
  layout: 'grid' | 'carousel' | 'list'
  columns: number                         // Grid columns count
  feeds: Array<{
    id: string                            // Unique ID
    type: 'instagram' | 'tiktok' | 'facebook' | 'twitter' | 'custom'
    url: string                           // Post link
    image_url?: string                    // Static preview
    username?: string                     // Social handle
  }>
  background_color?: string
}

/**
 * Logo Cloud Block - Partner/brand logo grid
 * Used for: "Trusted by", partner logos, certifications
 */
export interface LogoCloudBlockData {
  headline?: string                       // Optional section heading
  logos: Array<{
    id: string                            // Unique ID
    url: string                           // Logo image URL
    name: string                          // Brand name
    link?: string                         // Optional website link
  }>
  logo_height?: string                    // Logo sizing (e.g. "40px")
  grayscale?: boolean                     // Grayscale effect toggle
  opacity?: number                        // Logo opacity (0-1)
  background_color?: string
}

/**
 * Type guard to check if block is a specific type
 */
export function isBlockType<T>(
  block: LandingPageBlock,
  type: string
): block is LandingPageBlock & { data: T } {
  return block.type === type
}

/**
 * Helper to create a new block with default data
 */
export function createBlock(
  type: string,
  name: string,
  order: number,
  defaultData: Record<string, any>
): LandingPageBlock {
  return {
    id: crypto.randomUUID(),
    type,
    name,
    order,
    data: defaultData
  }
}
