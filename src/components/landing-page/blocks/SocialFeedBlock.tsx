'use client'

import React from 'react'
import { LandingPageBlock } from '@/types/landing-page-blocks'
import { getFontClass } from '@/lib/fonts'
import { Instagram, Twitter, Facebook } from 'lucide-react'

interface SocialFeedBlockProps {
  block: LandingPageBlock
  anchorId?: string
}

export default function SocialFeedBlock({ block, anchorId }: SocialFeedBlockProps) {
  const data = block.data as {
    headline: string
    headline_font_size?: string
    headline_font_family?: string
    headline_color?: string
    headline_bold?: boolean
    headline_italic?: boolean
    headline_text_align?: 'left' | 'center' | 'right'

    layout: 'grid' | 'carousel' | 'list'
    columns: number
    
    feeds: Array<{
      id: string
      type: 'instagram' | 'tiktok' | 'facebook' | 'twitter' | 'custom'
      url: string
      image_url?: string
      username?: string
      content?: string
    }>

    background_color?: string
    text_color?: string
  }

  const gridCols = 
    data.columns === 1 ? 'grid-cols-1' :
    data.columns === 2 ? 'grid-cols-1 md:grid-cols-2' :
    data.columns === 3 ? 'grid-cols-1 md:grid-cols-3' :
    data.columns === 4 ? 'grid-cols-2 md:grid-cols-4' :
    'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'

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
              fontSize: data.headline_font_size || '2rem',
              color: data.headline_color || '#000000',
              fontWeight: data.headline_bold ? 'bold' : 'normal',
              fontStyle: data.headline_italic ? 'italic' : 'normal'
            }}
          >
            {data.headline}
          </h2>
        )}

        <div className={`grid ${gridCols} gap-4 md:gap-6`}>
          {(data.feeds || []).map((feed) => (
            <a 
              key={feed.id}
              href={feed.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square bg-gray-100 overflow-hidden rounded-lg hover:shadow-xl transition-all"
            >
              {feed.image_url ? (
                <img 
                  src={feed.image_url} 
                  alt={feed.username} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                  {feed.type === 'instagram' && <Instagram className="w-8 h-8 text-pink-600 mb-2" />}
                  {feed.type === 'twitter' && <Twitter className="w-8 h-8 text-sky-500 mb-2" />}
                  {feed.type === 'facebook' && <Facebook className="w-8 h-8 text-blue-600 mb-2" />}
                  <span className="text-sm font-medium text-gray-700">{feed.username}</span>
                </div>
              )}
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-white">
                {feed.type === 'instagram' && <Instagram className="w-6 h-6 mb-2" />}
                {feed.type === 'tiktok' && (
                  <svg className="w-6 h-6 mb-2 fill-current" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.03 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-.1-.01-.1 0-1.2.21-2.45.82-3.5 1.11-1.96 3.27-3.23 5.44-3.29 1.13-.05 2.26.21 3.28.73v4.25c-.67-.36-1.44-.52-2.2-.44-1.02.12-1.93.67-2.51 1.51-.33.48-.5 1.07-.49 1.65.01 1.14.6 2.24 1.55 2.82.72.44 1.61.62 2.44.5 1.15-.13 2.19-.86 2.69-1.89.26-.53.38-1.13.38-1.73V.02z"/>
                  </svg>
                )}
                <span className="text-xs font-bold tracking-wider">VIEW POST</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
