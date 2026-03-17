'use client'

import React, { useState, useRef } from 'react'
import { Upload, FileText, Loader2, X, Link as LinkIcon, Image as ImageIcon } from 'lucide-react'
import type { LandingPageBlock } from '@/types/landing-page-blocks'
import TextEditorControls from '../TextEditorControls'
import PolicyRichTextEditor from '../PolicyRichTextEditor'

interface LeadMagnetEditorProps {
  block: LandingPageBlock
  onChange: (block: LandingPageBlock) => void
  onMediaLibraryOpen?: (callback: (url: string) => void) => void
  businessUnitId?: string
}

export default function LeadMagnetEditor({ block, onChange, onMediaLibraryOpen, businessUnitId }: LeadMagnetEditorProps) {
  const data = block.data
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaInputRef = useRef<HTMLInputElement>(null)

  const updateData = (newData: any) => {
    onChange({
      ...block,
      data: { ...data, ...newData }
    })
  }

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        updateData({ 
          media_url: responseData.url,
          media_type: isVideo ? 'video' : 'image'
        })
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      alert(`Failed to upload: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('businessUnit', businessUnitId!)

      const response = await fetch('/api/media-library', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('Upload failed')

      const result = await response.json()
      const fileUrl = result.file?.url || result.url
      
      if (fileUrl) {
        updateData({ pdf_url: fileUrl })
      }
    } catch (error: any) {
      console.error('PDF upload error:', error)
      alert('Failed to upload PDF')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          {/* Background Image/Video - Pattern from StepsBlockEditor */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Background Image/Video</label>
            <div className="flex items-center gap-3 flex-wrap">
              {data.media_url ? (
                <div className="relative">
                  {data.media_type === 'video' ? (
                    <video src={data.media_url} className="h-20 w-32 object-cover rounded-lg border border-gray-200" muted />
                  ) : (
                    <img src={data.media_url} alt="Background" className="h-20 w-32 object-cover rounded-lg border border-gray-200" />
                  )}
                  <button
                    onClick={() => updateData({ media_url: '', media_type: 'image' })}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-sm"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <span className="absolute bottom-1 right-1 text-[8px] bg-black/60 text-white px-1 py-0.5 rounded font-bold">
                    {data.media_type === 'video' ? 'VIDEO' : 'IMAGE'}
                  </span>
                </div>
              ) : (
                <div className="h-20 w-32 bg-white border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-1">
                  <ImageIcon className="w-6 h-6 text-gray-300" />
                  <span className="text-[8px] text-gray-400 font-bold">NO MEDIA</span>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => mediaInputRef.current?.click()}
                    disabled={uploading}
                    className="px-3 py-1.5 bg-violet-600 text-white text-xs font-bold rounded-lg hover:bg-violet-700 disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                  >
                    {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                    Upload
                  </button>
                  {onMediaLibraryOpen && (
                    <button
                      onClick={() => onMediaLibraryOpen((url) => updateData({ media_url: url, media_type: 'image' }))}
                      className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 flex items-center gap-1.5 shadow-sm"
                    >
                      <ImageIcon className="w-3 h-3" />
                      Library
                    </button>
                  )}
                </div>
                <input
                  ref={mediaInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleMediaUpload}
                  className="hidden"
                />
                
                {/* Text Position Controls */}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Text Side</span>
                  <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                    {(['left', 'right', 'above', 'below'] as const).map((pos) => (
                      <button
                        key={pos}
                        onClick={() => updateData({ text_position: pos })}
                        className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all capitalize ${
                          (data.text_position || 'left') === pos ? 'bg-white text-violet-600 shadow-sm' : 'text-gray-400'
                        }`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">Headline</label>
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
              textAlign={data.headline_text_align}
              onTextAlignChange={(val) => updateData({ headline_text_align: val })}
            />
          </div>

          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">Subheadline</label>
            <TextEditorControls
              label="Subheadline"
              value={data.subheadline}
              onChange={(val) => updateData({ subheadline: val })}
              fontSize={data.subheadline_font_size}
              onFontSizeChange={(val) => updateData({ subheadline_font_size: val })}
              fontFamily={data.subheadline_font_family}
              onFontFamilyChange={(val) => updateData({ subheadline_font_family: val })}
              color={data.subheadline_color}
              onColorChange={(val) => updateData({ subheadline_color: val })}
              bold={data.subheadline_bold}
              onBoldChange={(val) => updateData({ subheadline_bold: val })}
              italic={data.subheadline_italic}
              onItalicChange={(val) => updateData({ subheadline_italic: val })}
              textAlign={data.subheadline_text_align}
              onTextAlignChange={(val) => updateData({ subheadline_text_align: val })}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 shadow-sm">
            <label className="block text-sm font-bold text-emerald-700 mb-2 uppercase tracking-tight">PDF Target</label>
            
            <div className="space-y-3">
              {data.pdf_url ? (
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-emerald-200 shadow-sm">
                  <div className="w-10 h-10 bg-emerald-100 rounded flex items-center justify-center text-emerald-600">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Current File</p>
                    <p className="text-xs text-gray-700 truncate font-mono">{data.pdf_url.split('/').pop()}</p>
                  </div>
                  <button
                    onClick={() => updateData({ pdf_url: '' })}
                    className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="py-6 rounded-lg border-2 border-dashed border-emerald-200 flex flex-col items-center justify-center gap-2 hover:border-emerald-400 hover:bg-emerald-100/30 cursor-pointer transition-all bg-white"
                >
                  {uploading ? (
                    <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-emerald-400" />
                      <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Upload PDF</span>
                    </>
                  )}
                </div>
              )}
              
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="application/pdf" 
                onChange={handlePdfUpload} 
              />
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">Button Text & Color</label>
            <div className="space-y-3">
              <input
                type="text"
                value={data.cta_text}
                onChange={(e) => updateData({ cta_text: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 rounded-lg"
                placeholder="CTA Button Text"
              />
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={data.button_color || '#7c3aed'}
                  onChange={(e) => updateData({ button_color: e.target.value })}
                  className="w-12 h-10 cursor-pointer p-0.5 border border-gray-200 rounded-lg"
                />
                <span className="text-xs text-gray-500 font-mono">{data.button_color || '#7c3aed'}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
            <input
              type="color"
              value={data.background_color || '#f9fafb'}
              onChange={(e) => updateData({ background_color: e.target.value })}
              className="w-full h-8 cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">Introduction Text (Public)</label>
        <PolicyRichTextEditor
          value={data.content}
          onChange={(val) => updateData({ content: val })}
          placeholder="This text is visible before login..."
        />
      </div>
    </div>
  )
}
