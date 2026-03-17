'use client'

import React, { useState } from 'react'
import { LandingPageBlock } from '@/types/landing-page-blocks'
import { getFontClass } from '@/lib/fonts'
import { FileText, Maximize2, Download, ChevronRight, BookOpen } from 'lucide-react'

interface PDFItem {
  title: string
  pdf_url: string
  media_type?: 'image' | 'video'
  media_url?: string
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

  const renderActiveMedia = () => {
    if (!activeItem?.media_url) return null

    if (activeItem.media_type === 'video') {
      let embedUrl = activeItem.media_url
      if (activeItem.media_url.includes('youtube.com/watch?v=')) {
        embedUrl = activeItem.media_url.replace('watch?v=', 'embed/')
      } else if (activeItem.media_url.includes('youtu.be/')) {
        embedUrl = activeItem.media_url.replace('youtu.be/', 'youtube.com/embed/')
      }

      return (
        <div className="rounded-2xl overflow-hidden shadow-lg aspect-video bg-black">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )
    }

    return (
      <div className="rounded-2xl overflow-hidden shadow-lg">
        <img
          src={activeItem.media_url}
          alt={activeItem.title}
          className="w-full h-full object-cover max-h-[500px]"
        />
      </div>
    )
  }

  const textPosition = activeItem?.text_position || 'above'

  return (
    <section 
      className="py-12 px-4 min-h-[80vh] flex flex-col"
      style={{ backgroundColor: data.background_color || '#ffffff' }}
    >
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-8">
          <h2 
            className={`text-2xl md:text-3xl font-bold mb-2 ${getFontClass(data.headline_font_family)}`}
            style={{ color: data.headline_color || '#111827' }}
          >
            {data.headline}
          </h2>
          <p className="text-gray-500 text-sm">
            {data.subheadline}
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-6 flex-1">
          {/* Sidebar Menu */}
          <div className="md:w-64 space-y-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-3">Resources</p>
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
                    {item.title}
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
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-tight">{activeItem.title}</span>
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
                  <div className={`flex flex-col gap-8 ${
                    textPosition === 'left' ? 'md:flex-row' : 
                    textPosition === 'right' ? 'md:flex-row-reverse' : 
                    textPosition === 'below' ? 'flex-col-reverse' : 'flex-col'
                  }`}>
                    
                    {/* Media Component */}
                    {activeItem.media_url && (
                      <div className={`w-full ${
                        (textPosition === 'left' || textPosition === 'right') ? 'md:w-1/2' : ''
                      }`}>
                        {renderActiveMedia()}
                      </div>
                    )}

                    {/* PDF Component */}
                    <div className={`flex-1 min-h-[600px] relative bg-gray-200 rounded-xl overflow-hidden shadow-inner border border-gray-300 ${
                      (textPosition === 'left' || textPosition === 'right') && !activeItem.media_url ? 'w-full' : ''
                    }`}>
                      <iframe
                        src={`${activeItem.pdf_url}#toolbar=0`}
                        className="w-full h-full absolute inset-0 border-none"
                        title={activeItem.title}
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-gray-400">
                  <FileText className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-700">No Document Selected</h3>
                  <p className="text-gray-400 text-sm max-w-xs mx-auto">Please select a guide from the menu on the left to start reading.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
