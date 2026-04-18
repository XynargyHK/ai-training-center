'use client'

import type { SplitBlockData } from '@/types/landing-page-blocks'
import { getFontClass } from '@/lib/fonts'
import { stripHtml } from '@/lib/utils'

interface SplitBlockProps {
  data: SplitBlockData & {
    background_color?: string
    bg_color?: string
    headline_color?: string
    headline_font_family?: string
    content_color?: string
    content_font_family?: string
  }
  anchorId?: string
}

export default function SplitBlock({ data, anchorId }: SplitBlockProps) {
  const isImageLeft = data.layout === 'image-left'
  // Respect block color fields; fall back to light defaults (was hardcoded dark slate)
  const bgColor = data.background_color || data.bg_color || '#ffffff'
  const headlineColor = data.headline_color || '#111111'
  const contentColor = data.content_color || '#4b5563'
  const headlineFont = data.headline_font_family || 'Josefin Sans'
  const contentFont = data.content_font_family || 'Cormorant Garamond'

  return (
    <div id={anchorId} className="w-full py-16 px-4" style={{ backgroundColor: bgColor }}>
      <div className="max-w-6xl mx-auto">
        <div className={`grid md:grid-cols-2 gap-8 items-center ${isImageLeft ? '' : 'md:grid-flow-dense'}`}>
          {/* Image Column */}
          <div className={isImageLeft ? '' : 'md:col-start-2'}>
            {data.image_url ? (
              <img
                src={data.image_url}
                alt={stripHtml(data.headline) || 'Block image'}
                className="w-full h-auto rounded-lg shadow-2xl"
              />
            ) : (
              <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-400 text-sm">No image</span>
              </div>
            )}
          </div>

          {/* Text Column */}
          <div className={isImageLeft ? '' : 'md:col-start-1 md:row-start-1'}>
            {data.headline && (
              <h2
                className={`text-3xl md:text-4xl font-light leading-tight mb-4 ${getFontClass(headlineFont)}`}
                style={{ color: headlineColor }}
              >
                {stripHtml(data.headline)}
              </h2>
            )}

            {data.content && (
              <p
                className={`text-lg font-light leading-relaxed mb-6 whitespace-pre-wrap ${getFontClass(contentFont)}`}
                style={{ color: contentColor }}
              >
                {data.content}
              </p>
            )}

            {data.cta_text && data.cta_url && (
              data.cta_url.startsWith('#') ? (
                <button
                  onClick={() => {
                    const element = document.querySelector(data.cta_url || '')
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                  }}
                  className={`inline-block px-8 py-3 text-sm font-bold tracking-[0.15em] uppercase transition-colors ${getFontClass(headlineFont)}`}
                  style={{ backgroundColor: headlineColor, color: bgColor }}
                >
                  {data.cta_text}
                </button>
              ) : (
                <a
                  href={data.cta_url}
                  className={`inline-block px-8 py-3 text-sm font-bold tracking-[0.15em] uppercase transition-colors ${getFontClass(headlineFont)}`}
                  style={{ backgroundColor: headlineColor, color: bgColor }}
                >
                  {data.cta_text}
                </a>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
