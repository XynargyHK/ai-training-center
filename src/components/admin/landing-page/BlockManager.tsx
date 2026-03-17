'use client'

import { useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Plus, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Languages, Loader2, Image, X, Check } from 'lucide-react'
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
import TableBlockEditor from './blocks/TableBlockEditor'
import FormBlockEditor from './blocks/FormBlockEditor'
import VideoBlockEditor from './blocks/VideoBlockEditor'
import SocialFeedBlockEditor from './blocks/SocialFeedBlockEditor'
import LogoCloudBlockEditor from './blocks/LogoCloudBlockEditor'
import ImageGridBlockEditor from './blocks/ImageGridBlockEditor'
import StatsGridBlockEditor from './blocks/StatsGridBlockEditor'
import LeadMagnetEditor from './blocks/LeadMagnetEditor'
import PDFReaderEditor from './blocks/PDFReaderEditor'

interface BlockManagerProps {
  blocks: LandingPageBlock[]
  onChange: (blocks: LandingPageBlock[]) => void
  businessUnitId?: string
  // Translation props
  translationMode?: boolean
  translationSourceBlocks?: LandingPageBlock[]
  targetLanguage?: string
  onTranslateBlock?: (index: number, translatedBlock: LandingPageBlock) => void
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

export default function BlockManager({
  blocks,
  onChange,
  businessUnitId,
  translationMode,
  translationSourceBlocks,
  targetLanguage,
  onTranslateBlock
}: BlockManagerProps) {
  const [showBlockPicker, setShowBlockPicker] = useState(false)
  const [showBgColorPicker, setShowBgColorPicker] = useState<string | null>(null)
  const [translatingBlockIndex, setTranslatingBlockIndex] = useState<number | null>(null)
  const [mediaPickerCallback, setMediaPickerCallback] = useState<((url: string) => void) | null>(null)
  const [mediaFiles, setMediaFiles] = useState<Array<{ id: string; name: string; url: string; type: string }>>([])
  const [mediaLoading, setMediaLoading] = useState(false)

  const handleOpenMediaLibrary = async (callback: (url: string) => void) => {
    setMediaPickerCallback(() => callback)
    // Only fetch if not already loaded
    if (mediaFiles.length > 0 || !businessUnitId) return
    setMediaLoading(true)
    try {
      const response = await fetch(`/api/media-library?businessUnit=${businessUnitId}`)
      const data = await response.json()
      setMediaFiles(data.files || [])
    } catch (error) {
      console.error('Error loading media files:', error)
    } finally {
      setMediaLoading(false)
    }
  }

  const handleTranslateBlock = async (index: number) => {
    if (!translationSourceBlocks || !targetLanguage || !onTranslateBlock) return

    const sourceBlock = translationSourceBlocks[index]
    if (!sourceBlock) return

    setTranslatingBlockIndex(index)
    try {
      const response = await fetch('/api/landing-pages/translate-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: sourceBlock,
          targetLanguage
        })
      })
      const data = await response.json()
      if (data.success) {
        onTranslateBlock(index, data.translated)
      }
    } catch (err) {
      console.error('Translation error:', err)
    } finally {
      setTranslatingBlockIndex(null)
    }
  }

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
      <div className="flex flex-wrap items-center gap-1">
        {/* Alignment buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              handleUpdateBlock(index, {
                ...block,
                data: { ...data, heading_align: 'left' }
              })
            }}
            className={`p-1 rounded-none ${
              textAlign === 'left'
                ? 'bg-violet-50 border border-violet-200 text-gray-800'
                : 'text-gray-500 hover:text-gray-700'
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
            className={`p-1 rounded-none ${
              textAlign === 'center'
                ? 'bg-violet-50 border border-violet-200 text-gray-800'
                : 'text-gray-500 hover:text-gray-700'
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
            className={`p-1 rounded-none ${
              textAlign === 'right'
                ? 'bg-violet-50 border border-violet-200 text-gray-800'
                : 'text-gray-500 hover:text-gray-700'
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
            className={`p-1 rounded-none ${
              bold
                ? 'bg-violet-50 border border-violet-200 text-gray-800'
                : 'text-gray-500 hover:text-gray-700'
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
            className={`p-1 rounded-none ${
              italic
                ? 'bg-violet-50 border border-violet-200 text-gray-800'
                : 'text-gray-500 hover:text-gray-700'
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
            className="px-2 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-none border border-gray-200"
          >
            {Math.round(parseFloat(fontSize) * 16) || 16}
          </button>
          {showBgColorPicker === sizeKey && (
            <div className="absolute right-0 top-full mt-1 w-20 bg-gray-100 border border-gray-200 rounded-none shadow-sm z-50 max-h-48 overflow-y-auto">
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
                  className={`w-full px-2 py-1 text-left text-xs hover:bg-gray-200 ${
                    Math.round(parseFloat(fontSize) * 16) === size ? 'bg-violet-50 border border-violet-200 text-gray-800' : 'text-gray-700'
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
            className="px-2 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-none border border-gray-200"
          >
            {fontFamily.split(' ')[0]}
          </button>
          {showBgColorPicker === fontKey && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-gray-100 border border-gray-200 rounded-none shadow-sm z-50 max-h-64 overflow-y-auto">
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
                  className={`w-full px-2 py-1 text-left text-xs hover:bg-gray-200 ${
                    fontFamily === font ? 'bg-violet-50 border border-violet-200 text-gray-800' : 'text-gray-700'
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
            className="w-7 h-7 rounded-none border border-gray-200 cursor-pointer hover:scale-110 transition-transform"
            style={{ backgroundColor: textColor }}
            title="Text color"
          />
          <span className="text-[9px] text-gray-400">Text</span>
          {showBgColorPicker === textColorKey && (
            <div className="absolute right-0 top-full mt-2 p-3 bg-gray-100 border border-gray-200 rounded-none shadow-sm z-50">
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
                    className="w-7 h-7 rounded-none border-2 hover:scale-110 transition-transform"
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
            className="w-7 h-7 rounded-none border border-gray-200 cursor-pointer hover:scale-110 transition-transform"
            style={{ backgroundColor: bgColor }}
            title="Background color"
          />
          <span className="text-[9px] text-gray-400">BG</span>
          {showBgColorPicker === bgColorKey && (
            <div className="absolute right-0 top-full mt-2 p-3 bg-gray-100 border border-gray-200 rounded-none shadow-sm z-50">
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
                    className="w-7 h-7 rounded-none border-2 hover:scale-110 transition-transform"
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
      <div className="flex flex-wrap items-center gap-1">
        {/* Alignment buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              handleUpdateBlock(index, {
                ...block,
                data: { ...data, heading_align: 'left' }
              })
            }}
            className={`p-1 rounded-none ${
              textAlign === 'left'
                ? 'bg-violet-50 border border-violet-200 text-gray-800'
                : 'text-gray-500 hover:text-gray-700'
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
            className={`p-1 rounded-none ${
              textAlign === 'center'
                ? 'bg-violet-50 border border-violet-200 text-gray-800'
                : 'text-gray-500 hover:text-gray-700'
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
            className={`p-1 rounded-none ${
              textAlign === 'right'
                ? 'bg-violet-50 border border-violet-200 text-gray-800'
                : 'text-gray-500 hover:text-gray-700'
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
            className={`p-1 rounded-none ${
              bold
                ? 'bg-violet-50 border border-violet-200 text-gray-800'
                : 'text-gray-500 hover:text-gray-700'
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
            className={`p-1 rounded-none ${
              italic
                ? 'bg-violet-50 border border-violet-200 text-gray-800'
                : 'text-gray-500 hover:text-gray-700'
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
            className="px-2 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-none border border-gray-200"
          >
            {Math.round(parseFloat(fontSize) * 16) || 16}
          </button>
          {showBgColorPicker === sizeKey && (
            <div className="absolute right-0 top-full mt-1 w-20 bg-gray-100 border border-gray-200 rounded-none shadow-sm z-50 max-h-48 overflow-y-auto">
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
                  className={`w-full px-2 py-1 text-left text-xs hover:bg-gray-200 ${
                    Math.round(parseFloat(fontSize) * 16) === size ? 'bg-violet-50 border border-violet-200 text-gray-800' : 'text-gray-700'
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
            className="px-2 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-none border border-gray-200"
          >
            {fontFamily.split(' ')[0]}
          </button>
          {showBgColorPicker === fontKey && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-gray-100 border border-gray-200 rounded-none shadow-sm z-50 max-h-64 overflow-y-auto">
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
                  className={`w-full px-2 py-1 text-left text-xs hover:bg-gray-200 ${
                    fontFamily === font ? 'bg-violet-50 border border-violet-200 text-gray-800' : 'text-gray-700'
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
            className="w-7 h-7 rounded-none border border-gray-200 cursor-pointer hover:scale-110 transition-transform"
            style={{ backgroundColor: textColor }}
            title="Text color"
          />
          <span className="text-[9px] text-gray-400">Text</span>
          {showBgColorPicker === textColorKey && (
            <div className="absolute right-0 top-full mt-2 p-3 bg-gray-100 border border-gray-200 rounded-none shadow-sm z-50">
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
                    className="w-7 h-7 rounded-none border-2 hover:scale-110 transition-transform"
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
            className="w-7 h-7 rounded-none border border-gray-200 cursor-pointer hover:scale-110 transition-transform"
            style={{ backgroundColor: bgColor }}
            title="Background color"
          />
          <span className="text-[9px] text-gray-400">BG</span>
          {showBgColorPicker === bgColorKey && (
            <div className="absolute right-0 top-full mt-2 p-3 bg-gray-100 border border-gray-200 rounded-none shadow-sm z-50">
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
                    className="w-7 h-7 rounded-none border-2 hover:scale-110 transition-transform"
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
      <div className="flex flex-wrap items-center gap-1">
        {/* Alignment buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              handleUpdateBlock(index, {
                ...block,
                data: { ...data, heading_align: 'left' }
              })
            }}
            className={`p-1 rounded-none ${
              textAlign === 'left'
                ? 'bg-violet-50 border border-violet-200 text-gray-800'
                : 'text-gray-500 hover:text-gray-700'
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
            className={`p-1 rounded-none ${
              textAlign === 'center'
                ? 'bg-violet-50 border border-violet-200 text-gray-800'
                : 'text-gray-500 hover:text-gray-700'
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
            className={`p-1 rounded-none ${
              textAlign === 'right'
                ? 'bg-violet-50 border border-violet-200 text-gray-800'
                : 'text-gray-500 hover:text-gray-700'
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
            className={`p-1 rounded-none ${
              bold
                ? 'bg-violet-50 border border-violet-200 text-gray-800'
                : 'text-gray-500 hover:text-gray-700'
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
            className={`p-1 rounded-none ${
              italic
                ? 'bg-violet-50 border border-violet-200 text-gray-800'
                : 'text-gray-500 hover:text-gray-700'
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
            className="px-2 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-none border border-gray-200"
          >
            {Math.round(parseFloat(fontSize) * 16) || 16}
          </button>
          {showBgColorPicker === sizeKey && (
            <div className="absolute right-0 top-full mt-1 w-20 bg-gray-100 border border-gray-200 rounded-none shadow-sm z-50 max-h-48 overflow-y-auto">
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
                  className={`w-full px-2 py-1 text-left text-xs hover:bg-gray-200 ${
                    Math.round(parseFloat(fontSize) * 16) === size ? 'bg-violet-50 border border-violet-200 text-gray-800' : 'text-gray-700'
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
            className="px-2 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-none border border-gray-200"
          >
            {fontFamily.split(' ')[0]}
          </button>
          {showBgColorPicker === fontKey && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-gray-100 border border-gray-200 rounded-none shadow-sm z-50 max-h-64 overflow-y-auto">
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
                  className={`w-full px-2 py-1 text-left text-xs hover:bg-gray-200 ${
                    fontFamily === font ? 'bg-violet-50 border border-violet-200 text-gray-800' : 'text-gray-700'
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
            className="w-7 h-7 rounded-none border border-gray-200 cursor-pointer hover:scale-110 transition-transform"
            style={{ backgroundColor: textColor }}
            title="Text color"
          />
          <span className="text-[9px] text-gray-400">Text</span>
          {showBgColorPicker === textColorKey && (
            <div className="absolute right-0 top-full mt-2 p-3 bg-gray-100 border border-gray-200 rounded-none shadow-sm z-50">
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
                    className="w-7 h-7 rounded-none border-2 hover:scale-110 transition-transform"
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
            className={`px-2 py-0.5 text-xs rounded-none ${
              overallLayout === 'vertical'
                ? 'bg-violet-50 border border-violet-200 text-gray-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            } border border-gray-200`}
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
            className={`px-2 py-0.5 text-xs rounded-none ${
              overallLayout === 'horizontal'
                ? 'bg-violet-50 border border-violet-200 text-gray-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            } border border-gray-200`}
            title="Horizontal Layout"
          >
            →
          </button>
        </div>

        {/* Background Color */}
        <div className="relative flex flex-col items-center gap-0.5">
          <button
            onClick={() => setShowBgColorPicker(showBgColorPicker === bgColorKey ? null : bgColorKey)}
            className="w-7 h-7 rounded-none border border-gray-200 cursor-pointer hover:scale-110 transition-transform"
            style={{ backgroundColor: bgColor }}
            title="Background color"
          />
          <span className="text-[9px] text-gray-400">BG</span>
          {showBgColorPicker === bgColorKey && (
            <div className="absolute right-0 top-full mt-2 p-3 bg-gray-100 border border-gray-200 rounded-none shadow-sm z-50">
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
                    className="w-7 h-7 rounded-none border-2 hover:scale-110 transition-transform"
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
      <div className="flex flex-wrap items-center gap-1">
        {/* Alignment buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              handleUpdateBlock(index, {
                ...block,
                data: { ...data, heading_align: 'left' }
              })
            }}
            className={`p-1 rounded-none ${
              textAlign === 'left'
                ? 'bg-violet-50 border border-violet-200 text-gray-800'
                : 'text-gray-500 hover:text-gray-700'
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
            className={`p-1 rounded-none ${
              textAlign === 'center'
                ? 'bg-violet-50 border border-violet-200 text-gray-800'
                : 'text-gray-500 hover:text-gray-700'
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
            className={`p-1 rounded-none ${
              textAlign === 'right'
                ? 'bg-violet-50 border border-violet-200 text-gray-800'
                : 'text-gray-500 hover:text-gray-700'
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
            className={`p-1 rounded-none ${
              bold
                ? 'bg-violet-50 border border-violet-200 text-gray-800'
                : 'text-gray-500 hover:text-gray-700'
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
            className={`p-1 rounded-none ${
              italic
                ? 'bg-violet-50 border border-violet-200 text-gray-800'
                : 'text-gray-500 hover:text-gray-700'
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
            className="px-2 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-none border border-gray-200"
          >
            {Math.round(parseFloat(fontSize) * 16) || 40}
          </button>
          {showBgColorPicker === sizeKey && (
            <div className="absolute right-0 top-full mt-1 w-20 bg-gray-100 border border-gray-200 rounded-none shadow-sm z-50 max-h-48 overflow-y-auto">
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
                  className={`w-full px-2 py-1 text-left text-xs hover:bg-gray-200 ${
                    Math.round(parseFloat(fontSize) * 16) === size ? 'bg-violet-50 border border-violet-200 text-gray-800' : 'text-gray-700'
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
            className="px-2 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-none border border-gray-200"
          >
            {fontFamily.split(' ')[0]}
          </button>
          {showBgColorPicker === fontKey && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-gray-100 border border-gray-200 rounded-none shadow-sm z-50 max-h-64 overflow-y-auto">
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
                  className={`w-full px-2 py-1 text-left text-xs hover:bg-gray-200 ${
                    fontFamily === font ? 'bg-violet-50 border border-violet-200 text-gray-800' : 'text-gray-700'
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
            className="w-7 h-7 rounded-none border border-gray-200 cursor-pointer hover:scale-110 transition-transform"
            style={{ backgroundColor: textColor }}
            title="Text color"
          />
          <span className="text-[9px] text-gray-400">Text</span>
          {showBgColorPicker === textColorKey && (
            <div className="absolute right-0 top-full mt-2 p-3 bg-gray-100 border border-gray-200 rounded-none shadow-sm z-50">
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
                    className="w-7 h-7 rounded-none border-2 hover:scale-110 transition-transform"
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
            className="w-7 h-7 rounded-none border border-gray-200 cursor-pointer hover:scale-110 transition-transform"
            style={{ backgroundColor: bgColor }}
            title="Background color"
          />
          <span className="text-[9px] text-gray-400">BG</span>
          {showBgColorPicker === bgColorKey && (
            <div className="absolute right-0 top-full mt-2 p-3 bg-gray-100 border border-gray-200 rounded-none shadow-sm z-50">
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
                    className="w-7 h-7 rounded-none border-2 hover:scale-110 transition-transform"
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
      <div className="flex flex-wrap items-center gap-1">
        {/* Alignment buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              handleUpdateBlock(index, {
                ...block,
                data: { ...data, headline_align: 'left', text_align: 'left' }
              })
            }}
            className={`p-1 rounded-none ${
              textAlign === 'left'
                ? 'bg-violet-50 border border-violet-200 text-gray-800'
                : 'text-gray-500 hover:text-gray-700'
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
            className={`p-1 rounded-none ${
              textAlign === 'center'
                ? 'bg-violet-50 border border-violet-200 text-gray-800'
                : 'text-gray-500 hover:text-gray-700'
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
            className={`p-1 rounded-none ${
              textAlign === 'right'
                ? 'bg-violet-50 border border-violet-200 text-gray-800'
                : 'text-gray-500 hover:text-gray-700'
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
            className={`p-1 rounded-none ${
              bold
                ? 'bg-violet-50 border border-violet-200 text-gray-800'
                : 'text-gray-500 hover:text-gray-700'
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
            className={`p-1 rounded-none ${
              italic
                ? 'bg-violet-50 border border-violet-200 text-gray-800'
                : 'text-gray-500 hover:text-gray-700'
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
            className="px-2 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-none border border-gray-200"
          >
            {Math.round(parseFloat(fontSize) * 16) || 16}
          </button>
          {showBgColorPicker === sizeKey && (
            <div className="absolute right-0 top-full mt-1 w-20 bg-gray-100 border border-gray-200 rounded-none shadow-sm z-50 max-h-48 overflow-y-auto">
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
                  className={`w-full px-2 py-1 text-left text-xs hover:bg-gray-200 ${
                    Math.round(parseFloat(fontSize) * 16) === size ? 'bg-violet-50 border border-violet-200 text-gray-800' : 'text-gray-700'
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
            className="px-2 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-none border border-gray-200"
          >
            {fontFamily.split(' ')[0]}
          </button>
          {showBgColorPicker === fontKey && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-gray-100 border border-gray-200 rounded-none shadow-sm z-50 max-h-64 overflow-y-auto">
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
                  className={`w-full px-2 py-1 text-left text-xs hover:bg-gray-200 ${
                    fontFamily === font ? 'bg-violet-50 border border-violet-200 text-gray-800' : 'text-gray-700'
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
            className="w-7 h-7 rounded-none border border-gray-200 cursor-pointer hover:scale-110 transition-transform"
            style={{ backgroundColor: textColor }}
            title="Text color"
          />
          <span className="text-[9px] text-gray-400">Text</span>
          {showBgColorPicker === textColorKey && (
            <div className="absolute right-0 top-full mt-2 p-3 bg-gray-100 border border-gray-200 rounded-none shadow-sm z-50">
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
                    className="w-7 h-7 rounded-none border-2 hover:scale-110 transition-transform"
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
            className="w-7 h-7 rounded-none border border-gray-200 cursor-pointer hover:scale-110 transition-transform"
            style={{ backgroundColor: bgColor }}
            title="Background color"
          />
          <span className="text-[9px] text-gray-400">BG</span>
          {showBgColorPicker === bgColorKey && (
            <div className="absolute right-0 top-full mt-2 p-3 bg-gray-100 border border-gray-200 rounded-none shadow-sm z-50">
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
                    className="w-7 h-7 rounded-none border-2 hover:scale-110 transition-transform"
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
      <div className="flex flex-wrap items-center gap-1">
        {/* Alignment buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              handleUpdateBlock(index, {
                ...block,
                data: { ...data, headline_text_align: 'left' }
              })
            }}
            className={`p-1 rounded-none ${
              textAlign === 'left'
                ? 'bg-violet-50 border border-violet-200 text-gray-800'
                : 'text-gray-500 hover:text-gray-700'
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
            className={`p-1 rounded-none ${
              textAlign === 'center'
                ? 'bg-violet-50 border border-violet-200 text-gray-800'
                : 'text-gray-500 hover:text-gray-700'
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
            className={`p-1 rounded-none ${
              textAlign === 'right'
                ? 'bg-violet-50 border border-violet-200 text-gray-800'
                : 'text-gray-500 hover:text-gray-700'
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
            className={`p-1 rounded-none ${
              bold
                ? 'bg-violet-50 border border-violet-200 text-gray-800'
                : 'text-gray-500 hover:text-gray-700'
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
            className={`p-1 rounded-none ${
              italic
                ? 'bg-violet-50 border border-violet-200 text-gray-800'
                : 'text-gray-500 hover:text-gray-700'
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
            className="px-2 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-none border border-gray-200"
          >
            {(() => {
              // Extract size from clamp or simple rem value
              const match = fontSize.match(/clamp\(([\d.]+)rem/) || fontSize.match(/([\d.]+)rem/)
              return match ? Math.round(parseFloat(match[1]) * 16) : 16
            })()}
          </button>
          {showBgColorPicker === sizeKey && (
            <div className="absolute right-0 top-full mt-1 w-20 bg-gray-100 border border-gray-200 rounded-none shadow-sm z-50 max-h-48 overflow-y-auto">
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
                  className={`w-full px-2 py-1 text-left text-xs hover:bg-gray-200 ${
                    (() => {
                      const match = fontSize.match(/clamp\(([\d.]+)rem/) || fontSize.match(/([\d.]+)rem/)
                      const currentSize = match ? Math.round(parseFloat(match[1]) * 16) : 16
                      return currentSize === size ? 'bg-violet-50 border border-violet-200 text-gray-800' : 'text-gray-700'
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
            className="px-2 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-none border border-gray-200"
          >
            {fontFamily.split(' ')[0]}
          </button>
          {showBgColorPicker === fontKey && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-gray-100 border border-gray-200 rounded-none shadow-sm z-50 max-h-64 overflow-y-auto">
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
                  className={`w-full px-2 py-1 text-left text-xs hover:bg-gray-200 ${
                    fontFamily === font ? 'bg-violet-50 border border-violet-200 text-gray-800' : 'text-gray-700'
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
            className="w-7 h-7 rounded-none border border-gray-200 cursor-pointer hover:scale-110 transition-transform"
            style={{ backgroundColor: textColor }}
            title="Text color"
          />
          <span className="text-[9px] text-gray-400">Text</span>
          {showBgColorPicker === textColorKey && (
            <div className="absolute right-0 top-full mt-2 p-3 bg-gray-100 border border-gray-200 rounded-none shadow-sm z-50">
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
                    className="w-7 h-7 rounded-none border-2 hover:scale-110 transition-transform"
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
            className="w-7 h-7 rounded-none border border-gray-200 cursor-pointer hover:scale-110 transition-transform"
            style={{ backgroundColor: bgColor }}
            title="Background color"
          />
          <span className="text-[9px] text-gray-400">BG</span>
          {showBgColorPicker === bgColorKey && (
            <div className="absolute right-0 top-full mt-2 p-3 bg-gray-100 border border-gray-200 rounded-none shadow-sm z-50">
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
                    className="w-7 h-7 rounded-none border-2 hover:scale-110 transition-transform"
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
            onMediaLibraryOpen={handleOpenMediaLibrary}
          />
        )

      case 'card':
        return (
          <CardBlockEditor
            block={block}
            onUpdate={(updatedBlock) => handleUpdateBlock(index, updatedBlock)}
            businessUnitId={businessUnitId}
            onMediaLibraryOpen={handleOpenMediaLibrary}
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
            onMediaLibraryOpen={handleOpenMediaLibrary}
          />
        )

      case 'steps':
      case 'text_image_grid':
        return (
          <StepsBlockEditor
            block={block}
            onUpdate={(updatedBlock) => handleUpdateBlock(index, updatedBlock)}
            businessUnitId={businessUnitId}
            onMediaLibraryOpen={handleOpenMediaLibrary}
          />
        )

      case 'static_banner':
        return (
          <StaticBannerBlockEditor
            block={block}
            onUpdate={(updatedBlock) => handleUpdateBlock(index, updatedBlock)}
            businessUnitId={businessUnitId}
            onMediaLibraryOpen={handleOpenMediaLibrary}
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

      case 'form':
        return (
          <FormBlockEditor
            block={block}
            onUpdate={(updatedBlock) => handleUpdateBlock(index, updatedBlock)}
          />
        )

      case 'video':
        return (
          <VideoBlockEditor
            block={block}
            onUpdate={(updatedBlock) => handleUpdateBlock(index, updatedBlock)}
          />
        )

      case 'social_feed':
        return (
          <SocialFeedBlockEditor
            block={block}
            onUpdate={(updatedBlock) => handleUpdateBlock(index, updatedBlock)}
          />
        )

      case 'logo_cloud':
        return (
          <LogoCloudBlockEditor
            block={block}
            onUpdate={(updatedBlock) => handleUpdateBlock(index, updatedBlock)}
            onMediaLibraryOpen={handleOpenMediaLibrary}
          />
        )

      case 'image_grid':
        return (
          <ImageGridBlockEditor
            block={block}
            onUpdate={(updatedBlock) => handleUpdateBlock(index, updatedBlock)}
            onMediaLibraryOpen={handleOpenMediaLibrary}
          />
        )

      case 'stats_grid':
        return (
          <StatsGridBlockEditor
            block={block}
            onUpdate={(updatedBlock) => handleUpdateBlock(index, updatedBlock)}
          />
        )

      case 'lead_magnet':
        return (
          <LeadMagnetEditor
            block={block}
            onChange={(updatedBlock) => handleUpdateBlock(index, updatedBlock)}
            businessUnitId={businessUnitId}
            onMediaLibraryOpen={handleOpenMediaLibrary}
          />
        )

      case 'pdf_reader':
        return (
          <PDFReaderEditor
            block={block}
            onChange={(updatedBlock) => handleUpdateBlock(index, updatedBlock)}
            businessUnitId={businessUnitId}
          />
        )

      default:

        return (
          <div className="text-gray-500 text-xs">
            <p>Unknown block type: {block.type}</p>
          </div>
        )
    }
  }

  return (
    <div className="space-y-2">
      {/* Block List */}
      {blocks.length > 0 ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="blocks-list">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
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
                          fallbackAnchorId={translationSourceBlocks?.[index]?.data?.anchor_id}
                          headerActions={
                            <div className="flex items-center gap-2">
                              {/* Translation button */}
                              {translationMode && translationSourceBlocks && targetLanguage && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleTranslateBlock(index)
                                  }}
                                  disabled={translatingBlockIndex === index}
                                  className="px-2 py-1 bg-green-50 border border-green-200 hover:bg-green-100 text-gray-800 rounded-none text-xs flex items-center gap-1 disabled:opacity-50"
                                >
                                  {translatingBlockIndex === index ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Languages className="w-3 h-3" />
                                  )}
                                  Translate
                                </button>
                              )}
                              {/* Block-specific actions */}
                              {block.type === 'testimonials' ? renderTestimonialsHeaderActions(block, index) :
                               block.type === 'accordion' ? renderAccordionHeaderActions(block, index) :
                               (block.type === 'steps' || block.type === 'text_image_grid') ? renderStepsHeaderActions(block, index) :
                               block.type === 'pricing' ? renderPricingHeaderActions(block, index) :
                               block.type === 'static_banner' ? renderStaticBannerHeaderActions(block, index) :
                               block.type === 'table' ? renderTableHeaderActions(block, index) :
                               null}
                            </div>
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
        <div className="bg-white/30 border border-dashed border-gray-300 rounded-none p-4 text-center">
          <div className="text-gray-400 mb-2">
            <div className="text-xl mb-1">📦</div>
            <h3 className="text-xs font-medium text-gray-500 mb-1">No blocks yet</h3>
            <p className="text-xs">Add your first block to start building your landing page</p>
          </div>
        </div>
      )}

      {/* Add Block Button */}
      <button
        onClick={() => setShowBlockPicker(true)}
        className="w-full py-2 bg-violet-50 border border-violet-200 hover:bg-violet-100 text-gray-800 rounded-none text-xs font-medium transition-colors flex items-center justify-center gap-1"
      >
        <Plus className="w-3.5 h-3.5" />
        Add Block
      </button>

      {/* Block Picker Modal */}
      {showBlockPicker && (
        <BlockPicker
          onSelect={handleAddBlock}
          onClose={() => setShowBlockPicker(false)}
        />
      )}

      {/* Media Library Picker Modal */}
      {mediaPickerCallback && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-none shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-800">Image Library</h3>
              <button onClick={() => setMediaPickerCallback(null)} className="text-gray-500 hover:text-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {mediaLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
                </div>
              ) : mediaFiles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No images in library</p>
                  <p className="text-xs">Upload images in the Image Library tab first</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {mediaFiles.filter(f => f.type.startsWith('image/') || f.type.startsWith('video/')).map((file) => (
                    <button
                      key={file.id}
                      onClick={() => {
                        mediaPickerCallback(file.url)
                        setMediaPickerCallback(null)
                      }}
                      className="relative aspect-square bg-gray-100 rounded-none overflow-hidden hover:ring-2 hover:ring-violet-500 transition-all group"
                    >
                      {file.type.startsWith('video/') ? (
                        <video src={file.url} className="w-full h-full object-cover" muted />
                      ) : (
                        <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <Check className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
