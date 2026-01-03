'use client'

import { useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Plus } from 'lucide-react'
import type { LandingPageBlock } from '@/types/landing-page-blocks'
import { createNewBlock } from './block-registry'
import BlockContainer from './BlockContainer'
import BlockPicker from './BlockPicker'
import SplitBlockEditor from './blocks/SplitBlockEditor'
import CardBlockEditor from './blocks/CardBlockEditor'
import AccordionBlockEditor from './blocks/AccordionBlockEditor'
import PricingBlockEditor from './blocks/PricingBlockEditor'
import TestimonialsBlockEditor from './blocks/TestimonialsBlockEditor'
import StepsBlockEditor from './blocks/StepsBlockEditor'

interface BlockManagerProps {
  blocks: LandingPageBlock[]
  onChange: (blocks: LandingPageBlock[]) => void
  businessUnitId?: string
}

export default function BlockManager({ blocks, onChange, businessUnitId }: BlockManagerProps) {
  const [showBlockPicker, setShowBlockPicker] = useState(false)

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(blocks)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update order field for all blocks
    const updatedBlocks = items.map((block, index) => ({
      ...block,
      order: index
    }))

    onChange(updatedBlocks)
  }

  const handleAddBlock = (blockType: string) => {
    const newBlock = createNewBlock(blockType, `New ${blockType} block`, blocks.length)
    if (newBlock) {
      onChange([...blocks, newBlock])
    }
  }

  const handleUpdateBlock = (index: number, updatedBlock: LandingPageBlock) => {
    const updatedBlocks = [...blocks]
    updatedBlocks[index] = updatedBlock
    onChange(updatedBlocks)
  }

  const handleDeleteBlock = (index: number) => {
    const updatedBlocks = blocks.filter((_, i) => i !== index)
    // Reorder after deletion
    const reorderedBlocks = updatedBlocks.map((block, i) => ({
      ...block,
      order: i
    }))
    onChange(reorderedBlocks)
  }

  const renderBlockEditor = (block: LandingPageBlock, index: number) => {
    switch (block.type) {
      case 'split':
        return (
          <SplitBlockEditor
            block={block}
            onUpdate={(updatedBlock) => handleUpdateBlock(index, updatedBlock)}
            businessUnitId={businessUnitId}
          />
        )

      case 'card':
        return (
          <CardBlockEditor
            block={block}
            onUpdate={(updatedBlock) => handleUpdateBlock(index, updatedBlock)}
          />
        )

      case 'accordion':
        return (
          <AccordionBlockEditor
            block={block}
            onUpdate={(updatedBlock) => handleUpdateBlock(index, updatedBlock)}
          />
        )

      case 'pricing':
        return (
          <PricingBlockEditor
            block={block}
            onUpdate={(updatedBlock) => handleUpdateBlock(index, updatedBlock)}
          />
        )

      case 'testimonials':
        return (
          <TestimonialsBlockEditor
            block={block}
            onUpdate={(updatedBlock) => handleUpdateBlock(index, updatedBlock)}
            businessUnitId={businessUnitId}
          />
        )

      case 'steps':
        return (
          <StepsBlockEditor
            block={block}
            onUpdate={(updatedBlock) => handleUpdateBlock(index, updatedBlock)}
            businessUnitId={businessUnitId}
          />
        )

      default:
        return (
          <div className="text-slate-400 text-sm">
            <p>Unknown block type: {block.type}</p>
          </div>
        )
    }
  }

  return (
    <div className="space-y-4">
      {/* Block List */}
      {blocks.length > 0 ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="blocks-list">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-3"
              >
                {blocks.map((block, index) => (
                  <Draggable key={block.id} draggableId={block.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`transition-shadow ${
                          snapshot.isDragging ? 'shadow-2xl ring-2 ring-violet-500' : ''
                        }`}
                      >
                        <BlockContainer
                          block={block}
                          index={index}
                          onUpdate={(updatedBlock) => handleUpdateBlock(index, updatedBlock)}
                          onDelete={() => handleDeleteBlock(index)}
                          dragHandleProps={provided.dragHandleProps}
                        >
                          {renderBlockEditor(block, index)}
                        </BlockContainer>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        <div className="bg-slate-800/30 border-2 border-dashed border-slate-600 rounded-lg p-12 text-center">
          <div className="text-slate-500 mb-4">
            <div className="text-4xl mb-3">📦</div>
            <h3 className="text-lg font-medium text-slate-400 mb-2">No blocks yet</h3>
            <p className="text-sm">Add your first block to start building your landing page</p>
          </div>
        </div>
      )}

      {/* Add Block Button */}
      <button
        onClick={() => setShowBlockPicker(true)}
        className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
      >
        <Plus className="w-5 h-5" />
        Add Block
      </button>

      {/* Block Picker Modal */}
      {showBlockPicker && (
        <BlockPicker
          onSelect={handleAddBlock}
          onClose={() => setShowBlockPicker(false)}
        />
      )}
    </div>
  )
}
