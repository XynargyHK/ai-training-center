'use client'

import { useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Plus, AlignLeft, AlignCenter, AlignRight, Bold, Italic } from 'lucide-react'
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
import StaticBannerBlockEditor from './blocks/StaticBannerBlockEditor'
import PoliciesBlockEditor from './blocks/PoliciesBlockEditor'
import TableBlockEditor from './blocks/TableBlockEditor'

interface BlockManagerProps {
  blocks: LandingPageBlock[]
  onChange: (blocks: LandingPageBlock[]) => void
  businessUnitId?: string
}

// Color palette for background color picker
const COLOR_PALETTE = [
  { name: 'White', value: '#ffffff' },
  { name: 'Black', value: '#000000' },
  { name: 'Dark Gray', value: '#374151' },
  { name: 'Gray', value: '#6b7280' },
  { name: 'Light Gray', value: '#d1d5db' },
  { name: 'Slate', value: '#1e293b' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Lime', value: '#84cc16' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Sky', value: '#0ea5e9' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Fuchsia', value: '#d946ef' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Rose', value: '#f43f5e' },
]

export default function BlockManager({ blocks, onChange, businessUnitId }: BlockManagerProps) {
  const [showBlockPicker, setShowBlockPicker] = useState(false)
  const [showBgColorPicker, setShowBgColorPicker] = useState<string | null>(null)

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
    const newBlock = createNewBlock(blockType, '', blocks.length)
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

  const renderTestimonialsHeaderActions = (block: LandingPageBlock, index: number) => {
    const data = block.data as any
    const sizeKey = `testimonialsSize_${block.id}`
    const fontKey = `testimonialsFont_${block.id}`
    const textColorKey = `testimonialsTextColor_${block.id}`
    const bgColorKey = `testimonialsBgColor_${block.id}`

    const fontSize = data?.heading_font_size || '2.5rem'
    const fontFamily = data?.heading_font_family || 'Josefin Sans'
    const textColor = data?.heading_color || '#000000'
    const bgColor = data?.background_color || '#ffffff'
    const textAlign = data?.heading_align || 'center'
    const bold = data?.heading_bold || false
    const italic = data?.heading_italic || false

    return (
      <div className="flex items-center gap-1">
        {/* Alignment buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              handleUpdateBlock(index, {
                ...block,
                data: { ...data, heading_align: 'left' }
              })
            }}
            className={`p-1 rounded ${
              textAlign === 'left'
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Align Left"
          >
            <AlignLeft className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              handleUpdateBlock(index, {
                ...block,
                data: { ...data, heading_align: 'center' }
              })
            }}
            className={`p-1 rounded ${
              textAlign === 'center'
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Align Center"
          >
            <AlignCenter className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              handleUpdateBlock(index, {
                ...block,
                data: { ...data, heading_align: 'right' }
              })
            }}
            className={`p-1 rounded ${
              textAlign === 'right'
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Align Right"
          >
            <AlignRight className="w-3 h-3" />
          </button>
        </div>

        {/* Bold/Italic buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              handleUpdateBlock(index, {
                ...block,
                data: { ...data, heading_bold: !bold }
              })
            }}
            className={`p-1 rounded ${
              bold
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Bold"
          >
            <Bold className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              handleUpdateBlock(index, {
                ...block,
                data: { ...data, heading_italic: !italic }
              })
            }}
            className={`p-1 rounded ${
              italic
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Italic"
          >
            <Italic className="w-3 h-3" />
          </button>
        </div>

        {/* Font Size */}
        <div className="relative">
          <button
            onClick={() => setShowBgColorPicker(showBgColorPicker === sizeKey ? null : sizeKey)}
            className="px-2 py-0.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded border border-slate-600"
          >
            {Math.round(parseFloat(fontSize) * 16) || 16}
          </button>
          {showBgColorPicker === sizeKey && (
            <div className="absolute right-0 top-full mt-1 w-20 bg-slate-700 border border-slate-600 rounded shadow-lg z-50 max-h-48 overflow-y-auto">
              {[12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 80, 96].map(size => (
                <button
                  key={size}
                  onClick={() => {
                    handleUpdateBlock(index, {
                      ...block,
                      data: { ...data, heading_font_size: `${size / 16}rem` }
                    })
                    setShowBgColorPicker(null)
                  }}
                  className={`w-full px-3 py-1.5 text-left text-xs hover:bg-slate-600 ${
                    Math.round(parseFloat(fontSize) * 16) === size ? 'bg-violet-600 text-white' : 'text-slate-200'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Font Family */}
        <div className="relative">
          <button
            onClick={() => setShowBgColorPicker(showBgColorPicker === fontKey ? null : fontKey)}
            className="px-2 py-0.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded border border-slate-600"
          >
            {fontFamily.split(' ')[0]}
          </button>
          {showBgColorPicker === fontKey && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-slate-700 border border-slate-600 rounded shadow-lg z-50 max-h-64 overflow-y-auto">
              {['Josefin Sans', 'Cormorant Garamond', 'Playfair Display', 'Montserrat', 'Inter', 'Lora', 'Raleway', 'Open Sans'].map(font => (
                <button
                  key={font}
                  onClick={() => {
                    handleUpdateBlock(index, {
                      ...block,
                      data: { ...data, heading_font_family: font }
                    })
                    setShowBgColorPicker(null)
                  }}
                  className={`w-full px-3 py-1.5 text-left text-xs hover:bg-slate-600 ${
                    fontFamily === font ? 'bg-violet-600 text-white' : 'text-slate-200'
                  }`}
                >
                  {font}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Text Color */}
        <div className="relative flex flex-col items-center gap-0.5">
          <button
            onClick={() => setShowBgColorPicker(showBgColorPicker === textColorKey ? null : textColorKey)}
            className="w-7 h-7 rounded border border-slate-600 cursor-pointer hover:scale-110 transition-transform"
            style={{ backgroundColor: textColor }}
            title="Text color"
          />
          <span className="text-[9px] text-slate-500">Text</span>
          {showBgColorPicker === textColorKey && (
            <div className="absolute right-0 top-full mt-2 p-3 bg-slate-700 border border-slate-600 rounded-lg shadow-xl z-50">
              <div className="grid grid-cols-7 gap-2">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => {
                      handleUpdateBlock(index, {
                        ...block,
                        data: { ...data, heading_color: c.value }
                      })
                      setShowBgColorPicker(null)
                    }}
                    className="w-7 h-7 rounded border-2 hover:scale-110 transition-transform"
                    style={{
                      backgroundColor: c.value,
                      borderColor: textColor === c.value ? '#a855f7' : '#475569'
                    }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Background Color */}
        <div className="relative flex flex-col items-center gap-0.5">
          <button
            onClick={() => setShowBgColorPicker(showBgColorPicker === bgColorKey ? null : bgColorKey)}
            className="w-7 h-7 rounded border border-slate-600 cursor-pointer hover:scale-110 transition-transform"
            style={{ backgroundColor: bgColor }}
            title="Background color"
          />
          <span className="text-[9px] text-slate-500">BG</span>
          {showBgColorPicker === bgColorKey && (
            <div className="absolute right-0 top-full mt-2 p-3 bg-slate-700 border border-slate-600 rounded-lg shadow-xl z-50">
              <div className="grid grid-cols-7 gap-2">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => {
                      handleUpdateBlock(index, {
                        ...block,
                        data: { ...data, background_color: c.value }
                      })
                      setShowBgColorPicker(null)
                    }}
                    className="w-7 h-7 rounded border-2 hover:scale-110 transition-transform"
                    style={{
                      backgroundColor: c.value,
                      borderColor: bgColor === c.value ? '#a855f7' : '#475569'
                    }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderAccordionHeaderActions = (block: LandingPageBlock, index: number) => {
    const data = block.data as any
    const sizeKey = `accordionSize_${block.id}`
    const fontKey = `accordionFont_${block.id}`
    const textColorKey = `accordionTextColor_${block.id}`
    const bgColorKey = `accordionBgColor_${block.id}`

    const fontSize = data?.heading_font_size || '2.5rem'
    const fontFamily = data?.heading_font_family || 'Josefin Sans'
    const textColor = data?.heading_color || '#000000'
    const bgColor = data?.background_color || '#ffffff'
    const textAlign = data?.heading_align || 'center'
    const bold = data?.heading_bold || false
    const italic = data?.heading_italic || false

    return (
      <div className="flex items-center gap-1">
        {/* Alignment buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              handleUpdateBlock(index, {
                ...block,
                data: { ...data, heading_align: 'left' }
              })
            }}
            className={`p-1 rounded ${
              textAlign === 'left'
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Align Left"
          >
            <AlignLeft className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              handleUpdateBlock(index, {
                ...block,
                data: { ...data, heading_align: 'center' }
              })
            }}
            className={`p-1 rounded ${
              textAlign === 'center'
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Align Center"
          >
            <AlignCenter className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              handleUpdateBlock(index, {
                ...block,
                data: { ...data, heading_align: 'right' }
              })
            }}
            className={`p-1 rounded ${
              textAlign === 'right'
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Align Right"
          >
            <AlignRight className="w-3 h-3" />
          </button>
        </div>

        {/* Bold/Italic buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              handleUpdateBlock(index, {
                ...block,
                data: { ...data, heading_bold: !bold }
              })
            }}
            className={`p-1 rounded ${
              bold
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Bold"
          >
            <Bold className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              handleUpdateBlock(index, {
                ...block,
                data: { ...data, heading_italic: !italic }
              })
            }}
            className={`p-1 rounded ${
              italic
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Italic"
          >
            <Italic className="w-3 h-3" />
          </button>
        </div>

        {/* Font Size */}
        <div className="relative">
          <button
            onClick={() => setShowBgColorPicker(showBgColorPicker === sizeKey ? null : sizeKey)}
            className="px-2 py-0.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded border border-slate-600"
          >
            {Math.round(parseFloat(fontSize) * 16) || 16}
          </button>
          {showBgColorPicker === sizeKey && (
            <div className="absolute right-0 top-full mt-1 w-20 bg-slate-700 border border-slate-600 rounded shadow-lg z-50 max-h-48 overflow-y-auto">
              {[12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 80, 96].map(size => (
                <button
                  key={size}
                  onClick={() => {
                    handleUpdateBlock(index, {
                      ...block,
                      data: { ...data, heading_font_size: `${size / 16}rem` }
                    })
                    setShowBgColorPicker(null)
                  }}
                  className={`w-full px-3 py-1.5 text-left text-xs hover:bg-slate-600 ${
                    Math.round(parseFloat(fontSize) * 16) === size ? 'bg-violet-600 text-white' : 'text-slate-200'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Font Family */}
        <div className="relative">
          <button
            onClick={() => setShowBgColorPicker(showBgColorPicker === fontKey ? null : fontKey)}
            className="px-2 py-0.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded border border-slate-600"
          >
            {fontFamily.split(' ')[0]}
          </button>
          {showBgColorPicker === fontKey && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-slate-700 border border-slate-600 rounded shadow-lg z-50 max-h-64 overflow-y-auto">
              {['Josefin Sans', 'Cormorant Garamond', 'Playfair Display', 'Montserrat', 'Inter', 'Lora', 'Raleway', 'Open Sans'].map(font => (
                <button
                  key={font}
                  onClick={() => {
                    handleUpdateBlock(index, {
                      ...block,
                      data: { ...data, heading_font_family: font }
                    })
                    setShowBgColorPicker(null)
                  }}
                  className={`w-full px-3 py-1.5 text-left text-xs hover:bg-slate-600 ${
                    fontFamily === font ? 'bg-violet-600 text-white' : 'text-slate-200'
                  }`}
                >
                  {font}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Text Color */}
        <div className="relative flex flex-col items-center gap-0.5">
          <button
            onClick={() => setShowBgColorPicker(showBgColorPicker === textColorKey ? null : textColorKey)}
            className="w-7 h-7 rounded border border-slate-600 cursor-pointer hover:scale-110 transition-transform"
            style={{ backgroundColor: textColor }}
            title="Text color"
          />
          <span className="text-[9px] text-slate-500">Text</span>
          {showBgColorPicker === textColorKey && (
            <div className="absolute right-0 top-full mt-2 p-3 bg-slate-700 border border-slate-600 rounded-lg shadow-xl z-50">
              <div className="grid grid-cols-7 gap-2">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => {
                      handleUpdateBlock(index, {
                        ...block,
                        data: { ...data, heading_color: c.value }
                      })
                      setShowBgColorPicker(null)
                    }}
                    className="w-7 h-7 rounded border-2 hover:scale-110 transition-transform"
                    style={{
                      backgroundColor: c.value,
                      borderColor: textColor === c.value ? '#a855f7' : '#475569'
                    }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Background Color */}
        <div className="relative flex flex-col items-center gap-0.5">
          <button
            onClick={() => setShowBgColorPicker(showBgColorPicker === bgColorKey ? null : bgColorKey)}
            className="w-7 h-7 rounded border border-slate-600 cursor-pointer hover:scale-110 transition-transform"
            style={{ backgroundColor: bgColor }}
            title="Background color"
          />
          <span className="text-[9px] text-slate-500">BG</span>
          {showBgColorPicker === bgColorKey && (
            <div className="absolute right-0 top-full mt-2 p-3 bg-slate-700 border border-slate-600 rounded-lg shadow-xl z-50">
              <div className="grid grid-cols-7 gap-2">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => {
                      handleUpdateBlock(index, {
                        ...block,
                        data: { ...data, background_color: c.value }
                      })
                      setShowBgColorPicker(null)
                    }}
                    className="w-7 h-7 rounded border-2 hover:scale-110 transition-transform"
                    style={{
                      backgroundColor: c.value,
                      borderColor: bgColor === c.value ? '#a855f7' : '#475569'
                    }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderStepsHeaderActions = (block: LandingPageBlock, index: number) => {
    const data = block.data as any
    const sizeKey = `stepsSize_${block.id}`
    const fontKey = `stepsFont_${block.id}`
    const textColorKey = `stepsTextColor_${block.id}`
    const bgColorKey = `stepsBgColor_${block.id}`

    const fontSize = data?.heading_font_size || '2.5rem'
    const fontFamily = data?.heading_font_family || 'Josefin Sans'
    const textColor = data?.heading_color || '#000000'
    const bgColor = data?.background_color || '#ffffff'
    const textAlign = data?.heading_align || 'center'
    const bold = data?.heading_bold || false
    const italic = data?.heading_italic || false
    const overallLayout = data?.overall_layout || 'vertical'

    return (
      <div className="flex items-center gap-1">
        {/* Alignment buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              handleUpdateBlock(index, {
                ...block,
                data: { ...data, heading_align: 'left' }
              })
            }}
            className={`p-1 rounded ${
              textAlign === 'left'
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Align Left"
          >
            <AlignLeft className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              handleUpdateBlock(index, {
                ...block,
                data: { ...data, heading_align: 'center' }
              })
            }}
            className={`p-1 rounded ${
              textAlign === 'center'
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Align Center"
          >
            <AlignCenter className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              handleUpdateBlock(index, {
                ...block,
                data: { ...data, heading_align: 'right' }
              })
            }}
            className={`p-1 rounded ${
              textAlign === 'right'
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Align Right"
          >
            <AlignRight className="w-3 h-3" />
          </button>
        </div>

        {/* Bold/Italic buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              handleUpdateBlock(index, {
                ...block,
                data: { ...data, heading_bold: !bold }
              })
            }}
            className={`p-1 rounded ${
              bold
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Bold"
          >
            <Bold className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              handleUpdateBlock(index, {
                ...block,
                data: { ...data, heading_italic: !italic }
              })
            }}
            className={`p-1 rounded ${
              italic
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Italic"
          >
            <Italic className="w-3 h-3" />
          </button>
        </div>

        {/* Font Size */}
        <div className="relative">
          <button
            onClick={() => setShowBgColorPicker(showBgColorPicker === sizeKey ? null : sizeKey)}
            className="px-2 py-0.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded border border-slate-600"
          >
            {Math.round(parseFloat(fontSize) * 16) || 16}
          </button>
          {showBgColorPicker === sizeKey && (
            <div className="absolute right-0 top-full mt-1 w-20 bg-slate-700 border border-slate-600 rounded shadow-lg z-50 max-h-48 overflow-y-auto">
              {[12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 80, 96].map(size => (
                <button
                  key={size}
                  onClick={() => {
                    handleUpdateBlock(index, {
                      ...block,
                      data: { ...data, heading_font_size: `${size / 16}rem` }
                    })
                    setShowBgColorPicker(null)
                  }}
                  className={`w-full px-3 py-1.5 text-left text-xs hover:bg-slate-600 ${
                    Math.round(parseFloat(fontSize) * 16) === size ? 'bg-violet-600 text-white' : 'text-slate-200'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Font Family */}
        <div className="relative">
          <button
            onClick={() => setShowBgColorPicker(showBgColorPicker === fontKey ? null : fontKey)}
            className="px-2 py-0.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded border border-slate-600"
          >
            {fontFamily.split(' ')[0]}
          </button>
          {showBgColorPicker === fontKey && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-slate-700 border border-slate-600 rounded shadow-lg z-50 max-h-64 overflow-y-auto">
              {['Josefin Sans', 'Cormorant Garamond', 'Playfair Display', 'Montserrat', 'Inter', 'Lora', 'Raleway', 'Open Sans'].map(font => (
                <button
                  key={font}
                  onClick={() => {
                    handleUpdateBlock(index, {
                      ...block,
                      data: { ...data, heading_font_family: font }
                    })
                    setShowBgColorPicker(null)
                  }}
                  className={`w-full px-3 py-1.5 text-left text-xs hover:bg-slate-600 ${
                    fontFamily === font ? 'bg-violet-600 text-white' : 'text-slate-200'
                  }`}
                >
                  {font}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Text Color */}
        <div className="relative flex flex-col items-center gap-0.5">
          <button
            onClick={() => setShowBgColorPicker(showBgColorPicker === textColorKey ? null : textColorKey)}
            className="w-7 h-7 rounded border border-slate-600 cursor-pointer hover:scale-110 transition-transform"
            style={{ backgroundColor: textColor }}
            title="Text color"
          />
          <span className="text-[9px] text-slate-500">Text</span>
          {showBgColorPicker === textColorKey && (
            <div className="absolute right-0 top-full mt-2 p-3 bg-slate-700 border border-slate-600 rounded-lg shadow-xl z-50">
              <div className="grid grid-cols-7 gap-2">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => {
                      handleUpdateBlock(index, {
                        ...block,
                        data: { ...data, heading_color: c.value }
                      })
                      setShowBgColorPicker(null)
                    }}
                    className="w-7 h-7 rounded border-2 hover:scale-110 transition-transform"
                    style={{
                      backgroundColor: c.value,
                      borderColor: textColor === c.value ? '#a855f7' : '#475569'
                    }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Layout buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              handleUpdateBlock(index, {
                ...block,
                data: { ...data, overall_layout: 'vertical' }
              })
            }}
            className={`px-2 py-0.5 text-xs rounded ${
              overallLayout === 'vertical'
                ? 'bg-violet-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            } border border-slate-600`}
            title="Vertical Layout"
          >
            ↓
          </button>
          <button
            onClick={() => {
              handleUpdateBlock(index, {
                ...block,
                data: { ...data, overall_layout: 'horizontal' }
              })
            }}
            className={`px-2 py-0.5 text-xs rounded ${
              overallLayout === 'horizontal'
                ? 'bg-violet-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            } border border-slate-600`}
            title="Horizontal Layout"
          >
            →
          </button>
        </div>

        {/* Background Color */}
        <div className="relative flex flex-col items-center gap-0.5">
          <button
            onClick={() => setShowBgColorPicker(showBgColorPicker === bgColorKey ? null : bgColorKey)}
            className="w-7 h-7 rounded border border-slate-600 cursor-pointer hover:scale-110 transition-transform"
            style={{ backgroundColor: bgColor }}
            title="Background color"
          />
          <span className="text-[9px] text-slate-500">BG</span>
          {showBgColorPicker === bgColorKey && (
            <div className="absolute right-0 top-full mt-2 p-3 bg-slate-700 border border-slate-600 rounded-lg shadow-xl z-50">
              <div className="grid grid-cols-7 gap-2">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => {
                      handleUpdateBlock(index, {
                        ...block,
                        data: { ...data, background_color: c.value }
                      })
                      setShowBgColorPicker(null)
                    }}
                    className="w-7 h-7 rounded border-2 hover:scale-110 transition-transform"
                    style={{
                      backgroundColor: c.value,
                      borderColor: bgColor === c.value ? '#a855f7' : '#475569'
                    }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderTableHeaderActions = (block: LandingPageBlock, index: number) => {
    const data = block.data as any
    const sizeKey = `tableSize_${block.id}`
    const fontKey = `tableFont_${block.id}`
    const textColorKey = `tableTextColor_${block.id}`
    const bgColorKey = `tableBgColor_${block.id}`

    const fontSize = data?.heading_font_size || '2.5rem'
    const fontFamily = data?.heading_font_family || 'Josefin Sans'
    const textColor = data?.heading_color || '#000000'
    const bgColor = data?.background_color || '#ffffff'
    const textAlign = data?.heading_align || 'center'
    const bold = data?.heading_bold || false
    const italic = data?.heading_italic || false

    return (
      <div className="flex items-center gap-1">
        {/* Alignment buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              handleUpdateBlock(index, {
                ...block,
                data: { ...data, heading_align: 'left' }
              })
            }}
            className={`p-1 rounded ${
              textAlign === 'left'
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Align Left"
          >
            <AlignLeft className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              handleUpdateBlock(index, {
                ...block,
                data: { ...data, heading_align: 'center' }
              })
            }}
            className={`p-1 rounded ${
              textAlign === 'center'
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Align Center"
          >
            <AlignCenter className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              handleUpdateBlock(index, {
                ...block,
                data: { ...data, heading_align: 'right' }
              })
            }}
            className={`p-1 rounded ${
              textAlign === 'right'
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Align Right"
          >
            <AlignRight className="w-3 h-3" />
          </button>
        </div>

        {/* Bold/Italic buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              handleUpdateBlock(index, {
                ...block,
                data: { ...data, heading_bold: !bold }
              })
            }}
            className={`p-1 rounded ${
              bold
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Bold"
          >
            <Bold className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              handleUpdateBlock(index, {
                ...block,
                data: { ...data, heading_italic: !italic }
              })
            }}
            className={`p-1 rounded ${
              italic
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Italic"
          >
            <Italic className="w-3 h-3" />
          </button>
        </div>

        {/* Font Size */}
        <div className="relative">
          <button
            onClick={() => setShowBgColorPicker(showBgColorPicker === sizeKey ? null : sizeKey)}
            className="px-2 py-0.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded border border-slate-600"
          >
            {Math.round(parseFloat(fontSize) * 16) || 40}
          </button>
          {showBgColorPicker === sizeKey && (
            <div className="absolute right-0 top-full mt-1 w-20 bg-slate-700 border border-slate-600 rounded shadow-lg z-50 max-h-48 overflow-y-auto">
              {[12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 80, 96].map(size => (
                <button
                  key={size}
                  onClick={() => {
                    handleUpdateBlock(index, {
                      ...block,
                      data: { ...data, heading_font_size: `${size / 16}rem` }
                    })
                    setShowBgColorPicker(null)
                  }}
                  className={`w-full px-3 py-1.5 text-left text-xs hover:bg-slate-600 ${
                    Math.round(parseFloat(fontSize) * 16) === size ? 'bg-violet-600 text-white' : 'text-slate-200'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Font Family */}
        <div className="relative">
          <button
            onClick={() => setShowBgColorPicker(showBgColorPicker === fontKey ? null : fontKey)}
            className="px-2 py-0.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded border border-slate-600"
          >
            {fontFamily.split(' ')[0]}
          </button>
          {showBgColorPicker === fontKey && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-slate-700 border border-slate-600 rounded shadow-lg z-50 max-h-64 overflow-y-auto">
              {['Josefin Sans', 'Cormorant Garamond', 'Playfair Display', 'Montserrat', 'Inter', 'Lora', 'Raleway', 'Open Sans'].map(font => (
                <button
                  key={font}
                  onClick={() => {
                    handleUpdateBlock(index, {
                      ...block,
                      data: { ...data, heading_font_family: font }
                    })
                    setShowBgColorPicker(null)
                  }}
                  className={`w-full px-3 py-1.5 text-left text-xs hover:bg-slate-600 ${
                    fontFamily === font ? 'bg-violet-600 text-white' : 'text-slate-200'
                  }`}
                >
                  {font}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Text Color */}
        <div className="relative flex flex-col items-center gap-0.5">
          <button
            onClick={() => setShowBgColorPicker(showBgColorPicker === textColorKey ? null : textColorKey)}
            className="w-7 h-7 rounded border border-slate-600 cursor-pointer hover:scale-110 transition-transform"
            style={{ backgroundColor: textColor }}
            title="Text color"
          />
          <span className="text-[9px] text-slate-500">Text</span>
          {showBgColorPicker === textColorKey && (
            <div className="absolute right-0 top-full mt-2 p-3 bg-slate-700 border border-slate-600 rounded-lg shadow-xl z-50">
              <div className="grid grid-cols-7 gap-2">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => {
                      handleUpdateBlock(index, {
                        ...block,
                        data: { ...data, heading_color: c.value }
                      })
                      setShowBgColorPicker(null)
                    }}
                    className="w-7 h-7 rounded border-2 hover:scale-110 transition-transform"
                    style={{
                      backgroundColor: c.value,
                      borderColor: textColor === c.value ? '#a855f7' : '#475569'
                    }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Background Color */}
        <div className="relative flex flex-col items-center gap-0.5">
          <button
            onClick={() => setShowBgColorPicker(showBgColorPicker === bgColorKey ? null : bgColorKey)}
            className="w-7 h-7 rounded border border-slate-600 cursor-pointer hover:scale-110 transition-transform"
            style={{ backgroundColor: bgColor }}
            title="Background color"
          />
          <span className="text-[9px] text-slate-500">BG</span>
          {showBgColorPicker === bgColorKey && (
            <div className="absolute right-0 top-full mt-2 p-3 bg-slate-700 border border-slate-600 rounded-lg shadow-xl z-50">
              <div className="grid grid-cols-7 gap-2">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => {
                      handleUpdateBlock(index, {
                        ...block,
                        data: { ...data, background_color: c.value }
                      })
                      setShowBgColorPicker(null)
                    }}
                    className="w-7 h-7 rounded border-2 hover:scale-110 transition-transform"
                    style={{
                      backgroundColor: c.value,
                      borderColor: bgColor === c.value ? '#a855f7' : '#475569'
                    }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderPricingHeaderActions = (block: LandingPageBlock, index: number) => {
    const data = block.data as any
    const sizeKey = `pricingSize_${block.id}`
    const fontKey = `pricingFont_${block.id}`
    const textColorKey = `pricingTextColor_${block.id}`
    const bgColorKey = `pricingBgColor_${block.id}`

    const fontSize = data?.headline_font_size || '1.5rem'
    const fontFamily = data?.headline_font_family || 'Josefin Sans'
    const textColor = data?.headline_color || '#000000'
    const bgColor = data?.background_color || '#ffffff'
    const textAlign = data?.headline_align || data?.text_align || 'center'
    const bold = data?.headline_bold || false
    const italic = data?.headline_italic || false

    return (
      <div className="flex items-center gap-1">
        {/* Alignment buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              handleUpdateBlock(index, {
                ...block,
                data: { ...data, headline_align: 'left', text_align: 'left' }
              })
            }}
            className={`p-1 rounded ${
              textAlign === 'left'
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Align Left"
          >
            <AlignLeft className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              handleUpdateBlock(index, {
                ...block,
                data: { ...data, headline_align: 'center', text_align: 'center' }
              })
            }}
            className={`p-1 rounded ${
              textAlign === 'center'
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Align Center"
          >
            <AlignCenter className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              handleUpdateBlock(index, {
                ...block,
                data: { ...data, headline_align: 'right', text_align: 'right' }
              })
            }}
            className={`p-1 rounded ${
              textAlign === 'right'
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Align Right"
          >
            <AlignRight className="w-3 h-3" />
          </button>
        </div>

        {/* Bold/Italic buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              handleUpdateBlock(index, {
                ...block,
                data: { ...data, headline_bold: !bold }
              })
            }}
            className={`p-1 rounded ${
              bold
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Bold"
          >
            <Bold className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              handleUpdateBlock(index, {
                ...block,
                data: { ...data, headline_italic: !italic }
              })
            }}
            className={`p-1 rounded ${
              italic
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Italic"
          >
            <Italic className="w-3 h-3" />
          </button>
        </div>

        {/* Font Size */}
        <div className="relative">
          <button
            onClick={() => setShowBgColorPicker(showBgColorPicker === sizeKey ? null : sizeKey)}
            className="px-2 py-0.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded border border-slate-600"
          >
            {Math.round(parseFloat(fontSize) * 16) || 16}
          </button>
          {showBgColorPicker === sizeKey && (
            <div className="absolute right-0 top-full mt-1 w-20 bg-slate-700 border border-slate-600 rounded shadow-lg z-50 max-h-48 overflow-y-auto">
              {[12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 80, 96].map(size => (
                <button
                  key={size}
                  onClick={() => {
                    handleUpdateBlock(index, {
                      ...block,
                      data: { ...data, headline_font_size: `${size / 16}rem` }
                    })
                    setShowBgColorPicker(null)
                  }}
                  className={`w-full px-3 py-1.5 text-left text-xs hover:bg-slate-600 ${
                    Math.round(parseFloat(fontSize) * 16) === size ? 'bg-violet-600 text-white' : 'text-slate-200'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Font Family */}
        <div className="relative">
          <button
            onClick={() => setShowBgColorPicker(showBgColorPicker === fontKey ? null : fontKey)}
            className="px-2 py-0.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded border border-slate-600"
          >
            {fontFamily.split(' ')[0]}
          </button>
          {showBgColorPicker === fontKey && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-slate-700 border border-slate-600 rounded shadow-lg z-50 max-h-64 overflow-y-auto">
              {['Josefin Sans', 'Cormorant Garamond', 'Playfair Display', 'Montserrat', 'Inter', 'Lora', 'Raleway', 'Open Sans'].map(font => (
                <button
                  key={font}
                  onClick={() => {
                    handleUpdateBlock(index, {
                      ...block,
                      data: { ...data, headline_font_family: font }
                    })
                    setShowBgColorPicker(null)
                  }}
                  className={`w-full px-3 py-1.5 text-left text-xs hover:bg-slate-600 ${
                    fontFamily === font ? 'bg-violet-600 text-white' : 'text-slate-200'
                  }`}
                >
                  {font}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Text Color */}
        <div className="relative flex flex-col items-center gap-0.5">
          <button
            onClick={() => setShowBgColorPicker(showBgColorPicker === textColorKey ? null : textColorKey)}
            className="w-7 h-7 rounded border border-slate-600 cursor-pointer hover:scale-110 transition-transform"
            style={{ backgroundColor: textColor }}
            title="Text color"
          />
          <span className="text-[9px] text-slate-500">Text</span>
          {showBgColorPicker === textColorKey && (
            <div className="absolute right-0 top-full mt-2 p-3 bg-slate-700 border border-slate-600 rounded-lg shadow-xl z-50">
              <div className="grid grid-cols-7 gap-2">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => {
                      handleUpdateBlock(index, {
                        ...block,
                        data: { ...data, headline_color: c.value }
                      })
                      setShowBgColorPicker(null)
                    }}
                    className="w-7 h-7 rounded border-2 hover:scale-110 transition-transform"
                    style={{
                      backgroundColor: c.value,
                      borderColor: textColor === c.value ? '#a855f7' : '#475569'
                    }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Background Color */}
        <div className="relative flex flex-col items-center gap-0.5">
          <button
            onClick={() => setShowBgColorPicker(showBgColorPicker === bgColorKey ? null : bgColorKey)}
            className="w-7 h-7 rounded border border-slate-600 cursor-pointer hover:scale-110 transition-transform"
            style={{ backgroundColor: bgColor }}
            title="Background color"
          />
          <span className="text-[9px] text-slate-500">BG</span>
          {showBgColorPicker === bgColorKey && (
            <div className="absolute right-0 top-full mt-2 p-3 bg-slate-700 border border-slate-600 rounded-lg shadow-xl z-50">
              <div className="grid grid-cols-7 gap-2">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => {
                      handleUpdateBlock(index, {
                        ...block,
                        data: { ...data, background_color: c.value }
                      })
                      setShowBgColorPicker(null)
                    }}
                    className="w-7 h-7 rounded border-2 hover:scale-110 transition-transform"
                    style={{
                      backgroundColor: c.value,
                      borderColor: bgColor === c.value ? '#a855f7' : '#475569'
                    }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderStaticBannerHeaderActions = (block: LandingPageBlock, index: number) => {
    const data = block.data as any
    const sizeKey = `staticBannerSize_${block.id}`
    const fontKey = `staticBannerFont_${block.id}`
    const textColorKey = `staticBannerTextColor_${block.id}`
    const bgColorKey = `staticBannerBgColor_${block.id}`

    const fontSize = data?.headline_font_size || 'clamp(1.875rem, 5vw, 3.75rem)'
    const fontFamily = data?.headline_font_family || 'Josefin Sans'
    const textColor = data?.headline_color || '#ffffff'
    const bgColor = data?.background_color || '#1e293b'
    const textAlign = data?.headline_text_align || 'center'
    const bold = data?.headline_bold || false
    const italic = data?.headline_italic || false

    return (
      <div className="flex items-center gap-1">
        {/* Alignment buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              handleUpdateBlock(index, {
                ...block,
                data: { ...data, headline_text_align: 'left' }
              })
            }}
            className={`p-1 rounded ${
              textAlign === 'left'
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Align Left"
          >
            <AlignLeft className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              handleUpdateBlock(index, {
                ...block,
                data: { ...data, headline_text_align: 'center' }
              })
            }}
            className={`p-1 rounded ${
              textAlign === 'center'
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Align Center"
          >
            <AlignCenter className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              handleUpdateBlock(index, {
                ...block,
                data: { ...data, headline_text_align: 'right' }
              })
            }}
            className={`p-1 rounded ${
              textAlign === 'right'
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Align Right"
          >
            <AlignRight className="w-3 h-3" />
          </button>
        </div>

        {/* Bold/Italic buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              handleUpdateBlock(index, {
                ...block,
                data: { ...data, headline_bold: !bold }
              })
            }}
            className={`p-1 rounded ${
              bold
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Bold"
          >
            <Bold className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              handleUpdateBlock(index, {
                ...block,
                data: { ...data, headline_italic: !italic }
              })
            }}
            className={`p-1 rounded ${
              italic
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Italic"
          >
            <Italic className="w-3 h-3" />
          </button>
        </div>

        {/* Font Size */}
        <div className="relative">
          <button
            onClick={() => setShowBgColorPicker(showBgColorPicker === sizeKey ? null : sizeKey)}
            className="px-2 py-0.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded border border-slate-600"
          >
            {(() => {
              // Extract size from clamp or simple rem value
              const match = fontSize.match(/clamp\(([\d.]+)rem/) || fontSize.match(/([\d.]+)rem/)
              return match ? Math.round(parseFloat(match[1]) * 16) : 16
            })()}
          </button>
          {showBgColorPicker === sizeKey && (
            <div className="absolute right-0 top-full mt-1 w-20 bg-slate-700 border border-slate-600 rounded shadow-lg z-50 max-h-48 overflow-y-auto">
              {[12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 80, 96].map(size => (
                <button
                  key={size}
                  onClick={() => {
                    handleUpdateBlock(index, {
                      ...block,
                      data: { ...data, headline_font_size: `${size / 16}rem` }
                    })
                    setShowBgColorPicker(null)
                  }}
                  className={`w-full px-3 py-1.5 text-left text-xs hover:bg-slate-600 ${
                    (() => {
                      const match = fontSize.match(/clamp\(([\d.]+)rem/) || fontSize.match(/([\d.]+)rem/)
                      const currentSize = match ? Math.round(parseFloat(match[1]) * 16) : 16
                      return currentSize === size ? 'bg-violet-600 text-white' : 'text-slate-200'
                    })()
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Font Family */}
        <div className="relative">
          <button
            onClick={() => setShowBgColorPicker(showBgColorPicker === fontKey ? null : fontKey)}
            className="px-2 py-0.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded border border-slate-600"
          >
            {fontFamily.split(' ')[0]}
          </button>
          {showBgColorPicker === fontKey && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-slate-700 border border-slate-600 rounded shadow-lg z-50 max-h-64 overflow-y-auto">
              {['Josefin Sans', 'Cormorant Garamond', 'Playfair Display', 'Montserrat', 'Inter', 'Lora', 'Raleway', 'Open Sans'].map(font => (
                <button
                  key={font}
                  onClick={() => {
                    handleUpdateBlock(index, {
                      ...block,
                      data: { ...data, headline_font_family: font }
                    })
                    setShowBgColorPicker(null)
                  }}
                  className={`w-full px-3 py-1.5 text-left text-xs hover:bg-slate-600 ${
                    fontFamily === font ? 'bg-violet-600 text-white' : 'text-slate-200'
                  }`}
                >
                  {font}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Text Color */}
        <div className="relative flex flex-col items-center gap-0.5">
          <button
            onClick={() => setShowBgColorPicker(showBgColorPicker === textColorKey ? null : textColorKey)}
            className="w-7 h-7 rounded border border-slate-600 cursor-pointer hover:scale-110 transition-transform"
            style={{ backgroundColor: textColor }}
            title="Text color"
          />
          <span className="text-[9px] text-slate-500">Text</span>
          {showBgColorPicker === textColorKey && (
            <div className="absolute right-0 top-full mt-2 p-3 bg-slate-700 border border-slate-600 rounded-lg shadow-xl z-50">
              <div className="grid grid-cols-7 gap-2">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => {
                      handleUpdateBlock(index, {
                        ...block,
                        data: { ...data, headline_color: c.value }
                      })
                      setShowBgColorPicker(null)
                    }}
                    className="w-7 h-7 rounded border-2 hover:scale-110 transition-transform"
                    style={{
                      backgroundColor: c.value,
                      borderColor: textColor === c.value ? '#a855f7' : '#475569'
                    }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Background Color */}
        <div className="relative flex flex-col items-center gap-0.5">
          <button
            onClick={() => setShowBgColorPicker(showBgColorPicker === bgColorKey ? null : bgColorKey)}
            className="w-7 h-7 rounded border border-slate-600 cursor-pointer hover:scale-110 transition-transform"
            style={{ backgroundColor: bgColor }}
            title="Background color"
          />
          <span className="text-[9px] text-slate-500">BG</span>
          {showBgColorPicker === bgColorKey && (
            <div className="absolute right-0 top-full mt-2 p-3 bg-slate-700 border border-slate-600 rounded-lg shadow-xl z-50">
              <div className="grid grid-cols-7 gap-2">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => {
                      handleUpdateBlock(index, {
                        ...block,
                        data: { ...data, background_color: c.value }
                      })
                      setShowBgColorPicker(null)
                    }}
                    className="w-7 h-7 rounded border-2 hover:scale-110 transition-transform"
                    style={{
                      backgroundColor: c.value,
                      borderColor: bgColor === c.value ? '#a855f7' : '#475569'
                    }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
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
            businessUnitId={businessUnitId}
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

      case 'static_banner':
        return (
          <StaticBannerBlockEditor
            block={block}
            onUpdate={(updatedBlock) => handleUpdateBlock(index, updatedBlock)}
            businessUnitId={businessUnitId}
          />
        )

      case 'policies':
        return (
          <PoliciesBlockEditor
            block={block}
            onUpdate={(updatedBlock) => handleUpdateBlock(index, updatedBlock)}
          />
        )

      case 'table':
        return (
          <TableBlockEditor
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
                          headerActions={
                            block.type === 'testimonials' ? renderTestimonialsHeaderActions(block, index) :
                            block.type === 'accordion' ? renderAccordionHeaderActions(block, index) :
                            block.type === 'steps' ? renderStepsHeaderActions(block, index) :
                            block.type === 'pricing' ? renderPricingHeaderActions(block, index) :
                            block.type === 'static_banner' ? renderStaticBannerHeaderActions(block, index) :
                            block.type === 'table' ? renderTableHeaderActions(block, index) :
                            undefined
                          }
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
