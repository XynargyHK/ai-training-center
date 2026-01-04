'use client'

import { useState, useEffect, Suspense } from 'react'
import { Star, Check, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ShoppingCart, Sparkles, Shield, Truck, RotateCcw, Menu, X, User, Search, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { serifFont, headlineFont, getFontClass } from '@/lib/fonts'
import BlockRenderer from '@/components/landing-page/BlockRenderer'
import CheckoutModal from '@/components/shop/checkout-modal'
import AICoach from '@/components/ui/ai-coach'

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

interface PricingPlan {
  title: string
  original_price: number
  discounted_price: number
  popular?: boolean
  product_id?: string // Link to actual product in database
}

interface HeroSlide {
  headline: string
  subheadline: string
  content?: string
  background_url: string
  background_type: 'image' | 'video'
  background_color?: string // Fallback background color when no image/video
  cta_text: string
  cta_url: string
  text_align?: 'left' | 'center' | 'right'
  is_carousel?: boolean // If true, show in carousel; if false, show as static banner below
  headline_font_size?: string
  headline_font_family?: string
  subheadline_font_size?: string
  subheadline_font_family?: string
  content_font_size?: string
  content_font_family?: string
  // Price Banner fields
  is_price_banner?: boolean // If true, render as pricing table
  features?: string[] // Product features (uses content field styling)
  plans?: PricingPlan[] // Pricing plans
  currency_symbol?: string
  plan_heading?: string // "Choose Your Plan" heading
  plan_heading_font_size?: string
  plan_heading_font_family?: string
  plan_heading_color?: string
  // Price display styling
  price_font_size?: string
  price_font_family?: string
  price_color?: string
  // Plan title styling (radio button labels)
  plan_title_font_size?: string
  plan_title_font_family?: string
  plan_title_color?: string
  // Additional text styling fields for price banner
  headline_color?: string
  headline_bold?: boolean
  headline_italic?: boolean
  headline_text_align?: 'left' | 'center' | 'right'
  subheadline_color?: string
  subheadline_bold?: boolean
  subheadline_italic?: boolean
  subheadline_text_align?: 'left' | 'center' | 'right'
  content_color?: string
  content_bold?: boolean
  content_italic?: boolean
  content_text_align?: 'left' | 'center' | 'right'
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
  hero_static_headline_font_size?: string
  hero_static_headline_font_family?: string
  hero_static_subheadline_font_size?: string
  hero_static_subheadline_font_family?: string
  hero_static_content_font_size?: string
  hero_static_content_font_family?: string
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

// Price Banner Component
function PriceBannerContent({ slide, onAddToCart }: { slide: HeroSlide; onAddToCart: (product: any) => void }) {
  const searchParams = useSearchParams()
  const businessUnitParam = searchParams.get('businessUnit') || ''
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0)

  const plans = slide.plans || []
  const features = slide.features || []
  const selectedPlan = plans[selectedPlanIndex] || plans[0] || {
    title: '',
    original_price: 0,
    discounted_price: 0
  }

  // Calculate discount percentage
  const discountPercentage = selectedPlan.original_price > 0
    ? Math.round(((selectedPlan.original_price - selectedPlan.discounted_price) / selectedPlan.original_price) * 100)
    : 0

  const currencySymbol = slide.currency_symbol || '$'

  // Add selected plan to cart
  const handleAddToCart = async () => {
    let planProduct

    // If plan has product_id, fetch actual product data
    if (selectedPlan.product_id) {
      try {
        const response = await fetch(`/api/shop/products?businessUnit=${businessUnitParam}`)
        const data = await response.json()
        const product = data.products?.find((p: any) => p.id === selectedPlan.product_id)

        if (product) {
          planProduct = {
            id: product.id,
            title: product.title,
            description: product.description || '',
            cost_price: selectedPlan.discounted_price, // Use plan pricing
            compare_at_price: selectedPlan.original_price,
            thumbnail: product.thumbnail || '',
          }
        }
      } catch (error) {
        console.error('Error fetching product:', error)
      }
    }

    // Fallback: Create a product object from the selected plan
    if (!planProduct) {
      planProduct = {
        id: `plan-${selectedPlanIndex}`,
        title: selectedPlan.title,
        description: slide.features?.join(', ') || '',
        cost_price: selectedPlan.discounted_price,
        compare_at_price: selectedPlan.original_price,
        thumbnail: slide.background_url || '',
      }
    }

    onAddToCart(planProduct)
  }

  return (
    <div className="px-4 md:px-12 max-w-2xl w-full">
      {/* Product Name (Headline) */}
      {slide.headline && (
        <h2
          className={`text-center font-light tracking-[0.2em] uppercase leading-tight mb-6 ${getFontClass(slide.headline_font_family)}`}
          style={{
            fontSize: slide.headline_font_size || 'clamp(1.875rem, 5vw, 2.5rem)',
            color: slide.headline_color || '#000000',
            fontWeight: slide.headline_bold ? 'bold' : undefined,
            fontStyle: slide.headline_italic ? 'italic' : undefined
          }}
        >
          {slide.headline}
        </h2>
      )}

      {/* Pricing Display - Discounted LEFT, Original RIGHT */}
      <div className="flex items-center justify-center gap-4 mb-6">
        {/* Discounted Price */}
        <div
          className={`font-bold ${getFontClass(slide.price_font_family)}`}
          style={{
            fontSize: slide.price_font_size || '2.5rem',
            color: slide.price_color || slide.headline_color || '#000000'
          }}
        >
          {currencySymbol}{selectedPlan.discounted_price}
        </div>

        {/* Original Price (Strikethrough) */}
        {selectedPlan.original_price > selectedPlan.discounted_price && (
          <div
            className={`line-through ${getFontClass(slide.price_font_family)}`}
            style={{
              fontSize: slide.price_font_size ? `calc(${slide.price_font_size} * 0.6)` : '1.5rem',
              color: slide.subheadline_color || '#6b7280'
            }}
          >
            {currencySymbol}{selectedPlan.original_price}
          </div>
        )}
      </div>

      {/* Features (using Content styling) */}
      {features.length > 0 && (
        <ul className="space-y-2 mb-8 max-w-md mx-auto">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span
                className={`font-light ${getFontClass(slide.content_font_family)}`}
                style={{
                  fontSize: slide.content_font_size || 'clamp(1rem, 2vw, 1.125rem)',
                  color: slide.content_color || '#374151',
                  fontWeight: slide.content_bold ? 'bold' : undefined,
                  fontStyle: slide.content_italic ? 'italic' : undefined
                }}
              >
                {feature}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Plan Heading (Subheadline styling) */}
      {slide.plan_heading && (
        <h3
          className={`text-center font-light tracking-[0.15em] uppercase mb-4 ${getFontClass(slide.plan_heading_font_family || slide.subheadline_font_family)}`}
          style={{
            fontSize: slide.plan_heading_font_size || slide.subheadline_font_size || 'clamp(1.125rem, 2.5vw, 1.25rem)',
            color: slide.plan_heading_color || slide.subheadline_color || '#000000',
          }}
        >
          {slide.plan_heading}
        </h3>
      )}

      {/* Plan Options - Radio Buttons */}
      {plans.length > 0 && (
        <div className="space-y-3 mb-6">
          {plans.map((plan, index) => (
            <label
              key={index}
              className={`relative flex items-center gap-3 p-4 border-2 cursor-pointer transition-all ${
                selectedPlanIndex === index
                  ? 'border-black bg-gray-100'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              onClick={() => setSelectedPlanIndex(index)}
            >
              {/* Most Popular Badge */}
              {plan.popular && (
                <div className={`absolute -top-2.5 right-4 bg-black text-white text-xs px-3 py-1 rounded-full font-semibold tracking-wider ${getFontClass(slide.subheadline_font_family)}`}>
                  MOST POPULAR
                </div>
              )}

              {/* Radio Button */}
              <input
                type="radio"
                name="pricing-plan"
                checked={selectedPlanIndex === index}
                onChange={() => setSelectedPlanIndex(index)}
                className="w-5 h-5 text-violet-600 focus:ring-violet-500"
              />

              {/* Plan Title */}
              <span
                className={`flex-1 font-medium ${getFontClass(slide.plan_title_font_family)}`}
                style={{
                  fontSize: slide.plan_title_font_size || '1rem',
                  color: slide.plan_title_color || slide.content_color || '#1f2937'
                }}
              >
                {plan.title}
              </span>
            </label>
          ))}
        </div>
      )}

      {/* CTA Button with Auto-Calculated Discount */}
      {slide.cta_text && (
        <div className="text-center">
          <button
            onClick={handleAddToCart}
            className={`px-8 py-4 bg-black hover:bg-gray-800 text-white font-bold text-lg transition-colors shadow-lg tracking-wider uppercase ${getFontClass(slide.headline_font_family)}`}
          >
            {slide.cta_text} {discountPercentage > 0 && `${discountPercentage}%`}
          </button>
        </div>
      )}
    </div>
  )
}

interface CartItem {
  product: {
    id: string
    title: string
    description?: string
    cost_price?: number
    compare_at_price?: number
    thumbnail?: string
  }
  quantity: number
}

interface AIStaff {
  id: string
  name: string
  role: 'coach' | 'sales' | 'customer-service' | 'scientist'
  createdAt: Date
  trainingMemory: {[key: string]: string[]}
  totalSessions: number
}

function LandingPageContent() {
  const searchParams = useSearchParams()
  const businessUnitParam = searchParams.get('businessUnit') || ''
  const countryParam = searchParams.get('country') || 'US'
  const langParam = searchParams.get('lang') || searchParams.get('language') || 'en'

  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [selectedPricing, setSelectedPricing] = useState<string>('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [businessUnit, setBusinessUnit] = useState<BusinessUnit | null>(null)
  const [landingPage, setLandingPage] = useState<LandingPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasLandingPage, setHasLandingPage] = useState(false)

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCartSidebar, setShowCartSidebar] = useState(false)
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)

  // AI Staff state
  const [aiStaffList, setAiStaffList] = useState<AIStaff[]>([])

  // Announcement rotation state
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  // Hero carousel state
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0)

  // Load cart from localStorage
  useEffect(() => {
    if (!businessUnitParam) return
    const savedCart = localStorage.getItem(`shop_cart_${businessUnitParam}`)
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart))
      } catch (e) {
        console.error('Error loading cart:', e)
      }
    }
  }, [businessUnitParam])

  // Save cart to localStorage
  useEffect(() => {
    if (businessUnitParam) {
      localStorage.setItem(`shop_cart_${businessUnitParam}`, JSON.stringify(cart))
    }
  }, [cart, businessUnitParam])

  // Auto-scroll hero carousel every 5 seconds
  useEffect(() => {
    const heroSlides = landingPage?.hero_slides || []
    // Only auto-scroll carousel slides
    const carouselSlides = heroSlides.filter(slide => slide.is_carousel !== false)
    if (carouselSlides.length <= 1) return

    const interval = setInterval(() => {
      setCurrentHeroSlide((prev) =>
        prev >= carouselSlides.length - 1 ? 0 : prev + 1
      )
    }, 5000)

    return () => clearInterval(interval)
  }, [landingPage?.hero_slides])

  // Load landing page content
  useEffect(() => {
    async function loadLandingPage() {
      if (!businessUnitParam) {
        setLoading(false)
        return
      }

      try {
        const apiUrl = `/api/landing-page?businessUnit=${businessUnitParam}&country=${countryParam}&language=${langParam}`
        console.log('[LiveChat Preview] Fetching from:', apiUrl)
        const response = await fetch(apiUrl)
        const data = await response.json()

        if (data.businessUnit) {
          setBusinessUnit(data.businessUnit)
        }
        if (data.landingPage) {
          console.log('[LiveChat Preview] Loaded landing page data')
          console.log('[LiveChat Preview] Blocks count:', data.landingPage.blocks?.length || 0)
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
  }, [businessUnitParam, countryParam, langParam])

  // Load AI Staff
  useEffect(() => {
    async function loadAIData() {
      if (!businessUnitParam) return

      try {
        const { loadAIStaff } = await import('@/lib/api-client')
        const staff = await loadAIStaff(businessUnitParam)
        if (staff && staff.length > 0) {
          setAiStaffList(staff)
        }
      } catch (error) {
        console.error('Failed to load AI staff:', error)
      }
    }
    loadAIData()
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

  // Cart functions
  const addToCart = (product: any) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.product.id === product.id)
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex].quantity += 1
        return updated
      }
      return [...prev, { product, quantity: 1 }]
    })
    setShowCartSidebar(true)
  }

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    )
  }

  const handleCheckoutSuccess = (orderId: string) => {
    // Clear cart
    setCart([])
    // Close modals
    setShowCheckoutModal(false)
    setShowCartSidebar(false)
  }

  const cartTotal = cart.reduce((sum, item) => sum + ((item.product.cost_price || 0) * item.quantity), 0)
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const primaryColor = landingPage?.primary_color || '#4A90D9'
  const secondaryColor = landingPage?.secondary_color || '#0D1B2A'

  // Get font settings from landing page (use first hero slide as reference)
  const heroSlide = landingPage?.hero_slides?.[0]
  const headingFont = heroSlide?.headline_font_family || 'Josefin Sans'
  const bodyFont = heroSlide?.subheadline_font_family || 'Cormorant Garamond'

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
                <button
                  onClick={() => setShowCartSidebar(true)}
                  className="relative p-2 text-black hover:opacity-80 transition-colors"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                      {cartItemCount}
                    </span>
                  )}
                </button>
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
          // Separate slides into carousel and static
          const carouselSlides = landingPage.hero_slides.filter(slide => slide.is_carousel !== false)
          const staticSlides = landingPage.hero_slides.filter(slide => slide.is_carousel === false)

          // Only show carousel section if there are carousel slides
          if (carouselSlides.length === 0) return null

          const currentSlide = carouselSlides[currentHeroSlide] || carouselSlides[0]

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
                <div
                  className="absolute inset-0"
                  style={{ backgroundColor: currentSlide.background_color || '#1e293b' }}
                />
              )}

              {/* Overlay for text readability - only when there's an image/video */}
              {currentSlide.background_url && (
                <div className="absolute inset-0 bg-black/30" />
              )}

              {/* Content */}
              <div className="relative z-10 h-full flex items-center justify-center">
                <div className="px-4 md:px-12 max-w-4xl w-full">
                  {currentSlide.headline && (
                    <h1
                      className={`font-light tracking-[0.2em] uppercase leading-tight mb-4 drop-shadow-lg ${getFontClass(currentSlide.headline_font_family)} ${
                        (currentSlide.headline_text_align || 'center') === 'left' ? 'text-left' :
                        (currentSlide.headline_text_align || 'center') === 'right' ? 'text-right' :
                        'text-center'
                      }`}
                      style={{
                        fontSize: currentSlide.headline_font_size || 'clamp(1.875rem, 5vw, 3.75rem)',
                        color: currentSlide.headline_color || '#ffffff',
                        fontWeight: currentSlide.headline_bold ? 'bold' : undefined,
                        fontStyle: currentSlide.headline_italic ? 'italic' : undefined
                      }}
                    >
                      {currentSlide.headline}
                    </h1>
                  )}
                  {currentSlide.subheadline && (
                    <p
                      className={`font-light tracking-[0.15em] uppercase mb-4 drop-shadow ${getFontClass(currentSlide.subheadline_font_family)} ${
                        (currentSlide.subheadline_text_align || 'center') === 'left' ? 'text-left' :
                        (currentSlide.subheadline_text_align || 'center') === 'right' ? 'text-right' :
                        'text-center'
                      }`}
                      style={{
                        fontSize: currentSlide.subheadline_font_size || 'clamp(1.125rem, 2.5vw, 1.25rem)',
                        color: currentSlide.subheadline_color || '#ffffff',
                        fontWeight: currentSlide.subheadline_bold ? 'bold' : undefined,
                        fontStyle: currentSlide.subheadline_italic ? 'italic' : undefined
                      }}
                    >
                      {currentSlide.subheadline}
                    </p>
                  )}
                  {currentSlide.content && (
                    <p
                      className={`font-light mb-8 drop-shadow max-w-2xl whitespace-pre-wrap ${getFontClass(currentSlide.content_font_family)} ${
                        (currentSlide.content_text_align || 'center') === 'left' ? 'text-left' :
                        (currentSlide.content_text_align || 'center') === 'right' ? 'text-right mr-0 ml-auto' :
                        'text-center mx-auto'
                      }`}
                      style={{
                        fontSize: currentSlide.content_font_size || 'clamp(1rem, 2vw, 1.125rem)',
                        color: currentSlide.content_color || '#ffffff',
                        fontWeight: currentSlide.content_bold ? 'bold' : undefined,
                        fontStyle: currentSlide.content_italic ? 'italic' : undefined
                      }}
                    >
                      {currentSlide.content}
                    </p>
                  )}
                  {!currentSlide.content && currentSlide.subheadline && (
                    <div className="mb-4" />
                  )}
                  {currentSlide.cta_text && (
                    <div className={`${
                      (currentSlide.content_text_align || 'center') === 'left' ? 'text-left' :
                      (currentSlide.content_text_align || 'center') === 'right' ? 'text-right' :
                      'text-center'
                    }`}>
                      <Link
                        href={buildUrl(currentSlide.cta_url || '/livechat/shop')}
                        className={`inline-block px-8 py-3 bg-white text-black text-sm font-bold tracking-[0.15em] uppercase hover:bg-black hover:text-white transition-colors ${headlineFont.className}`}
                      >
                        {currentSlide.cta_text}
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation Arrows */}
              {carouselSlides.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentHeroSlide(prev => prev === 0 ? carouselSlides.length - 1 : prev - 1)}
                    className="absolute left-4 bottom-6 z-20 w-12 h-12 flex items-center justify-center bg-white/20 hover:bg-white/40 transition-colors rounded-full backdrop-blur-sm"
                  >
                    <ChevronLeft className="w-6 h-6 text-white" />
                  </button>
                  <button
                    onClick={() => setCurrentHeroSlide(prev => prev === carouselSlides.length - 1 ? 0 : prev + 1)}
                    className="absolute right-4 bottom-6 z-20 w-12 h-12 flex items-center justify-center bg-white/20 hover:bg-white/40 transition-colors rounded-full backdrop-blur-sm"
                  >
                    <ChevronRight className="w-6 h-6 text-white" />
                  </button>
                </>
              )}

              {/* Slide Indicators */}
              {carouselSlides.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                  {carouselSlides.map((_, index) => (
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

      {/* Static Hero Banners - Below Carousel */}
      {(landingPage.hero_slides && landingPage.hero_slides.length > 0) && (() => {
          const staticSlides = landingPage.hero_slides.filter(slide => slide.is_carousel === false)

          if (staticSlides.length === 0) return null

          return (
            <>
              {staticSlides.map((slide, index) => (
                <section key={index} className="relative w-full pt-8 pb-4 md:pt-12 md:pb-6 overflow-hidden">
                  {/* Background */}
                  {slide.background_url ? (
                    slide.background_type === 'video' ? (
                      <video
                        src={slide.background_url}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={slide.background_url}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )
                  ) : (
                    <div
                      className="absolute inset-0"
                      style={{ backgroundColor: slide.background_color || (slide.is_price_banner ? '#ffffff' : '#1e293b') }}
                    />
                  )}

                  {/* Overlay for text readability - only when there's an image/video */}
                  {slide.background_url && (
                    <div className="absolute inset-0 bg-black/30" />
                  )}

                  {/* Content */}
                  <div className="relative z-10 h-full flex items-center justify-center">
                    {slide.is_price_banner ? (
                      <PriceBannerContent slide={slide} onAddToCart={addToCart} />
                    ) : (
                      <div className="px-4 md:px-12 max-w-4xl w-full">
                        {slide.headline && (
                          <h2
                            className={`font-light tracking-[0.2em] uppercase leading-tight mb-4 drop-shadow-lg ${getFontClass(slide.headline_font_family)} ${
                              (slide.headline_text_align || 'center') === 'left' ? 'text-left' :
                              (slide.headline_text_align || 'center') === 'right' ? 'text-right' :
                              'text-center'
                            }`}
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
                            className={`font-light tracking-[0.15em] uppercase mb-4 drop-shadow ${getFontClass(slide.subheadline_font_family)} ${
                              (slide.subheadline_text_align || 'center') === 'left' ? 'text-left' :
                              (slide.subheadline_text_align || 'center') === 'right' ? 'text-right' :
                              'text-center'
                            }`}
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
                        {!slide.content && slide.subheadline && (
                          <div className="mb-4" />
                        )}
                        {slide.cta_text && (
                          <div className={`${
                            (slide.content_text_align || 'center') === 'left' ? 'text-left' :
                            (slide.content_text_align || 'center') === 'right' ? 'text-right' :
                            'text-center'
                          }`}>
                            <Link
                              href={buildUrl(slide.cta_url || '/livechat/shop')}
                              className={`inline-block px-8 py-3 bg-white text-black text-sm font-bold tracking-[0.15em] uppercase hover:bg-black hover:text-white transition-colors ${headlineFont.className}`}
                            >
                              {slide.cta_text}
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </section>
              ))}
            </>
          )
        })()}

      {/* Dynamic Blocks */}
      {landingPage.blocks && landingPage.blocks.length > 0 ? (
        <BlockRenderer blocks={landingPage.blocks} />
      ) : (
        <>
          {/* Fallback: Show old landing page schema content */}
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

        </>
      )}

      {/* Cart Sidebar - Always render regardless of blocks */}
      {showCartSidebar && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowCartSidebar(false)}>
          <div
            className="absolute right-0 top-0 h-full w-full md:w-96 bg-white shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cart Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className={`text-lg font-light tracking-[0.2em] uppercase ${getFontClass(headingFont)}`}>Shopping Cart ({cartItemCount})</h2>
              <button
                onClick={() => setShowCartSidebar(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <ShoppingCart className="w-16 h-16 mb-4" />
                  <p className={`text-gray-500 font-light ${getFontClass(bodyFont)}`}>Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.product.id} className="flex gap-4 pb-4 border-b border-gray-200">
                      <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                        {item.product.thumbnail ? (
                          <img src={item.product.thumbnail} alt={item.product.title} className="w-full h-full object-cover rounded" />
                        ) : (
                          <span className="text-3xl">🧴</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-medium text-sm ${getFontClass(headingFont)}`}>{item.product.title}</h3>
                        {item.product.description && (
                          <p className={`text-xs text-gray-600 mt-1 font-light ${getFontClass(bodyFont)}`}>{item.product.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                            className={`w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-sm font-light ${getFontClass(bodyFont)}`}
                          >
                            -
                          </button>
                          <span className={`text-sm font-light ${getFontClass(bodyFont)}`}>{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className={`w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-sm font-light ${getFontClass(bodyFont)}`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-red-500 hover:text-red-700 p-1 transition-colors"
                          title="Remove from cart"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        <span className={`font-bold ${getFontClass(headingFont)}`}>${((item.product.cost_price || 0) * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex justify-between mb-4">
                  <span className={`font-light tracking-[0.15em] uppercase ${getFontClass(headingFont)}`}>Total:</span>
                  <span className={`font-bold ${getFontClass(headingFont)}`}>${cartTotal.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => setShowCheckoutModal(true)}
                  className={`block w-full px-6 py-3 bg-black text-white text-center font-bold tracking-[0.15em] uppercase hover:bg-gray-800 transition-colors shadow-lg ${getFontClass(headingFont)}`}
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal - Always render regardless of blocks */}
      <CheckoutModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        cart={cart}
        onSuccess={handleCheckoutSuccess}
        businessUnitParam={businessUnitParam}
        headingFont={headingFont}
        bodyFont={bodyFont}
      />

      {/* AI Coach Floating Button - Always render regardless of blocks */}
      {aiStaffList.length > 0 && (
        <AICoach
          businessUnit={businessUnitParam}
          aiStaffList={aiStaffList}
          initialOpen={false}
        />
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
