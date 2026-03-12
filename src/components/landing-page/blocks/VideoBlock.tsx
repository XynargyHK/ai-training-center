'use client'

import React from 'react'
import { LandingPageBlock } from '@/types/landing-page-blocks'
import { getFontClass } from '@/lib/fonts'

interface VideoBlockProps {
  block: LandingPageBlock
  anchorId?: string
}

export default function VideoBlock({ block, anchorId }: VideoBlockProps) {
  const data = block.data as {
    headline?: string
    headline_font_size?: string
    headline_font_family?: string
    headline_color?: string
    headline_bold?: boolean
    headline_italic?: boolean
    headline_text_align?: 'left' | 'center' | 'right'

    video_url: string
    video_type: 'youtube' | 'vimeo' | 'direct'
    aspect_ratio: '16/9' | '4/3' | '1/1' | '9/16'
    autoplay: boolean
    muted: boolean
    loop: boolean
    controls: boolean
    
    max_width?: string
    background_color?: string
  }

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return ''
    let videoId = url
    if (url.includes('v=')) videoId = url.split('v=')[1].split('&')[0]
    else if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0]
    
    const params = new URLSearchParams()
    if (data.autoplay) params.append('autoplay', '1')
    if (data.muted) params.append('mute', '1')
    if (data.loop) {
      params.append('loop', '1')
      params.append('playlist', videoId)
    }
    if (!data.controls) params.append('controls', '0')
    
    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`
  }

  const getVimeoEmbedUrl = (url: string) => {
    if (!url) return ''
    let videoId = url
    if (url.includes('vimeo.com/')) videoId = url.split('vimeo.com/')[1].split('?')[0]
    
    const params = new URLSearchParams()
    if (data.autoplay) params.append('autoplay', '1')
    if (data.muted) params.append('muted', '1')
    if (data.loop) params.append('loop', '1')
    if (!data.controls) params.append('controls', '0')
    
    return `https://player.vimeo.com/video/${videoId}?${params.toString()}`
  }

  const aspectRatioClass = 
    data.aspect_ratio === '9/16' ? 'aspect-[9/16]' :
    data.aspect_ratio === '1/1' ? 'aspect-square' :
    data.aspect_ratio === '4/3' ? 'aspect-[4/3]' : 'aspect-video'

  return (
    <section 
      id={anchorId} 
      className="py-12 md:py-20 px-4 md:px-12"
      style={{ backgroundColor: data.background_color || 'transparent' }}
    >
      <div className="max-w-6xl mx-auto">
        {data.headline && (
          <h2
            className={`mb-10 ${getFontClass(data.headline_font_family)} ${
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

        <div 
          className="mx-auto shadow-2xl overflow-hidden rounded-xl bg-black"
          style={{ maxWidth: data.max_width || '800px' }}
        >
          <div className={`relative w-full ${aspectRatioClass}`}>
            {data.video_type === 'youtube' ? (
              <iframe
                src={getYouTubeEmbedUrl(data.video_url)}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : data.video_type === 'vimeo' ? (
              <iframe
                src={getVimeoEmbedUrl(data.video_url)}
                className="absolute inset-0 w-full h-full"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                src={data.video_url}
                className="absolute inset-0 w-full h-full object-contain"
                autoPlay={data.autoplay}
                muted={data.muted}
                loop={data.loop}
                controls={data.controls}
                playsInline
              />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
