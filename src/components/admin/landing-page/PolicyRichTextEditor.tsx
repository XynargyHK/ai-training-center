'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Type
} from 'lucide-react'

interface PolicyRichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const FONT_SIZES = [
  { label: '12', value: '1' },
  { label: '14', value: '2' },
  { label: '16', value: '3' },
  { label: '18', value: '4' },
  { label: '24', value: '5' },
  { label: '32', value: '6' },
  { label: '48', value: '7' },
]

// Font families with their CSS variable names
const FONT_FAMILIES = [
  { name: 'Josefin Sans', variable: 'var(--font-headline)' },
  { name: 'Cormorant Garamond', variable: 'var(--font-serif)' },
  { name: 'Playfair Display', variable: 'var(--font-playfair)' },
  { name: 'Montserrat', variable: 'var(--font-montserrat)' },
  { name: 'Inter', variable: 'var(--font-inter)' },
  { name: 'Lora', variable: 'var(--font-lora)' },
  { name: 'Raleway', variable: 'var(--font-raleway)' },
  { name: 'Open Sans', variable: 'var(--font-open-sans)' },
]

const COLOR_PALETTE = [
  { name: 'Black', value: '#000000' },
  { name: 'Dark Gray', value: '#374151' },
  { name: 'Gray', value: '#6b7280' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
]

export default function PolicyRichTextEditor({
  value,
  onChange,
  placeholder = 'Start typing your policy content...'
}: PolicyRichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const savedSelectionRef = useRef<Range | null>(null)
  const [showFontSizeMenu, setShowFontSizeMenu] = useState(false)
  const [showFontFamilyMenu, setShowFontFamilyMenu] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [currentFontSize, setCurrentFontSize] = useState('3')
  const [currentFontFamily, setCurrentFontFamily] = useState('Josefin Sans')
  const [currentColor, setCurrentColor] = useState('#000000')

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && value && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  // Save current selection (only if within editor)
  const saveSelection = useCallback(() => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0 && editorRef.current) {
      const range = selection.getRangeAt(0)
      // Check if selection is within our editor
      if (editorRef.current.contains(range.commonAncestorContainer)) {
        savedSelectionRef.current = range.cloneRange()
      }
    }
  }, [])

  // Restore saved selection
  const restoreSelection = useCallback(() => {
    if (savedSelectionRef.current && editorRef.current) {
      editorRef.current.focus()
      const selection = window.getSelection()
      if (selection) {
        selection.removeAllRanges()
        selection.addRange(savedSelectionRef.current)
      }
    }
  }, [])

  // Handle content changes
  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }, [onChange])

  // Execute formatting command with selection preservation
  const execCommand = useCallback((command: string, value?: string) => {
    // Restore selection before executing command
    restoreSelection()

    // Execute the command
    document.execCommand(command, false, value)

    // Keep focus and update content
    editorRef.current?.focus()
    handleInput()

    // Save new selection state
    saveSelection()
  }, [handleInput, restoreSelection, saveSelection])

  // Format handlers
  const handleBold = () => execCommand('bold')
  const handleItalic = () => execCommand('italic')
  const handleUnderline = () => execCommand('underline')
  const handleAlignLeft = () => execCommand('justifyLeft')
  const handleAlignCenter = () => execCommand('justifyCenter')
  const handleAlignRight = () => execCommand('justifyRight')
  const handleUndo = () => execCommand('undo')
  const handleRedo = () => execCommand('redo')

  // Special handler for lists - use requestAnimationFrame for timing
  const handleBulletList = () => {
    if (!editorRef.current) return

    const editor = editorRef.current
    const savedRange = savedSelectionRef.current

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      editor.focus()

      // Restore selection
      if (savedRange) {
        const selection = window.getSelection()
        if (selection) {
          selection.removeAllRanges()
          try {
            selection.addRange(savedRange.cloneRange())
          } catch (e) {
            console.log('Could not restore selection')
          }
        }
      }

      // Execute after another frame to ensure focus is complete
      requestAnimationFrame(() => {
        document.execCommand('insertUnorderedList', false)
        handleInput()
        saveSelection()
      })
    })
  }

  const handleNumberedList = () => {
    if (!editorRef.current) return

    const editor = editorRef.current
    const savedRange = savedSelectionRef.current

    // Use requestAnimationFrame for timing
    requestAnimationFrame(() => {
      editor.focus()

      // Restore selection
      if (savedRange) {
        const selection = window.getSelection()
        if (selection) {
          selection.removeAllRanges()
          try {
            selection.addRange(savedRange.cloneRange())
          } catch (e) {
            console.log('Could not restore selection')
          }
        }
      }

      // Execute after another frame
      requestAnimationFrame(() => {
        document.execCommand('insertOrderedList', false)
        handleInput()
        saveSelection()
      })
    })
  }

  const handleHeading = (level: number) => {
    execCommand('formatBlock', `<h${level}>`)
  }

  const handleParagraph = () => {
    execCommand('formatBlock', '<p>')
  }

  const handleFontSize = (size: string) => {
    execCommand('fontSize', size)
    setCurrentFontSize(size)
    setShowFontSizeMenu(false)
  }

  const handleFontFamily = (fontObj: { name: string; variable: string }) => {
    if (editorRef.current) {
      editorRef.current.focus()
      // Restore selection
      if (savedSelectionRef.current) {
        const selection = window.getSelection()
        if (selection) {
          selection.removeAllRanges()
          try {
            selection.addRange(savedSelectionRef.current.cloneRange())
          } catch (e) {
            // Selection might be invalid
          }
        }
      }
      // Wrap selection in span with CSS variable font
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        if (!range.collapsed) {
          const span = document.createElement('span')
          span.style.fontFamily = fontObj.variable
          try {
            range.surroundContents(span)
          } catch (e) {
            // If surroundContents fails (partial selection), use execCommand fallback
            document.execCommand('fontName', false, fontObj.name)
          }
        }
      }
      handleInput()
      saveSelection()
    }
    setCurrentFontFamily(fontObj.name)
    setShowFontFamilyMenu(false)
  }

  const handleColor = (color: string) => {
    execCommand('foreColor', color)
    setCurrentColor(color)
    setShowColorPicker(false)
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.font-size-dropdown')) setShowFontSizeMenu(false)
      if (!target.closest('.font-family-dropdown')) setShowFontFamilyMenu(false)
      if (!target.closest('.color-picker-dropdown')) setShowColorPicker(false)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // Toolbar button component - uses onMouseDown to prevent focus loss
  const ToolbarButton = ({
    onClick,
    icon: Icon,
    title,
    active = false
  }: {
    onClick: () => void
    icon: any
    title: string
    active?: boolean
  }) => (
    <button
      onMouseDown={(e) => {
        e.preventDefault() // Prevent focus loss from editor
        onClick()
      }}
      className={`p-1.5 rounded hover:bg-slate-600 transition-colors ${
        active ? 'bg-violet-600 text-white' : 'text-slate-300'
      }`}
      title={title}
      type="button"
    >
      <Icon className="w-4 h-4" />
    </button>
  )

  const ToolbarDivider = () => (
    <div className="w-px h-6 bg-slate-600 mx-1" />
  )

  return (
    <div className="border border-slate-600 rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-700 border-b border-slate-600">
        {/* Undo/Redo */}
        <ToolbarButton onClick={handleUndo} icon={Undo} title="Undo" />
        <ToolbarButton onClick={handleRedo} icon={Redo} title="Redo" />

        <ToolbarDivider />

        {/* Font Family Dropdown */}
        <div className="relative font-family-dropdown">
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setShowFontFamilyMenu(!showFontFamilyMenu)
              setShowFontSizeMenu(false)
              setShowColorPicker(false)
            }}
            className="px-2 py-1 text-xs bg-slate-600 hover:bg-slate-500 text-slate-200 rounded border border-slate-500 min-w-[80px] text-left"
            type="button"
          >
            {currentFontFamily.split(' ')[0]}
          </button>
          {showFontFamilyMenu && (
            <div className="absolute top-full left-0 mt-1 w-40 bg-slate-700 border border-slate-600 rounded shadow-lg z-50 max-h-48 overflow-y-auto">
              {FONT_FAMILIES.map(font => (
                <button
                  key={font.name}
                  onClick={(e) => {
                    e.preventDefault()
                    handleFontFamily(font)
                  }}
                  className={`w-full px-3 py-1.5 text-left text-xs hover:bg-slate-600 ${
                    currentFontFamily === font.name ? 'bg-violet-600 text-white' : 'text-slate-200'
                  }`}
                  style={{ fontFamily: font.variable }}
                  type="button"
                >
                  {font.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Font Size Dropdown */}
        <div className="relative font-size-dropdown">
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setShowFontSizeMenu(!showFontSizeMenu)
              setShowFontFamilyMenu(false)
              setShowColorPicker(false)
            }}
            className="px-2 py-1 text-xs bg-slate-600 hover:bg-slate-500 text-slate-200 rounded border border-slate-500 min-w-[40px]"
            type="button"
          >
            {FONT_SIZES.find(s => s.value === currentFontSize)?.label || '16'}
          </button>
          {showFontSizeMenu && (
            <div className="absolute top-full left-0 mt-1 w-20 bg-slate-700 border border-slate-600 rounded shadow-lg z-50 max-h-48 overflow-y-auto">
              {FONT_SIZES.map(size => (
                <button
                  key={size.value}
                  onClick={(e) => {
                    e.preventDefault()
                    handleFontSize(size.value)
                  }}
                  className={`w-full px-3 py-1.5 text-left text-xs hover:bg-slate-600 ${
                    currentFontSize === size.value ? 'bg-violet-600 text-white' : 'text-slate-200'
                  }`}
                  type="button"
                >
                  {size.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <ToolbarDivider />

        {/* Text Color */}
        <div className="relative color-picker-dropdown">
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setShowColorPicker(!showColorPicker)
              setShowFontSizeMenu(false)
              setShowFontFamilyMenu(false)
            }}
            className="w-7 h-7 rounded border border-slate-500 cursor-pointer hover:scale-105 transition-transform flex items-center justify-center"
            style={{ backgroundColor: currentColor }}
            title="Text color"
            type="button"
          >
            <Type className="w-3 h-3" style={{ color: currentColor === '#000000' ? '#fff' : '#000' }} />
          </button>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-slate-700 border border-slate-600 rounded-lg shadow-xl z-50">
              <div className="grid grid-cols-5 gap-1.5">
                {COLOR_PALETTE.map((color) => (
                  <button
                    key={color.value}
                    onClick={(e) => {
                      e.preventDefault()
                      handleColor(color.value)
                    }}
                    className="w-6 h-6 rounded border-2 hover:scale-110 transition-transform"
                    style={{
                      backgroundColor: color.value,
                      borderColor: currentColor === color.value ? '#a855f7' : '#475569'
                    }}
                    title={color.name}
                    type="button"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <ToolbarDivider />

        {/* Bold, Italic, Underline */}
        <ToolbarButton onClick={handleBold} icon={Bold} title="Bold (Ctrl+B)" />
        <ToolbarButton onClick={handleItalic} icon={Italic} title="Italic (Ctrl+I)" />
        <ToolbarButton onClick={handleUnderline} icon={Underline} title="Underline (Ctrl+U)" />

        <ToolbarDivider />

        {/* Headings */}
        <ToolbarButton onClick={() => handleHeading(1)} icon={Heading1} title="Heading 1" />
        <ToolbarButton onClick={() => handleHeading(2)} icon={Heading2} title="Heading 2" />
        <ToolbarButton onClick={() => handleHeading(3)} icon={Heading3} title="Heading 3" />

        <ToolbarDivider />

        {/* Alignment */}
        <ToolbarButton onClick={handleAlignLeft} icon={AlignLeft} title="Align Left" />
        <ToolbarButton onClick={handleAlignCenter} icon={AlignCenter} title="Align Center" />
        <ToolbarButton onClick={handleAlignRight} icon={AlignRight} title="Align Right" />

        <ToolbarDivider />

        {/* Lists */}
        <ToolbarButton onClick={handleBulletList} icon={List} title="Bullet List" />
        <ToolbarButton onClick={handleNumberedList} icon={ListOrdered} title="Numbered List" />
      </div>

      {/* Editable Content Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
        onSelect={saveSelection}
        onBlur={saveSelection}
        className="min-h-[400px] max-h-[60vh] overflow-y-auto p-4 focus:outline-none text-gray-900 prose prose-sm max-w-none editor-content"
        style={{
          backgroundColor: '#ffffff',
          lineHeight: '1.6'
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />

      {/* Editor Styles */}
      <style jsx global>{`
        .editor-content:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        .editor-content ul {
          list-style-type: disc;
          margin-left: 1.5rem;
          padding-left: 0.5rem;
        }
        .editor-content ol {
          list-style-type: decimal;
          margin-left: 1.5rem;
          padding-left: 0.5rem;
        }
        .editor-content li {
          margin-bottom: 0.25rem;
        }
        .editor-content h1 {
          font-size: 2rem;
          font-weight: bold;
          margin: 1rem 0;
        }
        .editor-content h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0.75rem 0;
        }
        .editor-content h3 {
          font-size: 1.25rem;
          font-weight: 500;
          margin: 0.5rem 0;
        }
      `}</style>
    </div>
  )
}
