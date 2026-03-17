'use client'

import type { LandingPageBlock } from '@/types/landing-page-blocks'
import SplitBlock from './blocks/SplitBlock'
import CardBlockSSR from './blocks/CardBlockSSR'
import TestimonialsBlock from './blocks/TestimonialsBlock'
import AccordionBlock from './blocks/AccordionBlock'
import StepsBlock from './blocks/StepsBlock'
import PricingBlock from './blocks/PricingBlock'
import StaticBannerBlock from './blocks/StaticBannerBlock'
import TableBlock from './blocks/TableBlock'
import FormBlock from './blocks/FormBlock'
import VideoBlock from './blocks/VideoBlock'
import SocialFeedBlock from './blocks/SocialFeedBlock'
import LogoCloudBlock from './blocks/LogoCloudBlock'
import ImageGridBlock from './blocks/ImageGridBlock'
import StatsGridBlock from './blocks/StatsGridBlock'
import LeadMagnetBlock from './blocks/LeadMagnetBlock'
import PDFReaderBlock from './blocks/PDFReaderBlock'

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
  businessUnitId?: string
}

export default function BlockRenderer({ blocks, onAddToCart, businessUnitId }: BlockRendererProps) {
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

        // Use custom anchor_id if set, otherwise generate from block name
        // anchor_id should be language-independent (English) for consistent links across languages
        const anchorId = block.data?.anchor_id || toAnchorSlug(block.name)

        switch (block.type) {
          case 'split':
            return <SplitBlock key={block.id} anchorId={anchorId} data={block.data as any} />

          case 'pricing':
            return <PricingBlock key={block.id} anchorId={anchorId} data={block.data as any} onAddToCart={onAddToCart} />

          case 'testimonials':
            return <TestimonialsBlock key={block.id} anchorId={anchorId} data={block.data as any} heading={block.name} />

          case 'card':
            return <CardBlockSSR key={block.id} anchorId={anchorId} data={block.data as any} heading={block.name} />

          case 'accordion':
            return <AccordionBlock key={block.id} anchorId={anchorId} data={block.data as any} heading={block.name} />

          case 'steps':
          case 'text_image_grid':
            return <StepsBlock key={block.id} anchorId={anchorId} data={block.data as any} heading={block.name} />

          case 'static_banner':
            return <StaticBannerBlock key={block.id} anchorId={anchorId} data={block.data as any} />

          case 'table':
            return <TableBlock key={block.id} anchorId={anchorId} data={block.data as any} heading={block.name} />

          case 'form':
            return <FormBlock key={block.id} block={block} />

          case 'video':
            return <VideoBlock key={block.id} anchorId={anchorId} block={block} />

          case 'social_feed':
            return <SocialFeedBlock key={block.id} anchorId={anchorId} block={block} />

          case 'logo_cloud':
            return <LogoCloudBlock key={block.id} anchorId={anchorId} block={block} />

          case 'image_grid':
            return <ImageGridBlock key={block.id} anchorId={anchorId} block={block} />

          case 'stats_grid':
            return <StatsGridBlock key={block.id} anchorId={anchorId} block={block} />

          case 'lead_magnet':
            return <LeadMagnetBlock key={block.id} block={block} businessUnitId={businessUnitId} />

          case 'pdf_reader':
            return <PDFReaderBlock key={block.id} block={block} />

          default:
            // Silently skip unknown block types (legacy blocks or removed types)
            console.warn(`[BlockRenderer] Unknown block type "${block.type}" - skipping`)
            return null
        }
      })}
    </>
  )
}
