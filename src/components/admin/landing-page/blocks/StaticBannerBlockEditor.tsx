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
  const [uploadingPoster, setUploadingPoster] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const posterInputRef = useRef<HTMLInputElement>(null)

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
            background_type: isVideo ? 'video' : 'image',
            original_filename: file.name
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

  const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Only allow images for poster
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file for the poster')
      return
    }

    // Validate file size (max 5MB for poster)
    if (file.size > 5 * 1024 * 1024) {
      alert('Poster image must be less than 5MB')
      return
    }

    setUploadingPoster(true)
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
        updateField('video_poster', responseData.url)
      }
    } catch (error: any) {
      console.error('Error uploading poster:', error)
      alert(`Failed to upload poster: ${error.message}`)
    } finally {
      setUploadingPoster(false)
      if (posterInputRef.current) {
        posterInputRef.current.value = ''
      }
    }
  }

  const updateField = (key: string, value: any) => {
    const updatedBlock = {
      ...block,
      data: {
        ...data,
        [key]: value
      }
    }
    onUpdate(updatedBlock)
  }

  return (
    <div className="space-y-3">
      {/* Background Media */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Background Image/Video</label>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Preview thumbnail or placeholder */}
          {background_url ? (
            <div className="relative">
              {background_type === 'video' ? (
                <video
                  src={background_url}
                  poster={data.video_poster}
                  className="h-16 w-28 object-cover rounded-none bg-white"
                  muted
                  playsInline
                  preload="metadata"
                />
              ) : (
                <img src={background_url} alt="Background" className="h-16 w-28 object-cover rounded-none" />
              )}
              <button
                onClick={removeBackground}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-50 text-gray-800 rounded-full flex items-center justify-center hover:bg-red-50 border border-red-200"
              >
                <X className="w-3 h-3" />
              </button>
              <span className="absolute bottom-0.5 right-0.5 text-[10px] bg-black/60 text-gray-800 px-1 rounded-none">
                {background_type === 'video' ? 'VIDEO' : 'IMAGE'}
              </span>
            </div>
          ) : (
            <div className="h-16 w-28 bg-white border border-dashed border-gray-300 rounded-none flex items-center justify-center">
              <Image className="w-6 h-6 text-gray-400" />
            </div>
          )}

          {/* Filename display */}
          {background_url && (
            <div className="text-xs font-mono max-w-xs">
              {(() => {
                // Use original_filename if set
                if (data.original_filename) {
                  return (
                    <span className="text-green-600" title={data.original_filename}>
                      📄 {data.original_filename}
                    </span>
                  )
                }
                // Try to extract from URL (works for media-library uploads with format: timestamp_filename.ext)
                try {
                  const urlPath = new URL(background_url).pathname
                  const fullName = urlPath.split('/').pop() || ''
                  // Check if it's media-library format (timestamp_filename) vs product-images format (timestamp-random)
                  if (fullName.includes('_') && !fullName.match(/^\d+-[a-z0-9]+\./i)) {
                    const filename = fullName.replace(/^\d+_/, '')
                    if (filename && filename !== fullName) {
                      return (
                        <span className="text-green-600" title={filename}>
                          📄 {filename}
                        </span>
                      )
                    }
                  }
                } catch {}
                // Can't determine filename - show truncated URL
                try {
                  const urlPath = new URL(background_url).pathname
                  const shortName = urlPath.split('/').pop() || ''
                  return (
                    <span className="text-gray-500 text-[10px]" title={shortName}>
                      📎 {shortName.length > 20 ? shortName.substring(0, 17) + '...' : shortName}
                    </span>
                  )
                } catch {
                  return null
                }
              })()}
            </div>
          )}

          {/* Upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-3 py-1.5 bg-violet-50 border border-violet-200 text-gray-800 text-sm rounded-none hover:bg-violet-100 transition-colors disabled:opacity-50 flex items-center gap-1.5"
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
            <label className="text-xs text-gray-500">BG Color:</label>
            <input
              type="color"
              value={background_color}
              onChange={(e) => updateField('background_color', e.target.value)}
              className="w-10 h-10 rounded-none border border-gray-200 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Video Poster Image - Only show when background is video */}
      {background_type === 'video' && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-none p-4">
          <label className="block text-sm font-medium text-amber-600 mb-2 flex items-center gap-2">
            <Image className="w-4 h-4" />
            Video Poster Image (Optional - Shows while loading)
          </label>
          <p className="text-xs text-amber-200/70 mb-3">
            A poster image displays while the video loads, improving perceived performance. Recommended for videos over 1MB.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Preview poster thumbnail */}
            {data.video_poster ? (
              <div className="relative">
                <img src={data.video_poster} alt="Poster" className="h-16 w-28 object-cover rounded-none border border-amber-500/30" />
                <button
                  onClick={() => updateField('video_poster', '')}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-50 text-gray-800 rounded-full flex items-center justify-center hover:bg-red-50 border border-red-200"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="h-16 w-28 bg-white border border-dashed border-amber-600/50 rounded-none flex items-center justify-center">
                <Image className="w-6 h-6 text-amber-500/50" />
              </div>
            )}

            {/* Upload poster button */}
            <button
              onClick={() => posterInputRef.current?.click()}
              disabled={uploadingPoster}
              className="px-3 py-1.5 bg-amber-50 text-gray-800 text-sm rounded-none hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {uploadingPoster ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  {data.video_poster ? 'Change Poster' : 'Add Poster'}
                </>
              )}
            </button>

            {/* Hidden file input for poster */}
            <input
              ref={posterInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handlePosterUpload}
              className="hidden"
            />
          </div>
        </div>
      )}

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
            <label className="block text-sm text-gray-600 mb-2">CTA Button Text</label>
            <input
              type="text"
              value={data.cta_text || ''}
              onChange={(e) => updateField('cta_text', e.target.value)}
              placeholder="SHOP NOW"
              className="w-full px-2 py-1.5 bg-gray-100 border border-gray-200 rounded-none text-gray-800 text-xs"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">CTA Button URL</label>
            <input
              type="text"
              value={data.cta_url || ''}
              onChange={(e) => updateField('cta_url', e.target.value)}
              placeholder="#micro-infusion-system"
              className="w-full px-2 py-1.5 bg-gray-100 border border-gray-200 rounded-none text-gray-800 text-xs"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500">
          To scroll to another block, use <span className="text-violet-600">#headline-in-lowercase</span> (e.g., #micro-infusion-system, #faq, #pricing-plans)
        </p>
      </div>
    </div>
  )
}
