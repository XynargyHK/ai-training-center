'use client'

import type { LandingPageBlock } from '@/types/landing-page-blocks'
import SplitBlock from './blocks/SplitBlock'
import PricingBlock from './blocks/PricingBlock'
import TestimonialsBlock from './blocks/TestimonialsBlock'
import AccordionBlock from './blocks/AccordionBlock'
import StepsBlock from './blocks/StepsBlock'

interface BlockRendererProps {
  blocks: LandingPageBlock[]
}

export default function BlockRenderer({ blocks }: BlockRendererProps) {
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

        switch (block.type) {
          case 'split':
            return <SplitBlock key={block.id} data={block.data as any} />

          case 'pricing':
            return <PricingBlock key={block.id} data={block.data as any} />

          case 'testimonials':
            return <TestimonialsBlock key={block.id} data={block.data as any} />

          case 'card':
            // TODO: Implement CardBlock component
            return (
              <div key={block.id} className="py-16 px-4 bg-gray-50">
                <div className="max-w-6xl mx-auto text-center text-gray-500">
                  Card Block (Coming Soon)
                </div>
              </div>
            )

          case 'accordion':
            return <AccordionBlock key={block.id} data={block.data as any} />

          case 'steps':
            return <StepsBlock key={block.id} data={block.data as any} />

          default:
            // Silently skip unknown block types (legacy blocks or removed types)
            console.warn(`[BlockRenderer] Unknown block type "${block.type}" - skipping`)
            return null
        }
      })}
    </>
  )
}
