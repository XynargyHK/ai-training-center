'use client'

import React, { useState } from 'react'
import { LandingPageBlock } from '@/types/landing-page-blocks'
import { getFontClass } from '@/lib/fonts'
import { FileText, Maximize2, Download, ChevronRight, BookOpen } from 'lucide-react'
import { stripHtml } from '@/lib/utils'

interface PDFItem {
  title: string
  pdf_url: string
  media_type?: 'image' | 'video'
  media_url?: string
  original_filename?: string
  image_width?: string
  text_position?: 'left' | 'right' | 'above' | 'below'
}

interface PDFReaderBlockProps {
  block: LandingPageBlock
}

export default function PDFReaderBlock({ block }: PDFReaderBlockProps) {
  const data = block.data
  const items = data.items || []
  const [activeIndex, setActiveIndex] = useState(0)
  const activeItem = items[activeIndex] as PDFItem

  if (items.length === 0) return null

  // Media Rendering - Patterned after StepsBlock
  const renderActiveMedia = () => {
    if (!activeItem?.media_url) return null
    const isMediaVideo = activeItem.media_type === 'video'
    const imageWidth = activeItem.image_width || '400px'

    const mediaElement = isMediaVideo ? (
      <video
        src={activeItem.media_url}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="h-auto rounded mb-6"
        style={{ width: imageWidth, maxWidth: '100%' }}
      />
    ) : (
      <img
        src={activeItem.media_url}
        alt={activeItem.title}
        className="h-auto rounded mb-6"
        style={{ width: imageWidth, maxWidth: '100%' }}
      />
    )

    return (
      <div className="flex justify-center w-full md:w-auto flex-shrink-0">
        {mediaElement}
      </div>
    )
  }

  const textPosition = activeItem?.text_position || 'above'
  const isTextAbove = textPosition === 'above'
  const isTextBelow = textPosition === 'below'
  const isTextLeft = textPosition === 'left'
  const isTextRight = textPosition === 'right'

  return (
    <section 
      className="py-12 px-4 min-h-[80vh] flex flex-col"
      style={{ backgroundColor: data.background_color || '#ffffff' }}
    >
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col">
        {/* Header - Fixed font sizing */}
        <div className="mb-8">
          <h2 
            className={`font-bold mb-2 ${getFontClass(data.headline_font_family)}`}
            style={{ 
              color: data.headline_color || '#111827',
              fontSize: data.headline_font_size || 'clamp(1.5rem, 4vw, 2.5rem)',
              fontWeight: data.headline_bold ? 'bold' : 'normal',
              fontStyle: data.headline_italic ? 'italic' : 'normal'
            }}
          >
            {stripHtml(data.headline)}
          </h2>
          <p 
            className="opacity-80"
            style={{ 
              color: data.subheadline_color || '#4b5563',
              fontSize: data.subheadline_font_size || '1rem'
            }}
          >
            {stripHtml(data.subheadline)}
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-6 flex-1">
          {/* Sidebar Menu */}
          <div className="md:w-64 space-y-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-3">
              {stripHtml(data.resources_label) || 'Resources'}
            </p>
            {items.map((item: PDFItem, idx: number) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`w-full flex items-center justify-between p-4 rounded-xl text-left transition-all border ${
                  activeIndex === idx 
                    ? 'bg-white border-violet-200 shadow-md translate-x-1' 
                    : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    activeIndex === idx ? 'bg-violet-100 text-violet-600' : 'bg-gray-200 text-gray-400'
                  }`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className={`text-sm font-bold ${activeIndex === idx ? 'text-violet-700' : ''}`}>
                    {stripHtml(item.title)}
                  </span>
                </div>
                {activeIndex === idx && <ChevronRight className="w-4 h-4 text-violet-400" />}
              </button>
            ))}
          </div>

          {/* Reader Area */}
          <div className="flex-1 bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 shadow-inner flex flex-col min-h-[600px]">
            {activeItem?.pdf_url ? (
              <>
                {/* Reader Toolbar */}
                <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-violet-500" />
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-tight">{stripHtml(activeItem.title)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a 
                      href={activeItem.pdf_url} 
                      target="_blank" 
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                      title="Open in New Tab"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </a>
                    <a 
                      href={activeItem.pdf_url} 
                      download 
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white text-xs font-bold rounded-lg hover:bg-violet-700 transition-all shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      DOWNLOAD
                    </a>
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col p-6 overflow-y-auto">
                  {/* Layout - Logic matching StepsBlock */}
                  {isTextAbove || isTextBelow ? (
                    // Stacked
                    <div className="flex flex-col items-center">
                      {isTextAbove && activeItem.media_url && renderActiveMedia()}
                      <div className="flex-1 w-full min-h-[600px] relative bg-gray-200 rounded-xl overflow-hidden shadow-inner border border-gray-300">
                        <iframe
                          src={`${activeItem.pdf_url}#toolbar=0`}
                          className="w-full h-full absolute inset-0 border-none"
                          title={stripHtml(activeItem.title)}
                        />
                      </div>
                      {isTextBelow && activeItem.media_url && renderActiveMedia()}
                    </div>
                  ) : (
                    // Side-by-side
                    <div className={`flex flex-col ${isTextLeft ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8 items-start`}>
                      <div className="flex-1 w-full min-h-[600px] relative bg-gray-200 rounded-xl overflow-hidden shadow-inner border border-gray-300">
                        <iframe
                          src={`${activeItem.pdf_url}#toolbar=0`}
                          className="w-full h-full absolute inset-0 border-none"
                          title={stripHtml(activeItem.title)}
                        />
                      </div>
                      {activeItem.media_url && renderActiveMedia()}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-gray-400">
                  <FileText className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-700">
                    {stripHtml(data.select_guide_title) || 'No Document Selected'}
                  </h3>
                  <p className="text-gray-400 text-sm max-w-xs mx-auto">
                    {stripHtml(data.select_guide_placeholder) || 'Please select a guide from the menu on the left to start reading.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
