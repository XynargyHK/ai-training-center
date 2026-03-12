'use client'

import React from 'react'
import type { LandingPageBlock } from '@/types/landing-page-blocks'
import TextEditorControls from '../TextEditorControls'

interface BrezCodeHeroEditorProps {
  block: LandingPageBlock
  onUpdate: (block: LandingPageBlock) => void
}

export default function BrezCodeHeroEditor({ block, onUpdate }: BrezCodeHeroEditorProps) {
  const data = block.data as {
    headline: string
    subheadline: string
    cta_text: string
    cta_url: string
    background_image?: string
  }

  const updateData = (updates: Partial<typeof data>) => {
    onUpdate({
      ...block,
      data: {
        ...block.data,
        ...updates
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">Headline</label>
        <TextEditorControls
          label="Headline"
          value={data.headline}
          onChange={(val) => updateData({ headline: val })}
        />
      </div>
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">Subheadline</label>
        <TextEditorControls
          label="Subheadline"
          value={data.subheadline}
          onChange={(val) => updateData({ subheadline: val })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">CTA Text</label>
          <input
            type="text"
            value={data.cta_text}
            onChange={(e) => updateData({ cta_text: e.target.value })}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">CTA URL</label>
          <input
            type="text"
            value={data.cta_url}
            onChange={(e) => updateData({ cta_url: e.target.value })}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
          />
        </div>
      </div>
    </div>
  )
}
