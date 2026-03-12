'use client'

import React from 'react'
import type { LandingPageBlock } from '@/types/landing-page-blocks'
import TextEditorControls from '../TextEditorControls'

interface StatsGridBlockEditorProps {
  block: LandingPageBlock
  onUpdate: (block: LandingPageBlock) => void
}

export default function StatsGridBlockEditor({ block, onUpdate }: StatsGridBlockEditorProps) {
  const data = block.data as {
    headline: string
    headline_font_size?: string
    headline_font_family?: string
    headline_color?: string
    headline_text_align?: 'left' | 'center' | 'right'
    
    subheadline: string
    
    stats: Array<{
      id: string
      value: string
      label: string
      prefix?: string
      suffix?: string
      color?: string
    }>
    
    background_color?: string
    columns: number
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

  const addStat = () => {
    const newStats = [
      ...(data.stats || []),
      { id: crypto.randomUUID(), value: '99%', label: 'Success Rate' }
    ]
    updateData({ stats: newStats })
  }

  const updateStat = (id: string, updates: any) => {
    const newStats = data.stats.map(s => s.id === id ? { ...s, ...updates } : s)
    updateData({ stats: newStats })
  }

  const removeStat = (id: string) => {
    const newStats = data.stats.filter(s => s.id !== id)
    updateData({ stats: newStats })
  }

  return (
    <div className="space-y-6">
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">Section Headline</label>
        <TextEditorControls
          label="Headline"
          value={data.headline}
          onChange={(val) => updateData({ headline: val })}
          textAlign={data.headline_text_align}
          onTextAlignChange={(val) => updateData({ headline_text_align: val })}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Statistics</label>
          <button
            onClick={addStat}
            className="px-3 py-1 bg-violet-600 text-white text-xs rounded-md hover:bg-violet-700 transition-colors"
          >
            + Add Stat
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {(data.stats || []).map((stat) => (
            <div key={stat.id} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm space-y-3 relative group">
              <button
                onClick={() => removeStat(stat.id)}
                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">Value (e.g. 96%)</label>
                  <input
                    type="text"
                    value={stat.value}
                    onChange={(e) => updateStat(stat.id, { value: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">Label</label>
                  <input
                    type="text"
                    value={stat.label}
                    onChange={(e) => updateStat(stat.id, { label: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
