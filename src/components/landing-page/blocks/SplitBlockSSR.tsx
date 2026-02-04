import type { SplitBlockData } from '@/types/landing-page-blocks'
import { getFontClass } from '@/lib/fonts'

interface SplitBlockSSRProps {
  data: SplitBlockData
  anchorId?: string
}

export default function SplitBlockSSR({ data, anchorId }: SplitBlockSSRProps) {
  const isImageLeft = data.layout === 'image-left'

  return (
    <div id={anchorId} className="w-full py-16 px-4 bg-gradient-to-b from-slate-900 to-slate-800">
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
              <h2 className={`text-3xl md:text-4xl font-light tracking-[0.2em] uppercase leading-tight text-white mb-4 ${getFontClass('Josefin Sans')}`}>
                {data.headline}
              </h2>
            )}

            {data.content && (
              <p className={`text-lg font-light text-slate-300 leading-relaxed mb-6 whitespace-pre-wrap ${getFontClass('Cormorant Garamond')}`}>
                {data.content}
              </p>
            )}

            {data.cta_text && data.cta_url && (
              <a
                href={data.cta_url}
                className={`inline-block px-8 py-3 bg-white text-black text-sm font-bold tracking-[0.15em] uppercase hover:bg-black hover:text-white transition-colors ${getFontClass('Josefin Sans')}`}
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
