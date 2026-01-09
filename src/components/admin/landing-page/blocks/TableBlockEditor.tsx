'use client'

import { useEffect, useState, useRef } from 'react'
import { Plus, Minus, Upload, Loader2, X, Image } from 'lucide-react'
import type { LandingPageBlock } from '@/types/landing-page-blocks'
import UniversalTextEditor from '../UniversalTextEditor'

const COLOR_PALETTE = [
  { name: 'White', value: '#ffffff' },
  { name: 'Light Gray', value: '#f3f4f6' },
  { name: 'Gray', value: '#9ca3af' },
  { name: 'Dark Gray', value: '#374151' },
  { name: 'Black', value: '#000000' },
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
  { name: 'Slate 800', value: '#1e293b' },
  { name: 'Slate 900', value: '#0f172a' },
  { name: 'Navy', value: '#1e3a5f' },
  { name: 'Dark Teal', value: '#134e4a' },
  { name: 'Dark Purple', value: '#581c87' },
  { name: 'Cream', value: '#fef3c7' },
]

interface TableBlockEditorProps {
  block: LandingPageBlock
  onUpdate: (block: LandingPageBlock) => void
  businessUnitId?: string
}

export default function TableBlockEditor({ block, onUpdate, businessUnitId }: TableBlockEditorProps) {
  const data = block.data || {}
  const rows = data.rows || 3
  const columns = data.columns || 3
  const tableData: string[][] = data.table_data || []
  const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Background fields
  const background_url = data.background_url || ''
  const background_type = data.background_type || 'image'

  // Handle background upload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type - allow images and videos
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')

    if (!isImage && !isVideo) {
      alert('Please select an image or video file')
      return
    }

    // Validate file size (max 10MB for images, 50MB for videos)
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSize) {
      alert(`File must be less than ${isVideo ? '50MB' : '10MB'}`)
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('businessUnitId', businessUnitId || '')

      const response = await fetch('/api/ecommerce/upload-image', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const responseData = await response.json()
      if (responseData.url) {
        const updatedBlock = {
          ...block,
          data: {
            ...data,
            background_url: responseData.url,
            background_type: isVideo ? 'video' : 'image'
          }
        }
        onUpdate(updatedBlock)
      }
    } catch (error: any) {
      console.error('Error uploading background:', error)
      alert(`Failed to upload: ${error.message}`)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeBackground = () => {
    const updatedBlock = {
      ...block,
      data: {
        ...data,
        background_url: '',
        background_type: 'image'
      }
    }
    onUpdate(updatedBlock)
  }

  const updateField = (key: string, value: any) => {
    const updatedBlock = {
      ...block,
      data: {
        ...data,
        [key]: value
      }
    }
    // Update block name when headline changes
    if (key === 'headline' && value) {
      updatedBlock.name = value
    }
    onUpdate(updatedBlock)
  }

  // Initialize table data if needed
  const ensureTableData = (newRows: number, newCols: number): string[][] => {
    const newData: string[][] = []
    for (let r = 0; r < newRows; r++) {
      const row: string[] = []
      for (let c = 0; c < newCols; c++) {
        // Preserve existing data if available
        row.push(tableData[r]?.[c] || (r === 0 ? `Header ${c + 1}` : ''))
      }
      newData.push(row)
    }
    return newData
  }

  const updateRowCount = (newRows: number) => {
    if (newRows < 1) return
    const newTableData = ensureTableData(newRows, columns)
    // Update both at once to avoid state sync issues
    const updatedBlock = {
      ...block,
      data: {
        ...data,
        rows: newRows,
        table_data: newTableData
      }
    }
    onUpdate(updatedBlock)
  }

  const updateColumnCount = (newCols: number) => {
    if (newCols < 1) return
    const newTableData = ensureTableData(rows, newCols)
    // Update both at once to avoid state sync issues
    const updatedBlock = {
      ...block,
      data: {
        ...data,
        columns: newCols,
        table_data: newTableData
      }
    }
    onUpdate(updatedBlock)
  }

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const newTableData = [...tableData.map(row => [...row])]
    if (!newTableData[rowIndex]) {
      newTableData[rowIndex] = []
    }
    newTableData[rowIndex][colIndex] = value
    updateField('table_data', newTableData)
  }

  // Ensure table data exists - use useEffect to avoid setState during render
  useEffect(() => {
    if (tableData.length === 0 || tableData.length !== rows || (tableData[0] && tableData[0].length !== columns)) {
      const initialData = ensureTableData(rows, columns)
      updateField('table_data', initialData)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, columns])

  return (
    <div className="space-y-6">
      {/* Background Media */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Background Image/Video</label>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Preview thumbnail or placeholder */}
          {background_url ? (
            <div className="relative">
              {background_type === 'video' ? (
                <video src={background_url} className="h-16 w-28 object-cover rounded" muted />
              ) : (
                <img src={background_url} alt="Background" className="h-16 w-28 object-cover rounded" />
              )}
              <button
                onClick={removeBackground}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
              >
                <X className="w-3 h-3" />
              </button>
              <span className="absolute bottom-0.5 right-0.5 text-[10px] bg-black/60 text-white px-1 rounded">
                {background_type === 'video' ? 'VIDEO' : 'IMAGE'}
              </span>
            </div>
          ) : (
            <div className="h-16 w-28 bg-slate-800 border border-dashed border-slate-600 rounded flex items-center justify-center">
              <Image className="w-6 h-6 text-slate-500" />
            </div>
          )}

          {/* Upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-3 py-1.5 bg-violet-600 text-white text-sm rounded hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload
              </>
            )}
          </button>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm"
            onChange={handleUpload}
            className="hidden"
          />
        </div>
        <p className="text-xs text-slate-500 mt-1">Optional background image or video for the table section</p>
      </div>

      {/* Headline Text */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Table Name / Headline</label>
        <input
          type="text"
          value={data.headline || ''}
          onChange={(e) => {
            const value = e.target.value
            // Update both headline and block name
            const updatedBlock = {
              ...block,
              name: value || 'Table Block',
              data: {
                ...data,
                headline: value
              }
            }
            onUpdate(updatedBlock)
          }}
          placeholder="Enter table headline"
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <p className="text-xs text-slate-500 mt-1">Style this headline using the controls in the header bar above</p>
      </div>

      {/* Subheadline */}
      <div>
        <UniversalTextEditor
          label="Subheadline"
          value={data.subheadline || ''}
          onChange={(value) => updateField('subheadline', value)}
          textAlign={data.subheadline_align || 'center'}
          onTextAlignChange={(align) => updateField('subheadline_align', align)}
          bold={data.subheadline_bold || false}
          onBoldChange={(bold) => updateField('subheadline_bold', bold)}
          italic={data.subheadline_italic || false}
          onItalicChange={(italic) => updateField('subheadline_italic', italic)}
          fontSize={data.subheadline_font_size || 'clamp(1rem, 2vw, 1.25rem)'}
          onFontSizeChange={(size) => updateField('subheadline_font_size', size)}
          fontFamily={data.subheadline_font_family || 'Josefin Sans'}
          onFontFamilyChange={(family) => updateField('subheadline_font_family', family)}
          color={data.subheadline_color || '#666666'}
          onColorChange={(color) => updateField('subheadline_color', color)}
          placeholder="Enter subheadline (optional)"
        />
      </div>

      {/* Content */}
      <div>
        <UniversalTextEditor
          label="Content"
          value={data.content || ''}
          onChange={(value) => updateField('content', value)}
          textAlign={data.content_align || 'center'}
          onTextAlignChange={(align) => updateField('content_align', align)}
          bold={data.content_bold || false}
          onBoldChange={(bold) => updateField('content_bold', bold)}
          italic={data.content_italic || false}
          onItalicChange={(italic) => updateField('content_italic', italic)}
          fontSize={data.content_font_size || 'clamp(0.875rem, 1.5vw, 1rem)'}
          onFontSizeChange={(size) => updateField('content_font_size', size)}
          fontFamily={data.content_font_family || 'Cormorant Garamond'}
          onFontFamilyChange={(family) => updateField('content_font_family', family)}
          color={data.content_color || '#374151'}
          onColorChange={(color) => updateField('content_color', color)}
          placeholder="Enter content (optional)"
          multiline
          rows={2}
        />
      </div>

      {/* Table Configuration */}
      <div className="border-t border-slate-600 pt-4">
        <label className="block text-sm font-medium text-slate-300 mb-3">Table Configuration</label>

        {/* Row and Column Controls */}
        <div className="flex gap-6 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Rows:</span>
            <button
              onClick={() => updateRowCount(rows - 1)}
              disabled={rows <= 1}
              className="p-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-white w-8 text-center">{rows}</span>
            <button
              onClick={() => updateRowCount(rows + 1)}
              className="p-1 bg-slate-700 hover:bg-slate-600 rounded"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Columns:</span>
            <button
              onClick={() => updateColumnCount(columns - 1)}
              disabled={columns <= 1}
              className="p-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-white w-8 text-center">{columns}</span>
            <button
              onClick={() => updateColumnCount(columns + 1)}
              className="p-1 bg-slate-700 hover:bg-slate-600 rounded"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table Text Style */}
        <div className="mb-4 p-3 bg-slate-700/50 rounded-lg">
          <label className="block text-xs font-medium text-slate-400 mb-2">Table Text Style</label>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Font:</span>
              <select
                value={data.table_font_family || 'Inter'}
                onChange={(e) => updateField('table_font_family', e.target.value)}
                className="px-2 py-1 bg-slate-600 border border-slate-500 rounded text-xs text-white"
              >
                <option value="Inter">Inter</option>
                <option value="Josefin Sans">Josefin Sans</option>
                <option value="Cormorant Garamond">Cormorant Garamond</option>
                <option value="Playfair Display">Playfair Display</option>
                <option value="Montserrat">Montserrat</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Size:</span>
              <select
                value={data.table_font_size || '0.875rem'}
                onChange={(e) => updateField('table_font_size', e.target.value)}
                className="px-2 py-1 bg-slate-600 border border-slate-500 rounded text-xs text-white"
              >
                <option value="0.75rem">12</option>
                <option value="0.875rem">14</option>
                <option value="1rem">16</option>
                <option value="1.125rem">18</option>
                <option value="1.25rem">20</option>
              </select>
            </div>
            {/* Table Text Color */}
            <div className="relative flex items-center gap-1">
              <span className="text-xs text-slate-400">Text:</span>
              <button
                onClick={() => setActiveColorPicker(activeColorPicker === 'tableText' ? null : 'tableText')}
                className="w-6 h-6 rounded border border-slate-500 cursor-pointer hover:scale-110 transition-transform"
                style={{ backgroundColor: data.table_text_color || '#000000' }}
              />
              {activeColorPicker === 'tableText' && (
                <div className="absolute left-0 top-full mt-1 p-2 bg-slate-700 border border-slate-600 rounded-lg shadow-xl z-50">
                  <div className="grid grid-cols-7 gap-1.5">
                    {COLOR_PALETTE.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => {
                          updateField('table_text_color', c.value)
                          setActiveColorPicker(null)
                        }}
                        className="w-6 h-6 rounded border hover:scale-110 transition-transform"
                        style={{
                          backgroundColor: c.value,
                          borderColor: (data.table_text_color || '#000000') === c.value ? '#a855f7' : '#475569'
                        }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Border Color */}
            <div className="relative flex items-center gap-1">
              <span className="text-xs text-slate-400">Border:</span>
              <button
                onClick={() => setActiveColorPicker(activeColorPicker === 'border' ? null : 'border')}
                className="w-6 h-6 rounded border border-slate-500 cursor-pointer hover:scale-110 transition-transform"
                style={{ backgroundColor: data.border_color || '#e5e7eb' }}
              />
              {activeColorPicker === 'border' && (
                <div className="absolute left-0 top-full mt-1 p-2 bg-slate-700 border border-slate-600 rounded-lg shadow-xl z-50">
                  <div className="grid grid-cols-7 gap-1.5">
                    {COLOR_PALETTE.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => {
                          updateField('border_color', c.value)
                          setActiveColorPicker(null)
                        }}
                        className="w-6 h-6 rounded border hover:scale-110 transition-transform"
                        style={{
                          backgroundColor: c.value,
                          borderColor: (data.border_color || '#e5e7eb') === c.value ? '#a855f7' : '#475569'
                        }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table Editor */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <tbody>
              {tableData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, colIndex) => (
                    <td key={colIndex} className="p-1">
                      <input
                        type="text"
                        value={cell}
                        onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                        placeholder={rowIndex === 0 ? `Header ${colIndex + 1}` : `R${rowIndex + 1}C${colIndex + 1}`}
                        className={`w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm ${
                          rowIndex === 0 ? 'font-bold text-white' : 'text-slate-300'
                        }`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500 mt-2">First row is automatically styled as header (bold)</p>
      </div>
    </div>
  )
}
