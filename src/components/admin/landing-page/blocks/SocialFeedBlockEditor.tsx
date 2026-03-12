'use client'

import React from 'react'
import type { LandingPageBlock } from '@/types/landing-page-blocks'
import TextEditorControls from '../TextEditorControls'

interface SocialFeedBlockEditorProps {
  block: LandingPageBlock
  onUpdate: (block: LandingPageBlock) => void
}

export default function SocialFeedBlockEditor({ block, onUpdate }: SocialFeedBlockEditorProps) {
  const data = block.data as {
    headline: string
    headline_font_size?: string
    headline_font_family?: string
    headline_color?: string
    headline_bold?: boolean
    headline_italic?: boolean
    headline_text_align?: 'left' | 'center' | 'right'

    layout: 'grid' | 'carousel' | 'list'
    columns: number
    
    feeds: Array<{
      id: string
      type: 'instagram' | 'tiktok' | 'facebook' | 'twitter' | 'custom'
      url: string
      image_url?: string
      username?: string
      content?: string
    }>

    background_color?: string
    text_color?: string
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

  const addFeed = () => {
    const newFeeds = [
      ...(data.feeds || []),
      {
        id: crypto.randomUUID(),
        type: 'instagram' as const,
        url: '',
        username: '@username'
      }
    ]
    updateData({ feeds: newFeeds })
  }

  const updateFeed = (id: string, updates: any) => {
    const newFeeds = data.feeds.map(f => f.id === id ? { ...f, ...updates } : f)
    updateData({ feeds: newFeeds })
  }

  const removeFeed = (id: string) => {
    const newFeeds = data.feeds.filter(f => f.id !== id)
    updateData({ feeds: newFeeds })
  }

  return (
    <div className="space-y-6">
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">Social Headline</label>
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
            <label className="block text-xs font-medium text-gray-600 mb-1">Layout</label>
            <select
              value={data.layout}
              onChange={(e) => updateData({ layout: e.target.value as any })}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded outline-none"
            >
              <option value="grid">Grid</option>
              <option value="carousel">Carousel</option>
              <option value="list">List</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Columns (Grid Only)</label>
            <input
              type="number"
              min="1"
              max="6"
              value={data.columns}
              onChange={(e) => updateData({ columns: parseInt(e.target.value) })}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded outline-none"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-700">Feed Posts</label>
            <button
              onClick={addFeed}
              className="px-2 py-1 bg-violet-600 text-white text-[10px] rounded hover:bg-violet-700 transition-colors"
            >
              + Add Post
            </button>
          </div>

          <div className="space-y-2">
            {(data.feeds || []).map((feed) => (
              <div key={feed.id} className="p-3 bg-gray-50 border border-gray-200 rounded relative group">
                <button
                  onClick={() => removeFeed(feed.id)}
                  className="absolute top-1 right-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <select
                    value={feed.type}
                    onChange={(e) => updateFeed(feed.id, { type: e.target.value })}
                    className="px-1 py-0.5 text-[10px] border border-gray-300 rounded outline-none bg-white"
                  >
                    <option value="instagram">Instagram</option>
                    <option value="tiktok">TikTok</option>
                    <option value="facebook">Facebook</option>
                    <option value="twitter">Twitter</option>
                    <option value="custom">Custom</option>
                  </select>
                  <input
                    type="text"
                    value={feed.username}
                    onChange={(e) => updateFeed(feed.id, { username: e.target.value })}
                    placeholder="@username"
                    className="px-1 py-0.5 text-[10px] border border-gray-300 rounded outline-none bg-white"
                  />
                </div>
                <input
                  type="text"
                  value={feed.url}
                  onChange={(e) => updateFeed(feed.id, { url: e.target.value })}
                  placeholder="Post URL"
                  className="w-full px-1 py-0.5 text-[10px] border border-gray-300 rounded outline-none bg-white mb-1"
                />
                <input
                  type="text"
                  value={feed.image_url}
                  onChange={(e) => updateFeed(feed.id, { image_url: e.target.value })}
                  placeholder="Preview Image URL (Optional)"
                  className="w-full px-1 py-0.5 text-[10px] border border-gray-300 rounded outline-none bg-white"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <label className="block text-xs font-medium text-gray-600 mb-2">Block Styling</label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] text-gray-500 mb-1">Background Color</label>
            <input
              type="color"
              value={data.background_color || '#ffffff'}
              onChange={(e) => updateData({ background_color: e.target.value })}
              className="w-full h-8 border-none p-0 cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 mb-1">Text Color</label>
            <input
              type="color"
              value={data.text_color || '#000000'}
              onChange={(e) => updateData({ text_color: e.target.value })}
              className="w-full h-8 border-none p-0 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
