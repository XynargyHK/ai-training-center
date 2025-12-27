'use client'

import { useState, useEffect, Suspense } from 'react'
import { Star, Check, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ShoppingCart, Sparkles, Shield, Truck, RotateCcw, Menu, X, User, MessageCircle, Search } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Cormorant_Garamond, Josefin_Sans } from 'next/font/google'

// Elegant serif font for body text and logo
const serifFont = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
})

// Elegant geometric sans-serif for headlines (Chanel-like)
const headlineFont = Josefin_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
})

interface BusinessUnit {
  id: string
  name: string
  slug: string
}

interface MenuItem {
  label: string
  url: string
  enabled: boolean
}

interface HeroSlide {
  headline: string
  subheadline: string
  content?: string
  background_url: string
  background_type: 'image' | 'video'
  cta_text: string
  cta_url: string
  text_align?: 'left' | 'center' | 'right'
}

interface LandingPageData {
  id: string
  business_unit_id: string
  announcement_text?: string
  announcements?: string[] // Array of rotating announcements
  // Menu bar settings
  logo_url?: string
  logo_text?: string
  logo_position?: 'left' | 'center'
  menu_items?: MenuItem[]
  show_search?: boolean
  show_account?: boolean
  show_cart?: boolean
  account_url?: string
  cart_url?: string
  // Hero section
  hero_type?: 'carousel' | 'static'
  hero_slides?: HeroSlide[]
  hero_static_bg?: string
  hero_static_headline?: string
  hero_static_subheadline?: string
  hero_static_content?: string
  hero_static_cta_text?: string
  hero_static_cta_url?: string
  hero_static_align?: 'left' | 'center' | 'right'
  hero_headline: string // Legacy
  hero_subheadline?: string
  hero_product_name?: string
  hero_benefits?: string[]
  hero_cta_text?: string
  hero_image_url?: string
  clinical_results?: { value: string; label: string }[]
  tech_headline?: string
  tech_subheadline?: string
  tech_features?: { icon: string; title: string; items: string[] }[]
  performance_metrics?: { value: string; label: string }[]
  how_to_use_headline?: string
  how_to_use_steps?: { icon: string; text: string }[]
  how_to_use_footer?: string
  ingredients_headline?: string
  ingredients_subheadline?: string
  ingredients?: { icon: string; name: string; description: string; benefits: string[]; badge?: string }[]
  pricing_headline?: string
  pricing_subheadline?: string
  pricing_options?: { id: string; label: string; sessions?: number; originalPrice: number; salePrice: number; perSession?: number; discount: number; popular: boolean }[]
  show_sold_indicator?: boolean
  sold_percentage?: number
  testimonials_headline?: string
  testimonials?: { name: string; age: string; text: string; rating: number }[]
  testimonials_stats?: { recommend_pct: number; five_star_pct: number }
  landing_faqs?: { question: string; answer: string }[]
  trust_badges?: { icon: string; label: string }[]
  footer_disclaimer?: string
  primary_color?: string
  secondary_color?: string
}

