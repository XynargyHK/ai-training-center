'use client'

import type { LandingPageBlock } from '@/types/landing-page-blocks'
import SplitBlock from './blocks/SplitBlock'
import TestimonialsBlock from './blocks/TestimonialsBlock'
import AccordionBlock from './blocks/AccordionBlock'
import StepsBlock from './blocks/StepsBlock'
import PricingBlock from './blocks/PricingBlock'
import StaticBannerBlock from './blocks/StaticBannerBlock'
import TableBlock from './blocks/TableBlock'

// Convert block name to URL-friendly anchor slug
function toAnchorSlug(name: string | undefined): string | undefined {
  if (!name) return undefined
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')          // Replace spaces with hyphens
    .replace(/-+/g, '-')           // Remove duplicate hyphens
    .trim()
}

interface BlockRendererProps {
  blocks: LandingPageBlock[]
  onAddToCart?: (product: any) => void
}

export default function BlockRenderer({ blocks, onAddToCart }: BlockRendererProps) {
  console.log('[BlockRenderer] Rendering', blocks.length, 'blocks')

  if (!blocks || blocks.length === 0) {
    console.log('[BlockRenderer] No blocks to render')
    return null
  }

  blocks.forEach((block, idx) => {
    console.log(`[BlockRenderer] Block ${idx}: type=${block.type}, id=${block.id}`)
  })

  return (
    <>
      {blocks.map((block, idx) => {
        console.log(`[BlockRenderer] Rendering block ${idx}: ${block.type}`)

        // Generate anchor slug from block name/headline
        const anchorId = toAnchorSlug(block.name)

        switch (block.type) {
          case 'split':
            return <SplitBlock key={block.id} anchorId={anchorId} data={block.data as any} />

          case 'pricing':
            return <PricingBlock key={block.id} anchorId={anchorId} data={block.data as any} onAddToCart={onAddToCart} />

          case 'testimonials':
            return <TestimonialsBlock key={block.id} anchorId={anchorId} data={block.data as any} heading={block.name} />

          case 'card':
            // TODO: Implement CardBlock component
            return (
              <div key={block.id} id={anchorId} className="py-16 px-4 bg-gray-50">
                <div className="max-w-6xl mx-auto text-center text-gray-500">
                  Card Block (Coming Soon)
                </div>
              </div>
            )

          case 'accordion':
            return <AccordionBlock key={block.id} anchorId={anchorId} data={block.data as any} heading={block.name} />

          case 'steps':
            return <StepsBlock key={block.id} anchorId={anchorId} data={block.data as any} heading={block.name} />

          case 'static_banner':
            return <StaticBannerBlock key={block.id} anchorId={anchorId} data={block.data as any} />

          case 'table':
            return <TableBlock key={block.id} anchorId={anchorId} data={block.data as any} heading={block.name} />

          default:
            // Silently skip unknown block types (legacy blocks or removed types)
            console.warn(`[BlockRenderer] Unknown block type "${block.type}" - skipping`)
            return null
        }
      })}
    </>
  )
}
