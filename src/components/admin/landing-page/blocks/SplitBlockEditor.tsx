'use client'

import { useState, useRef } from 'react'
import { Upload, Image as ImageIcon, Loader2, X } from 'lucide-react'
import type { LandingPageBlock } from '@/types/landing-page-blocks'
import type { SplitBlockData } from '@/types/landing-page-blocks'

interface SplitBlockEditorProps {
  block: LandingPageBlock
  onUpdate: (block: LandingPageBlock) => void
  onMediaLibraryOpen?: (callback: (url: string) => void) => void
  businessUnitId?: string
}

const COLOR_PALETTE = [
  { name: 'White', value: '#ffffff' },
  { name: 'Black', value: '#000000' },
  { name: 'Dark Gray', value: '#374151' },
  { name: 'Gray', value: '#6b7280' },
  { name: 'Light Gray', value: '#d1d5db' },
  { name: 'Slate', value: '#1e293b' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Lime', value: '#84cc16' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Sky', value: '#0ea5e9' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Fuchsia', value: '#d946ef' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Rose', value: '#f43f5e' },
]

export default function SplitBlockEditor({ block, onUpdate, onMediaLibraryOpen, businessUnitId }: SplitBlockEditorProps) {
  const data = block.data as SplitBlockData
  const [uploading, setUploading] = useState(false)
  const [showButtonColorPicker, setShowButtonColorPicker] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const updateData = (updates: Partial<SplitBlockData>) => {
    onUpdate({
      ...block,
      data: { ...data, ...updates }
    })
  }

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!businessUnitId) {
      alert('Business Unit ID is required for upload')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('businessUnit', businessUnitId)

      const response = await fetch('/api/media-library', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()
      updateData({ image_url: result.file.url })
    } catch (error) {
      console.error('Upload error:', error)
      alert(`Failed to upload: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Layout Selector */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <label className="block text-sm font-medium text-gray-600 mb-2">Layout</label>
        <div className="flex gap-2">
          <button
            onClick={() => updateData({ layout: 'image-left' })}
            className={`flex-1 px-4 py-3 rounded-none border-2 transition-all ${
              data.layout === 'image-left'
                ? 'border-violet-500 bg-violet-50/20 text-gray-800'
                : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
            }`}
          >
            <div className="text-sm font-medium">Image Left</div>
            <div className="text-xs mt-1 opacity-70">📷 ← Text</div>
          </button>
          <button
            onClick={() => updateData({ layout: 'image-right' })}
            className={`flex-1 px-4 py-3 rounded-none border-2 transition-all ${
              data.layout === 'image-right'
                ? 'border-violet-500 bg-violet-50/20 text-gray-800'
                : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
            }`}
          >
            <div className="text-sm font-medium">Image Right</div>
            <div className="text-xs mt-1 opacity-70">Text → 📷</div>
          </button>
        </div>
      </div>

      {/* Image/Video Upload */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <label className="block text-sm font-medium text-gray-600 mb-2">Image or Video</label>
        <div className="flex flex-col gap-3">
          {/* Media Preview */}
          {data.image_url ? (
            <div className="relative inline-block">
              {data.image_url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                <video
                  src={data.image_url}
                  className="h-32 w-48 object-cover rounded-none border border-gray-200"
                />
              ) : (
                <img
                  src={data.image_url}
                  alt="Preview"
                  className="h-32 w-48 object-cover rounded-none border border-gray-200"
                />
              )}
              <button
                onClick={() => updateData({ image_url: '' })}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="h-32 w-48 bg-white border-2 border-dashed border-gray-300 rounded-none flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-gray-400" />
            </div>
          )}

          {/* Upload Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 bg-violet-50 border border-violet-200 hover:bg-violet-100 text-gray-800 rounded-none text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload
                </>
              )}
            </button>

            {onMediaLibraryOpen && (
              <button
                onClick={() => onMediaLibraryOpen((url) => updateData({ image_url: url }))}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-100 text-gray-800 rounded-none text-sm font-medium transition-colors flex items-center gap-2"
              >
                <ImageIcon className="w-4 h-4" />
                Library
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleMediaUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Headline */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <label className="block text-sm font-medium text-gray-600 mb-2">Headline</label>
        <input
          type="text"
          value={data.headline || ''}
          onChange={(e) => updateData({ headline: e.target.value })}
          placeholder="Enter headline..."
          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-none text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      {/* Content */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <label className="block text-sm font-medium text-gray-600 mb-2">Content</label>
        <textarea
          value={data.content || ''}
          onChange={(e) => updateData({ content: e.target.value })}
          placeholder="Enter content..."
          rows={4}
          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-none text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-y"
        />
      </div>

      {/* Optional CTA Button - Standardized Design */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">Button Text & Style</label>
          <div className="flex bg-gray-100 p-0.5 rounded-none border border-gray-200">
            {(['left', 'center', 'right'] as const).map((align) => (
              <button
                key={align}
                onClick={() => updateData({ button_align: align })}
                className={`px-2 py-1 text-[8px] font-bold rounded-none transition-all uppercase ${
                  (data.button_align || 'left') === align ? 'bg-white text-violet-600 shadow-sm' : 'text-gray-400'
                }`}
              >
                {align}
              </button>
            ))}
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Button Text</label>
              <input
                type="text"
                value={data.cta_text || ''}
                onChange={(e) => updateData({ cta_text: e.target.value })}
                placeholder="e.g., Learn More"
                className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-none text-gray-800 text-xs focus:ring-1 focus:ring-violet-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Button URL</label>
              <input
                type="text"
                value={data.cta_url || ''}
                onChange={(e) => updateData({ cta_url: e.target.value })}
                placeholder="#faq"
                className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-none text-gray-800 text-xs focus:ring-1 focus:ring-violet-500 outline-none"
              />
            </div>
          </div>

          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] text-gray-400 uppercase font-bold">Button Color</span>
              <button
                onClick={() => setShowButtonColorPicker(!showButtonColorPicker)}
                className="w-7 h-7 rounded-none border border-gray-200 cursor-pointer hover:scale-110 transition-transform"
                style={{ backgroundColor: data.button_color || '#000000' }}
              />
            </div>
            {showButtonColorPicker && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-gray-100 border border-gray-200 rounded-none shadow-sm z-50">
                <div className="grid grid-cols-7 gap-2">
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => {
                        updateData({ button_color: c.value })
                        setShowButtonColorPicker(false)
                      }}
                      className="w-7 h-7 rounded-none border-2 hover:scale-110 transition-transform"
                      style={{
                        backgroundColor: c.value,
                        borderColor: (data.button_color || '#000000') === c.value ? '#a855f7' : '#475569'
                      }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
