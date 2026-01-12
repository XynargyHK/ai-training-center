'use client'

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
  heading_font_size?: string
  heading_font_family?: string
  heading_color?: string
  heading_align?: 'left' | 'center' | 'right'
  heading_bold?: boolean
  heading_italic?: boolean
  // Block-level subheadline (after headline)
  subheadline?: string
  subheadline_font_size?: string
  subheadline_font_family?: string
  subheadline_color?: string
  subheadline_bold?: boolean
  subheadline_italic?: boolean
  subheadline_align?: 'left' | 'center' | 'right'
  background_color?: string
  overall_layout?: 'vertical' | 'horizontal'
  steps: Step[]
}

interface StepsBlockProps {
  data: StepsBlockData
  heading?: string
  anchorId?: string
}

export default function StepsBlock({ data, heading = '', anchorId }: StepsBlockProps) {
  const {
    heading_font_size = '2.5rem',
    heading_font_family = 'Josefin Sans',
    heading_color = '#000000',
    heading_align = 'center',
    heading_bold = false,
    heading_italic = false,
    subheadline,
    subheadline_font_size = 'clamp(1rem, 2vw, 1.25rem)',
    subheadline_font_family = 'Josefin Sans',
    subheadline_color = '#666666',
    subheadline_bold = false,
    subheadline_italic = false,
    subheadline_align = 'center',
    background_color = '#ffffff',
    overall_layout = 'vertical',
    steps = []
  } = data

  // Helper function to handle text content
  // If content is HTML (from rich editor), use as-is
  // If plain text, preserve line breaks
  const processTextContent = (text: string) => {
    if (!text) return ''
    // Check if content appears to be HTML
    if (text.includes('<') && text.includes('>')) {
      return text // Already HTML from WYSIWYG editor
    }
    // Plain text - preserve line breaks
    return text.replace(/\n/g, '<br>')
  }

  if (!steps || steps.length === 0) {
    return null
  }

  return (
    <section
      id={anchorId}
      className="py-4 px-2 steps-block-content"
      style={{ backgroundColor: background_color }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Heading */}
        {heading && (
          <h2
            className={`font-light tracking-[0.2em] uppercase leading-tight mb-4 drop-shadow-lg ${getFontClass(heading_font_family)}`}
            style={{
              fontSize: heading_font_size,
              color: heading_color,
              textAlign: heading_align,
              fontWeight: heading_bold ? 'bold' : undefined,
              fontStyle: heading_italic ? 'italic' : undefined
            }}
          >
            {heading}
          </h2>
        )}

        {/* Block Subheadline - same style as hero banner */}
        {subheadline && (
          <p
            className={`font-light tracking-[0.15em] uppercase mb-4 drop-shadow ${getFontClass(subheadline_font_family)}`}
            style={{
              fontSize: subheadline_font_size,
              color: subheadline_color,
              textAlign: subheadline_align,
              fontWeight: subheadline_bold ? 'bold' : undefined,
              fontStyle: subheadline_italic ? 'italic' : undefined
            }}
          >
            {subheadline}
          </p>
        )}

        {/* Steps Container */}
        {overall_layout === 'horizontal' ? (
          <div className="overflow-x-auto snap-x snap-mandatory pb-4" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="flex gap-4">
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
                className="flex-shrink-0 snap-center p-6 border border-gray-200 rounded-lg bg-white shadow-sm"
                style={{ width: `calc(${step.image_width || '400px'} + 3rem)` }}
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
                          dangerouslySetInnerHTML={{ __html: processTextContent(step.text_content) }}
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
                      ) : null}
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
                          dangerouslySetInnerHTML={{ __html: processTextContent(step.text_content) }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  // Side-by-side layout - wraps to stack only when text would be <40% width
                  <div className="flex flex-row flex-wrap gap-4 items-start">
                    {/* Text Left */}
                    {isTextLeft && (
                      <div className="flex-1 space-y-2" style={{ minWidth: '40%' }}>
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
                          dangerouslySetInnerHTML={{ __html: processTextContent(step.text_content) }}
                        />
                      </div>
                    )}

                    {/* Media - fixed width, flex-shrink-0 to maintain size */}
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
                            style={{ width: step.image_width || '400px', maxWidth: '100%' }}
                          />
                        ) : (
                          <img
                            src={step.background_url}
                            alt={`Step ${index + 1}`}
                            className="h-auto rounded"
                            style={{ width: step.image_width || '400px', maxWidth: '100%' }}
                          />
                        )
                      ) : null}
                    </div>

                    {/* Text Right - wraps below when text would be <40% width */}
                    {isTextRight && (
                      <div className="flex-1 space-y-2" style={{ minWidth: '40%' }}>
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
                          dangerouslySetInnerHTML={{ __html: processTextContent(step.text_content) }}
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
                            dangerouslySetInnerHTML={{ __html: processTextContent(step.text_content) }}
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
                        ) : null}
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
                            dangerouslySetInnerHTML={{ __html: processTextContent(step.text_content) }}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    // Side-by-side layout - wraps to stack only when text would be <40% width
                    <div className="flex flex-row flex-wrap gap-4 items-start">
                      {/* Text Left */}
                      {isTextLeft && (
                        <div className="flex-1 space-y-2" style={{ minWidth: '40%' }}>
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
                            dangerouslySetInnerHTML={{ __html: processTextContent(step.text_content) }}
                          />
                        </div>
                      )}

                      {/* Media - fixed width, flex-shrink-0 to maintain size */}
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
                              style={{ width: step.image_width || '400px', maxWidth: '100%' }}
                            />
                          ) : (
                            <img
                              src={step.background_url}
                              alt={`Step ${index + 1}`}
                              className="h-auto rounded"
                              style={{ width: step.image_width || '400px', maxWidth: '100%' }}
                            />
                          )
                        ) : null}
                      </div>

                      {/* Text Right - wraps below when text would be <40% width */}
                      {isTextRight && (
                        <div className="flex-1 space-y-2" style={{ minWidth: '40%' }}>
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
                            dangerouslySetInnerHTML={{ __html: processTextContent(step.text_content) }}
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

      {/* Rich text content styles */}
      <style jsx global>{`
        .steps-block-content ul {
          list-style-type: disc;
          margin-left: 1.5rem;
          padding-left: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .steps-block-content ol {
          list-style-type: decimal;
          margin-left: 1.5rem;
          padding-left: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .steps-block-content li {
          margin-bottom: 0.25rem;
        }
        .steps-block-content h1 {
          font-size: 1.75rem;
          font-weight: bold;
          margin: 0.5rem 0;
        }
        .steps-block-content h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0.5rem 0;
        }
        .steps-block-content h3 {
          font-size: 1.25rem;
          font-weight: 500;
          margin: 0.25rem 0;
        }
        .steps-block-content p {
          margin-bottom: 0.5rem;
        }
      `}</style>
    </section>
  )
}
