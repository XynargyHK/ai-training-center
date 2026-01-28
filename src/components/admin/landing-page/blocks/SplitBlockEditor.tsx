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

export default function SplitBlockEditor({ block, onUpdate, onMediaLibraryOpen, businessUnitId }: SplitBlockEditorProps) {
  const data = block.data as SplitBlockData
  const [uploading, setUploading] = useState(false)
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
      <div>
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
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-2">Image or Video</label>
        <div className="flex flex-col gap-3">
          {/* Media Preview */}
          {data.image_url ? (
            <div className="relative inline-block">
              {/* Check if it's a video */}
              {data.image_url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                <video
                  src={data.image_url}
                  controls
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
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-50 text-gray-800 rounded-full flex items-center justify-center hover:bg-red-50 border border-red-200 transition-colors"
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
                  Upload Image/Video
                </>
              )}
            </button>

            {onMediaLibraryOpen && (
              <button
                onClick={() => onMediaLibraryOpen((url) => updateData({ image_url: url }))}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-100 text-gray-800 rounded-none text-sm font-medium transition-colors flex items-center gap-2"
              >
                <ImageIcon className="w-4 h-4" />
                Media Library
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
          <p className="text-xs text-gray-400">Supports: Images (JPG, PNG, GIF, WebP) and Videos (MP4, WebM, MOV)</p>
        </div>
      </div>

      {/* Headline */}
      <div>
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
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-2">Content</label>
        <textarea
          value={data.content || ''}
          onChange={(e) => updateData({ content: e.target.value })}
          placeholder="Enter content..."
          rows={4}
          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-none text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-y"
        />
      </div>

      {/* Optional CTA Button */}
      <div className="border-t border-gray-200 pt-4">
        <label className="block text-sm font-medium text-gray-600 mb-3">Call-to-Action Button (Optional)</label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Button Text</label>
            <input
              type="text"
              value={data.cta_text || ''}
              onChange={(e) => updateData({ cta_text: e.target.value })}
              placeholder="e.g., Learn More"
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-none text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Button URL</label>
            <input
              type="text"
              value={data.cta_url || ''}
              onChange={(e) => updateData({ cta_url: e.target.value })}
              placeholder="#micro-infusion-system"
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-none text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          To scroll to another block, use <span className="text-violet-600">#headline-in-lowercase</span> (e.g., #micro-infusion-system, #faq)
        </p>
      </div>
    </div>
  )
}
