'use client'

import { useState } from 'react'
import { GripVertical, ChevronDown, ChevronUp, Trash2, Edit2, Check, Type } from 'lucide-react'
import type { LandingPageBlock } from '@/types/landing-page-blocks'
import { getBlockTypeConfig } from './block-registry'

interface BlockContainerProps {
  block: LandingPageBlock
  index: number
  onUpdate: (block: LandingPageBlock) => void
  onDelete: () => void
  dragHandleProps?: any  // From react-beautiful-dnd
  children: React.ReactNode
  headerActions?: React.ReactNode  // Custom actions to show in header
}

export default function BlockContainer({
  block,
  index,
  onUpdate,
  onDelete,
  dragHandleProps,
  children,
  headerActions
}: BlockContainerProps) {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState(block.name)
  const [showToolbar, setShowToolbar] = useState(false)

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
    <div className="bg-gradient-to-r from-slate-800/50 to-slate-800/30 rounded-none border border-gray-200/50 overflow-hidden">
      {/* Header */}
      <div className="relative flex flex-wrap items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200/50">
        {/* Block Type Label - Top Center */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2">
          <span className="text-[9px] text-gray-800 uppercase tracking-wider">
            {blockConfig?.label || block.type}
          </span>
        </div>

        {/* Block Name/Type */}
        <div className="flex-1 min-w-0 mt-2">
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
                className="flex-1 px-2 py-0.5 bg-gray-100 border border-gray-300 rounded-none text-gray-800 text-xs"
                placeholder="Block name..."
              />
              <button
                onClick={handleSaveName}
                className="text-green-600 hover:text-green-600 p-1"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h3 className="text-gray-800 text-xs font-medium truncate">{block.name}</h3>
              <button
                onClick={() => setIsEditingName(true)}
                className="text-gray-500 hover:text-violet-600 p-1 transition-colors flex-shrink-0"
                title="Edit block name"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Desktop: Toolbar inline */}
        {headerActions && (
          <div className="hidden md:flex items-center gap-1 mt-2">
            {headerActions}
          </div>
        )}

        {/* Mobile: Toolbar toggle button */}
        {headerActions && (
          <button
            onClick={() => setShowToolbar(!showToolbar)}
            className={`md:hidden flex items-center gap-1 mt-2 px-2 py-1 text-[10px] border rounded-none transition-colors ${
              showToolbar
                ? 'bg-violet-50 border-violet-300 text-violet-700'
                : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Type className="w-3 h-3" />
            Format
            <ChevronDown className={`w-3 h-3 transition-transform ${showToolbar ? 'rotate-180' : ''}`} />
          </button>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 mt-2 flex-shrink-0">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-gray-500 hover:text-gray-800 transition-colors p-1"
          >
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onDelete}
            className="text-gray-500 hover:text-red-600 transition-colors p-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Drag Handle */}
          <div
            {...dragHandleProps}
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Mobile: Toolbar dropdown panel */}
      {showToolbar && headerActions && (
        <div className="md:hidden p-2 bg-gray-100 border-b border-gray-200/50 flex flex-wrap items-center gap-2">
          {headerActions}
        </div>
      )}

      {/* Content */}
      {!isCollapsed && (
        <div className="p-3">
          {children}
        </div>
      )}
    </div>
  )
}
