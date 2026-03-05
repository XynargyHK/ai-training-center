import type { SplitBlockData } from '@/types/landing-page-blocks'
import { getFontClass } from '@/lib/fonts'

interface SplitBlockSSRProps {
  data: SplitBlockData & {
    bg_color?: string
    headline_font_size?: string
    headline_font_family?: string
    headline_color?: string
    headline_bold?: boolean
    content_font_size?: string
    content_font_family?: string
    content_color?: string
  }
  anchorId?: string
}

export default function SplitBlockSSR({ data, anchorId }: SplitBlockSSRProps) {
  const isImageLeft = data.layout === 'image-left'
  const bgColor = data.bg_color || '#0f172a'
  const headlineColor = data.headline_color || '#ffffff'
  const contentColor = data.content_color || '#cbd5e1'

  return (
    <div id={anchorId} className="w-full py-16 px-4" style={{ backgroundColor: bgColor }}>
      <div className="max-w-6xl mx-auto">
        <div className={`grid md:grid-cols-2 gap-8 items-center ${isImageLeft ? '' : 'md:grid-flow-dense'}`}>
          {/* Image Column */}
          <div className={isImageLeft ? '' : 'md:col-start-2'}>
            {data.image_url ? (
              <img
                src={data.image_url}
                alt={data.headline || 'Block image'}
                className="w-full h-auto rounded-lg shadow-2xl"
                loading="lazy"
              />
            ) : (
              <div className="w-full aspect-video bg-slate-700 rounded-lg flex items-center justify-center">
                <span className="text-slate-500 text-sm">No image</span>
              </div>
            )}
          </div>

          {/* Text Column */}
          <div className={isImageLeft ? '' : 'md:col-start-1 md:row-start-1'}>
            {data.headline && (
              <h2
                className={`text-3xl md:text-4xl leading-tight mb-4 ${getFontClass(data.headline_font_family || 'Josefin Sans')}`}
                style={{
                  fontSize: data.headline_font_size,
                  color: headlineColor,
                  fontWeight: data.headline_bold ? 'bold' : 300
                }}
              >
                {data.headline}
              </h2>
            )}

            {data.content && (
              <p
                className={`text-lg leading-relaxed mb-6 whitespace-pre-wrap ${getFontClass(data.content_font_family || 'Cormorant Garamond')}`}
                style={{
                  fontSize: data.content_font_size,
                  color: contentColor
                }}
              >
                {data.content}
              </p>
            )}

            {data.cta_text && data.cta_url && (
              <a
                href={data.cta_url}
                className={`inline-block px-8 py-3 text-sm font-bold tracking-[0.15em] uppercase transition-colors ${getFontClass(data.headline_font_family || 'Josefin Sans')}`}
                style={{
                  backgroundColor: headlineColor === '#ffffff' ? '#ffffff' : headlineColor,
                  color: bgColor
                }}
              >
                {data.cta_text}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
