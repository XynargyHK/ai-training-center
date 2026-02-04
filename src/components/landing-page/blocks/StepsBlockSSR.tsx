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

interface StepsBlockSSRProps {
  data: StepsBlockData
  heading?: string
  anchorId?: string
}

function processTextContent(text: string): string {
  if (!text) return ''
  if (text.includes('<') && text.includes('>')) {
    let processed = text
    processed = processed.replace(/<font\s+color=["']?(#fff|#ffffff|white|rgb\(255,\s*255,\s*255\))["']?>/gi, '<font color="#000000">')
    processed = processed.replace(/style=["'][^"']*color:\s*(#fff|#ffffff|white|rgb\(255,\s*255,\s*255\))/gi, (match) => {
      return match.replace(/(#fff|#ffffff|white|rgb\(255,\s*255,\s*255\))/gi, '#000000')
    })
    return processed
  }
  return text.replace(/\n/g, '<br>')
}

function StepItem({ step, index }: { step: Step; index: number }) {
  const isTextLeft = step.text_position === 'left'
  const isTextRight = step.text_position === 'right'
  const isTextAbove = step.text_position === 'above'
  const isTextBelow = step.text_position === 'below'
  const isMediaVideo = step.background_type === 'video'

  const subheadlineClassName = `font-light tracking-[0.15em] uppercase drop-shadow ${getFontClass(step.subheadline_font_family)}`
  const subheadlineStyle: React.CSSProperties = {
    fontSize: step.subheadline_font_size || '1.5rem',
    color: step.subheadline_color || '#000000',
    fontWeight: step.subheadline_bold ? 'bold' : undefined,
    fontStyle: step.subheadline_italic ? 'italic' : undefined,
    textAlign: step.subheadline_align || 'left'
  }

  const textClassName = `font-light step-text-content ${getFontClass(step.text_font_family)}`
  const textStyle: React.CSSProperties = {
    fontSize: step.text_font_size || 'clamp(1rem, 2vw, 1.125rem)',
    color: step.text_color || '#374151',
    fontWeight: step.text_bold ? 'bold' : undefined,
    fontStyle: step.text_italic ? 'italic' : undefined,
    textAlign: step.text_align || 'left'
  }

  const mediaElement = step.background_url ? (
    isMediaVideo ? (
      <video
        src={step.background_url}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="h-auto rounded"
        style={{ width: step.image_width || '400px', maxWidth: '100%' }}
      />
    ) : (
      <img
        src={step.background_url}
        alt={`Step ${index + 1}`}
        loading="lazy"
        className="h-auto rounded"
        style={{ width: step.image_width || '400px', maxWidth: '100%' }}
      />
    )
  ) : null

  const textElement = (
    <div className="space-y-2">
      {step.subheadline && (
        <h3 className={subheadlineClassName} style={subheadlineStyle}>
          {step.subheadline}
        </h3>
      )}
      <div
        className={textClassName}
        style={textStyle}
        dangerouslySetInnerHTML={{ __html: processTextContent(step.text_content) }}
      />
    </div>
  )

  return (
    <div className="w-full p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
      {(isTextAbove || isTextBelow) ? (
        <div className="flex flex-col gap-1">
          {isTextAbove && textElement}
          <div className="flex justify-center">{mediaElement}</div>
          {isTextBelow && textElement}
        </div>
      ) : (
        <div className="flex flex-row flex-wrap gap-4 items-start">
          {isTextLeft && <div className="flex-1" style={{ minWidth: '40%' }}>{textElement}</div>}
          <div className="flex-shrink-0">{mediaElement}</div>
          {isTextRight && <div className="flex-1" style={{ minWidth: '40%' }}>{textElement}</div>}
        </div>
      )}
    </div>
  )
}

export default function StepsBlockSSR({ data, heading = '', anchorId }: StepsBlockSSRProps) {
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

  if (!steps || steps.length === 0) return null

  return (
    <section
      id={anchorId}
      className="py-4 px-2 steps-block-content"
      style={{ backgroundColor: background_color }}
    >
      <div className="max-w-4xl mx-auto">
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

        {overall_layout === 'horizontal' ? (
          <div className="overflow-x-auto snap-x snap-mandatory pb-4" style={{ WebkitOverflowScrolling: 'touch' as any }}>
            <div className="flex gap-4">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 snap-center"
                  style={{ width: `calc(${step.image_width || '400px'} + 3rem)` }}
                >
                  <StepItem step={step} index={index} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {steps.map((step, index) => (
              <StepItem key={index} step={step} index={index} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
