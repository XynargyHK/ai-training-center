import { getFontClass } from '@/lib/fonts'
import { headlineFont, serifFont } from '@/lib/fonts'
import HeroCarousel from './HeroCarousel'
import BlockRendererSSR from './BlockRendererSSR'
import LandingPageFooterSSR from './LandingPageFooterSSR'
import ChatFloatingButton from './ChatFloatingButton'
import LanguageSwitcherSSR from './LanguageSwitcherSSR'
import MobileMenuSSR from './MobileMenuSSR'

interface LandingPageSSRProps {
  landingPage: any
  businessUnit: { id: string; name: string; slug: string } | null
  country: string
  lang: string
  availableLocales: { country: string; language_code: string }[]
  aiStaffList: { id: string; name: string; role: string }[]
  pageSlug?: string
}

function getAlignClass(align: string | undefined, fallback = 'center') {
  const a = align || fallback
  return a === 'left' ? 'text-left' : a === 'right' ? 'text-right' : 'text-center'
}

function HeroSlideContent({ slide, isFirst }: { slide: any; isFirst: boolean }) {
  const HeadlineTag = isFirst ? 'h1' : 'h2'

  return (
    <section className="relative w-full h-[500px] md:h-[600px] overflow-hidden">
      {/* Background color fallback */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: slide.background_color || '#1e293b' }}
      />
      {/* Background media */}
      {slide.background_url && (
        slide.background_type === 'video' ? (
          <video
            src={slide.background_url}
            poster={slide.poster_url}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <img
            src={slide.background_url}
            alt=""
            loading={isFirst ? 'eager' : 'lazy'}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )
      )}
      {/* Overlay */}
      {slide.background_url && <div className="absolute inset-0 bg-black/30" />}

      {/* Content */}
      <div className="relative z-10 h-full flex items-center justify-center">
        <div className="px-4 md:px-12 max-w-4xl w-full">
          {slide.headline && (
            <HeadlineTag
              className={`font-light tracking-[0.2em] uppercase leading-tight mb-4 drop-shadow-lg ${getFontClass(slide.headline_font_family)} ${getAlignClass(slide.headline_text_align)}`}
              style={{
                fontSize: slide.headline_font_size || 'clamp(1.875rem, 5vw, 3.75rem)',
                color: slide.headline_color || '#ffffff',
                fontWeight: slide.headline_bold ? 'bold' : undefined,
                fontStyle: slide.headline_italic ? 'italic' : undefined
              }}
            >
              {slide.headline}
            </HeadlineTag>
          )}
          {slide.subheadline && (
            <p
              className={`font-light tracking-[0.15em] uppercase mb-4 drop-shadow ${getFontClass(slide.subheadline_font_family)} ${getAlignClass(slide.subheadline_text_align)}`}
              style={{
                fontSize: slide.subheadline_font_size || 'clamp(1.125rem, 2.5vw, 1.25rem)',
                color: slide.subheadline_color || '#ffffff',
                fontWeight: slide.subheadline_bold ? 'bold' : undefined,
                fontStyle: slide.subheadline_italic ? 'italic' : undefined
              }}
            >
              {slide.subheadline}
            </p>
          )}
          {slide.content && (
            <p
              className={`font-light mb-8 drop-shadow max-w-2xl whitespace-pre-wrap ${getFontClass(slide.content_font_family)} ${
                (slide.content_text_align || 'center') === 'left' ? 'text-left' :
                (slide.content_text_align || 'center') === 'right' ? 'text-right mr-0 ml-auto' :
                'text-center mx-auto'
              }`}
              style={{
                fontSize: slide.content_font_size || 'clamp(1rem, 2vw, 1.125rem)',
                color: slide.content_color || '#ffffff',
                fontWeight: slide.content_bold ? 'bold' : undefined,
                fontStyle: slide.content_italic ? 'italic' : undefined
              }}
            >
              {slide.content}
            </p>
          )}
          {!slide.content && slide.subheadline && <div className="mb-4" />}
          {slide.cta_text && (
            <div className={getAlignClass(slide.content_text_align)}>
              <a
                href={slide.cta_url || '#'}
                className={`inline-block px-8 py-3 bg-white text-black text-sm font-bold tracking-[0.15em] uppercase hover:bg-black hover:text-white transition-colors ${headlineFont.className}`}
              >
                {slide.cta_text}
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function StaticBannerSlide({ slide }: { slide: any }) {
  return (
    <section className="relative w-full pt-8 pb-4 md:pt-12 md:pb-6 overflow-hidden">
      {slide.background_url ? (
        slide.background_type === 'video' ? (
          <video
            src={slide.background_url}
            poster={slide.poster_url}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <img
            src={slide.background_url}
            alt=""
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )
      ) : (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: slide.background_color || '#1e293b' }}
        />
      )}
      {slide.background_url && <div className="absolute inset-0 bg-black/30" />}

      <div className="relative z-10 h-full flex items-center justify-center">
        <div className="px-4 md:px-12 max-w-4xl w-full">
          {slide.headline && (
            <h2
              className={`font-light tracking-[0.2em] uppercase leading-tight mb-4 drop-shadow-lg ${getFontClass(slide.headline_font_family)} ${getAlignClass(slide.headline_text_align)}`}
              style={{
                fontSize: slide.headline_font_size || 'clamp(1.875rem, 5vw, 3.75rem)',
                color: slide.headline_color || '#ffffff',
                fontWeight: slide.headline_bold ? 'bold' : undefined,
                fontStyle: slide.headline_italic ? 'italic' : undefined
              }}
            >
              {slide.headline}
            </h2>
          )}
          {slide.subheadline && (
            <p
              className={`font-light tracking-[0.15em] uppercase mb-4 drop-shadow ${getFontClass(slide.subheadline_font_family)} ${getAlignClass(slide.subheadline_text_align)}`}
              style={{
                fontSize: slide.subheadline_font_size || 'clamp(1.125rem, 2.5vw, 1.25rem)',
                color: slide.subheadline_color || '#ffffff',
                fontWeight: slide.subheadline_bold ? 'bold' : undefined,
                fontStyle: slide.subheadline_italic ? 'italic' : undefined
              }}
            >
              {slide.subheadline}
            </p>
          )}
          {slide.content && (
            <p
              className={`font-light mb-8 drop-shadow max-w-2xl whitespace-pre-wrap ${getFontClass(slide.content_font_family)} ${
                (slide.content_text_align || 'center') === 'left' ? 'text-left' :
                (slide.content_text_align || 'center') === 'right' ? 'text-right mr-0 ml-auto' :
                'text-center mx-auto'
              }`}
              style={{
                fontSize: slide.content_font_size || 'clamp(1rem, 2vw, 1.125rem)',
                color: slide.content_color || '#ffffff',
                fontWeight: slide.content_bold ? 'bold' : undefined,
                fontStyle: slide.content_italic ? 'italic' : undefined
              }}
            >
              {slide.content}
            </p>
          )}
          {!slide.content && slide.subheadline && <div className="mb-4" />}
          {slide.cta_text && (
            <div className={getAlignClass(slide.content_text_align)}>
              <a
                href={slide.cta_url || '#'}
                className={`inline-block px-8 py-3 bg-white text-black text-sm font-bold tracking-[0.15em] uppercase hover:bg-black hover:text-white transition-colors ${headlineFont.className}`}
              >
                {slide.cta_text}
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default function LandingPageSSR({
  landingPage,
  businessUnit,
  country,
  lang,
  availableLocales,
  aiStaffList,
  pageSlug
}: LandingPageSSRProps) {
  if (!landingPage) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Page not found</p>
      </div>
    )
  }

  const secondaryColor = landingPage.secondary_color || '#0D1B2A'
  const logoUrl = landingPage.logo_url || ''
  const logoText = landingPage.logo_text || businessUnit?.name || 'Shop'
  const logoPosition = landingPage.logo_position || 'center'
  const menuItems = (landingPage.menu_items || []).filter((item: any) => item.enabled)
  const showSearch = landingPage.show_search !== false
  const showCart = landingPage.show_cart !== false

  // Announcements
  const announcements = landingPage.announcements?.length
    ? landingPage.announcements
    : landingPage.announcement_text
    ? [landingPage.announcement_text]
    : []

  // Hero slides
  const heroSlides = landingPage.hero_slides || []
  const carouselSlides = heroSlides.filter((s: any) => s.is_carousel !== false)
  const staticSlides = heroSlides.filter((s: any) => s.is_carousel === false)

  // Language filtering for this country
  const languagesForCountry = availableLocales.filter(
    (l) => l.country === country
  )

  // Country route path
  const countryPath = `/${country.toLowerCase()}`

  // Build navigation items from menu
  const navItems = menuItems.map((item: any) => {
    let href = item.url || '#'
    if (href.startsWith('#')) {
      // Keep anchor links as-is
    } else if (!href.startsWith('http')) {
      href = `${countryPath}${href.startsWith('/') ? '' : '/'}${href}`
    }
    return { label: item.label, href }
  })

  return (
    <div className="min-h-screen bg-white">
      {/* Announcement Bar */}
      {announcements.length > 0 && (
        <div
          className="text-white text-center py-2.5 px-4 text-sm overflow-hidden"
          style={{ backgroundColor: secondaryColor }}
        >
          <span className={`font-light tracking-[0.15em] uppercase ${headlineFont.className}`}>
            {announcements[0]}
          </span>
        </div>
      )}

      {/* Header Navigation */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm relative">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left side */}
            <div className="flex items-center gap-6">
              {/* Mobile hamburger menu */}
              <MobileMenuSSR
                navItems={navItems}
                languages={languagesForCountry}
                currentLang={lang}
                countryPath={countryPath}
              />

              {logoPosition === 'left' && (
                <a href={countryPath} className="flex items-center gap-2">
                  {logoUrl ? (
                    <img src={logoUrl} alt={logoText} className="h-5 w-auto" />
                  ) : (
                    <span className={`text-sm font-light tracking-[0.2em] uppercase ${serifFont.className}`} style={{ color: '#000000' }}>{logoText}</span>
                  )}
                </a>
              )}

              {/* Desktop menu */}
              <nav className="hidden md:flex items-center gap-6">
                {navItems.map((item: any) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className={`text-black hover:opacity-80 transition-colors text-sm font-bold tracking-[0.15em] uppercase ${headlineFont.className}`}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>

            {/* Center logo */}
            {logoPosition === 'center' && (
              <a href={countryPath} className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2">
                {logoUrl ? (
                  <img src={logoUrl} alt={logoText} className="h-5 w-auto" />
                ) : (
                  <span className={`text-sm font-light tracking-[0.2em] uppercase ${serifFont.className}`} style={{ color: '#000000' }}>{logoText}</span>
                )}
              </a>
            )}

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* Language Switcher — desktop only (mobile has it in hamburger menu) */}
              {languagesForCountry.length > 1 && (
                <div className="hidden md:block">
                  <LanguageSwitcherSSR
                    languages={languagesForCountry}
                    currentLang={lang}
                    countryPath={countryPath}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Carousel */}
      {carouselSlides.length > 0 && (
        carouselSlides.length === 1 ? (
          <HeroSlideContent slide={carouselSlides[0]} isFirst={true} />
        ) : (
          <HeroCarousel autoplay autoplayInterval={5000}>
            {carouselSlides.map((slide: any, i: number) => (
              <HeroSlideContent key={i} slide={slide} isFirst={i === 0} />
            ))}
          </HeroCarousel>
        )
      )}

      {/* Static Hero Banners */}
      {staticSlides.length > 0 && staticSlides.map((slide: any, i: number) => (
        <StaticBannerSlide key={i} slide={slide} />
      ))}

      {/* Dynamic Blocks */}
      {landingPage.blocks && landingPage.blocks.length > 0 && (
        <BlockRendererSSR blocks={landingPage.blocks} />
      )}

      {/* Footer */}
      <LandingPageFooterSSR
        data={landingPage.footer}
        businessUnitName={businessUnit?.name}
        country={country}
        language={lang}
        countryPath={countryPath}
      />

      {/* Floating Chat Button — client-only, ssr:false so no HTML emitted for crawlers */}
      <ChatFloatingButton
        businessUnit={businessUnit?.slug || 'skincoach'}
        country={country}
        lang={lang}
        aiStaffList={aiStaffList}
        enableSocialLogin={landingPage.enable_social_login}
      />
    </div>
  )
}