function LandingPageContent() {
  const searchParams = useSearchParams()
  const businessUnitParam = searchParams.get('businessUnit') || ''

  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [selectedPricing, setSelectedPricing] = useState<string>('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [businessUnit, setBusinessUnit] = useState<BusinessUnit | null>(null)
  const [landingPage, setLandingPage] = useState<LandingPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasLandingPage, setHasLandingPage] = useState(false)

  // Announcement rotation state
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  // Hero carousel state
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0)

  // Load landing page content
  useEffect(() => {
    async function loadLandingPage() {
      if (!businessUnitParam) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/landing-page?businessUnit=${businessUnitParam}`)
        const data = await response.json()

        if (data.businessUnit) {
          setBusinessUnit(data.businessUnit)
        }
        if (data.landingPage) {
          setLandingPage(data.landingPage)
          setHasLandingPage(true)
          // Set initial pricing selection
          if (data.landingPage.pricing_options?.length > 0) {
            const popular = data.landingPage.pricing_options.find((p: { popular: boolean }) => p.popular)
            setSelectedPricing(popular?.id || data.landingPage.pricing_options[0].id)
          }
        }
      } catch (err) {
        console.error('Error loading landing page:', err)
      } finally {
        setLoading(false)
      }
    }
    loadLandingPage()
  }, [businessUnitParam])

  // Rotate announcements every 5 seconds
  useEffect(() => {
    const announcements = landingPage?.announcements || []
    if (announcements.length <= 1) return

    const interval = setInterval(() => {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentAnnouncementIndex((prev) =>
          prev >= announcements.length - 1 ? 0 : prev + 1
        )
        setIsAnimating(false)
      }, 300) // Animation duration
    }, 5000)

    return () => clearInterval(interval)
  }, [landingPage?.announcements])

  // Get announcements (use array if available, fallback to single text)
  const announcements = landingPage?.announcements?.length
    ? landingPage.announcements
    : landingPage?.announcement_text
    ? [landingPage.announcement_text]
    : []
  const currentAnnouncement = announcements[currentAnnouncementIndex] || ''

  // Build URL with businessUnit param preserved
  const buildUrl = (path: string) => {
    if (businessUnitParam) {
      return `${path}?businessUnit=${businessUnitParam}`
    }
    return path
  }

  // Navigation menu items from database or defaults
  const menuItems = landingPage?.menu_items?.filter(item => item.enabled) || []
  const navItems = menuItems.length > 0
    ? menuItems.map(item => ({
        label: item.label,
        href: item.url.startsWith('#') ? item.url : buildUrl(item.url === '#' ? '/livechat' : item.url)
      }))
    : [
        { label: 'Home', href: buildUrl('/livechat') },
        { label: 'Shop', href: buildUrl('/livechat/shop') },
      ]

  // Menu bar configuration
  const logoPosition = landingPage?.logo_position || 'left'
  const logoText = landingPage?.logo_text || businessUnit?.name || 'Shop'
  const logoUrl = landingPage?.logo_url
  const showSearch = landingPage?.show_search !== false
  const showAccount = landingPage?.show_account !== false
  const showCart = landingPage?.show_cart !== false
  const accountUrl = landingPage?.account_url || '/account'
  const cartUrl = landingPage?.cart_url || '/cart'

  const primaryColor = landingPage?.primary_color || '#4A90D9'
  const secondaryColor = landingPage?.secondary_color || '#0D1B2A'

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-black">Loading...</p>
        </div>
      </div>
    )
  }

  // If no landing page content, show generic shop redirect
  if (!hasLandingPage) {
    return (
      <div className="min-h-screen bg-white">
        {/* Simple Header */}
        <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-center h-16">
              <span className={`text-sm font-light tracking-[0.2em] uppercase text-[#0D1B2A] ${serifFont.className}`}>{businessUnit?.name || 'Shop'}</span>
            </div>
          </div>
        </header>

        {/* Welcome Section */}
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-bold text-black mb-4">
            Welcome to {businessUnit?.name || 'Our Shop'}
          </h1>
          <p className="text-xl text-black mb-8">
            Explore our products and discover what works best for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={buildUrl('/livechat/shop')}
              className="inline-flex items-center justify-center gap-2 bg-[#0D1B2A] text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-[#1a2d42] transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              Browse Products
            </Link>
            <Link
              href={buildUrl('/livechat/shop')}
              className="inline-flex items-center justify-center gap-2 border-2 border-[#0D1B2A] text-[#0D1B2A] px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-50 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Chat with AI Coach
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="py-8 px-4 bg-[#0D1B2A] text-white text-center text-sm mt-auto">
          <p className="text-black/70">&copy; 2024 {businessUnit?.name || 'Shop'}. All rights reserved.</p>
        </footer>
      </div>
    )
  }

  // Render full landing page with database content
  return (
    <div className="min-h-screen bg-white">
      {/* Announcement Bar - Rotating */}
      {announcements.length > 0 && (
        <div className="text-white text-center py-2.5 px-4 text-sm overflow-hidden" style={{ backgroundColor: secondaryColor }}>
          <div
            className={`transition-all duration-300 ${
              isAnimating ? 'opacity-0 transform -translate-y-2' : 'opacity-100 transform translate-y-0'
            }`}
          >
            <span className={`font-light tracking-[0.15em] uppercase ${headlineFont.className}`}>{currentAnnouncement}</span>
          </div>
        </div>
      )}

      {/* Header Navigation */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left side: Mobile menu button (based on logo position) + Menu items or Logo */}
            <div className="flex items-center gap-6">
              {/* Mobile menu button - position depends on logo_position */}
              {logoPosition === 'center' && (
                <button
                  className="md:hidden p-2 text-black"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              )}

              {/* Logo on left (if logo_position is 'left') */}
              {logoPosition === 'left' && (
                <Link href={buildUrl('/livechat')} className="flex items-center gap-2">
                  {logoUrl ? (
                    <img src={logoUrl} alt={logoText} className="h-5 w-auto" />
                  ) : (
                    <span className={`text-sm font-light tracking-[0.2em] uppercase ${serifFont.className}`} style={{ color: '#000000' }}>{logoText}</span>
                  )}
                </Link>
              )}

              {/* Desktop menu items */}
              <nav className="hidden md:flex items-center gap-6">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`text-black hover:opacity-80 transition-colors text-sm font-bold tracking-[0.15em] uppercase ${headlineFont.className}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Center logo (if logo_position is 'center') */}
            {logoPosition === 'center' && (
              <Link href={buildUrl('/livechat')} className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2">
                {logoUrl ? (
                  <img src={logoUrl} alt={logoText} className="h-5 w-auto" />
                ) : (
                  <span className={`text-sm font-light tracking-[0.2em] uppercase ${serifFont.className}`} style={{ color: '#000000' }}>{logoText}</span>
                )}
              </Link>
            )}

            {/* Right side: Search, Account, Cart + Mobile menu (if logo left) */}
            <div className="flex items-center gap-3">
              {/* Search */}
              {showSearch && (
                <button className="hidden md:flex items-center p-2 text-black hover:opacity-80 transition-colors">
                  <Search className="w-5 h-5" />
                </button>
              )}

              {/* Account */}
              {showAccount && (
                <Link href={buildUrl(accountUrl)} className="hidden md:flex items-center gap-1 p-2 text-black hover:opacity-80 transition-colors">
                  <User className="w-5 h-5" />
                </Link>
              )}

              {/* Cart */}
              {showCart && (
                <Link href={buildUrl(cartUrl)} className="relative p-2 text-black hover:opacity-80 transition-colors">
                  <ShoppingCart className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                    0
                  </span>
                </Link>
              )}

              {/* Mobile menu button on right (if logo_position is 'left') */}
              {logoPosition === 'left' && (
                <button
                  className="md:hidden p-2 text-black"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100">
            <nav className="flex flex-col py-4">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`px-4 py-3 text-black hover:bg-gray-50 transition-colors text-sm font-bold tracking-[0.15em] uppercase ${headlineFont.className}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              {/* Mobile account link */}
              {showAccount && (
                <Link
                  href={buildUrl(accountUrl)}
                  className={`px-4 py-3 text-black hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-bold tracking-[0.15em] uppercase ${headlineFont.className}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="w-4 h-4" />
                  My Account
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section - Carousel */}
      {(landingPage.hero_slides && landingPage.hero_slides.length > 0) && (() => {
          const heroSlides = landingPage.hero_slides
          const currentSlide = heroSlides[currentHeroSlide] || heroSlides[0]

          return (
            <section className="relative w-full h-[500px] md:h-[600px] overflow-hidden">
              {/* Background */}
              {currentSlide.background_url ? (
                currentSlide.background_type === 'video' ? (
                  <video
                    key={currentSlide.background_url}
                    src={currentSlide.background_url}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <img
                    key={currentSlide.background_url}
                    src={currentSlide.background_url}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200" />
              )}

              {/* Overlay for text readability */}
              <div className="absolute inset-0 bg-black/30" />

              {/* Content */}
              <div className={`relative z-10 h-full flex items-center ${
                currentSlide.text_align === 'left' ? 'justify-start' :
                currentSlide.text_align === 'right' ? 'justify-end' :
                'justify-center'
              }`}>
                <div className={`px-4 md:px-12 max-w-4xl ${
                  currentSlide.text_align === 'left' ? 'text-left' :
                  currentSlide.text_align === 'right' ? 'text-right' :
                  'text-center'
                }`}>
                  {currentSlide.headline && (
                    <h1 className={`text-3xl md:text-5xl lg:text-6xl font-light tracking-[0.2em] uppercase text-white leading-tight mb-4 drop-shadow-lg ${headlineFont.className}`}>
                      {currentSlide.headline}
                    </h1>
                  )}
                  {currentSlide.subheadline && (
                    <p className={`text-lg md:text-xl font-light tracking-[0.15em] uppercase text-white/90 mb-4 drop-shadow ${headlineFont.className}`}>
                      {currentSlide.subheadline}
                    </p>
                  )}
                  {currentSlide.content && (
                    <p className={`text-base md:text-lg font-light text-white/80 mb-8 drop-shadow max-w-2xl whitespace-pre-wrap ${
                      currentSlide.text_align === 'center' ? 'mx-auto' :
                      currentSlide.text_align === 'right' ? 'ml-auto' : ''
                    } ${serifFont.className}`}>
                      {currentSlide.content}
                    </p>
                  )}
                  {!currentSlide.content && currentSlide.subheadline && (
                    <div className="mb-4" />
                  )}
                  {currentSlide.cta_text && (
                    <Link
                      href={buildUrl(currentSlide.cta_url || '/livechat/shop')}
                      className={`inline-block px-8 py-3 bg-white text-black text-sm font-bold tracking-[0.15em] uppercase hover:bg-black hover:text-white transition-colors ${headlineFont.className}`}
                    >
                      {currentSlide.cta_text}
                    </Link>
                  )}
                </div>
              </div>

              {/* Navigation Arrows */}
              {heroSlides.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentHeroSlide(prev => prev === 0 ? heroSlides.length - 1 : prev - 1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center bg-white/20 hover:bg-white/40 transition-colors rounded-full backdrop-blur-sm"
                  >
                    <ChevronLeft className="w-6 h-6 text-white" />
                  </button>
                  <button
                    onClick={() => setCurrentHeroSlide(prev => prev === heroSlides.length - 1 ? 0 : prev + 1)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center bg-white/20 hover:bg-white/40 transition-colors rounded-full backdrop-blur-sm"
                  >
                    <ChevronRight className="w-6 h-6 text-white" />
                  </button>
                </>
              )}

              {/* Slide Indicators */}
              {heroSlides.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                  {heroSlides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentHeroSlide(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentHeroSlide ? 'bg-white' : 'bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              )}
            </section>
          )
        })()}

      {/* Static Text/Image Box Section */}
      {(landingPage.hero_static_headline || landingPage.hero_static_subheadline || landingPage.hero_static_content || landingPage.hero_static_bg || landingPage.hero_static_cta_text) && (
        <section className="relative w-full h-[500px] md:h-[600px] overflow-hidden">
          {/* Background */}
          {landingPage.hero_static_bg ? (
            <img
              src={landingPage.hero_static_bg}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200" />
          )}

          {/* Overlay for text readability */}
          <div className="absolute inset-0 bg-black/30" />

          {/* Content */}
          <div className={`relative z-10 h-full flex items-center ${
            landingPage.hero_static_align === 'left' ? 'justify-start' :
            landingPage.hero_static_align === 'right' ? 'justify-end' :
            'justify-center'
          }`}>
            <div className={`px-4 md:px-12 max-w-4xl ${
              landingPage.hero_static_align === 'left' ? 'text-left' :
              landingPage.hero_static_align === 'right' ? 'text-right' :
              'text-center'
            }`}>
              {landingPage.hero_static_headline && (
                <h1 className={`text-3xl md:text-5xl lg:text-6xl font-light tracking-[0.2em] uppercase text-white leading-tight mb-4 drop-shadow-lg ${headlineFont.className}`}>
                  {landingPage.hero_static_headline}
                </h1>
              )}
              {landingPage.hero_static_subheadline && (
                <p className={`text-lg md:text-xl font-light tracking-[0.15em] uppercase text-white/90 mb-4 drop-shadow ${headlineFont.className}`}>
                  {landingPage.hero_static_subheadline}
                </p>
              )}
              {landingPage.hero_static_content && (
                <p className={`text-base md:text-lg font-light text-white/80 mb-8 drop-shadow max-w-2xl whitespace-pre-wrap ${
                  landingPage.hero_static_align === 'center' ? 'mx-auto' :
                  landingPage.hero_static_align === 'right' ? 'ml-auto' : ''
                } ${serifFont.className}`}>
                  {landingPage.hero_static_content}
                </p>
              )}
              {landingPage.hero_static_cta_text && (
                <Link
                  href={buildUrl(landingPage.hero_static_cta_url || '/livechat/shop')}
                  className={`inline-block px-8 py-3 bg-white text-black text-sm font-bold tracking-[0.15em] uppercase hover:bg-black hover:text-white transition-colors ${headlineFont.className}`}
                >
                  {landingPage.hero_static_cta_text}
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Clinical Results */}
      {landingPage.clinical_results && landingPage.clinical_results.length > 0 && (
        <section className="py-16 px-4 text-white" style={{ backgroundColor: secondaryColor }}>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-serif text-center mb-12">Clinical Results</h2>
            <div className="grid grid-cols-3 gap-4 md:gap-8 text-center">
              {landingPage.clinical_results.map((result, idx) => (
                <div key={idx}>
                  <div className="text-4xl md:text-6xl font-bold" style={{ color: primaryColor }}>{result.value}</div>
                  <div className="text-sm md:text-base mt-2 text-black/60" dangerouslySetInnerHTML={{ __html: result.label.replace('\n', '<br />') }}></div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Technology Features */}
      {landingPage.tech_features && landingPage.tech_features.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            {landingPage.tech_headline && (
              <h2 className="text-2xl md:text-3xl font-serif text-center mb-4">{landingPage.tech_headline}</h2>
            )}
            {landingPage.tech_subheadline && (
              <p className="text-black text-center mb-12 max-w-2xl mx-auto">{landingPage.tech_subheadline}</p>
            )}

            <div className="grid md:grid-cols-2 gap-8">
              {landingPage.tech_features.map((feature, idx) => (
                <div key={idx} className="bg-gray-50 rounded-2xl p-8">
                  <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: `linear-gradient(to bottom right, ${primaryColor}, ${primaryColor}dd)` }}>
                    <span className="text-4xl">{feature.icon}</span>
                  </div>
                  <h3 className="text-xl font-bold text-center mb-4">{feature.title}</h3>
                  <ul className="space-y-3">
                    {feature.items.map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-green-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Performance Metrics */}
      {landingPage.performance_metrics && landingPage.performance_metrics.length > 0 && (
        <section className="py-12 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-3 gap-4 text-center">
              {landingPage.performance_metrics.map((metric, idx) => (
                <div key={idx} className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="text-3xl md:text-4xl font-bold" style={{ color: primaryColor }}>{metric.value}</div>
                  <div className="text-sm text-black mt-2" dangerouslySetInnerHTML={{ __html: metric.label.replace('\n', '<br />') }}></div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How To Use */}
      {landingPage.how_to_use_steps && landingPage.how_to_use_steps.length > 0 && (
        <section className="py-16 px-4 text-white" style={{ backgroundColor: secondaryColor }}>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-serif text-center mb-12">{landingPage.how_to_use_headline || 'How To Use'}</h2>
            <div className={`grid grid-cols-2 md:grid-cols-${Math.min(landingPage.how_to_use_steps.length, 4)} gap-6 text-center`}>
              {landingPage.how_to_use_steps.map((step, idx) => (
                <div key={idx}>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${primaryColor}33` }}>
                    <span className="text-2xl">{step.icon}</span>
                  </div>
                  <p className="text-sm">{step.text}</p>
                </div>
              ))}
            </div>
            {landingPage.how_to_use_footer && (
              <div className="flex justify-center gap-6 mt-8 text-sm text-black/60">
                {landingPage.how_to_use_footer.split('|').map((item, idx) => (
                  <span key={idx}>{item.trim()}</span>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Ingredients */}
      {landingPage.ingredients && landingPage.ingredients.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            {landingPage.ingredients_headline && (
              <h2 className="text-2xl md:text-3xl font-serif text-center mb-4">{landingPage.ingredients_headline}</h2>
            )}
            {landingPage.ingredients_subheadline && (
              <p className="text-center text-black mb-12">{landingPage.ingredients_subheadline}</p>
            )}

            <div className="space-y-6">
              {landingPage.ingredients.map((ingredient, idx) => (
                <div key={idx} className="bg-gradient-to-r from-blue-50 to-white rounded-2xl p-6 border border-blue-100">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{ingredient.icon}</div>
                    <div>
                      <h3 className="font-bold text-lg mb-2">{ingredient.name}</h3>
                      <p className="text-black text-sm mb-3">{ingredient.description}</p>
                      <ul className="text-sm text-black space-y-1">
                        {ingredient.benefits.map((benefit, i) => (
                          <li key={i}>&#8226; {benefit}</li>
                        ))}
                      </ul>
                      {ingredient.badge && (
                        <div className="mt-3 bg-blue-100 text-blue-800 text-xs px-3 py-1.5 rounded-full inline-block">
                          {ingredient.badge}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Pricing */}
      {landingPage.pricing_options && landingPage.pricing_options.length > 0 && (
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-serif text-center mb-4">{landingPage.pricing_headline || 'Pricing'}</h2>
            {landingPage.pricing_subheadline && (
              <p className="text-center text-black mb-8">{landingPage.pricing_subheadline}</p>
            )}

            <div className="space-y-4">
              {landingPage.pricing_options.map((option) => (
                <div
                  key={option.id}
                  onClick={() => setSelectedPricing(option.id)}
                  className={`relative bg-white rounded-2xl p-6 cursor-pointer transition-all ${
                    selectedPricing === option.id
                      ? 'ring-2 shadow-lg'
                      : 'border border-gray-200 hover:border-opacity-50'
                  }`}
                  style={selectedPricing === option.id ? { '--tw-ring-color': primaryColor } as React.CSSProperties : {}}
                >
                  {option.popular && (
                    <div className="absolute -top-3 left-6 text-white text-xs px-3 py-1 rounded-full" style={{ backgroundColor: primaryColor }}>
                      MOST POPULAR
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg">{option.label}</h3>
                      {option.sessions && <p className="text-black/70 text-sm">{option.sessions} sessions</p>}
                    </div>
                    <div className="text-right">
                      {option.discount > 0 && (
                        <span className="text-black/50 line-through text-sm">${option.originalPrice}</span>
                      )}
                      <div className="text-2xl font-bold">${option.salePrice}</div>
                      {option.perSession && <p className="text-xs text-black/70">${option.perSession}/session</p>}
                    </div>
                  </div>
                  {option.discount > 0 && (
                    <div className="mt-3 bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full inline-block">
                      Save {option.discount}%
                    </div>
                  )}
                </div>
              ))}
            </div>

            {landingPage.show_sold_indicator && landingPage.sold_percentage && landingPage.sold_percentage > 0 && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-red-600">
                  <span className="text-2xl">&#128293;</span>
                  <span className="font-semibold">{landingPage.sold_percentage}% Sold</span>
                </div>
                <div className="w-full bg-red-200 rounded-full h-2 mt-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{width: `${landingPage.sold_percentage}%`}}></div>
                </div>
              </div>
            )}

            <Link
              href={buildUrl('/livechat/shop')}
              className="w-full mt-6 text-white py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition-colors flex items-center justify-center gap-2"
              style={{ backgroundColor: secondaryColor }}
            >
              <ShoppingCart className="w-5 h-5" />
              Buy Now {selectedPricing && landingPage.pricing_options.find(o => o.id === selectedPricing)?.discount
                ? `- Save ${landingPage.pricing_options.find(o => o.id === selectedPricing)?.discount}%`
                : ''}
            </Link>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {landingPage.testimonials && landingPage.testimonials.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-serif text-center mb-4">{landingPage.testimonials_headline || 'Customer Reviews'}</h2>
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className="flex">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-black">4.89 average</span>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {landingPage.testimonials.map((testimonial, i) => (
                <div key={i} className="bg-gray-50 rounded-2xl p-6">
                  <div className="flex mb-3">
                    {[1,2,3,4,5].map(j => (
                      <Star key={j} className={`w-4 h-4 ${j <= testimonial.rating ? 'fill-yellow-400 text-yellow-400' : 'text-black/60'}`} />
                    ))}
                  </div>
                  <p className="text-black mb-4">&quot;{testimonial.text}&quot;</p>
                  <p className="text-sm text-black/70">&mdash; {testimonial.name}, {testimonial.age}</p>
                </div>
              ))}
            </div>

            {landingPage.testimonials_stats && (
              <div className="mt-8 text-center">
                <div className="inline-flex gap-8 text-sm text-black">
                  {landingPage.testimonials_stats.recommend_pct && (
                    <span><strong>{landingPage.testimonials_stats.recommend_pct}%</strong> Recommend</span>
                  )}
                  {landingPage.testimonials_stats.five_star_pct && (
                    <span><strong>{landingPage.testimonials_stats.five_star_pct}%</strong> 5-Star Reviews</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* FAQ */}
      {landingPage.landing_faqs && landingPage.landing_faqs.length > 0 && (
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-serif text-center mb-12">Frequently Asked Questions</h2>

            <div className="space-y-4">
              {landingPage.landing_faqs.map((faq, i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left"
                  >
                    <span className="font-medium">{faq.question}</span>
                    {openFaq === i ? (
                      <ChevronUp className="w-5 h-5 text-black/50" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-black/50" />
                    )}
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-4 text-black text-sm">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trust Badges */}
      {landingPage.trust_badges && landingPage.trust_badges.length > 0 && (
        <section className="py-8 px-4 border-t">
          <div className="max-w-4xl mx-auto">
            <div className={`grid grid-cols-2 md:grid-cols-${Math.min(landingPage.trust_badges.length, 4)} gap-4 text-center text-sm`}>
              {landingPage.trust_badges.map((badge, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-xl">{badge.icon}</span>
                  </div>
                  <span className="text-black">{badge.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-8 px-4 text-white text-center text-sm" style={{ backgroundColor: secondaryColor }}>
        {landingPage.footer_disclaimer && (
          <p className="text-black/50 mb-4">
            {landingPage.footer_disclaimer}
          </p>
        )}
        <p className="text-black/70">&copy; 2024 {businessUnit?.name || 'Shop'}. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default function LandingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>}>
      <LandingPageContent />
    </Suspense>
  )
}
