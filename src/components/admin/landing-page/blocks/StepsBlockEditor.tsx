'use client'

import { useState, useRef } from 'react'
import { Upload, Image as ImageIcon, Loader2, X, ChevronUp, ChevronDown, Plus, Trash2, Bold, Italic, Underline } from 'lucide-react'
import type { LandingPageBlock } from '@/types/landing-page-blocks'

interface Step {
  image_url?: string
  video_url?: string
  text_content: string
  text_position: 'left' | 'right' | 'above' | 'below'
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
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({})

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
      image_url: '',
      video_url: '',
      text_content: '',
      text_position: 'right' as const
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

  const handleMediaUpload = async (stepIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !businessUnitId) return

    setUploadingIndex(stepIndex)
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
      const isVideo = file.type.startsWith('video/')

      updateStep(stepIndex, isVideo
        ? { video_url: result.file.url, image_url: '' }
        : { image_url: result.file.url, video_url: '' }
      )
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload media')
    } finally {
      setUploadingIndex(null)
    }
  }

  const applyFormatting = (stepIndex: number, format: 'bold' | 'italic' | 'underline') => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    const selectedText = range.toString()

    if (!selectedText) return

    let formattedText = ''
    switch (format) {
      case 'bold':
        formattedText = `<strong>${selectedText}</strong>`
        break
      case 'italic':
        formattedText = `<em>${selectedText}</em>`
        break
      case 'underline':
        formattedText = `<u>${selectedText}</u>`
        break
    }

    // Replace selection with formatted text
    const step = data.steps[stepIndex]
    const currentContent = step.text_content || ''

    // Simple approach: append formatted text (you can enhance this)
    const newContent = currentContent + formattedText
    updateStep(stepIndex, { text_content: newContent })
  }

  return (
    <div className="space-y-6">
      {/* Heading Settings */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-300">Heading</label>
        <input
          type="text"
          value={data.heading || 'HOW TO USE'}
          onChange={(e) => updateData({ heading: e.target.value })}
          placeholder="HOW TO USE"
          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
        />

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Font Size</label>
            <input
              type="text"
              value={data.heading_font_size || '2.5rem'}
              onChange={(e) => updateData({ heading_font_size: e.target.value })}
              placeholder="2.5rem"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Font Family</label>
            <select
              value={data.heading_font_family || 'Josefin Sans'}
              onChange={(e) => updateData({ heading_font_family: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm"
            >
              <option value="Josefin Sans">Josefin Sans</option>
              <option value="Cormorant Garamond">Cormorant Garamond</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Color</label>
            <input
              type="color"
              value={data.heading_color || '#000000'}
              onChange={(e) => updateData({ heading_color: e.target.value })}
              className="w-full h-10 bg-slate-800 border border-slate-600 rounded-lg"
            />
          </div>
        </div>
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

            {/* Media Upload */}
            <div>
              <label className="block text-xs text-slate-400 mb-2">Image or Video</label>
              <div className="flex flex-col gap-2">
                {(step.image_url || step.video_url) && (
                  <div className="relative inline-block">
                    {step.video_url ? (
                      <video src={step.video_url} controls className="w-32 h-32 object-cover rounded-lg" />
                    ) : (
                      <img src={step.image_url} alt={`Step ${index + 1}`} className="w-32 h-32 object-cover rounded-lg" />
                    )}
                    <button
                      onClick={() => updateStep(index, { image_url: '', video_url: '' })}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => fileInputRefs.current[index]?.click()}
                    disabled={uploadingIndex === index}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm flex items-center gap-2"
                  >
                    {uploadingIndex === index ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    Upload
                  </button>
                  {onMediaLibraryOpen && (
                    <button
                      onClick={() => onMediaLibraryOpen((url) => {
                        const isVideo = url.match(/\.(mp4|webm|mov)$/i)
                        updateStep(index, isVideo ? { video_url: url, image_url: '' } : { image_url: url, video_url: '' })
                      })}
                      className="px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-sm flex items-center gap-2"
                    >
                      <ImageIcon className="w-4 h-4" />
                      Library
                    </button>
                  )}
                </div>

                <input
                  ref={(el) => { fileInputRefs.current[index] = el }}
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => handleMediaUpload(index, e)}
                  className="hidden"
                />
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

            {/* Text Content with Rich Text Editor */}
            <div>
              <label className="block text-xs text-slate-400 mb-2">Text Content</label>

              {/* Simple Rich Text Toolbar */}
              <div className="flex gap-2 mb-2 p-2 bg-slate-700 rounded-lg">
                <button
                  onClick={() => applyFormatting(index, 'bold')}
                  className="p-1 hover:bg-slate-600 rounded text-white"
                  title="Bold"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  onClick={() => applyFormatting(index, 'italic')}
                  className="p-1 hover:bg-slate-600 rounded text-white"
                  title="Italic"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  onClick={() => applyFormatting(index, 'underline')}
                  className="p-1 hover:bg-slate-600 rounded text-white"
                  title="Underline"
                >
                  <Underline className="w-4 h-4" />
                </button>
              </div>

              <textarea
                value={step.text_content || ''}
                onChange={(e) => updateStep(index, { text_content: e.target.value })}
                placeholder="Enter step instructions..."
                rows={3}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-y font-light"
              />
              <p className="text-xs text-slate-500 mt-1">You can use HTML tags: &lt;strong&gt;, &lt;em&gt;, &lt;u&gt;, &lt;br&gt;</p>
            </div>
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
