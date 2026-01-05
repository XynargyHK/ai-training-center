'use client'

import { useState, useRef } from 'react'
import { Upload, Loader2, X } from 'lucide-react'
import type { LandingPageBlock } from '@/types/landing-page-blocks'
import UniversalTextEditor from '../UniversalTextEditor'

interface StaticBannerBlockEditorProps {
  block: LandingPageBlock
  onUpdate: (block: LandingPageBlock) => void
  businessUnitId?: string
}

export default function StaticBannerBlockEditor({ block, onUpdate, businessUnitId }: StaticBannerBlockEditorProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const updateData = (key: string, value: any) => {
    const updatedBlock = {
      ...block,
      data: {
        ...block.data,
        [key]: value
      }
    }

    // Auto-update block name when headline changes
    if (key === 'headline' && value) {
      updatedBlock.name = value
    }

    onUpdate(updatedBlock)
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type - allow images and videos
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')

    if (!isImage && !isVideo) {
      alert('Please select an image or video file')
      return
    }

    // Validate file size (max 10MB for images, 50MB for videos)
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSize) {
      alert(`File must be less than ${isVideo ? '50MB' : '10MB'}`)
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('businessUnitId', businessUnitId!)

      const response = await fetch('/api/ecommerce/upload-image', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const responseData = await response.json()
      if (responseData.url) {
        updateData('background_url', responseData.url)
        updateData('background_type', isVideo ? 'video' : 'image')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload file')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Background Media */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Background Media</label>
        <div className="space-y-3">
          {/* Upload Button and Preview */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              {block.data.background_url ? (
                <div className="relative">
                  {block.data.background_type === 'video' ? (
                    <video src={block.data.background_url} className="h-16 w-28 object-cover rounded" muted />
                  ) : (
                    <img src={block.data.background_url} alt="Background" className="h-16 w-28 object-cover rounded" />
                  )}
                  <button
                    onClick={() => {
                      updateData('background_url', '')
                      updateData('background_type', 'image')
                    }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <span className="absolute bottom-0.5 right-0.5 text-[10px] bg-black/60 text-white px-1 rounded">
                    {block.data.background_type === 'video' ? 'VIDEO' : 'IMAGE'}
                  </span>
                </div>
              ) : null}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded text-sm"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    {block.data.background_url ? 'Change' : 'Upload'} Image/Video
                  </>
                )}
              </button>
            </div>

            {/* Background Color Fallback - On the right */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400">BG Color:</label>
              <input
                type="color"
                value={block.data.background_color || '#1e293b'}
                onChange={(e) => updateData('background_color', e.target.value)}
                className="w-10 h-10 rounded border border-slate-600 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Headline */}
      <div>
        <UniversalTextEditor
          label="Headline"
          value={block.data.headline || ''}
          onChange={(value) => updateData('headline', value)}
          textAlign={block.data.headline_text_align || 'center'}
          onTextAlignChange={(align) => updateData('headline_text_align', align)}
          bold={block.data.headline_bold || false}
          onBoldChange={(bold) => updateData('headline_bold', bold)}
          italic={block.data.headline_italic || false}
          onItalicChange={(italic) => updateData('headline_italic', italic)}
          fontSize={block.data.headline_font_size || 'clamp(1.875rem, 5vw, 3.75rem)'}
          onFontSizeChange={(size) => updateData('headline_font_size', size)}
          fontFamily={block.data.headline_font_family || 'Josefin Sans'}
          onFontFamilyChange={(family) => updateData('headline_font_family', family)}
          color={block.data.headline_color || '#ffffff'}
          onColorChange={(color) => updateData('headline_color', color)}
          placeholder="Enter headline"
        />
      </div>

      {/* Subheadline */}
      <div>
        <UniversalTextEditor
          label="Subheadline"
          value={block.data.subheadline || ''}
          onChange={(value) => updateData('subheadline', value)}
          textAlign={block.data.subheadline_text_align || 'center'}
          onTextAlignChange={(align) => updateData('subheadline_text_align', align)}
          bold={block.data.subheadline_bold || false}
          onBoldChange={(bold) => updateData('subheadline_bold', bold)}
          italic={block.data.subheadline_italic || false}
          onItalicChange={(italic) => updateData('subheadline_italic', italic)}
          fontSize={block.data.subheadline_font_size || 'clamp(1.125rem, 2.5vw, 1.25rem)'}
          onFontSizeChange={(size) => updateData('subheadline_font_size', size)}
          fontFamily={block.data.subheadline_font_family || 'Josefin Sans'}
          onFontFamilyChange={(family) => updateData('subheadline_font_family', family)}
          color={block.data.subheadline_color || '#ffffff'}
          onColorChange={(color) => updateData('subheadline_color', color)}
          placeholder="Enter subheadline"
        />
      </div>

      {/* Content/Description */}
      <div>
        <UniversalTextEditor
          label="Description"
          value={block.data.content || ''}
          onChange={(value) => updateData('content', value)}
          textAlign={block.data.content_text_align || 'center'}
          onTextAlignChange={(align) => updateData('content_text_align', align)}
          bold={block.data.content_bold || false}
          onBoldChange={(bold) => updateData('content_bold', bold)}
          italic={block.data.content_italic || false}
          onItalicChange={(italic) => updateData('content_italic', italic)}
          fontSize={block.data.content_font_size || 'clamp(1rem, 2vw, 1.125rem)'}
          onFontSizeChange={(size) => updateData('content_font_size', size)}
          fontFamily={block.data.content_font_family || 'Josefin Sans'}
          onFontFamilyChange={(family) => updateData('content_font_family', family)}
          color={block.data.content_color || '#ffffff'}
          onColorChange={(color) => updateData('content_color', color)}
          placeholder="Enter description (optional)"
          multiline
          rows={3}
        />
      </div>

      {/* CTA Button */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-slate-300 mb-2">CTA Button Text</label>
          <input
            type="text"
            value={block.data.cta_text || ''}
            onChange={(e) => updateData('cta_text', e.target.value)}
            placeholder="SHOP NOW"
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-2">CTA Button URL</label>
          <input
            type="text"
            value={block.data.cta_url || ''}
            onChange={(e) => updateData('cta_url', e.target.value)}
            placeholder="/livechat/shop"
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
          />
        </div>
      </div>
    </div>
  )
}
