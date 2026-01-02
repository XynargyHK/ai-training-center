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
