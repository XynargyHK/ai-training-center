'use client'

import { getFontClass } from '@/lib/fonts'

interface Step {
  background_url?: string
  background_type?: 'image' | 'video'
  image_width?: string
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

  if (!steps || steps.length === 0) {
    return null
  }

  return (
    <section
      className="py-4 px-2"
      style={{ backgroundColor: background_color }}
    >
      <div className="w-full">
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
        <div className={`
          ${overall_layout === 'horizontal'
            ? 'flex flex-row gap-2 overflow-x-auto'
            : 'space-y-4'
          }
        `}>
          {steps.map((step, index) => {
            const isTextLeft = step.text_position === 'left'
            const isTextRight = step.text_position === 'right'
            const isTextAbove = step.text_position === 'above'
            const isTextBelow = step.text_position === 'below'
            const isMediaVideo = step.background_type === 'video'

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
                className={`
                  ${overall_layout === 'horizontal' ? 'flex-shrink-0 w-64' : 'w-full'}
                `}
              >
                {/* Vertical text above/below OR Horizontal text left/right */}
                {(isTextAbove || isTextBelow) ? (
                  // Stacked layout
                  <div className="flex flex-col gap-1">
                    {/* Text Above */}
                    {isTextAbove && (
                      <span
                        className={textClassName}
                        style={textStyle}
                        dangerouslySetInnerHTML={{ __html: step.text_content }}
                      />
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
                      <span
                        className={textClassName}
                        style={textStyle}
                        dangerouslySetInnerHTML={{ __html: step.text_content }}
                      />
                    )}
                  </div>
                ) : (
                  // Side-by-side layout
                  <div className="flex flex-row gap-2 items-start">
                    {/* Text Left */}
                    {isTextLeft && (
                      <span
                        className={`flex-1 ${textClassName}`}
                        style={textStyle}
                        dangerouslySetInnerHTML={{ __html: step.text_content }}
                      />
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
                      <span
                        className={`flex-1 ${textClassName}`}
                        style={textStyle}
                        dangerouslySetInnerHTML={{ __html: step.text_content }}
                      />
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
