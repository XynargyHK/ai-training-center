'use client'

import React from 'react'
import type { LandingPageBlock } from '@/types/landing-page-blocks'
import TextEditorControls from '../TextEditorControls'

interface VideoBlockEditorProps {
  block: LandingPageBlock
  onUpdate: (block: LandingPageBlock) => void
}

export default function VideoBlockEditor({ block, onUpdate }: VideoBlockEditorProps) {
  const data = block.data as {
    headline: string
    headline_font_size?: string
    headline_font_family?: string
    headline_color?: string
    headline_bold?: boolean
    headline_italic?: boolean
    headline_text_align?: 'left' | 'center' | 'right'

    video_url: string
    video_type: 'youtube' | 'vimeo' | 'direct'
    aspect_ratio: '16/9' | '4/3' | '1/1' | '9/16'
    autoplay: boolean
    muted: boolean
    loop: boolean
    controls: boolean
    
    max_width?: string
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

  return (
    <div className="space-y-6">
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">Video Headline (Optional)</label>
        <TextEditorControls
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

      <div className="p-4 bg-white border border-gray-200 rounded-lg space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Video Type</label>
            <select
              value={data.video_type}
              onChange={(e) => updateData({ video_type: e.target.value as any })}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded outline-none"
            >
              <option value="youtube">YouTube</option>
              <option value="vimeo">Vimeo</option>
              <option value="direct">Direct Video URL (.mp4)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Aspect Ratio</label>
            <select
              value={data.aspect_ratio}
              onChange={(e) => updateData({ aspect_ratio: e.target.value as any })}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded outline-none"
            >
              <option value="16/9">Landscape (16:9)</option>
              <option value="4/3">Classic (4:3)</option>
              <option value="1/1">Square (1:1)</option>
              <option value="9/16">Portrait (9:16)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Video URL / ID</label>
          <input
            type="text"
            value={data.video_url}
            onChange={(e) => updateData({ video_url: e.target.value })}
            placeholder={data.video_type === 'youtube' ? 'YouTube Video ID or URL' : 'Video URL'}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded outline-none"
          />
          <p className="text-[10px] text-gray-400 mt-1">
            {data.video_type === 'youtube' ? 'Example: dQw4w9WgXcQ or full URL' : 'Provide the direct link to the video.'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.autoplay}
              onChange={(e) => updateData({ autoplay: e.target.checked })}
              className="rounded text-violet-600 focus:ring-violet-500"
            />
            <span className="text-xs text-gray-600">Autoplay</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.muted}
              onChange={(e) => updateData({ muted: e.target.checked })}
              className="rounded text-violet-600 focus:ring-violet-500"
            />
            <span className="text-xs text-gray-600">Muted</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.loop}
              onChange={(e) => updateData({ loop: e.target.checked })}
              className="rounded text-violet-600 focus:ring-violet-500"
            />
            <span className="text-xs text-gray-600">Loop</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.controls}
              onChange={(e) => updateData({ controls: e.target.checked })}
              className="rounded text-violet-600 focus:ring-violet-500"
            />
            <span className="text-xs text-gray-600">Show Controls</span>
          </label>
        </div>
      </div>

      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Max Width</label>
            <input
              type="text"
              value={data.max_width || '800px'}
              onChange={(e) => updateData({ max_width: e.target.value })}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded outline-none"
              placeholder="e.g. 800px or 100%"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Background Color</label>
            <input
              type="color"
              value={data.background_color || '#ffffff'}
              onChange={(e) => updateData({ background_color: e.target.value })}
              className="w-full h-8 border-none p-0 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
