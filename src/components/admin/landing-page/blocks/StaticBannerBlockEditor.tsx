'use client'

import { useState, useRef } from 'react'
import { Upload, Loader2, X, Image } from 'lucide-react'
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

  // Get block data with defaults
  const data = block.data || {}
  const background_url = data.background_url || ''
  const background_type = data.background_type || 'image'
  const background_color = data.background_color || '#1e293b'

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
      formData.append('businessUnitId', businessUnitId || '')

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
        // Update block with new background - exactly like hero banner does
        const updatedBlock = {
          ...block,
          data: {
            ...data,
            background_url: responseData.url,
            background_type: isVideo ? 'video' : 'image'
          }
        }
        onUpdate(updatedBlock)
      }
    } catch (error: any) {
      console.error('Error uploading background:', error)
      alert(`Failed to upload: ${error.message}`)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeBackground = () => {
    const updatedBlock = {
      ...block,
      data: {
        ...data,
        background_url: '',
        background_type: 'image'
      }
    }
    onUpdate(updatedBlock)
  }

  const updateField = (key: string, value: any) => {
    const updatedBlock = {
      ...block,
      data: {
        ...data,
        [key]: value
      }
    }
    // Auto-update block name when headline changes
    if (key === 'headline' && value) {
      updatedBlock.name = value
    }
    onUpdate(updatedBlock)
  }

  return (
    <div className="space-y-6">
      {/* Background Media */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Background Image/Video</label>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Preview thumbnail or placeholder */}
          {background_url ? (
            <div className="relative">
              {background_type === 'video' ? (
                <video src={background_url} className="h-16 w-28 object-cover rounded" muted />
              ) : (
                <img src={background_url} alt="Background" className="h-16 w-28 object-cover rounded" />
              )}
              <button
                onClick={removeBackground}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
              >
                <X className="w-3 h-3" />
              </button>
              <span className="absolute bottom-0.5 right-0.5 text-[10px] bg-black/60 text-white px-1 rounded">
                {background_type === 'video' ? 'VIDEO' : 'IMAGE'}
              </span>
            </div>
          ) : (
            <div className="h-16 w-28 bg-slate-800 border border-dashed border-slate-600 rounded flex items-center justify-center">
              <Image className="w-6 h-6 text-slate-500" />
            </div>
          )}

          {/* Upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-3 py-1.5 bg-violet-600 text-white text-sm rounded hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
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

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm"
            onChange={handleUpload}
            className="hidden"
          />

          {/* Background Color */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">BG Color:</label>
            <input
              type="color"
              value={background_color}
              onChange={(e) => updateField('background_color', e.target.value)}
              className="w-10 h-10 rounded border border-slate-600 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Headline */}
      <div>
        <UniversalTextEditor
          label="Headline"
          value={data.headline || ''}
          onChange={(value) => updateField('headline', value)}
          textAlign={data.headline_text_align || 'center'}
          onTextAlignChange={(align) => updateField('headline_text_align', align)}
          bold={data.headline_bold || false}
          onBoldChange={(bold) => updateField('headline_bold', bold)}
          italic={data.headline_italic || false}
          onItalicChange={(italic) => updateField('headline_italic', italic)}
          fontSize={data.headline_font_size || 'clamp(1.875rem, 5vw, 3.75rem)'}
          onFontSizeChange={(size) => updateField('headline_font_size', size)}
          fontFamily={data.headline_font_family || 'Josefin Sans'}
          onFontFamilyChange={(family) => updateField('headline_font_family', family)}
          color={data.headline_color || '#ffffff'}
          onColorChange={(color) => updateField('headline_color', color)}
          placeholder="Enter headline"
        />
      </div>

      {/* Subheadline */}
      <div>
        <UniversalTextEditor
          label="Subheadline"
          value={data.subheadline || ''}
          onChange={(value) => updateField('subheadline', value)}
          textAlign={data.subheadline_text_align || 'center'}
          onTextAlignChange={(align) => updateField('subheadline_text_align', align)}
          bold={data.subheadline_bold || false}
          onBoldChange={(bold) => updateField('subheadline_bold', bold)}
          italic={data.subheadline_italic || false}
          onItalicChange={(italic) => updateField('subheadline_italic', italic)}
          fontSize={data.subheadline_font_size || 'clamp(1.125rem, 2.5vw, 1.25rem)'}
          onFontSizeChange={(size) => updateField('subheadline_font_size', size)}
          fontFamily={data.subheadline_font_family || 'Josefin Sans'}
          onFontFamilyChange={(family) => updateField('subheadline_font_family', family)}
          color={data.subheadline_color || '#ffffff'}
          onColorChange={(color) => updateField('subheadline_color', color)}
          placeholder="Enter subheadline"
        />
      </div>

      {/* Content/Description */}
      <div>
        <UniversalTextEditor
          label="Description"
          value={data.content || ''}
          onChange={(value) => updateField('content', value)}
          textAlign={data.content_text_align || 'center'}
          onTextAlignChange={(align) => updateField('content_text_align', align)}
          bold={data.content_bold || false}
          onBoldChange={(bold) => updateField('content_bold', bold)}
          italic={data.content_italic || false}
          onItalicChange={(italic) => updateField('content_italic', italic)}
          fontSize={data.content_font_size || 'clamp(1rem, 2vw, 1.125rem)'}
          onFontSizeChange={(size) => updateField('content_font_size', size)}
          fontFamily={data.content_font_family || 'Josefin Sans'}
          onFontFamilyChange={(family) => updateField('content_font_family', family)}
          color={data.content_color || '#ffffff'}
          onColorChange={(color) => updateField('content_color', color)}
          placeholder="Enter description (optional)"
          multiline
          rows={3}
        />
      </div>

      {/* CTA Button */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-slate-300 mb-2">CTA Button Text</label>
            <input
              type="text"
              value={data.cta_text || ''}
              onChange={(e) => updateField('cta_text', e.target.value)}
              placeholder="SHOP NOW"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">CTA Button URL</label>
            <input
              type="text"
              value={data.cta_url || ''}
              onChange={(e) => updateField('cta_url', e.target.value)}
              placeholder="#micro-infusion-system"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
            />
          </div>
        </div>
        <p className="text-xs text-slate-400">
          To scroll to another block, use <span className="text-violet-400">#headline-in-lowercase</span> (e.g., #micro-infusion-system, #faq, #pricing-plans)
        </p>
      </div>
    </div>
  )
}
