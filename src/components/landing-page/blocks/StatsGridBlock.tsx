'use client'

import React from 'react'
import { LandingPageBlock } from '@/types/landing-page-blocks'
import { getFontClass } from '@/lib/fonts'

interface StatsGridBlockProps {
  block: LandingPageBlock
  anchorId?: string
}

export default function StatsGridBlock({ block, anchorId }: StatsGridBlockProps) {
  const data = block.data as {
    headline: string
    headline_font_size?: string
    headline_font_family?: string
    headline_color?: string
    headline_text_align?: 'left' | 'center' | 'right'
    
    stats: Array<{
      id: string
      value: string
      label: string
    }>
    
    background_color?: string
  }

  return (
    <section 
      id={anchorId} 
      className="py-20 px-4 md:px-12"
      style={{ backgroundColor: data.background_color || '#f9fafb' }}
    >
      <div className="max-w-7xl mx-auto">
        {data.headline && (
          <h2
            className={`mb-16 ${getFontClass(data.headline_font_family)} ${
              data.headline_text_align === 'left' ? 'text-left' :
              data.headline_text_align === 'right' ? 'text-right' :
              'text-center'
            }`}
            style={{
              fontSize: data.headline_font_size || '3rem',
              color: data.headline_color || '#111827',
              fontWeight: 'bold'
            }}
          >
            {data.headline}
          </h2>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {(data.stats || []).map((stat) => (
            <div key={stat.id} className="text-center space-y-2 group">
              <div className="text-4xl md:text-5xl lg:text-6xl font-black text-violet-600 transition-transform group-hover:scale-110 duration-300">
                {stat.value}
              </div>
              <div className="text-sm md:text-base font-bold text-gray-500 uppercase tracking-widest">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
