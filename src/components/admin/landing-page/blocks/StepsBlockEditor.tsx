'use client'

import { useState, useRef } from 'react'
import { Upload, X, ChevronUp, ChevronDown, Plus, Trash2, Image, Loader2 } from 'lucide-react'
import type { LandingPageBlock } from '@/types/landing-page-blocks'
import UniversalTextEditor from '../UniversalTextEditor'
import PolicyRichTextEditor from '../PolicyRichTextEditor'

interface Step {
  background_url?: string
  background_type?: 'image' | 'video'
  original_filename?: string
  image_width?: string
  subheadline?: string
  subheadline_font_size?: string
  subheadline_font_family?: string
  subheadline_color?: string
  subheadline_bold?: boolean
  subheadline_italic?: boolean
  subheadline_align?: 'left' | 'center' | 'right'
  text_content: string
  text_position: 'left' | 'right' | 'above' | 'below'
  text_font_size?: string
  text_font_family?: string
  text_color?: string
  text_bold?: boolean
  text_italic?: boolean
  text_align?: 'left' | 'center' | 'right'
}

interface StepsBlockData {
  heading_font_size?: string
  heading_font_family?: string
  heading_color?: string
  heading_align?: 'left' | 'center' | 'right'
  heading_bold?: boolean
  heading_italic?: boolean
  // Block-level subheadline (after headline)
  subheadline?: string
  subheadline_font_size?: string
  subheadline_font_family?: string
  subheadline_color?: string
  subheadline_bold?: boolean
  subheadline_italic?: boolean
  subheadline_align?: 'left' | 'center' | 'right'
  background_color?: string
  overall_layout?: 'vertical' | 'horizontal'
  steps: Step[]
  // CTA Button fields
  cta_text?: string
  cta_url?: string
  button_align?: 'left' | 'center' | 'right'
  button_color?: string
}

