'use client'

import React from 'react'
import type { LandingPageBlock } from '@/types/landing-page-blocks'
import TextEditorControls from '../TextEditorControls'

interface FormBlockEditorProps {
  block: LandingPageBlock
  onUpdate: (block: LandingPageBlock) => void
}

export default function FormBlockEditor({ block, onUpdate }: FormBlockEditorProps) {
  const data = block.data as {
    headline: string
    headline_font_size?: string
    headline_font_family?: string
    headline_color?: string
    headline_bold?: boolean
    headline_italic?: boolean
    headline_text_align?: 'left' | 'center' | 'right'
    
    subheadline: string
    subheadline_font_size?: string
    subheadline_font_family?: string
    subheadline_color?: string
    subheadline_bold?: boolean
    subheadline_italic?: boolean
    subheadline_text_align?: 'left' | 'center' | 'right'

    description: string
    description_font_size?: string
    description_font_family?: string
    description_color?: string
    description_text_align?: 'left' | 'center' | 'right'

    fields: Array<{
      id: string
      label: string
      placeholder: string
      type: 'text' | 'email' | 'tel' | 'textarea' | 'checkbox' | 'select'
      required: boolean
      options?: string[] // For select type
    }>

    submit_button_text: string
    submit_button_color?: string
    submit_button_text_color?: string
    
    success_message: string
    redirect_url?: string
    
    background_color?: string
    border_color?: string
    border_radius?: string
  }

  const updateData = (updates: Partial<typeof data>) => {
    onUpdate({
      ...block,
      data: {
        ...block.data,
        ...updates
      }
    })
  }

  const addField = () => {
    const newFields = [
      ...(data.fields || []),
      {
        id: crypto.randomUUID(),
        label: 'New Field',
        placeholder: 'Enter value...',
        type: 'text' as const,
        required: false
      }
    ]
    updateData({ fields: newFields })
  }

  const updateField = (id: string, updates: any) => {
    const newFields = data.fields.map(f => f.id === id ? { ...f, ...updates } : f)
    updateData({ fields: newFields })
  }

  const removeField = (id: string) => {
    const newFields = data.fields.filter(f => f.id !== id)
    updateData({ fields: newFields })
  }

  return (
    <div className="space-y-6">
      {/* Headline Section */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">Form Headline</label>
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
          italic={data.headline_italic}
          onItalicChange={(val) => updateData({ headline_italic: val })}
          textAlign={data.headline_text_align}
          onTextAlignChange={(val) => updateData({ headline_text_align: val })}
        />
      </div>

      {/* Subheadline Section */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">Subheadline / Description</label>
        <TextEditorControls
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

      {/* Fields Editor */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Form Fields</label>
          <button
            onClick={addField}
            className="px-3 py-1 bg-violet-600 text-white text-xs rounded-md hover:bg-violet-700 transition-colors"
          >
            + Add Field
          </button>
        </div>

        <div className="space-y-3">
          {(data.fields || []).map((field, index) => (
            <div key={field.id} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm space-y-3 relative group">
              <button
                onClick={() => removeField(field.id)}
                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">Field Label</label>
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => updateField(field.id, { label: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-violet-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">Type</label>
                  <select
                    value={field.type}
                    onChange={(e) => updateField(field.id, { type: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-violet-500 outline-none"
                  >
                    <option value="text">Text</option>
                    <option value="email">Email</option>
                    <option value="tel">Phone</option>
                    <option value="textarea">Textarea</option>
                    <option value="checkbox">Checkbox</option>
                    <option value="select">Select Dropdown</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">Placeholder</label>
                  <input
                    type="text"
                    value={field.placeholder}
                    onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-violet-500 outline-none"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => updateField(field.id, { required: e.target.checked })}
                      className="rounded text-violet-600 focus:ring-violet-500"
                    />
                    <span className="text-xs text-gray-600">Required</span>
                  </label>
                </div>
              </div>

              {field.type === 'select' && (
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">Options (Comma separated)</label>
                  <input
                    type="text"
                    value={(field.options || []).join(', ')}
                    onChange={(e) => updateField(field.id, { options: e.target.value.split(',').map(s => s.trim()) })}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-violet-500 outline-none"
                    placeholder="Option 1, Option 2, Option 3"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Button & Success Section */}
      <div className="p-4 bg-violet-50 rounded-lg border border-violet-100 space-y-4">
        <div>
          <label className="block text-xs font-medium text-violet-700 mb-2">Submit Button</label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={data.submit_button_text}
              onChange={(e) => updateData({ submit_button_text: e.target.value })}
              className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-violet-500 outline-none"
              placeholder="Button Text"
            />
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500">Color:</span>
              <input
                type="color"
                value={data.submit_button_color || '#7c3aed'}
                onChange={(e) => updateData({ submit_button_color: e.target.value })}
                className="w-8 h-8 rounded border-none cursor-pointer p-0"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-violet-700 mb-2">Post-Submit Message</label>
          <textarea
            value={data.success_message}
            onChange={(e) => updateData({ success_message: e.target.value })}
            rows={2}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-violet-500 outline-none"
            placeholder="Thank you! We have received your submission."
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-violet-700 mb-2">Redirect URL (Optional)</label>
          <input
            type="text"
            value={data.redirect_url || ''}
            onChange={(e) => updateData({ redirect_url: e.target.value })}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-violet-500 outline-none"
            placeholder="https://dmsprod.hkbiorhythm.com"
          />
        </div>
      </div>

      {/* Style Section */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-3">Block Styling</label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] text-gray-500 mb-1">Background Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={data.background_color || '#ffffff'}
                onChange={(e) => updateData({ background_color: e.target.value })}
                className="w-8 h-8 rounded border-none cursor-pointer"
              />
              <input
                type="text"
                value={data.background_color || '#ffffff'}
                onChange={(e) => updateData({ background_color: e.target.value })}
                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 mb-1">Border Radius</label>
            <select
              value={data.border_radius || '0.5rem'}
              onChange={(e) => updateData({ border_radius: e.target.value })}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded outline-none"
            >
              <option value="0">Square</option>
              <option value="0.25rem">Rounded Small</option>
              <option value="0.5rem">Rounded Medium</option>
              <option value="1rem">Rounded Large</option>
              <option value="9999px">Full (Pill)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
