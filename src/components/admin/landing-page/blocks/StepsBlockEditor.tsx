'use client'

import { useState, useRef } from 'react'
import { Upload, X, ChevronUp, ChevronDown, Plus, Trash2, Image, Loader2 } from 'lucide-react'
import type { LandingPageBlock } from '@/types/landing-page-blocks'
import UniversalTextEditor from '../UniversalTextEditor'

interface Step {
  background_url?: string
  background_type?: 'image' | 'video'
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
  heading?: string
  heading_font_size?: string
  heading_font_family?: string
  heading_color?: string
  background_color?: string
  overall_layout?: 'vertical' | 'horizontal'
  steps: Step[]
}

interface StepsBlockEditorProps {
  block: LandingPageBlock
  onUpdate: (block: LandingPageBlock) => void
  onMediaLibraryOpen?: (callback: (url: string) => void) => void
  businessUnitId?: string
}

export default function StepsBlockEditor({ block, onUpdate, onMediaLibraryOpen, businessUnitId }: StepsBlockEditorProps) {
  const data = (block.data as StepsBlockData) || { steps: [] }
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
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

  // Upload handler - EXACT copy from hero banner
  const handleStepUpload = async (e: React.ChangeEvent<HTMLInputElement>, stepIndex: number) => {
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
          background_type: isVideo ? 'video' : 'image'
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
    <div className="space-y-6">
      {/* Heading Settings - Using UniversalTextEditor */}
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
        <UniversalTextEditor
          label="Heading"
          value={data.heading || ''}
          onChange={(value) => updateData({ heading: value })}
          fontSize={data.heading_font_size || '2.5rem'}
          onFontSizeChange={(value) => updateData({ heading_font_size: value })}
          fontFamily={data.heading_font_family || 'Josefin Sans'}
          onFontFamilyChange={(value) => updateData({ heading_font_family: value })}
          color={data.heading_color || '#000000'}
          onColorChange={(value) => updateData({ heading_color: value })}
          placeholder="e.g., HOW TO USE"
        />
      </div>

      {/* Overall Layout */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Overall Layout</label>
        <div className="flex gap-2">
          <button
            onClick={() => updateData({ overall_layout: 'vertical' })}
            className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
              (data.overall_layout || 'vertical') === 'vertical'
                ? 'border-violet-500 bg-violet-500/20 text-white'
                : 'border-slate-600 bg-slate-800/50 text-slate-400 hover:border-slate-500'
            }`}
          >
            <div className="text-sm font-medium">Vertical</div>
            <div className="text-xs mt-1 opacity-70">Steps stack ↓</div>
          </button>
          <button
            onClick={() => updateData({ overall_layout: 'horizontal' })}
            className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
              data.overall_layout === 'horizontal'
                ? 'border-violet-500 bg-violet-500/20 text-white'
                : 'border-slate-600 bg-slate-800/50 text-slate-400 hover:border-slate-500'
            }`}
          >
            <div className="text-sm font-medium">Horizontal</div>
            <div className="text-xs mt-1 opacity-70">Steps →→→</div>
          </button>
        </div>
      </div>

      {/* Background Color */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Background Color</label>
        <input
          type="color"
          value={data.background_color || '#ffffff'}
          onChange={(e) => updateData({ background_color: e.target.value })}
          className="w-full h-10 bg-slate-800 border border-slate-600 rounded-lg"
        />
      </div>

      {/* Steps */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-slate-300">Steps</label>
          <button
            onClick={addStep}
            className="px-3 py-1 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add Step
          </button>
        </div>

        {data.steps?.map((step, index) => (
          <div key={index} className="p-4 bg-slate-800 rounded-lg border border-slate-600 space-y-3">
            {/* Step Header */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">Step {index + 1}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => moveStep(index, 'up')}
                  disabled={index === 0}
                  className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move up"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => moveStep(index, 'down')}
                  disabled={index === data.steps.length - 1}
                  className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move down"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => removeStep(index)}
                  className="p-1 text-red-400 hover:text-red-300"
                  title="Delete step"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Background Upload - EXACT copy from hero banner */}
            <div className="mb-3">
              <label className="block text-xs text-slate-400 mb-1">Background Image/Video</label>
              <div className="flex items-center gap-2 flex-wrap">
                {step.background_url ? (
                  <div className="relative">
                    {step.background_type === 'video' ? (
                      <video src={step.background_url} className="h-16 w-28 object-cover rounded" muted />
                    ) : (
                      <img src={step.background_url} alt="Background" className="h-16 w-28 object-cover rounded" />
                    )}
                    <button
                      onClick={() => updateStep(index, { background_url: '', background_type: 'image' })}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <span className="absolute bottom-0.5 right-0.5 text-[10px] bg-black/60 text-white px-1 rounded">
                      {step.background_type === 'video' ? 'VIDEO' : 'IMAGE'}
                    </span>
                  </div>
                ) : (
                  <div className="h-16 w-28 bg-slate-800 border border-dashed border-slate-600 rounded flex items-center justify-center">
                    <Image className="w-6 h-6 text-slate-500" />
                  </div>
                )}
                <button
                  onClick={() => stepInputRefs.current[index]?.click()}
                  disabled={uploadingIndex === index}
                  className="px-3 py-1.5 bg-violet-600 text-white text-sm rounded hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {uploadingIndex === index ? (
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
                <input
                  ref={(el) => { stepInputRefs.current[index] = el }}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm"
                  onChange={(e) => handleStepUpload(e, index)}
                  className="hidden"
                />
                {/* Image Size Controls */}
                {step.background_url && (
                  <>
                    <button
                      onClick={() => {
                        const currentWidth = parseInt((step.image_width || '400px').replace('px', ''))
                        const newWidth = currentWidth - 20
                        updateStep(index, { image_width: `${newWidth}px` })
                      }}
                      className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm"
                      title="Smaller"
                    >
                      -
                    </button>
                    <span className="text-xs text-slate-300">
                      {parseInt((step.image_width || '400px').replace('px', ''))}px
                    </span>
                    <button
                      onClick={() => {
                        const currentWidth = parseInt((step.image_width || '400px').replace('px', ''))
                        const newWidth = currentWidth + 20
                        updateStep(index, { image_width: `${newWidth}px` })
                      }}
                      className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm"
                      title="Bigger"
                    >
                      +
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Text Position */}
            <div>
              <label className="block text-xs text-slate-400 mb-2">Text Position</label>
              <div className="grid grid-cols-4 gap-2">
                {(['left', 'right', 'above', 'below'] as const).map((pos) => (
                  <button
                    key={pos}
                    onClick={() => updateStep(index, { text_position: pos })}
                    className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all ${
                      step.text_position === pos
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            {/* Subheadline */}
            <UniversalTextEditor
              label="Subheadline"
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

            {/* Text Content - Using Universal Text Editor */}
            <UniversalTextEditor
              label="Text Content"
              value={step.text_content || ''}
              onChange={(value) => updateStep(index, { text_content: value })}
              fontSize={step.text_font_size || '1rem'}
              onFontSizeChange={(value) => updateStep(index, { text_font_size: value })}
              fontFamily={step.text_font_family || 'Cormorant Garamond'}
              onFontFamilyChange={(value) => updateStep(index, { text_font_family: value })}
              color={step.text_color || '#000000'}
              onColorChange={(value) => updateStep(index, { text_color: value })}
              bold={step.text_bold}
              onBoldChange={(value) => updateStep(index, { text_bold: value })}
              italic={step.text_italic}
              onItalicChange={(value) => updateStep(index, { text_italic: value })}
              textAlign={step.text_align || 'left'}
              onTextAlignChange={(value) => updateStep(index, { text_align: value })}
              placeholder="Enter step instructions..."
              multiline={true}
              rows={3}
            />
          </div>
        ))}

        {data.steps?.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-sm">
            No steps yet. Click "Add Step" to begin.
          </div>
        )}
      </div>
    </div>
  )
}
