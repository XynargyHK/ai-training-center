'use client'

import { getFontClass } from '@/lib/fonts'

interface Step {
  image_url?: string
  video_url?: string
  text_content: string
  text_position: 'left' | 'right' | 'above' | 'below'
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
      className="py-16 px-4"
      style={{ backgroundColor: background_color }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        {heading && (
          <h2
            className={`text-center font-light tracking-[0.2em] uppercase leading-tight mb-12 ${getFontClass(heading_font_family)}`}
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
            ? 'flex flex-row gap-8 overflow-x-auto'
            : 'space-y-12'
          }
        `}>
          {steps.map((step, index) => {
            const isTextLeft = step.text_position === 'left'
            const isTextRight = step.text_position === 'right'
            const isTextAbove = step.text_position === 'above'
            const isTextBelow = step.text_position === 'below'
            const isMediaVideo = step.video_url && step.video_url.length > 0

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
                  <div className="flex flex-col gap-4">
                    {/* Text Above */}
                    {isTextAbove && (
                      <div className={`font-light text-gray-700 ${getFontClass('Cormorant Garamond')}`}>
                        <div className="text-sm font-semibold text-gray-900 mb-2">Step {index + 1}</div>
                        <div dangerouslySetInnerHTML={{ __html: step.text_content }} />
                      </div>
                    )}

                    {/* Media */}
                    <div>
                      {isMediaVideo ? (
                        <video
                          src={step.video_url}
                          controls
                          className="w-full h-auto rounded-lg shadow-lg"
                        />
                      ) : step.image_url ? (
                        <img
                          src={step.image_url}
                          alt={`Step ${index + 1}`}
                          className="w-full h-auto rounded-lg shadow-lg"
                        />
                      ) : (
                        <div className="w-full aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-gray-400">No media</span>
                        </div>
                      )}
                    </div>

                    {/* Text Below */}
                    {isTextBelow && (
                      <div className={`font-light text-gray-700 ${getFontClass('Cormorant Garamond')}`}>
                        <div className="text-sm font-semibold text-gray-900 mb-2">Step {index + 1}</div>
                        <div dangerouslySetInnerHTML={{ __html: step.text_content }} />
                      </div>
                    )}
                  </div>
                ) : (
                  // Side-by-side layout
                  <div className={`grid md:grid-cols-2 gap-6 items-center ${isTextLeft ? '' : 'md:grid-flow-dense'}`}>
                    {/* Media Column */}
                    <div className={isTextLeft ? 'md:col-start-2' : ''}>
                      {isMediaVideo ? (
                        <video
                          src={step.video_url}
                          controls
                          className="w-full h-auto rounded-lg shadow-lg"
                        />
                      ) : step.image_url ? (
                        <img
                          src={step.image_url}
                          alt={`Step ${index + 1}`}
                          className="w-full h-auto rounded-lg shadow-lg"
                        />
                      ) : (
                        <div className="w-full aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-gray-400">No media</span>
                        </div>
                      )}
                    </div>

                    {/* Text Column */}
                    <div className={`${isTextLeft ? 'md:col-start-1 md:row-start-1' : ''} font-light text-gray-700 ${getFontClass('Cormorant Garamond')}`}>
                      <div className="text-sm font-semibold text-gray-900 mb-2">Step {index + 1}</div>
                      <div dangerouslySetInnerHTML={{ __html: step.text_content }} />
                    </div>
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
