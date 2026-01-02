'use client'

import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import type { LandingPageBlock } from '@/types/landing-page-blocks'

interface AccordionBlockEditorProps {
  block: LandingPageBlock
  onUpdate: (block: LandingPageBlock) => void
}

export default function AccordionBlockEditor({ block, onUpdate }: AccordionBlockEditorProps) {
  const data = block.data as {
    items: Array<{
      title: string
      content: string
    }>
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
            content: ''
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
            <div>
              <label className="block text-xs text-slate-400 mb-1">Question / Title</label>
              <input
                type="text"
                value={item.title}
                onChange={(e) => updateItem(index, { title: e.target.value })}
                placeholder="e.g., What is your return policy?"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Answer / Content</label>
              <textarea
                value={item.content}
                onChange={(e) => updateItem(index, { content: e.target.value })}
                placeholder="The answer or content that will be shown when expanded..."
                rows={4}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 resize-y"
              />
            </div>
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
