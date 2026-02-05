import type { LandingPageBlock } from '@/types/landing-page-blocks'
import SplitBlockSSR from './blocks/SplitBlockSSR'
import TestimonialsBlock from './blocks/TestimonialsBlock'
import AccordionBlock from './blocks/AccordionBlock'
import StepsBlockSSR from './blocks/StepsBlockSSR'
import PricingBlock from './blocks/PricingBlock'
import StaticBannerBlockSSR from './blocks/StaticBannerBlockSSR'
import TableBlockSSR from './blocks/TableBlockSSR'

function toAnchorSlug(name: string | undefined): string | undefined {
  if (!name) return undefined
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

interface BlockRendererSSRProps {
  blocks: LandingPageBlock[]
  onAddToCart?: (product: any) => void
}

export default function BlockRendererSSR({ blocks, onAddToCart }: BlockRendererSSRProps) {
  if (!blocks || blocks.length === 0) {
    return null
  }

  return (
    <>
      {blocks.map((block, idx) => {
        const anchorId = block.data?.anchor_id || toAnchorSlug(block.name)

        switch (block.type) {
          case 'split':
            return <SplitBlockSSR key={block.id} anchorId={anchorId} data={block.data as any} />

          case 'pricing':
            // PricingBlock stays as client component (needs useState for plan selection + cart)
            return <PricingBlock key={block.id} anchorId={anchorId} data={block.data as any} onAddToCart={onAddToCart} />

          case 'testimonials':
            // TestimonialsBlock stays as client component (needs useState for carousel)
            return <TestimonialsBlock key={block.id} anchorId={anchorId} data={block.data as any} heading={block.name} />

          case 'accordion':
            // AccordionBlock stays as client component (needs useState for expand/collapse)
            return <AccordionBlock key={block.id} anchorId={anchorId} data={block.data as any} heading={block.name} />

          case 'steps':
            return <StepsBlockSSR key={block.id} anchorId={anchorId} data={block.data as any} heading={block.name} />

          case 'static_banner':
            return <StaticBannerBlockSSR key={block.id} anchorId={anchorId} data={block.data as any} />

          case 'table':
            return <TableBlockSSR key={block.id} anchorId={anchorId} data={block.data as any} heading={block.name} />

          default:
            return null
        }
      })}
    </>
  )
}
