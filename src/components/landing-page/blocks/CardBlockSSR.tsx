import { getFontClass } from '@/lib/fonts'

interface CardItem {
  image_url?: string
  title?: string
  content?: string
  badge?: string
  rating?: number
  author?: string
}

interface CardBlockData {
  heading?: string
  heading_font_size?: string
  heading_font_family?: string
  heading_color?: string
  heading_align?: 'left' | 'center' | 'right'
  heading_bold?: boolean
  heading_italic?: boolean
  subheading?: string
  subheading_font_size?: string
  subheading_font_family?: string
  subheading_color?: string
  layout?: 'grid-2' | 'grid-3' | 'grid-4' | 'carousel'
  bg_color?: string
  cards?: CardItem[]
}

interface CardBlockSSRProps {
  data: CardBlockData
  anchorId?: string
  heading?: string
}

export default function CardBlockSSR({ data, anchorId, heading }: CardBlockSSRProps) {
  const cards = data.cards || []
  const displayHeading = data.heading || heading || ''
  const layout = data.layout || 'grid-3'

  const gridClass =
    layout === 'grid-2' ? 'grid-cols-1 md:grid-cols-2' :
    layout === 'grid-4' ? 'grid-cols-2 md:grid-cols-4' :
    'grid-cols-1 md:grid-cols-3'

  if (cards.length === 0) return null

  return (
    <section
      id={anchorId}
      className="py-16 px-4"
      style={{ backgroundColor: data.bg_color || '#ffffff' }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        {displayHeading && (
          <h2
            className={`leading-tight mb-4 ${getFontClass(data.heading_font_family)}`}
            style={{
              fontSize: data.heading_font_size || '2.25rem',
              color: data.heading_color || '#111827',
              textAlign: data.heading_align || 'center',
              fontWeight: data.heading_bold ? 'bold' : undefined,
              fontStyle: data.heading_italic ? 'italic' : undefined
            }}
          >
            {displayHeading}
          </h2>
        )}

        {/* Subheading */}
        {data.subheading && (
          <p
            className={`mb-12 ${getFontClass(data.subheading_font_family)}`}
            style={{
              fontSize: data.subheading_font_size || '1.125rem',
              color: data.subheading_color || '#6b7280',
              textAlign: data.heading_align || 'center'
            }}
          >
            {data.subheading}
          </p>
        )}

        {/* Cards Grid */}
        <div className={`grid ${gridClass} gap-6`}>
          {cards.map((card, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow overflow-hidden border border-gray-100"
            >
              {/* Card Image */}
              {card.image_url && (
                <div className="w-full aspect-video overflow-hidden">
                  <img
                    src={card.image_url}
                    alt={card.title || ''}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Card Content */}
              <div className="p-5">
                {/* Badge */}
                {card.badge && (
                  <span className="inline-block bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
                    {card.badge}
                  </span>
                )}

                {/* Title */}
                {card.title && (
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {card.title}
                  </h3>
                )}

                {/* Content */}
                {card.content && (
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {card.content}
                  </p>
                )}

                {/* Rating */}
                {card.rating && card.rating > 0 && (
                  <div className="flex items-center mt-3">
                    {Array.from({ length: card.rating }, (_, i) => (
                      <span key={i} className="text-yellow-400 text-sm">&#9733;</span>
                    ))}
                  </div>
                )}

                {/* Author */}
                {card.author && (
                  <p className="text-gray-500 text-xs mt-2">{card.author}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
