'use client'

import React from 'react'
import { LandingPageBlock } from '@/types/landing-page-blocks'
import { getFontClass } from '@/lib/fonts'

interface ImageGridBlockProps {
  block: LandingPageBlock
  anchorId?: string
}

export default function ImageGridBlock({ block, anchorId }: ImageGridBlockProps) {
  const data = block.data as {
    headline: string
    headline_font_size?: string
    headline_font_family?: string
    headline_color?: string
    headline_text_align?: 'left' | 'center' | 'right'
    
    columns: number
    gap: string
    images: Array<{
      id: string
      url: string
      caption?: string
      alt?: string
    }>
    
    background_color?: string
  }

  const gridCols = 
    data.columns === 1 ? 'grid-cols-1' :
    data.columns === 2 ? 'grid-cols-1 md:grid-cols-2' :
    data.columns === 3 ? 'grid-cols-1 md:grid-cols-3' :
    'grid-cols-2 md:grid-cols-4'

  return (
    <section 
      id={anchorId} 
      className="py-16 px-4 md:px-12"
      style={{ backgroundColor: data.background_color || '#ffffff' }}
    >
      <div className="max-w-7xl mx-auto">
        {data.headline && (
          <h2
            className={`mb-12 ${getFontClass(data.headline_font_family)} ${
              data.headline_text_align === 'left' ? 'text-left' :
              data.headline_text_align === 'right' ? 'text-right' :
              'text-center'
            }`}
            style={{
              fontSize: data.headline_font_size || '2.5rem',
              color: data.headline_color || '#000000'
            }}
          >
            {data.headline}
          </h2>
        )}

        <div 
          className={`grid ${gridCols} gap-4`}
          style={{ gap: data.gap || '1rem' }}
        >
          {(data.images || []).map((img) => (
            <div key={img.id} className="relative group overflow-hidden rounded-lg">
              <img 
                src={img.url} 
                alt={img.alt || ''} 
                className="w-full h-full object-cover aspect-square group-hover:scale-105 transition-transform duration-500"
              />
              {img.caption && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <p className="text-white text-sm font-medium">{img.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
