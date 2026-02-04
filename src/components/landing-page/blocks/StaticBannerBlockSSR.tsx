import { getFontClass } from '@/lib/fonts'

interface StaticBannerBlockData {
  background_url?: string
  background_type?: 'image' | 'video'
  background_color?: string
  video_poster?: string
  headline?: string
  headline_font_size?: string
  headline_font_family?: string
  headline_color?: string
  headline_bold?: boolean
  headline_italic?: boolean
  headline_text_align?: 'left' | 'center' | 'right'
  subheadline?: string
  subheadline_font_size?: string
  subheadline_font_family?: string
  subheadline_color?: string
  subheadline_bold?: boolean
  subheadline_italic?: boolean
  subheadline_text_align?: 'left' | 'center' | 'right'
  content?: string
  content_font_size?: string
  content_font_family?: string
  content_color?: string
  content_bold?: boolean
  content_italic?: boolean
  content_text_align?: 'left' | 'center' | 'right'
  cta_text?: string
  cta_url?: string
}

interface StaticBannerBlockSSRProps {
  data: StaticBannerBlockData
  anchorId?: string
}

export default function StaticBannerBlockSSR({ data, anchorId }: StaticBannerBlockSSRProps) {
  return (
    <section id={anchorId} className="relative w-full min-h-[200px] md:min-h-[300px] pt-8 pb-4 md:pt-12 md:pb-6 overflow-hidden">
      {data.background_url ? (
        data.background_type === 'video' ? (
          <video
            src={data.background_url}
            poster={data.video_poster}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <img
            src={data.background_url}
            alt=""
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )
      ) : (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: data.background_color || '#1e293b' }}
        />
      )}

      {data.background_url && <div className="absolute inset-0 bg-black/30" />}

      <div className="relative z-10 h-full flex items-center justify-center">
        <div className="px-4 md:px-12 max-w-4xl w-full">
          {data.headline && (
            <h2
              className={`font-light tracking-[0.2em] uppercase leading-tight mb-4 drop-shadow-lg ${getFontClass(data.headline_font_family)} ${
                (data.headline_text_align || 'center') === 'left' ? 'text-left' :
                (data.headline_text_align || 'center') === 'right' ? 'text-right' :
                'text-center'
              }`}
              style={{
                fontSize: data.headline_font_size || 'clamp(1.875rem, 5vw, 3.75rem)',
                color: data.headline_color || '#ffffff',
                fontWeight: data.headline_bold ? 'bold' : undefined,
                fontStyle: data.headline_italic ? 'italic' : undefined
              }}
            >
              {data.headline}
            </h2>
          )}
          {data.subheadline && (
            <p
              className={`font-light tracking-[0.15em] uppercase mb-4 drop-shadow ${getFontClass(data.subheadline_font_family)} ${
                (data.subheadline_text_align || 'center') === 'left' ? 'text-left' :
                (data.subheadline_text_align || 'center') === 'right' ? 'text-right' :
                'text-center'
              }`}
              style={{
                fontSize: data.subheadline_font_size || 'clamp(1.125rem, 2.5vw, 1.25rem)',
                color: data.subheadline_color || '#ffffff',
                fontWeight: data.subheadline_bold ? 'bold' : undefined,
                fontStyle: data.subheadline_italic ? 'italic' : undefined
              }}
            >
              {data.subheadline}
            </p>
          )}
          {data.content && (
            <p
              className={`font-light mb-8 drop-shadow max-w-2xl whitespace-pre-wrap ${getFontClass(data.content_font_family)} ${
                (data.content_text_align || 'center') === 'left' ? 'text-left' :
                (data.content_text_align || 'center') === 'right' ? 'text-right mr-0 ml-auto' :
                'text-center mx-auto'
              }`}
              style={{
                fontSize: data.content_font_size || 'clamp(1rem, 2vw, 1.125rem)',
                color: data.content_color || '#ffffff',
                fontWeight: data.content_bold ? 'bold' : undefined,
                fontStyle: data.content_italic ? 'italic' : undefined
              }}
            >
              {data.content}
            </p>
          )}
          {!data.content && data.subheadline && <div className="mb-4" />}
          {data.cta_text && (
            <div className={`${
              (data.content_text_align || 'center') === 'left' ? 'text-left' :
              (data.content_text_align || 'center') === 'right' ? 'text-right' :
              'text-center'
            }`}>
              <a
                href={data.cta_url || '#'}
                className={`inline-block px-8 py-3 bg-white text-black text-sm font-bold tracking-[0.15em] uppercase hover:bg-black hover:text-white transition-colors ${getFontClass(data.headline_font_family)}`}
              >
                {data.cta_text}
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
