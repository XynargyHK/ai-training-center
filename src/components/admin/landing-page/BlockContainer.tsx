'use client'

import { useState } from 'react'
import { GripVertical, ChevronDown, ChevronUp, Trash2, Edit2, Check } from 'lucide-react'
import type { LandingPageBlock } from '@/types/landing-page-blocks'
import { getBlockTypeConfig } from './block-registry'

interface BlockContainerProps {
  block: LandingPageBlock
  index: number
  onUpdate: (block: LandingPageBlock) => void
  onDelete: () => void
  dragHandleProps?: any  // From react-beautiful-dnd
  children: React.ReactNode
}

export default function BlockContainer({
  block,
  index,
  onUpdate,
  onDelete,
  dragHandleProps,
  children
}: BlockContainerProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState(block.name)

  const blockConfig = getBlockTypeConfig(block.type)

  const handleSaveName = () => {
    onUpdate({ ...block, name: editedName })
    setIsEditingName(false)
  }

  const handleCancelEdit = () => {
    setEditedName(block.name)
    setIsEditingName(false)
  }

  return (
    <div className="bg-gradient-to-r from-slate-800/50 to-slate-800/30 rounded-lg border border-slate-600 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-slate-800/50 border-b border-slate-600">
        {/* Block Icon */}
        <div className="w-10 h-10 bg-violet-500/20 rounded-lg flex items-center justify-center text-xl">
          {blockConfig?.icon || '📦'}
        </div>

        {/* Block Name/Type */}
        <div className="flex-1">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName()
                  if (e.key === 'Escape') handleCancelEdit()
                }}
                autoFocus
                className="flex-1 px-2 py-1 bg-slate-700 border border-slate-500 rounded text-white text-sm"
                placeholder="Block name..."
              />
              <button
                onClick={handleSaveName}
                className="text-green-400 hover:text-green-300 p-1"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h3 className="text-white font-medium">{block.name}</h3>
              <button
                onClick={() => setIsEditingName(true)}
                className="text-slate-400 hover:text-violet-400 p-1 transition-colors"
                title="Edit block name"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-slate-500">#{index + 1}</span>
            <span className="text-xs px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded">
              {blockConfig?.label || block.type}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
          </button>
          <button
            onClick={onDelete}
            className="text-slate-400 hover:text-red-400 transition-colors p-1"
          >
            <Trash2 className="w-5 h-5" />
          </button>

          {/* Drag Handle */}
          <div
            {...dragHandleProps}
            className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 transition-colors"
          >
            <GripVertical className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-6">
          {children}
        </div>
      )}
    </div>
  )
}
