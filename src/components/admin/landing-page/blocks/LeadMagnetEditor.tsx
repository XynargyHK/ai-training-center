'use client'

import React, { useState, useRef } from 'react'
import { Upload, FileText, Loader2, X, Link as LinkIcon } from 'lucide-react'
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

  const updateData = (newData: any) => {
    onChange({
      ...block,
      data: { ...data, ...newData }
    })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      // Fix: API returns result.file.url
      const fileUrl = result.file?.url || result.url
      
      if (fileUrl) {
        updateData({ pdf_url: fileUrl })
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      alert(error.message || 'Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">Headline</label>
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
              textAlign={data.headline_text_align}
              onTextAlignChange={(val) => updateData({ headline_text_align: val })}
            />
          </div>

          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">Subheadline</label>
            <TextEditorControls
              value={data.subheadline}
              onChange={(val) => updateData({ subheadline: val })}
              fontSize={data.subheadline_font_size}
              onFontSizeChange={(val) => updateData({ subheadline_font_size: val })}
              fontFamily={data.subheadline_font_family}
              onFontFamilyChange={(val) => updateData({ subheadline_font_family: val })}
              color={data.subheadline_color}
              onColorChange={(val) => updateData({ subheadline_color: val })}
              textAlign={data.subheadline_text_align}
              onTextAlignChange={(val) => updateData({ subheadline_text_align: val })}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-violet-50 rounded-lg border border-violet-200">
            <label className="block text-sm font-bold text-violet-700 mb-2">Target PDF File</label>
            
            <div className="space-y-3">
              {data.pdf_url ? (
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-violet-200 shadow-sm">
                  <div className="w-10 h-10 bg-violet-100 rounded flex items-center justify-center text-violet-600">
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
                  className="py-8 rounded-lg border-2 border-dashed border-violet-200 flex flex-col items-center justify-center gap-2 hover:border-violet-400 hover:bg-violet-100/30 cursor-pointer transition-all bg-white"
                >
                  {uploading ? (
                    <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-violet-400" />
                      <span className="text-xs text-violet-600 font-bold">Upload PDF Guide</span>
                      <span className="text-[10px] text-gray-400">Click to browse your computer</span>
                    </>
                  )}
                </div>
              )}
              
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="application/pdf" 
                onChange={handleFileUpload} 
              />

              <div className="flex items-center gap-2">
                {onMediaLibraryOpen && (
                  <button
                    onClick={() => onMediaLibraryOpen((url) => updateData({ pdf_url: url }))}
                    className="flex-1 py-2 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <LinkIcon className="w-3 h-3" />
                    From Media Library
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">Button Text & Color</label>
            <div className="space-y-3">
              <input
                type="text"
                value={data.cta_text}
                onChange={(e) => updateData({ cta_text: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="CTA Button Text"
              />
              <input
                type="color"
                value={data.button_color || '#7c3aed'}
                onChange={(e) => updateData({ button_color: e.target.value })}
                className="w-full h-8 cursor-pointer"
              />
            </div>
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
