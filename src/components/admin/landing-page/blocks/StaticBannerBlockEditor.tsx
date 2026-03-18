'use client'

import { useState, useRef } from 'react'
import { Upload, Loader2, X, Image as ImageIcon } from 'lucide-react'
import type { LandingPageBlock } from '@/types/landing-page-blocks'
import UniversalTextEditor from '../UniversalTextEditor'

interface StaticBannerBlockEditorProps {
  block: LandingPageBlock
  onUpdate: (block: LandingPageBlock) => void
  businessUnitId?: string
  onMediaLibraryOpen?: (callback: (url: string) => void) => void
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

export default function StaticBannerBlockEditor({ block, onUpdate, businessUnitId, onMediaLibraryOpen }: StaticBannerBlockEditorProps) {
  const [uploading, setUploading] = useState(false)
  const [showButtonColorPicker, setShowButtonColorPicker] = useState(false)
  const [showBgColorPicker, setShowBgColorPicker] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get block data with defaults
  const data = block.data || {}
  const background_url = data.background_url || ''
  const background_type = data.background_type || 'image'
  const background_color = data.background_color || '#1e293b'

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')

    if (!isImage && !isVideo) {
      alert('Please select an image or video file')
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

      if (!response.ok) throw new Error('Upload failed')

      const responseData = await response.json()
      if (responseData.url) {
        onUpdate({
          ...block,
          data: {
            ...data,
            background_url: responseData.url,
            background_type: isVideo ? 'video' : 'image',
            original_filename: file.name
          }
        })
      }
    } catch (error: any) {
      console.error('Error uploading background:', error)
      alert(`Failed to upload: ${error.message}`)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const updateField = (key: string, value: any) => {
    onUpdate({
      ...block,
      data: { ...data, [key]: value }
    })
  }

  return (
    <div className="space-y-4">
      {/* Background Media */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Background Image/Video</label>
        <div className="flex items-center gap-3 flex-wrap">
          {background_url ? (
            <div className="relative">
              {background_type === 'video' ? (
                <video src={background_url} className="h-16 w-28 object-cover rounded-none" muted />
              ) : (
                <img src={background_url} alt="Background" className="h-16 w-28 object-cover rounded-none" />
              )}
              <button
                onClick={() => updateField('background_url', '')}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="h-16 w-28 bg-white border border-dashed border-gray-300 rounded-none flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-gray-400" />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-3 py-1.5 bg-violet-50 border border-violet-200 text-gray-800 text-xs font-bold rounded-none hover:bg-violet-100 disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
              >
                {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                Upload
              </button>
              {onMediaLibraryOpen && (
                <button
                  onClick={() => onMediaLibraryOpen((url) => updateField('background_url', url))}
                  className="px-3 py-1.5 bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold rounded-none hover:bg-gray-200 flex items-center gap-1.5 shadow-sm"
                >
                  <ImageIcon className="w-3 h-3" />
                  Library
                </button>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleUpload} className="hidden" />
            
            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] text-gray-400 uppercase font-bold">BG Color</span>
                <button
                  onClick={() => setShowBgColorPicker(!showBgColorPicker)}
                  className="w-7 h-7 rounded-none border border-gray-200 cursor-pointer hover:scale-110 transition-transform"
                  style={{ backgroundColor: background_color }}
                />
              </div>
              {showBgColorPicker && (
                <div className="absolute top-full left-0 mt-1 p-2 bg-gray-100 border border-gray-200 rounded-none shadow-sm z-50">
                  <div className="grid grid-cols-7 gap-2">
                    {COLOR_PALETTE.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => {
                          updateField('background_color', c.value)
                          setShowBgColorPicker(false)
                        }}
                        className="w-7 h-7 rounded-none border-2 hover:scale-110 transition-transform"
                        style={{
                          backgroundColor: c.value,
                          borderColor: background_color === c.value ? '#a855f7' : '#475569'
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

      {/* Headline, Subheadline, Content */}
      <div className="space-y-4">
        <UniversalTextEditor
          label="Headline"
          value={data.headline || ''}
          onChange={(value) => updateField('headline', value)}
          textAlign={data.headline_text_align || 'center'}
          onTextAlignChange={(align) => updateField('headline_text_align', align)}
          bold={data.headline_bold}
          fontSize={data.headline_font_size || '2.5rem'}
          color={data.headline_color || '#ffffff'}
        />
        <UniversalTextEditor
          label="Subheadline"
          value={data.subheadline || ''}
          onChange={(value) => updateField('subheadline', value)}
          textAlign={data.subheadline_text_align || 'center'}
          onTextAlignChange={(align) => updateField('subheadline_text_align', align)}
          fontSize={data.subheadline_font_size || '1.25rem'}
          color={data.subheadline_color || '#ffffff'}
        />
        <UniversalTextEditor
          label="Description"
          value={data.content || ''}
          onChange={(value) => updateField('content', value)}
          multiline
          textAlign={data.content_text_align || 'center'}
          onTextAlignChange={(align) => updateField('content_text_align', align)}
          fontSize={data.content_font_size || '1rem'}
          color={data.content_color || '#ffffff'}
        />
      </div>

      {/* CTA Button - Standardized Design */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">Button Text & Style</label>
          <div className="flex bg-gray-100 p-0.5 rounded-none border border-gray-200">
            {(['left', 'center', 'right'] as const).map((align) => (
              <button
                key={align}
                onClick={() => updateField('button_align', align)}
                className={`px-2 py-1 text-[8px] font-bold rounded-none transition-all uppercase ${
                  (data.button_align || 'center') === align ? 'bg-white text-violet-600 shadow-sm' : 'text-gray-400'
                }`}
              >
                {align}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <input
            type="text"
            value={data.cta_text || ''}
            onChange={(e) => updateField('cta_text', e.target.value)}
            className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-none text-gray-800 text-xs placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-violet-500"
            placeholder="CTA Button Text"
          />
          <input
            type="text"
            value={data.cta_url || ''}
            onChange={(e) => updateField('cta_url', e.target.value)}
            className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-none text-gray-800 text-xs placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-violet-500"
            placeholder="CTA Button URL (#faq)"
          />
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
                        updateField('button_color', c.value)
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
