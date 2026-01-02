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
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-600 shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-600">
          <div>
            <h2 className="text-2xl font-bold text-white">Add Block</h2>
            <p className="text-sm text-slate-400 mt-1">Choose a block type to add to your page</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Block Types Grid */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
          {Object.entries(categories).map(([category, blocks]) => (
            blocks.length > 0 && (
              <div key={category} className="mb-6 last:mb-0">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {blocks.map((blockType) => (
                    <button
                      key={blockType.type}
                      onClick={() => handleSelectBlock(blockType.type)}
                      className="group relative bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600 hover:border-violet-500 rounded-lg p-4 text-left transition-all hover:scale-[1.02] hover:shadow-lg"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-violet-500/20 group-hover:bg-violet-500/30 rounded-lg flex items-center justify-center text-2xl transition-colors">
                          {blockType.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-semibold mb-1 group-hover:text-violet-400 transition-colors">
                            {blockType.label}
                          </h4>
                          <p className="text-sm text-slate-400 leading-relaxed">
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
