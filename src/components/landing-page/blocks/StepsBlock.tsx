'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getFontClass } from '@/lib/fonts'

interface Step {
  background_url?: string
  background_type?: 'image' | 'video'
  image_width?: string
  subheadline?: string
  subheadline_font_size?: string
  subheadline_font_family?: string
  subheadline_color?: string
  subheadline_bold?: boolean
  subheadline_italic?: boolean
  subheadline_align?: 'left' | 'center' | 'right'
  text_content: string
  text_position: 'left' | 'right' | 'above' | 'below'
  text_font_size?: string
  text_font_family?: string
  text_color?: string
  text_bold?: boolean
  text_italic?: boolean
  text_align?: 'left' | 'center' | 'right'
}

interface StepsBlockData {
  heading?: string
  heading_font_size?: string
  heading_font_family?: string
  heading_color?: string
  background_color?: string
  overall_layout?: 'vertical' | 'horizontal'
  steps: Step[]
}

interface StepsBlockProps {
  data: StepsBlockData
}

export default function StepsBlock({ data }: StepsBlockProps) {
  const {
    heading = 'HOW TO USE',
    heading_font_size = '2.5rem',
    heading_font_family = 'Josefin Sans',
    heading_color = '#000000',
    background_color = '#ffffff',
    overall_layout = 'vertical',
    steps = []
  } = data

  const [currentIndex, setCurrentIndex] = useState(0)

  // Helper function to preserve line breaks
  const preserveLineBreaks = (text: string) => {
    return text.replace(/\n/g, '<br>')
  }

  const goToPrevious = () => {
    setCurrentIndex(prev => (prev - 1 + steps.length) % steps.length)
  }

  const goToNext = () => {
    setCurrentIndex(prev => (prev + 1) % steps.length)
  }

  if (!steps || steps.length === 0) {
    return null
  }

  return (
    <section
      className="py-4 px-2"
      style={{ backgroundColor: background_color }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Heading */}
        {heading && (
          <h2
            className={`text-center font-light tracking-[0.2em] uppercase leading-tight mb-4 drop-shadow-lg ${getFontClass(heading_font_family)}`}
            style={{
              fontSize: heading_font_size,
              color: heading_color
            }}
          >
            {heading}
          </h2>
        )}

        {/* Steps Container */}
        {overall_layout === 'horizontal' ? (
          <div className="relative">
            {/* Navigation Buttons */}
            {steps.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 z-10 bg-black text-white p-3 rounded-full hover:bg-gray-800 transition-colors shadow-lg"
                  aria-label="Previous step"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <button
                  onClick={goToNext}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 z-10 bg-black text-white p-3 rounded-full hover:bg-gray-800 transition-colors shadow-lg"
                  aria-label="Next step"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Horizontal Slider */}
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              >
                {steps.map((step, index) => {
            const isTextLeft = step.text_position === 'left'
            const isTextRight = step.text_position === 'right'
            const isTextAbove = step.text_position === 'above'
            const isTextBelow = step.text_position === 'below'
            const isMediaVideo = step.background_type === 'video'

            // Subheadline styling
            const subheadlineClassName = `font-light tracking-[0.15em] uppercase drop-shadow ${getFontClass(step.subheadline_font_family)}`
            const subheadlineStyle: React.CSSProperties = {
              fontSize: step.subheadline_font_size || '1.5rem',
              color: step.subheadline_color || '#000000',
              fontWeight: step.subheadline_bold ? 'bold' : undefined,
              fontStyle: step.subheadline_italic ? 'italic' : undefined,
              textAlign: step.subheadline_align || 'left'
            }

            // Text styling - same as Features
            const textClassName = `font-light ${getFontClass(step.text_font_family)}`
            const textStyle: React.CSSProperties = {
              fontSize: step.text_font_size || 'clamp(1rem, 2vw, 1.125rem)',
              color: step.text_color || '#374151',
              fontWeight: step.text_bold ? 'bold' : undefined,
              fontStyle: step.text_italic ? 'italic' : undefined,
              textAlign: step.text_align || 'left'
            }

            return (
              <div
                key={index}
                className="flex-shrink-0 w-full p-6 border border-gray-200 rounded-lg bg-white shadow-sm"
              >
                {/* Vertical text above/below OR Horizontal text left/right */}
                {(isTextAbove || isTextBelow) ? (
                  // Stacked layout
                  <div className="flex flex-col gap-1">
                    {/* Text Above */}
                    {isTextAbove && (
                      <div className="space-y-2">
                        {/* Subheadline */}
                        {step.subheadline && (
                          <h3
                            className={subheadlineClassName}
                            style={subheadlineStyle}
                          >
                            {step.subheadline}
                          </h3>
                        )}
                        {/* Text Content */}
                        <div
                          className={textClassName}
                          style={textStyle}
                          dangerouslySetInnerHTML={{ __html: preserveLineBreaks(step.text_content) }}
                        />
                      </div>
                    )}

                    {/* Media */}
                    <div className="flex justify-center">
                      {step.background_url ? (
                        isMediaVideo ? (
                          <video
                            src={step.background_url}
                            autoPlay
                            muted
                            loop
                            playsInline
                            preload="auto"
                            className="h-auto rounded"
                            style={{ width: step.image_width || '400px' }}
                          />
                        ) : (
                          <img
                            src={step.background_url}
                            alt={`Step ${index + 1}`}
                            className="h-auto rounded"
                            style={{ width: step.image_width || '400px' }}
                          />
                        )
                      ) : (
                        <div className="w-full max-w-2xl aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-gray-400">No media</span>
                        </div>
                      )}
                    </div>

                    {/* Text Below */}
                    {isTextBelow && (
                      <div className="space-y-2">
                        {/* Subheadline */}
                        {step.subheadline && (
                          <h3
                            className={subheadlineClassName}
                            style={subheadlineStyle}
                          >
                            {step.subheadline}
                          </h3>
                        )}
                        {/* Text Content */}
                        <div
                          className={textClassName}
                          style={textStyle}
                          dangerouslySetInnerHTML={{ __html: preserveLineBreaks(step.text_content) }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  // Side-by-side layout
                  <div className="flex flex-row gap-2 items-start">
                    {/* Text Left */}
                    {isTextLeft && (
                      <div className="flex-1 space-y-2">
                        {/* Subheadline */}
                        {step.subheadline && (
                          <h3
                            className={subheadlineClassName}
                            style={subheadlineStyle}
                          >
                            {step.subheadline}
                          </h3>
                        )}
                        {/* Text Content */}
                        <div
                          className={textClassName}
                          style={textStyle}
                          dangerouslySetInnerHTML={{ __html: preserveLineBreaks(step.text_content) }}
                        />
                      </div>
                    )}

                    {/* Media */}
                    <div className="flex-shrink-0">
                      {step.background_url ? (
                        isMediaVideo ? (
                          <video
                            src={step.background_url}
                            autoPlay
                            muted
                            loop
                            playsInline
                            preload="auto"
                            className="h-auto rounded"
                            style={{ width: step.image_width || '400px' }}
                          />
                        ) : (
                          <img
                            src={step.background_url}
                            alt={`Step ${index + 1}`}
                            className="h-auto rounded"
                            style={{ width: step.image_width || '400px' }}
                          />
                        )
                      ) : (
                        <div className="aspect-video bg-gray-200 rounded flex items-center justify-center" style={{ width: step.image_width || '400px' }}>
                          <span className="text-gray-400">No media</span>
                        </div>
                      )}
                    </div>

                    {/* Text Right */}
                    {isTextRight && (
                      <div className="flex-1 space-y-2">
                        {/* Subheadline */}
                        {step.subheadline && (
                          <h3
                            className={subheadlineClassName}
                            style={subheadlineStyle}
                          >
                            {step.subheadline}
                          </h3>
                        )}
                        {/* Text Content */}
                        <div
                          className={textClassName}
                          style={textStyle}
                          dangerouslySetInnerHTML={{ __html: preserveLineBreaks(step.text_content) }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
              </div>
            </div>
          </div>
        ) : (
          // Vertical Layout
          <div className="space-y-4">
            {steps.map((step, index) => {
              const isTextLeft = step.text_position === 'left'
              const isTextRight = step.text_position === 'right'
              const isTextAbove = step.text_position === 'above'
              const isTextBelow = step.text_position === 'below'
              const isMediaVideo = step.background_type === 'video'

              // Subheadline styling
              const subheadlineClassName = `font-light tracking-[0.15em] uppercase drop-shadow ${getFontClass(step.subheadline_font_family)}`
              const subheadlineStyle: React.CSSProperties = {
                fontSize: step.subheadline_font_size || '1.5rem',
                color: step.subheadline_color || '#000000',
                fontWeight: step.subheadline_bold ? 'bold' : undefined,
                fontStyle: step.subheadline_italic ? 'italic' : undefined,
                textAlign: step.subheadline_align || 'left'
              }

              // Text styling - same as Features
              const textClassName = `font-light ${getFontClass(step.text_font_family)}`
              const textStyle: React.CSSProperties = {
                fontSize: step.text_font_size || 'clamp(1rem, 2vw, 1.125rem)',
                color: step.text_color || '#374151',
                fontWeight: step.text_bold ? 'bold' : undefined,
                fontStyle: step.text_italic ? 'italic' : undefined,
                textAlign: step.text_align || 'left'
              }

              return (
                <div key={index} className="w-full p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
                  {/* Vertical text above/below OR Horizontal text left/right */}
                  {(isTextAbove || isTextBelow) ? (
                    // Stacked layout
                    <div className="flex flex-col gap-1">
                      {/* Text Above */}
                      {isTextAbove && (
                        <div className="space-y-2">
                          {/* Subheadline */}
                          {step.subheadline && (
                            <h3
                              className={subheadlineClassName}
                              style={subheadlineStyle}
                            >
                              {step.subheadline}
                            </h3>
                          )}
                          {/* Text Content */}
                          <div
                            className={textClassName}
                            style={textStyle}
                            dangerouslySetInnerHTML={{ __html: preserveLineBreaks(step.text_content) }}
                          />
                        </div>
                      )}

                      {/* Media */}
                      <div className="flex justify-center">
                        {step.background_url ? (
                          isMediaVideo ? (
                            <video
                              src={step.background_url}
                              autoPlay
                              muted
                              loop
                              playsInline
                              preload="auto"
                              className="h-auto rounded"
                              style={{ width: step.image_width || '400px' }}
                            />
                          ) : (
                            <img
                              src={step.background_url}
                              alt={`Step ${index + 1}`}
                              className="h-auto rounded"
                              style={{ width: step.image_width || '400px' }}
                            />
                          )
                        ) : (
                          <div className="w-full max-w-2xl aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-gray-400">No media</span>
                          </div>
                        )}
                      </div>

                      {/* Text Below */}
                      {isTextBelow && (
                        <div className="space-y-2">
                          {/* Subheadline */}
                          {step.subheadline && (
                            <h3
                              className={subheadlineClassName}
                              style={subheadlineStyle}
                            >
                              {step.subheadline}
                            </h3>
                          )}
                          {/* Text Content */}
                          <div
                            className={textClassName}
                            style={textStyle}
                            dangerouslySetInnerHTML={{ __html: preserveLineBreaks(step.text_content) }}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    // Side-by-side layout
                    <div className="flex flex-row gap-2 items-start">
                      {/* Text Left */}
                      {isTextLeft && (
                        <div className="flex-1 space-y-2">
                          {/* Subheadline */}
                          {step.subheadline && (
                            <h3
                              className={subheadlineClassName}
                              style={subheadlineStyle}
                            >
                              {step.subheadline}
                            </h3>
                          )}
                          {/* Text Content */}
                          <div
                            className={textClassName}
                            style={textStyle}
                            dangerouslySetInnerHTML={{ __html: preserveLineBreaks(step.text_content) }}
                          />
                        </div>
                      )}

                      {/* Media */}
                      <div className="flex-shrink-0">
                        {step.background_url ? (
                          isMediaVideo ? (
                            <video
                              src={step.background_url}
                              autoPlay
                              muted
                              loop
                              playsInline
                              preload="auto"
                              className="h-auto rounded"
                              style={{ width: step.image_width || '400px' }}
                            />
                          ) : (
                            <img
                              src={step.background_url}
                              alt={`Step ${index + 1}`}
                              className="h-auto rounded"
                              style={{ width: step.image_width || '400px' }}
                            />
                          )
                        ) : (
                          <div className="aspect-video bg-gray-200 rounded flex items-center justify-center" style={{ width: step.image_width || '400px' }}>
                            <span className="text-gray-400">No media</span>
                          </div>
                        )}
                      </div>

                      {/* Text Right */}
                      {isTextRight && (
                        <div className="flex-1 space-y-2">
                          {/* Subheadline */}
                          {step.subheadline && (
                            <h3
                              className={subheadlineClassName}
                              style={subheadlineStyle}
                            >
                              {step.subheadline}
                            </h3>
                          )}
                          {/* Text Content */}
                          <div
                            className={textClassName}
                            style={textStyle}
                            dangerouslySetInnerHTML={{ __html: preserveLineBreaks(step.text_content) }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
