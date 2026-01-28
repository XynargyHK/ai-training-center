'use client'

import { useState } from 'react'
import { Bold, Italic, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'

interface UniversalTextEditorProps {
  label: string
  value: string
  onChange: (value: string) => void
  fontSize?: string
  onFontSizeChange?: (value: string) => void
  fontFamily?: string
  onFontFamilyChange?: (value: string) => void
  color?: string
  onColorChange?: (value: string) => void
  bold?: boolean
  onBoldChange?: (value: boolean) => void
  italic?: boolean
  onItalicChange?: (value: boolean) => void
  textAlign?: 'left' | 'center' | 'right'
  onTextAlignChange?: (value: 'left' | 'center' | 'right') => void
  placeholder?: string
  multiline?: boolean
  rows?: number
}

// Color palette from hero banner
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

export default function UniversalTextEditor({
  label,
  value,
  onChange,
  fontSize = '1rem',
  onFontSizeChange,
  fontFamily = 'Josefin Sans',
  onFontFamilyChange,
  color = '#ffffff',
  onColorChange,
  bold = false,
  onBoldChange,
  italic = false,
  onItalicChange,
  textAlign = 'center',
  onTextAlignChange,
  placeholder = '',
  multiline = false,
  rows = 2
}: UniversalTextEditorProps) {
  const [showFontMenu, setShowFontMenu] = useState<string | null>(null)
  const [showColorPicker, setShowColorPicker] = useState(false)

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <label className="text-xs text-gray-500">{label}</label>

        {/* Alignment buttons */}
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

        {/* Bold/Italic buttons */}
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

        {/* Font controls */}
        <div className="flex items-center gap-1">
          {/* Font Size Dropdown */}
          {onFontSizeChange && (
            <div className="relative">
              <button
                onClick={() => setShowFontMenu(showFontMenu === 'size' ? null : 'size')}
                className="px-2 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-none border border-gray-200"
              >
                {Math.round(parseFloat(fontSize) * 16) || 16}
              </button>
              {showFontMenu === 'size' && (
                <div className="fixed md:absolute left-4 md:left-0 top-1/2 -translate-y-1/2 md:top-auto md:translate-y-0 mt-0 md:mt-1 w-20 bg-gray-100 border border-gray-200 rounded-none shadow-sm z-50 max-h-48 overflow-y-auto">
                  {[12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 80, 96].map(size => (
                    <button
                      key={size}
                      onClick={() => {
                        onFontSizeChange(`${size / 16}rem`)
                        setShowFontMenu(null)
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
          )}

          {/* Font Family Dropdown */}
          {onFontFamilyChange && (
            <div className="relative">
              <button
                onClick={() => setShowFontMenu(showFontMenu === 'font' ? null : 'font')}
                className="px-2 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-none border border-gray-200"
              >
                {fontFamily.split(' ')[0]}
              </button>
              {showFontMenu === 'font' && (
                <div className="fixed md:absolute left-4 md:left-0 top-1/2 -translate-y-1/2 md:top-auto md:translate-y-0 mt-0 md:mt-1 w-40 max-w-[calc(100vw-2rem)] bg-gray-100 border border-gray-200 rounded-none shadow-sm z-50 max-h-64 overflow-y-auto">
                  {['Josefin Sans', 'Cormorant Garamond', 'Playfair Display', 'Montserrat', 'Inter', 'Lora', 'Raleway', 'Open Sans'].map(font => (
                    <button
                      key={font}
                      onClick={() => {
                        onFontFamilyChange(font)
                        setShowFontMenu(null)
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
          )}

          {/* Color Picker */}
          {onColorChange && (
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="w-7 h-7 rounded-none border border-gray-200 cursor-pointer hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                title="Text color"
              />
              {showColorPicker && (
                <div className="fixed md:absolute left-4 right-4 md:left-auto md:right-0 top-1/2 -translate-y-1/2 md:top-full md:translate-y-0 mt-0 md:mt-2 p-3 bg-gray-100 border border-gray-200 rounded-none shadow-sm z-50 max-w-xs mx-auto">
                  <div className="grid grid-cols-7 gap-2">
                    {COLOR_PALETTE.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => {
                          onColorChange(c.value)
                          setShowColorPicker(false)
                        }}
                        className="w-7 h-7 rounded-none border-2 hover:scale-110 transition-transform"
                        style={{
                          backgroundColor: c.value,
                          borderColor: color === c.value ? '#a855f7' : '#475569'
                        }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Text input */}
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-none text-gray-800 text-xs placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-y"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-none text-gray-800 text-xs placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
      )}
    </div>
  )
}
