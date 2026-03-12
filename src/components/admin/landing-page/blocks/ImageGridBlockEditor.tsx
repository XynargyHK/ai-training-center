'use client'

import React from 'react'
import type { LandingPageBlock } from '@/types/landing-page-blocks'
import TextEditorControls from '../TextEditorControls'

interface ImageGridBlockEditorProps {
  block: LandingPageBlock
  onUpdate: (block: LandingPageBlock) => void
  onMediaLibraryOpen: (callback: (url: string) => void) => void
}

export default function ImageGridBlockEditor({ block, onUpdate, onMediaLibraryOpen }: ImageGridBlockEditorProps) {
  const data = block.data as {
    headline: string
    headline_font_size?: string
    headline_font_family?: string
    headline_color?: string
    headline_text_align?: 'left' | 'center' | 'right'
    
    columns: number
    gap: string
    images: Array<{
      id: string
      url: string
      caption?: string
      alt?: string
    }>
    
    background_color?: string
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

  const addImage = () => {
    onMediaLibraryOpen((url) => {
      const newImages = [
        ...(data.images || []),
        { id: crypto.randomUUID(), url, caption: '' }
      ]
      updateData({ images: newImages })
    })
  }

  const updateImage = (id: string, updates: any) => {
    const newImages = data.images.map(img => img.id === id ? { ...img, ...updates } : img)
    updateData({ images: newImages })
  }

  const removeImage = (id: string) => {
    const newImages = data.images.filter(img => img.id !== id)
    updateData({ images: newImages })
  }

  return (
    <div className="space-y-6">
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">Grid Headline</label>
        <TextEditorControls
          label="Headline"
          value={data.headline}
          onChange={(val) => updateData({ headline: val })}
          fontSize={data.headline_font_size}
          onFontSizeChange={(val) => updateData({ headline_font_size: val })}
          fontFamily={data.headline_font_family}
          onFontFamilyChange={(val) => updateData({ headline_font_family: val })}
          color={data.headline_color}
          onColorChange={(val) => updateData({ headline_color: val })}
          textAlign={data.headline_text_align}
          onTextAlignChange={(val) => updateData({ headline_text_align: val })}
        />
      </div>

      <div className="p-4 bg-white border border-gray-200 rounded-lg space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Columns</label>
            <select
              value={data.columns}
              onChange={(e) => updateData({ columns: parseInt(e.target.value) })}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded outline-none"
            >
              <option value={1}>1 Column</option>
              <option value={2}>2 Columns</option>
              <option value={3}>3 Columns</option>
              <option value={4}>4 Columns</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Gap Size</label>
            <select
              value={data.gap}
              onChange={(e) => updateData({ gap: e.target.value })}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded outline-none"
            >
              <option value="0.5rem">Small</option>
              <option value="1rem">Medium</option>
              <option value="2rem">Large</option>
              <option value="0">None</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-700">Grid Images</label>
            <button
              onClick={addImage}
              className="px-2 py-1 bg-violet-600 text-white text-[10px] rounded hover:bg-violet-700 transition-colors"
            >
              + Add Image
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(data.images || []).map((img) => (
              <div key={img.id} className="relative aspect-square bg-gray-100 rounded overflow-hidden group">
                <img src={img.url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                  <input
                    type="text"
                    value={img.caption}
                    onChange={(e) => updateImage(img.id, { caption: e.target.value })}
                    placeholder="Caption..."
                    className="w-full bg-white/20 text-white text-[10px] px-1 rounded border-none outline-none mb-1"
                  />
                  <button
                    onClick={() => removeImage(img.id)}
                    className="w-full bg-red-500 text-white text-[10px] py-1 rounded"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
