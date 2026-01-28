'use client'

import { X } from 'lucide-react'
import { getAllBlockTypes, type BlockTypeConfig } from './block-registry'

interface BlockPickerProps {
  onSelect: (blockType: string) => void
  onClose: () => void
}

export default function BlockPicker({ onSelect, onClose }: BlockPickerProps) {
  const blockTypes = getAllBlockTypes()

  // Group by category
  const categories = {
    content: blockTypes.filter(b => b.category === 'content'),
    social: blockTypes.filter(b => b.category === 'social'),
    interactive: blockTypes.filter(b => b.category === 'interactive')
  }

  const categoryLabels = {
    content: 'Content Blocks',
    social: 'Social Proof',
    interactive: 'Interactive'
  }

  const handleSelectBlock = (type: string) => {
    onSelect(type)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-none border border-gray-200/50 shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200/50">
          <div>
            <h2 className="text-xs font-bold text-gray-800">Add Block</h2>
            <p className="text-[10px] text-gray-500">Choose a block type</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 transition-colors p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Block Types Grid */}
        <div className="p-3 overflow-y-auto max-h-[calc(80vh-60px)]">
          {Object.entries(categories).map(([category, blocks]) => (
            blocks.length > 0 && (
              <div key={category} className="mb-3 last:mb-0">
                <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </h3>
                <div className="grid grid-cols-2 gap-1.5">
                  {blocks.map((blockType) => (
                    <button
                      key={blockType.type}
                      onClick={() => handleSelectBlock(blockType.type)}
                      className="group relative bg-gray-50 hover:bg-gray-50 border border-gray-200/50 hover:border-violet-500 rounded-none p-2 text-left transition-all"
                    >
                      <div className="flex items-start gap-2">
                        <div className="w-7 h-7 bg-violet-50/20 group-hover:bg-violet-50/30 rounded-none flex items-center justify-center text-sm transition-colors shrink-0">
                          {blockType.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-gray-800 text-xs font-medium group-hover:text-violet-600 transition-colors">
                            {blockType.label}
                          </h4>
                          <p className="text-[10px] text-gray-500 leading-tight truncate">
                            {blockType.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  )
}
