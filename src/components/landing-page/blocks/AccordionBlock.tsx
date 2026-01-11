'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { getFontClass } from '@/lib/fonts'

interface AccordionItem {
  title: string
  title_font_size?: string
  title_font_family?: string
  title_color?: string
  title_bold?: boolean
  title_italic?: boolean
  content: string
  content_font_size?: string
  content_font_family?: string
  content_color?: string
  content_bold?: boolean
  content_italic?: boolean
}

interface AccordionBlockData {
  heading_font_size?: string
  heading_font_family?: string
  heading_color?: string
  heading_align?: 'left' | 'center' | 'right'
  heading_bold?: boolean
  heading_italic?: boolean
  items: AccordionItem[]
  background_color?: string
}

interface AccordionBlockProps {
  data: AccordionBlockData
  heading?: string
  anchorId?: string
}

export default function AccordionBlock({ data, heading = '', anchorId }: AccordionBlockProps) {
  const {
    heading_font_size = '2.5rem',
    heading_font_family = 'Josefin Sans',
    heading_color = '#000000',
    heading_align = 'center',
    heading_bold = false,
    heading_italic = false,
    items = [],
    background_color = '#ffffff'
  } = data

  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const toggleItem = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index)
  }

  if (!items || items.length === 0) {
    return null
  }

  return (
    <section
      id={anchorId}
      className="py-16 px-4"
      style={{ backgroundColor: background_color }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Heading */}
        {heading && (
          <h2
            className={`font-light tracking-[0.2em] uppercase leading-tight mb-12 drop-shadow-lg ${getFontClass(heading_font_family)}`}
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

        {/* Accordion Items */}
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <button
                onClick={() => toggleItem(index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <span
                  className={`pr-4 ${getFontClass(item.title_font_family || 'Josefin Sans')}`}
                  style={{
                    fontSize: item.title_font_size || '1rem',
                    color: item.title_color || '#111827',
                    fontWeight: item.title_bold ? 'bold' : 600,
                    fontStyle: item.title_italic ? 'italic' : undefined
                  }}
                >
                  {item.title}
                </span>
                <span className="flex-shrink-0">
                  {expandedIndex === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  )}
                </span>
              </button>

              {expandedIndex === index && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <p
                    className={`font-light leading-relaxed whitespace-pre-wrap ${getFontClass(item.content_font_family || 'Cormorant Garamond')}`}
                    style={{
                      fontSize: item.content_font_size || '1rem',
                      color: item.content_color || '#374151',
                      fontWeight: item.content_bold ? 'bold' : undefined,
                      fontStyle: item.content_italic ? 'italic' : undefined
                    }}
                  >
                    {item.content}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
