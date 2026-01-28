'use client'

import { useState } from 'react'
import { AlignLeft, AlignCenter, AlignRight, Bold, Italic } from 'lucide-react'

interface TextEditorControlsProps {
  label: string
  value: string
  onChange: (value: string) => void
  textAlign?: 'left' | 'center' | 'right'
  onTextAlignChange?: (align: 'left' | 'center' | 'right') => void
  bold?: boolean
  onBoldChange?: (bold: boolean) => void
  italic?: boolean
  onItalicChange?: (italic: boolean) => void
  fontSize?: string
  onFontSizeChange?: (size: string) => void
  fontFamily?: string
  onFontFamilyChange?: (family: string) => void
  color?: string
  onColorChange?: (color: string) => void
  multiline?: boolean
  placeholder?: string
  rows?: number
  hideTextInput?: boolean // Hide the text input field (for styling-only controls)
}

const FONT_SIZES = {
  headline: [24, 32, 40, 48, 56, 64, 72, 80, 96, 112, 128],
  subheadline: [14, 16, 18, 20, 24, 28, 32, 36, 40],
  content: [12, 14, 16, 18, 20, 24, 28, 32]
}

const FONT_FAMILIES = [
  'Josefin Sans',
  'Cormorant Garamond',
  'Playfair Display',
  'Montserrat',
  'Inter',
  'Lora',
  'Raleway',
  'Open Sans'
]

const COLOR_PALETTE = [
  { name: 'White', value: '#ffffff' },
  { name: 'Black', value: '#000000' },
  { name: 'Dark Gray', value: '#374151' },
  { name: 'Gray', value: '#6b7280' },
  { name: 'Light Gray', value: '#d1d5db' },
  { name: 'Slate', value: '#1e293b' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Gold', value: '#d97706' },
]

export default function TextEditorControls({
  label,
  value,
  onChange,
  textAlign = 'center',
  onTextAlignChange,
  bold = false,
  onBoldChange,
  italic = false,
  onItalicChange,
  fontSize,
  onFontSizeChange,
  fontFamily,
  onFontFamilyChange,
  color,
  onColorChange,
  multiline = false,
  placeholder = '',
  rows = 3,
  hideTextInput = false
}: TextEditorControlsProps) {
  const [showSizeMenu, setShowSizeMenu] = useState(false)
  const [showFontMenu, setShowFontMenu] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)

  // Determine which font sizes to use based on label
  const fontSizes = label.toLowerCase().includes('headline')
    ? FONT_SIZES.headline
    : label.toLowerCase().includes('subheadline')
    ? FONT_SIZES.subheadline
    : FONT_SIZES.content

  // Parse current font size to pixels
  const currentFontSizePx = fontSize
    ? Math.round(parseFloat(fontSize) * (fontSize.includes('rem') ? 16 : 1))
    : label.toLowerCase().includes('headline')
    ? 60
    : label.toLowerCase().includes('subheadline')
    ? 20
    : 18

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <label className="text-xs text-gray-500">{label}</label>

        {/* Alignment Controls */}
        {onTextAlignChange && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onTextAlignChange('left')}
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
              onClick={() => onTextAlignChange('center')}
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
              onClick={() => onTextAlignChange('right')}
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
        )}

        {/* Bold and Italic Controls */}
        {(onBoldChange || onItalicChange) && (
          <div className="flex items-center gap-1">
            {onBoldChange && (
              <button
                onClick={() => onBoldChange(!bold)}
                className={`p-1 rounded-none ${
                  bold
                    ? 'bg-violet-50 border border-violet-200 text-gray-800'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                title="Bold"
              >
                <Bold className="w-3 h-3" />
              </button>
            )}
            {onItalicChange && (
              <button
                onClick={() => onItalicChange(!italic)}
                className={`p-1 rounded-none ${
                  italic
                    ? 'bg-violet-50 border border-violet-200 text-gray-800'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                title="Italic"
              >
                <Italic className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Font Size Dropdown */}
        {onFontSizeChange && (
          <div className="flex items-center gap-1">
            <div className="relative">
              <button
                onClick={() => setShowSizeMenu(!showSizeMenu)}
                className="px-2 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-none border border-gray-200"
              >
                {currentFontSizePx}
              </button>
              {showSizeMenu && (
                <div className="fixed md:absolute left-4 md:left-0 top-1/2 -translate-y-1/2 md:top-auto md:translate-y-0 mt-0 md:mt-1 w-20 bg-gray-100 border border-gray-200 rounded-none shadow-sm z-50 max-h-48 overflow-y-auto">
                  {fontSizes.map(size => (
                    <button
                      key={size}
                      onClick={() => {
                        onFontSizeChange(`${size / 16}rem`)
                        setShowSizeMenu(false)
                      }}
                      className={`w-full px-2 py-1 text-left text-xs hover:bg-gray-200 ${
                        currentFontSizePx === size ? 'bg-violet-50 border border-violet-200 text-gray-800' : 'text-gray-700'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Font Family Dropdown */}
            {onFontFamilyChange && (
              <div className="relative">
                <button
                  onClick={() => setShowFontMenu(!showFontMenu)}
                  className="px-2 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-none border border-gray-200"
                >
                  {(fontFamily || 'Josefin Sans').split(' ')[0]}
                </button>
                {showFontMenu && (
                  <div className="fixed md:absolute left-4 md:left-0 top-1/2 -translate-y-1/2 md:top-auto md:translate-y-0 mt-0 md:mt-1 w-40 max-w-[calc(100vw-2rem)] bg-gray-100 border border-gray-200 rounded-none shadow-sm z-50 max-h-64 overflow-y-auto">
                    {FONT_FAMILIES.map(font => (
                      <button
                        key={font}
                        onClick={() => {
                          onFontFamilyChange(font)
                          setShowFontMenu(false)
                        }}
                        className={`w-full px-2 py-1 text-left text-xs hover:bg-gray-200 ${
                          (fontFamily || 'Josefin Sans') === font ? 'bg-violet-50 border border-violet-200 text-gray-800' : 'text-gray-700'
                        }`}
                      >
                        {font}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Color Picker */}
        {onColorChange && (
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-7 h-7 rounded-none border border-gray-200 cursor-pointer hover:scale-110 transition-transform"
              style={{ backgroundColor: color || '#ffffff' }}
              title={`${label} color`}
            />
            {showColorPicker && (
              <div className="fixed md:absolute left-4 right-4 md:left-auto md:right-0 top-1/2 -translate-y-1/2 md:top-full md:translate-y-0 mt-0 md:mt-2 p-3 bg-gray-100 border border-gray-200 rounded-none shadow-sm z-50 max-w-xs mx-auto">
                <div className="grid grid-cols-7 gap-2">
                  {COLOR_PALETTE.map((colorOption) => (
                    <button
                      key={colorOption.value}
                      onClick={() => {
                        onColorChange(colorOption.value)
                        setShowColorPicker(false)
                      }}
                      className="w-7 h-7 rounded-none border-2 hover:scale-110 transition-transform"
                      style={{
                        backgroundColor: colorOption.value,
                        borderColor: (color || '#ffffff') === colorOption.value ? '#a855f7' : '#475569'
                      }}
                      title={colorOption.name}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Text Input */}
      {!hideTextInput && (
        multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-none text-gray-800 text-xs placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-y break-words whitespace-pre-wrap"
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-none text-gray-800 text-xs placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        )
      )}
    </div>
  )
}