interface StepsBlockEditorProps {
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

export default function StepsBlockEditor({ block, onUpdate, onMediaLibraryOpen, businessUnitId }: StepsBlockEditorProps) {
  const data = (block.data as StepsBlockData) || { steps: [] }
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
  const [showButtonColorPicker, setShowButtonColorPicker] = useState(false)
  const stepInputRefs = useRef<(HTMLInputElement | null)[]>([])

  const updateData = (updates: Partial<StepsBlockData>) => {
    onUpdate({
      ...block,
      data: { ...data, ...updates }
    })
  }

  const updateStep = (index: number, updates: Partial<Step>) => {
    const newSteps = [...(data.steps || [])]
    newSteps[index] = { ...newSteps[index], ...updates }
    updateData({ steps: newSteps })
  }

  const addStep = () => {
    const newSteps = [...(data.steps || []), {
      background_url: '',
      background_type: 'image' as const,
      image_width: '400px',
      subheadline: '',
      subheadline_font_size: '1.5rem',
      subheadline_font_family: 'Josefin Sans',
      subheadline_color: '#000000',
      subheadline_bold: false,
      subheadline_italic: false,
      subheadline_align: 'left' as const,
      text_content: '',
      text_position: 'right' as const,
      text_font_size: '1rem',
      text_font_family: 'Cormorant Garamond',
      text_color: '#000000',
      text_bold: false,
      text_italic: false,
      text_align: 'left' as const
    }]
    updateData({ steps: newSteps })
  }

  const removeStep = (index: number) => {
    const newSteps = data.steps.filter((_, i) => i !== index)
    updateData({ steps: newSteps })
  }

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...data.steps]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= newSteps.length) return

    [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]]
    updateData({ steps: newSteps })
  }

  const handleStepUpload = async (e: React.ChangeEvent<HTMLInputElement>, stepIndex: number) => {
    const file = e.target.files?.[0]
    if (!file) return

    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')

    if (!isImage && !isVideo) {
      alert('Please select an image or video file')
      return
    }

    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSize) {
      alert(`File must be less than ${isVideo ? '50MB' : '10MB'}`)
      return
    }

    setUploadingIndex(stepIndex)
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
        const steps = [...(data.steps || [])]
        steps[stepIndex] = {
          ...steps[stepIndex],
          background_url: responseData.url,
          background_type: isVideo ? 'video' : 'image',
          original_filename: file.name
        }
        updateData({ steps })
      }
    } catch (error: any) {
      console.error('Error uploading step background:', error)
      alert(`Failed to upload: ${error.message}`)
    } finally {
      setUploadingIndex(null)
      if (stepInputRefs.current[stepIndex]) {
        stepInputRefs.current[stepIndex]!.value = ''
      }
    }
  }

  return (
    <div className="space-y-3">
      {/* Block-level Subheadline (after headline) */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <UniversalTextEditor
          label="Block Subheadline"
          value={data.subheadline || ''}
          onChange={(value) => updateData({ subheadline: value })}
          fontSize={data.subheadline_font_size || 'clamp(1rem, 2vw, 1.25rem)'}
          onFontSizeChange={(value) => updateData({ subheadline_font_size: value })}
          fontFamily={data.subheadline_font_family || 'Josefin Sans'}
          onFontFamilyChange={(value) => updateData({ subheadline_font_family: value })}
          color={data.subheadline_color || '#666666'}
          onColorChange={(value) => updateData({ subheadline_color: value })}
          bold={data.subheadline_bold}
          onBoldChange={(value) => updateData({ subheadline_bold: value })}
          italic={data.subheadline_italic}
          onItalicChange={(value) => updateData({ subheadline_italic: value })}
          textAlign={data.subheadline_align || 'center'}
          onTextAlignChange={(value) => updateData({ subheadline_align: value })}
          placeholder="Enter subheadline (appears below main headline)"
        />
      </div>

      {/* CTA Button - Unified Design */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">Button Text & Style</label>
          <div className="flex bg-gray-100 p-0.5 rounded-none border border-gray-200">
            {(['left', 'center', 'right'] as const).map((align) => (
              <button
                key={align}
                onClick={() => updateData({ button_align: align })}
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
            onChange={(e) => updateData({ cta_text: e.target.value })}
            className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-none text-gray-800 text-xs placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-violet-500"
            placeholder="CTA Button Text"
          />
          <input
            type="text"
            value={data.cta_url || ''}
            onChange={(e) => updateData({ cta_url: e.target.value })}
            className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-none text-gray-800 text-xs placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-violet-500"
            placeholder="CTA Button URL (#faq)"
          />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] text-gray-400 uppercase font-bold">Button Color</span>
              <button
                onClick={() => setShowButtonColorPicker(!showButtonColorPicker)}
                className="w-7 h-7 rounded-none border border-gray-200 cursor-pointer hover:scale-110 transition-transform"
                style={{ backgroundColor: data.button_color || '#7c3aed' }}
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
                        borderColor: (data.button_color || '#7c3aed') === c.value ? '#a855f7' : '#475569'
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

      {/* Steps */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-gray-700">Steps / Features</label>
          <button
            onClick={addStep}
            className="px-3 py-1.5 bg-violet-600 text-white rounded-none text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-violet-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Step
          </button>
        </div>

        {data.steps?.map((step, index) => (
          <div key={index} className="p-4 bg-white rounded-none border border-gray-200 space-y-4 shadow-sm">
            {/* Step Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Step {index + 1}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => moveStep(index, 'up')} disabled={index === 0} className="p-1 text-gray-400 hover:text-gray-800 disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                <button onClick={() => moveStep(index, 'down')} disabled={index === data.steps.length - 1} className="p-1 text-gray-400 hover:text-gray-800 disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                <button onClick={() => removeStep(index)} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>

            {/* Background Upload */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-none">
              <label className="block text-[10px] text-gray-500 font-bold uppercase mb-2">Media (Image/Video)</label>
              <div className="flex items-center gap-3 flex-wrap">
                {step.background_url ? (
                  <div className="relative">
                    {step.background_type === 'video' ? (
                      <video src={step.background_url} className="h-16 w-28 object-cover rounded-none" muted />
                    ) : (
                      <img src={step.background_url} alt="Background" className="h-16 w-28 object-cover rounded-none" />
                    )}
                    <button
                      onClick={() => updateStep(index, { background_url: '', background_type: 'image' })}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="h-16 w-28 bg-white border border-dashed border-gray-300 rounded-none flex items-center justify-center">
                    <Image className="w-6 h-6 text-gray-300" />
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => stepInputRefs.current[index]?.click()}
                      disabled={uploadingIndex === index}
                      className="px-2 py-1 bg-violet-50 border border-violet-200 text-gray-800 text-[10px] font-bold rounded-none hover:bg-violet-100 disabled:opacity-50 flex items-center gap-1 shadow-sm"
                    >
                      {uploadingIndex === index ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                      Upload
                    </button>
                    {onMediaLibraryOpen && (
                      <button
                        onClick={() => onMediaLibraryOpen((url) => updateStep(index, { background_url: url }))}
                        className="px-2 py-1 bg-gray-100 border border-gray-200 text-gray-700 text-[10px] font-bold rounded-none hover:bg-gray-200 flex items-center gap-1 shadow-sm"
                      >
                        <Image className="w-3 h-3" />
                        Library
                      </button>
                    )}
                  </div>
                  <input
                    ref={(el) => { stepInputRefs.current[index] = el }}
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => handleStepUpload(e, index)}
                    className="hidden"
                  />
                  {/* Image Size Controls */}
                  {step.background_url && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => {
                        const w = parseInt((step.image_width || '400px').replace('px',''))
                        updateStep(index, { image_width: `${Math.max(100, w-20)}px` })
                      }} className="px-1.5 py-0.5 bg-gray-100 text-[10px] border border-gray-200">-</button>
                      <span className="text-[10px] font-mono">{step.image_width || '400px'}</span>
                      <button onClick={() => {
                        const w = parseInt((step.image_width || '400px').replace('px',''))
                        updateStep(index, { image_width: `${w+20}px` })
                      }} className="px-1.5 py-0.5 bg-gray-100 text-[10px] border border-gray-200">+</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Text Position */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-none">
              <label className="block text-[10px] text-gray-500 font-bold uppercase mb-2">Text Position</label>
              <div className="grid grid-cols-4 gap-1">
                {(['left', 'right', 'above', 'below'] as const).map((pos) => (
                  <button
                    key={pos}
                    onClick={() => updateStep(index, { text_position: pos })}
                    className={`px-2 py-1 rounded-none text-[10px] font-bold capitalize transition-all ${
                      step.text_position === pos
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'bg-white text-gray-400 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <UniversalTextEditor
                label="Step Headline"
                value={step.subheadline || ''}
                onChange={(value) => updateStep(index, { subheadline: value })}
                fontSize={step.subheadline_font_size || '1.5rem'}
                onFontSizeChange={(value) => updateStep(index, { subheadline_font_size: value })}
                fontFamily={step.subheadline_font_family || 'Josefin Sans'}
                onFontFamilyChange={(value) => updateStep(index, { subheadline_font_family: value })}
                color={step.subheadline_color || '#000000'}
                onColorChange={(value) => updateStep(index, { subheadline_color: value })}
                bold={step.subheadline_bold}
                onBoldChange={(value) => updateStep(index, { subheadline_bold: value })}
                italic={step.subheadline_italic}
                onItalicChange={(value) => updateStep(index, { subheadline_italic: value })}
                textAlign={step.subheadline_align || 'left'}
                onTextAlignChange={(value) => updateStep(index, { subheadline_align: value })}
                placeholder="e.g., Step 1: Cleanse"
              />

              <div>
                <label className="block text-[10px] text-gray-500 font-bold uppercase mb-1">Text Content</label>
                <PolicyRichTextEditor
                  value={step.text_content || ''}
                  onChange={(value) => updateStep(index, { text_content: value })}
                  placeholder="Enter step instructions..."
                />
              </div>
            </div>
          </div>
        ))}

        {data.steps?.length === 0 && (
          <div className="text-center py-8 bg-gray-50 border-2 border-dashed border-gray-200 text-gray-400 text-xs">
            No steps yet. Click "Add Step" to begin building your grid.
          </div>
        )}
      </div>
    </div>
  )
}
