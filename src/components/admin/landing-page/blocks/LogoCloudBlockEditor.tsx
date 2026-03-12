'use client'

import React from 'react'
import type { LandingPageBlock } from '@/types/landing-page-blocks'
import TextEditorControls from '../TextEditorControls'

interface LogoCloudBlockEditorProps {
  block: LandingPageBlock
  onUpdate: (block: LandingPageBlock) => void
  onMediaLibraryOpen: (callback: (url: string) => void) => void
}

export default function LogoCloudBlockEditor({ block, onUpdate, onMediaLibraryOpen }: LogoCloudBlockEditorProps) {
  const data = block.data as {
    headline: string
    headline_font_size?: string
    headline_font_family?: string
    headline_color?: string
    headline_bold?: boolean
    headline_italic?: boolean
    headline_text_align?: 'left' | 'center' | 'right'

    logos: Array<{
      id: string
      url: string
      name: string
      link?: string
    }>

    background_color?: string
    logo_height?: string
    grayscale?: boolean
    opacity?: number
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

  const addLogo = () => {
    onMediaLibraryOpen((url) => {
      const newLogos = [
        ...(data.logos || []),
        {
          id: crypto.randomUUID(),
          url,
          name: 'New Partner'
        }
      ]
      updateData({ logos: newLogos })
    })
  }

  const removeLogo = (id: string) => {
    const newLogos = data.logos.filter(l => l.id !== id)
    updateData({ logos: newLogos })
  }

  return (
    <div className="space-y-6">
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">Headline (Optional)</label>
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
          bold={data.headline_bold}
          onBoldChange={(val) => updateData({ headline_bold: val })}
          italic={data.headline_italic}
          onItalicChange={(val) => updateData({ headline_italic: val })}
          textAlign={data.headline_text_align}
          onTextAlignChange={(val) => updateData({ headline_text_align: val })}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Partner Logos</label>
          <button
            onClick={addLogo}
            className="px-3 py-1 bg-violet-600 text-white text-xs rounded-md hover:bg-violet-700 transition-colors"
          >
            + Add Logo
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {(data.logos || []).map((logo) => (
            <div key={logo.id} className="relative aspect-video bg-white border border-gray-200 rounded p-2 flex items-center justify-center group">
              <img src={logo.url} alt={logo.name} className="max-w-full max-h-full object-contain" />
              <button
                onClick={() => removeLogo(logo.id)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <label className="block text-xs font-medium text-gray-600 mb-3">Styling & Layout</label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] text-gray-500 mb-1">Logo Height</label>
            <input
              type="text"
              value={data.logo_height || '40px'}
              onChange={(e) => updateData({ logo_height: e.target.value })}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded outline-none"
              placeholder="e.g. 40px"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 mb-1">Background Color</label>
            <input
              type="color"
              value={data.background_color || '#ffffff'}
              onChange={(e) => updateData({ background_color: e.target.value })}
              className="w-full h-8 border-none p-0 cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={data.grayscale}
                onChange={(e) => updateData({ grayscale: e.target.checked })}
                className="rounded text-violet-600 focus:ring-violet-500"
              />
              <span className="text-xs text-gray-600">Grayscale</span>
            </label>
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 mb-1">Logo Opacity ({data.opacity || 0.6})</label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={data.opacity || 0.6}
              onChange={(e) => updateData({ opacity: parseFloat(e.target.value) })}
              className="w-full accent-violet-600"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
