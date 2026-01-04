'use client'

import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import type { LandingPageBlock } from '@/types/landing-page-blocks'
import UniversalTextEditor from '../UniversalTextEditor'

interface AccordionBlockEditorProps {
  block: LandingPageBlock
  onUpdate: (block: LandingPageBlock) => void
}

export default function AccordionBlockEditor({ block, onUpdate }: AccordionBlockEditorProps) {
  const data = block.data as {
    heading?: string
    heading_font_size?: string
    heading_font_family?: string
    heading_color?: string
    items: Array<{
      title: string
      title_font_size?: string
      title_font_family?: string
      title_color?: string
      title_bold?: boolean
      title_italic?: boolean
      content: string
      content_font_size?: string
      content_font_family?: string
      content_color?: string
      content_bold?: boolean
      content_italic?: boolean
    }>
  }

  const updateData = (updates: any) => {
    onUpdate({
      ...block,
      data: { ...data, ...updates }
    })
  }

  const updateItem = (index: number, updates: any) => {
    const newItems = [...data.items]
    newItems[index] = { ...newItems[index], ...updates }
    onUpdate({
      ...block,
      data: { ...data, items: newItems }
    })
  }

  const addItem = () => {
    onUpdate({
      ...block,
      data: {
        ...data,
        items: [
          ...data.items,
          {
            title: '',
            title_font_size: '1rem',
            title_font_family: 'Josefin Sans',
            title_color: '#111827',
            title_bold: false,
            title_italic: false,
            content: '',
            content_font_size: '1rem',
            content_font_family: 'Cormorant Garamond',
            content_color: '#374151',
            content_bold: false,
            content_italic: false
          }
        ]
      }
    })
  }

  const deleteItem = (index: number) => {
    onUpdate({
      ...block,
      data: {
        ...data,
        items: data.items.filter((_, i) => i !== index)
      }
    })
  }

  const moveUp = (index: number) => {
    if (index === 0) return
    const newItems = [...data.items]
    const temp = newItems[index - 1]
    newItems[index - 1] = newItems[index]
    newItems[index] = temp
    onUpdate({
      ...block,
      data: { ...data, items: newItems }
    })
  }

  const moveDown = (index: number) => {
    if (index === data.items.length - 1) return
    const newItems = [...data.items]
    const temp = newItems[index + 1]
    newItems[index + 1] = newItems[index]
    newItems[index] = temp
    onUpdate({
      ...block,
      data: { ...data, items: newItems }
    })
  }

  return (
    <div className="space-y-4">
      {/* Heading Section - Using UniversalTextEditor */}
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
          placeholder="e.g., Frequently Asked Questions"
        />
      </div>

      {/* FAQ Items */}
      {data.items.map((item, index) => (
        <div key={index} className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-slate-300">Item {index + 1}</span>
            <div className="flex items-center gap-2">
              {/* Move Up */}
              <button
                onClick={() => moveUp(index)}
                disabled={index === 0}
                className="text-slate-400 hover:text-white p-1 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Move up"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              {/* Move Down */}
              <button
                onClick={() => moveDown(index)}
                disabled={index === data.items.length - 1}
                className="text-slate-400 hover:text-white p-1 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Move down"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              {/* Delete */}
              <button
                onClick={() => deleteItem(index)}
                className="text-red-400 hover:text-red-300 p-1"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {/* Question / Title */}
            <UniversalTextEditor
              label="Question / Title"
              value={item.title}
              onChange={(value) => updateItem(index, { title: value })}
              fontSize={item.title_font_size || '1rem'}
              onFontSizeChange={(value) => updateItem(index, { title_font_size: value })}
              fontFamily={item.title_font_family || 'Josefin Sans'}
              onFontFamilyChange={(value) => updateItem(index, { title_font_family: value })}
              color={item.title_color || '#000000'}
              onColorChange={(value) => updateItem(index, { title_color: value })}
              bold={item.title_bold}
              onBoldChange={(value) => updateItem(index, { title_bold: value })}
              italic={item.title_italic}
              onItalicChange={(value) => updateItem(index, { title_italic: value })}
              placeholder="e.g., What is your return policy?"
            />

            {/* Answer / Content */}
            <UniversalTextEditor
              label="Answer / Content"
              value={item.content}
              onChange={(value) => updateItem(index, { content: value })}
              fontSize={item.content_font_size || '1rem'}
              onFontSizeChange={(value) => updateItem(index, { content_font_size: value })}
              fontFamily={item.content_font_family || 'Cormorant Garamond'}
              onFontFamilyChange={(value) => updateItem(index, { content_font_family: value })}
              color={item.content_color || '#374151'}
              onColorChange={(value) => updateItem(index, { content_color: value })}
              bold={item.content_bold}
              onBoldChange={(value) => updateItem(index, { content_bold: value })}
              italic={item.content_italic}
              onItalicChange={(value) => updateItem(index, { content_italic: value })}
              placeholder="The answer or content that will be shown when expanded..."
              multiline={true}
              rows={4}
            />
          </div>
        </div>
      ))}

      <button
        onClick={addItem}
        className="w-full py-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Add Item
      </button>
    </div>
  )
}
