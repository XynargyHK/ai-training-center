'use client'

import { Eye, EyeOff } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import type { LandingPageBlock } from '@/types/landing-page-blocks'
import BlockRenderer from '@/components/landing-page/BlockRenderer'

interface BlockPreviewProps {
  blocks: LandingPageBlock[]
}

export default function BlockPreview({ blocks }: BlockPreviewProps) {
  const [showPreview, setShowPreview] = useState(true) // Show by default
  const [renderKey, setRenderKey] = useState(0)
  const previousBlocksRef = useRef<string>('')

  // Force re-render when blocks change
  useEffect(() => {
    const currentBlocks = JSON.stringify(blocks)
    if (currentBlocks !== previousBlocksRef.current) {
      console.log('[BlockPreview] Blocks changed, forcing re-render')
      setRenderKey(prev => prev + 1)
      previousBlocksRef.current = currentBlocks
    }
  }, [blocks])

  if (!blocks || blocks.length === 0) {
    return null
  }

  return (
    <div className="bg-slate-700/50 rounded-lg border border-slate-600 overflow-hidden">
      <button
        onClick={() => setShowPreview(!showPreview)}
        className="w-full px-6 py-3 flex items-center justify-between bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {showPreview ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          <span className="font-medium text-white">
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </span>
        </div>
        <span className="text-sm text-slate-400">
          {blocks.length} block{blocks.length !== 1 ? 's' : ''}
        </span>
      </button>

      {showPreview && (
        <div key={renderKey} className="bg-white">
          <BlockRenderer blocks={blocks} />
        </div>
      )}
    </div>
  )
}
