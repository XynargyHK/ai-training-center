'use client'

import { getFontClass } from '@/lib/fonts'

interface TableBlockData {
  // Heading styles (same as other blocks)
  heading_font_size?: string
  heading_font_family?: string
  heading_color?: string
  heading_align?: 'left' | 'center' | 'right'
  heading_bold?: boolean
  heading_italic?: boolean
  // Subheadline
  subheadline?: string
  subheadline_font_size?: string
  subheadline_font_family?: string
  subheadline_color?: string
  subheadline_bold?: boolean
  subheadline_italic?: boolean
  subheadline_align?: 'left' | 'center' | 'right'
  // Content
  content?: string
  content_font_size?: string
  content_font_family?: string
  content_color?: string
  content_bold?: boolean
  content_italic?: boolean
  content_align?: 'left' | 'center' | 'right'
  // Section
  background_color?: string
  background_url?: string
  background_type?: 'image' | 'video'
  // Table
  rows?: number
  columns?: number
  table_data?: string[][]
  table_font_family?: string
  table_font_size?: string
  table_text_color?: string
  border_color?: string
}

interface TableBlockProps {
  data: TableBlockData
  heading?: string
}

export default function TableBlock({ data, heading = '' }: TableBlockProps) {
  const {
    heading_font_size = '2.5rem',
    heading_font_family = 'Josefin Sans',
    heading_color = '#000000',
    heading_align = 'center',
    heading_bold = false,
    heading_italic = false,
    subheadline,
    subheadline_font_size = 'clamp(1rem, 2vw, 1.25rem)',
    subheadline_font_family = 'Josefin Sans',
    subheadline_color = '#666666',
    subheadline_bold = false,
    subheadline_italic = false,
    subheadline_align = 'center',
    content,
    content_font_size = 'clamp(0.875rem, 1.5vw, 1rem)',
    content_font_family = 'Cormorant Garamond',
    content_color = '#374151',
    content_bold = false,
    content_italic = false,
    content_align = 'center',
    background_color = '#ffffff',
    background_url,
    background_type = 'image',
    table_data = [],
    table_font_family = 'Inter',
    table_font_size = '0.875rem',
    table_text_color = '#000000',
    border_color = '#e5e7eb'
  } = data

  if (!table_data || table_data.length === 0) {
    return null
  }

  return (
    <section
      className="py-8 px-4 relative overflow-hidden"
      style={{ backgroundColor: background_color }}
    >
      {/* Background Media */}
      {background_url && (
        <div className="absolute inset-0 z-0">
          {background_type === 'video' ? (
            <video
              src={background_url}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={background_url}
              alt="Background"
              className="w-full h-full object-cover"
            />
          )}
          {/* Optional overlay to ensure text readability */}
          <div className="absolute inset-0 bg-black/20" />
        </div>
      )}

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Heading - same style as StepsBlock */}
        {heading && (
          <h2
            className={`font-light tracking-[0.2em] uppercase leading-tight mb-4 drop-shadow-lg ${getFontClass(heading_font_family)}`}
            style={{
              fontSize: heading_font_size,
              color: heading_color,
              textAlign: heading_align,
              fontWeight: heading_bold ? 'bold' : undefined,
              fontStyle: heading_italic ? 'italic' : undefined
            }}
          >
            {heading}
          </h2>
        )}

        {/* Subheadline */}
        {subheadline && (
          <h3
            className={`mb-2 ${getFontClass(subheadline_font_family)}`}
            style={{
              fontSize: subheadline_font_size,
              color: subheadline_color,
              fontWeight: subheadline_bold ? 'bold' : 'normal',
              fontStyle: subheadline_italic ? 'italic' : 'normal',
              textAlign: subheadline_align
            }}
          >
            {subheadline}
          </h3>
        )}

        {/* Content */}
        {content && (
          <p
            className={`mb-6 whitespace-pre-wrap ${getFontClass(content_font_family)}`}
            style={{
              fontSize: content_font_size,
              color: content_color,
              fontWeight: content_bold ? 'bold' : 'normal',
              fontStyle: content_italic ? 'italic' : 'normal',
              textAlign: content_align
            }}
          >
            {content}
          </p>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table
            className="w-full border-collapse"
            style={{ borderColor: border_color }}
          >
            <thead>
              <tr>
                {table_data[0]?.map((cell, colIndex) => (
                  <th
                    key={colIndex}
                    className={`px-4 py-3 text-left font-bold border ${getFontClass(table_font_family)}`}
                    style={{
                      borderColor: border_color,
                      fontSize: table_font_size,
                      color: table_text_color
                    }}
                  >
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table_data.slice(1).map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, colIndex) => (
                    <td
                      key={colIndex}
                      className={`px-4 py-3 border font-light ${getFontClass(table_font_family)}`}
                      style={{
                        borderColor: border_color,
                        fontSize: table_font_size,
                        color: table_text_color
                      }}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
