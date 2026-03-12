'use client'

import React from 'react'
import { LandingPageBlock } from '@/types/landing-page-blocks'
import { getFontClass } from '@/lib/fonts'

interface LogoCloudBlockProps {
  block: LandingPageBlock
  anchorId?: string
}

export default function LogoCloudBlock({ block, anchorId }: LogoCloudBlockProps) {
  const data = block.data as {
    headline?: string
    headline_font_size?: string
    headline_font_family?: string
    headline_color?: string
    headline_bold?: boolean
    headline_italic?: boolean
    headline_text_align?: 'left' | 'center' | 'right'

    logos: Array<{
      id: string
      url: string
      name: string
      link?: string
    }>

    background_color?: string
    logo_height?: string
    grayscale?: boolean
    opacity?: number
  }

  return (
    <section 
      id={anchorId} 
      className="py-12 px-4 md:px-12 border-y border-gray-50"
      style={{ backgroundColor: data.background_color || '#ffffff' }}
    >
      <div className="max-w-7xl mx-auto">
        {data.headline && (
          <h2
            className={`mb-8 ${getFontClass(data.headline_font_family)} ${
              data.headline_text_align === 'left' ? 'text-left' :
              data.headline_text_align === 'right' ? 'text-right' :
              'text-center'
            }`}
            style={{
              fontSize: data.headline_font_size || '1.25rem',
              color: data.headline_color || '#6b7280',
              fontWeight: data.headline_bold ? 'bold' : 'normal',
              fontStyle: data.headline_italic ? 'italic' : 'normal',
              letterSpacing: '0.1em',
              textTransform: 'uppercase'
            }}
          >
            {data.headline}
          </h2>
        )}

        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
          {(data.logos || []).map((logo) => (
            <div 
              key={logo.id}
              className={`transition-all duration-300 hover:opacity-100`}
              style={{ 
                height: data.logo_height || '40px',
                opacity: data.opacity || 0.6,
                filter: data.grayscale ? 'grayscale(100%)' : 'none'
              }}
            >
              <img 
                src={logo.url} 
                alt={logo.name} 
                className="h-full w-auto object-contain pointer-events-none"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
