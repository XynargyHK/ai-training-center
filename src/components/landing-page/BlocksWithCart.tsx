'use client'

import type { LandingPageBlock } from '@/types/landing-page-blocks'
import BlockRendererSSR from './BlockRendererSSR'
import { useCart } from './CartProviderSSR'

interface BlocksWithCartProps {
  blocks: LandingPageBlock[]
}

export default function BlocksWithCart({ blocks }: BlocksWithCartProps) {
  const { addToCart } = useCart()

  return <BlockRendererSSR blocks={blocks} onAddToCart={addToCart} />
}
