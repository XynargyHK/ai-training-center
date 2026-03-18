'use client'

import Link from 'next/link'
import { getFontClass } from '@/lib/fonts'
import { stripHtml, cleanHtml } from '@/lib/utils'

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
  cta_text?: string
  cta_url?: string
  button_align?: 'left' | 'center' | 'right'
  button_color?: string
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
    steps = [],
    cta_text,
    cta_url,
    button_align = 'center',
    button_color = '#7c3aed'
  } = data

  const processTextContent = (text: string) => {
    if (!text) return ''
    if (text.includes('<!--') || text.includes('MsoNormal') || text.includes('/* Font Definitions */')) {
      if (text.includes('EndFragment')) return stripHtml(text)
    }
    if (text.includes('<') && text.includes('>')) {
      let processed = text
      processed = processed.replace(/<font\s+color=["']?(#fff|#ffffff|white|rgb\(255,\s*255,\s*255\))["']?>/gi, '<font color="#000000">')
      processed = processed.replace(/style=["'][^"']*color:\s*(#fff|#ffffff|white|rgb\(255,\s*255,\s*255\))/gi, (match) => {
        return match.replace(/(#fff|#ffffff|white|rgb\(255,\s*255,\s*255\))/gi, '#000000')
      })
      processed = processed.replace(/<!--[\s\S]*?-->/g, '')
      return processed
    }
    return text
  }

  if (!steps || steps.length === 0) return null

  return (
    <section id={anchorId} className="py-12 px-4 steps-block-content" style={{ backgroundColor: background_color }}>
      <div className="max-w-6xl mx-auto">
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
            {stripHtml(heading)}
          </h2>
        )}

        {/* Block Subheadline */}
        {subheadline && (
          <p
            className={`font-light tracking-[0.15em] uppercase mb-12 drop-shadow ${getFontClass(subheadline_font_family)}`}
            style={{
              fontSize: subheadline_font_size,
              color: subheadline_color,
              textAlign: subheadline_align,
              fontWeight: subheadline_bold ? 'bold' : undefined,
              fontStyle: subheadline_italic ? 'italic' : undefined
            }}
          >
            {stripHtml(subheadline)}
          </p>
        )}

        {/* Steps Content */}
        <div className={overall_layout === 'horizontal' ? "flex flex-row overflow-x-auto gap-8 pb-8 snap-x" : "flex flex-col gap-16"}>
          {steps.map((step, index) => (
            <div key={index} className={`flex flex-col ${
              step.text_position === 'left' ? 'md:flex-row' : 
              step.text_position === 'right' ? 'md:flex-row-reverse' : 
              step.text_position === 'below' ? 'flex-col-reverse' : 'flex-col'
            } gap-8 items-center ${overall_layout === 'horizontal' ? 'min-w-[300px] snap-center' : ''}`}>
              
              {/* Media */}
              {step.background_url && (
                <div className="flex-shrink-0">
                  {step.background_type === 'video' ? (
                    <video src={step.background_url} autoPlay muted loop playsInline className="h-auto rounded shadow-lg" style={{ width: step.image_width || '400px', maxWidth: '100%' }} />
                  ) : (
                    <img src={step.background_url} alt={step.subheadline || ''} className="h-auto rounded shadow-lg" style={{ width: step.image_width || '400px', maxWidth: '100%' }} />
                  )}
                </div>
              )}

              {/* Text */}
              <div className="flex-1 w-full">
                {step.subheadline && (
                  <h3 className={`mb-4 ${getFontClass(step.subheadline_font_family)}`} style={{ 
                    fontSize: step.subheadline_font_size || '1.5rem',
                    color: step.subheadline_color || '#000000',
                    textAlign: step.subheadline_align || 'left',
                    fontWeight: step.subheadline_bold ? 'bold' : 'normal',
                    fontStyle: step.subheadline_italic ? 'italic' : 'normal'
                  }}>
                    {stripHtml(step.subheadline)}
                  </h3>
                )}
                <div 
                  className={`prose prose-sm md:prose-base max-w-none step-text-content ${getFontClass(step.text_font_family)}`}
                  style={{ 
                    color: step.text_color || '#374151',
                    fontSize: step.text_font_size || '1rem',
                    textAlign: step.text_align || 'left'
                  }}
                  dangerouslySetInnerHTML={{ __html: processTextContent(step.text_content) }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Block-level CTA Button */}
        {cta_text && (
          <div className="mt-12" style={{ textAlign: button_align }}>
            <Link
              href={cta_url || '#'}
              className="inline-block px-8 py-4 text-white font-bold rounded-none transition-all shadow-lg hover:scale-105"
              style={{ backgroundColor: button_color }}
            >
              {cta_text}
            </Link>
          </div>
        )}
      </div>

      <style jsx global>{`
        .steps-block-content .step-text-content p { margin-bottom: 0; }
        .steps-block-content .step-text-content ul { list-style-type: disc; margin-left: 1.5rem; }
      `}</style>
    </section>
  )
}
