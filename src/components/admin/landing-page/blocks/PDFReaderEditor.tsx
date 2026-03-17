'use client'

import React, { useState, useRef } from 'react'
import { Plus, Trash2, FileText, Upload, Loader2, X, ChevronUp, ChevronDown, Image as ImageIcon } from 'lucide-react'
import type { LandingPageBlock } from '@/types/landing-page-blocks'
import TextEditorControls from '../TextEditorControls'

interface PDFItem {
  title: string
  pdf_url: string
  media_type?: 'image' | 'video'
  media_url?: string
  original_filename?: string
  image_width?: string
  text_position?: 'left' | 'right' | 'above' | 'below'
}

interface PDFReaderEditorProps {
  block: LandingPageBlock
  onChange: (block: LandingPageBlock) => void
  onMediaLibraryOpen?: (callback: (url: string) => void) => void
  businessUnitId?: string
}

export default function PDFReaderEditor({ block, onChange, onMediaLibraryOpen, businessUnitId }: PDFReaderEditorProps) {
  const data = block.data
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
  const [uploadingMediaIndex, setUploadingMediaIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaInputRefs = useRef<(HTMLInputElement | null)[]>([])

  const updateData = (newData: any) => {
    onChange({
      ...block,
      data: { ...data, ...newData }
    })
  }

  const updateItem = (index: number, newItemData: Partial<PDFItem>) => {
    const newItems = [...(data.items || [])]
    newItems[index] = { ...newItems[index], ...newItemData }
    updateData({ items: newItems })
  }

  const addItem = () => {
    const newItems = [...(data.items || []), { 
      title: '', 
      pdf_url: '', 
      media_type: 'image', 
      media_url: '',
      image_width: '400px',
      text_position: 'above'
    }]
    updateData({ items: newItems })
  }

  const removeItem = (index: number) => {
    const newItems = data.items.filter((_: any, i: number) => i !== index)
    updateData({ items: newItems })
  }

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === data.items.length - 1)) return
    const newItems = [...data.items]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const temp = newItems[index]
    newItems[index] = newItems[targetIndex]
    newItems[targetIndex] = temp
    updateData({ items: newItems })
  }

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0]
    if (!file) return

    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')

    setUploadingMediaIndex(index)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('businessUnitId', businessUnitId!)

      const response = await fetch('/api/ecommerce/upload-image', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('Upload failed')

      const result = await response.json()
      if (result.url) {
        updateItem(index, { 
          media_url: result.url,
          media_type: isVideo ? 'video' : 'image',
          original_filename: file.name
        })
      }
    } catch (error) {
      console.error('Media upload error:', error)
      alert('Failed to upload media')
    } finally {
      setUploadingMediaIndex(null)
      if (mediaInputRefs.current[index]) mediaInputRefs.current[index]!.value = ''
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!businessUnitId) {
      alert('Business Unit ID is required for upload')
      return
    }

    setUploadingIndex(index)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('businessUnit', businessUnitId)

      const response = await fetch('/api/media-library', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('Upload failed')

      const result = await response.json()
      const fileUrl = result.file?.url || result.url
      
      if (fileUrl) {
        updateItem(index, { pdf_url: fileUrl })
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload PDF')
    } finally {
      setUploadingIndex(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">Headline</label>
            <TextEditorControls
              label="Headline"
              value={data.headline}
              onChange={(val) => updateData({ headline: val })}
              fontSize={data.headline_font_size}
              onFontSizeChange={(val) => updateData({ headline_font_size: val })}
              color={data.headline_color}
              onColorChange={(val) => updateData({ headline_color: val })}
              bold={true}
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
              color={data.subheadline_color}
              onColorChange={(val) => updateData({ subheadline_color: val })}
            />
          </div>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">Appearance & Main Labels</label>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold">Theme Color</span>
                <input
                  type="color"
                  value={data.primary_color || '#7c3aed'}
                  onChange={(e) => updateData({ primary_color: e.target.value })}
                  className="w-full h-8 cursor-pointer mt-1"
                />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold">Background Color</span>
                <input
                  type="color"
                  value={data.background_color || '#ffffff'}
                  onChange={(e) => updateData({ background_color: e.target.value })}
                  className="w-full h-8 cursor-pointer mt-1"
                />
              </div>
            </div>
            
            <div className="pt-2 border-t border-gray-200 space-y-3">
              <div>
                <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Sidebar Label</label>
                <input
                  type="text"
                  value={data.resources_label || ''}
                  onChange={(e) => updateData({ resources_label: e.target.value })}
                  placeholder="e.g., Resources"
                  className="w-full px-2 py-1.5 border border-gray-200 text-xs rounded"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Empty State Title</label>
                <input
                  type="text"
                  value={data.select_guide_title || ''}
                  onChange={(e) => updateData({ select_guide_title: e.target.value })}
                  placeholder="e.g., No Document Selected"
                  className="w-full px-2 py-1.5 border border-gray-200 text-xs rounded"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Empty State Text</label>
                <input
                  type="text"
                  value={data.select_guide_placeholder || ''}
                  onChange={(e) => updateData({ select_guide_placeholder: e.target.value })}
                  placeholder="e.g., Please select a guide..."
                  className="w-full px-2 py-1.5 border border-gray-200 text-xs rounded"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-bold text-gray-700">Guide Documents</label>
          <button
            onClick={addItem}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white text-xs font-bold rounded-lg hover:bg-violet-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Document
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {(data.items || []).map((item: PDFItem, index: number) => (
            <div key={index} className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => updateItem(index, { title: e.target.value })}
                    className="w-full px-3 py-2 border-b border-gray-100 text-sm font-bold focus:outline-none focus:border-violet-500 bg-transparent"
                    placeholder="Document Title (e.g., SOP Menu)"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => moveItem(index, 'up')} className="p-1 hover:bg-gray-100 rounded text-gray-400"><ChevronUp className="w-4 h-4" /></button>
                  <button onClick={() => moveItem(index, 'down')} className="p-1 hover:bg-gray-100 rounded text-gray-400"><ChevronDown className="w-4 h-4" /></button>
                  <button onClick={() => removeItem(index)} className="p-1 hover:bg-red-50 rounded text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Media Column */}
                <div className="space-y-3">
                  <label className="block text-[10px] text-gray-500 uppercase font-bold">Media Preview (Image/Video)</label>
                  <div className="flex items-start gap-3 flex-wrap">
                    {item.media_url ? (
                      <div className="relative">
                        {item.media_type === 'video' ? (
                          <video src={item.media_url} className="h-20 w-32 object-cover rounded-none border border-gray-200" muted />
                        ) : (
                          <img src={item.media_url} alt="Preview" className="h-20 w-32 object-cover rounded-lg border border-gray-200" />
                        )}
                        <button
                          onClick={() => updateItem(index, { media_url: '', media_type: 'image', original_filename: '' })}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-sm"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <span className="absolute bottom-1 right-1 text-[7px] bg-black/60 text-white px-1 py-0.5 rounded-none font-bold uppercase">
                          {item.media_type === 'video' ? 'VIDEO' : 'IMAGE'}
                        </span>
                      </div>
                    ) : (
                      <div className="h-20 w-32 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-1">
                        <ImageIcon className="w-5 h-5 text-gray-300" />
                        <span className="text-[7px] text-gray-400 font-bold">NO MEDIA</span>
                      </div>
                    )}

                    {/* Filename display */}
                    {item.media_url && (
                      <div className="text-[9px] font-mono max-w-[120px] truncate text-green-600">
                        📄 {item.original_filename || item.media_url.split('/').pop()}
                      </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => mediaInputRefs.current[index]?.click()}
                          disabled={uploadingMediaIndex === index}
                          className="px-2 py-1 bg-violet-50 border border-violet-200 text-gray-800 text-[10px] font-bold rounded-none hover:bg-violet-100 disabled:opacity-50 flex items-center gap-1 shadow-sm"
                        >
                          {uploadingMediaIndex === index ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                          Upload
                        </button>
                        {onMediaLibraryOpen && (
                          <button
                            onClick={() => onMediaLibraryOpen((url) => updateItem(index, { media_url: url, media_type: 'image' }))}
                            className="px-2 py-1 bg-gray-100 border border-gray-200 text-gray-700 text-[10px] font-bold rounded-none hover:bg-gray-200 flex items-center gap-1 shadow-sm"
                          >
                            <ImageIcon className="w-3 h-3" />
                            Library
                          </button>
                        )}
                      </div>
                      <input
                        ref={(el) => { mediaInputRefs.current[index] = el }}
                        type="file"
                        accept="image/*,video/*"
                        onChange={(e) => handleMediaUpload(e, index)}
                        className="hidden"
                      />

                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-bold text-gray-400 uppercase">Side</span>
                        <div className="flex bg-gray-50 p-0.5 rounded-none border border-gray-200">
                          {(['left', 'right', 'above', 'below'] as const).map((pos) => (
                            <button
                              key={pos}
                              onClick={() => updateItem(index, { text_position: pos })}
                              className={`px-1.5 py-0.5 text-[8px] font-bold rounded-none transition-all capitalize ${
                                (item.text_position || 'above') === pos ? 'bg-white text-violet-600 shadow-sm' : 'text-gray-400'
                              }`}
                            >
                              {pos}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Image Size Controls */}
                      {item.media_url && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              const currentWidth = parseInt((item.image_width || '400px').replace('px', ''))
                              const newWidth = Math.max(100, currentWidth - 20)
                              updateItem(index, { image_width: `${newWidth}px` })
                            }}
                            className="px-1.5 py-0.5 bg-gray-50 border border-gray-200 text-gray-600 text-[8px]"
                          >
                            -
                          </button>
                          <span className="text-[8px] text-gray-400 font-mono">{item.image_width || '400px'}</span>
                          <button
                            onClick={() => {
                              const currentWidth = parseInt((item.image_width || '400px').replace('px', ''))
                              const newWidth = currentWidth + 20
                              updateItem(index, { image_width: `${newWidth}px` })
                            }}
                            className="px-1.5 py-0.5 bg-gray-50 border border-gray-200 text-gray-600 text-[8px]"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* PDF Column */}
                <div className="space-y-3">
                  <label className="block text-[10px] text-gray-500 uppercase font-bold">Target PDF Document</label>
                  <div className="flex items-center gap-2">
                    {item.pdf_url ? (
                      <div className="flex-1 flex items-center justify-between p-2 bg-emerald-50 border border-emerald-100 rounded-lg shadow-inner">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="text-[9px] text-emerald-700 font-mono truncate">{item.pdf_url.split('/').pop()}</span>
                        </div>
                        <button onClick={() => updateItem(index, { pdf_url: '' })} className="text-emerald-400 hover:text-emerald-600 shrink-0"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          const input = document.getElementById(`pdf-file-${index}`) as HTMLInputElement
                          input?.click()
                        }}
                        className="flex-1 py-4 border-2 border-dashed border-gray-100 rounded-lg flex items-center justify-center gap-2 text-gray-400 hover:border-violet-200 hover:bg-violet-50/30 transition-all bg-gray-50/50"
                      >
                        {uploadingIndex === index ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            <span className="text-[9px] font-bold uppercase tracking-wider">Select PDF</span>
                          </>
                        )}
                      </button>
                    )}
                    <input
                      id={`pdf-file-${index}`}
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, index)}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
