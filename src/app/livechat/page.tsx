'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { Star, Check, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ShoppingCart, Sparkles, Shield, Truck, RotateCcw, Menu, X, User, Search, Trash2, MessageCircle, Globe, Loader2, LogOut, Edit2, Save } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { serifFont, headlineFont, getFontClass } from '@/lib/fonts'
import BlockRenderer from '@/components/landing-page/BlockRenderer'
import LandingPageFooter from '@/components/landing-page/LandingPageFooter'
import PolicyContentView from '@/components/landing-page/PolicyContentView'
import CheckoutModal from '@/components/shop/checkout-modal'
import AICoach from '@/components/ui/ai-coach'
import { supabase } from '@/lib/supabase'

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
  poster_url?: string // Optimized poster image for videos (< 50KB)
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
  blocks?: any[]
  footer?: {
    links?: { label: string; url: string }[]
    brand_name?: string
    company_name?: string
    contact_email?: string
    background_color?: string
    text_font_family?: string
    text_font_size?: string
    text_color?: string
    text_align?: 'left' | 'center' | 'right'
    text_bold?: boolean
    text_italic?: boolean
    // Policy settings
    website_url?: string
    contact_address?: string
    governing_state?: string
    effective_date?: string
    liability_cap?: string
    refund_days?: string
    refund_processing_days?: string
    warranty_months?: string
    restocking_fee?: string
    return_address?: string
    processing_days?: string
    domestic_shipping_days?: string
    international_shipping_days?: string
    free_shipping_threshold?: string
    shipping_carriers?: string
    cutoff_time?: string
    warehouse_location?: string
    policies?: {
      about_us?: { enabled: boolean }
      terms_of_service?: { enabled: boolean }
      privacy_policy?: { enabled: boolean }
      refund_policy?: { enabled: boolean }
      shipping_policy?: { enabled: boolean }
      guarantee?: { enabled: boolean }
    }
    policy_content?: Record<string, string>
  }
}

// Price Banner Component
function PriceBannerContent({ slide, onAddToCart }: { slide: HeroSlide; onAddToCart: (product: any) => void }) {
  const searchParams = useSearchParams()
  const businessUnitParam = searchParams.get('businessUnit') || ''
  const countryParam = searchParams.get('country') || 'US'
  const langParam = searchParams.get('lang') || searchParams.get('language') || 'en'
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
        const response = await fetch(`/api/shop/products?businessUnit=${businessUnitParam}&country=${countryParam}&language=${langParam}`)
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

export interface LandingPageContentProps {
  businessUnitOverride?: string
  countryOverride?: string
  languageOverride?: string
  pageSlug?: string
}

export function LandingPageContent({
  businessUnitOverride,
  countryOverride,
  languageOverride,
  pageSlug
}: LandingPageContentProps = {}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const businessUnitParam = searchParams.get('businessUnit') || businessUnitOverride || ''
  const countryParam = searchParams.get('country') || countryOverride || 'US'
  const langParam = searchParams.get('lang') || searchParams.get('language') || languageOverride || 'en'
  const policyParam = searchParams.get('policy') || ''
  const previewParam = searchParams.get('preview') === 'true'

  // Cart translations
  const cartText = langParam === 'tw' ? {
    shoppingCart: '購物車',
    cartEmpty: '您的購物車是空的',
    total: '總計',
    proceedToCheckout: '前往結帳',
    removeFromCart: '從購物車移除'
  } : {
    shoppingCart: 'Shopping Cart',
    cartEmpty: 'Your cart is empty',
    total: 'Total',
    proceedToCheckout: 'Proceed to Checkout',
    removeFromCart: 'Remove from cart'
  }

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

  // Auth state - for showing user name in header & account modal
  const [authUser, setAuthUser] = useState<any>(null)
  const [authUserName, setAuthUserName] = useState<string | null>(null)
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [accountProfile, setAccountProfile] = useState<any>(null)
  const [accountEditing, setAccountEditing] = useState(false)
  const [accountSaving, setAccountSaving] = useState(false)
  const [accountEditForm, setAccountEditForm] = useState({ name: '', email: '', phone: '' })
  const [accountSocialLoading, setAccountSocialLoading] = useState<'google' | 'facebook' | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const meta = session.user.user_metadata || {}
        setAuthUser(session.user)
        setAuthUserName(meta.full_name || meta.name || session.user.email?.split('@')[0] || null)
      }
    }
    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const meta = session.user.user_metadata || {}
        setAuthUser(session.user)
        setAuthUserName(meta.full_name || meta.name || session.user.email?.split('@')[0] || null)
      } else {
        setAuthUser(null)
        setAuthUserName(null)
        setAccountProfile(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  // Load profile when account modal opens and user is signed in
  useEffect(() => {
    if (!showAccountModal || !authUser) return
    const loadProfile = async () => {
      try {
        const res = await fetch(`/api/customer/account?userId=${authUser.id}`)
        const data = await res.json()
        if (data.success && data.profile) {
          setAccountProfile(data.profile)
          setAccountEditForm({
            name: data.profile.name || authUser.user_metadata?.full_name || '',
            email: data.profile.email || authUser.email || '',
            phone: data.profile.phone || ''
          })
        } else {
          setAccountEditForm({
            name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
            email: authUser.email || '',
            phone: ''
          })
          await fetch('/api/customer/account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: authUser.id,
              name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || null,
              email: authUser.email || null
            })
          })
        }
      } catch (error) {
        console.error('Failed to load profile:', error)
      }
    }
    loadProfile()
  }, [showAccountModal, authUser])

  const handleAccountSave = async () => {
    if (!authUser) return
    setAccountSaving(true)
    try {
      const res = await fetch('/api/customer/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: authUser.id,
          name: accountEditForm.name,
          email: accountEditForm.email,
          phone: accountEditForm.phone
        })
      })
      const data = await res.json()
      if (data.success) {
        setAccountProfile(data.profile)
        setAccountEditing(false)
      }
    } catch (error) {
      console.error('Failed to save profile:', error)
    } finally {
      setAccountSaving(false)
    }
  }

  const handleAccountSocialLogin = async (provider: 'google' | 'facebook') => {
    setAccountSocialLoading(provider)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.href,
          queryParams: provider === 'google' ? { prompt: 'select_account' } : undefined
        }
      })
      if (error) {
        console.error('Social login error:', error)
        setAccountSocialLoading(null)
      }
    } catch (err) {
      console.error('Social login failed:', err)
      setAccountSocialLoading(null)
    }
  }

  const handleAccountSignOut = async () => {
    await supabase.auth.signOut()
    setAuthUser(null)
    setAuthUserName(null)
    setAccountProfile(null)
    setShowAccountModal(false)
  }

  // AI Staff state
  const [aiStaffList, setAiStaffList] = useState<AIStaff[]>([])

  // Announcement rotation state
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  // Hero carousel state
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0)
  const heroVideoRefs = useRef<(HTMLVideoElement | null)[]>([])

  // Play only the active carousel video, pause all others (mobile browsers limit concurrent playback)
  useEffect(() => {
    heroVideoRefs.current.forEach((video, index) => {
      if (!video) return
      if (index === currentHeroSlide) {
        video.play().catch(() => {})
      } else {
        video.pause()
      }
    })
  }, [currentHeroSlide])

  // Language selector state
  const [availableLocales, setAvailableLocales] = useState<{ country: string; language_code: string }[]>([])
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)

  // Filter locales to only show languages for the current country (based on IP/URL)
  const languagesForCountry = availableLocales.filter(l => l.country === countryParam)

  // Close language dropdown when clicking outside
  useEffect(() => {
    if (!showLanguageDropdown) return
    const handleClick = () => setShowLanguageDropdown(false)
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [showLanguageDropdown])

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
        const apiUrl = `/api/landing-page?businessUnit=${businessUnitParam}&country=${countryParam}&language=${langParam}${pageSlug ? `&page=${pageSlug}` : ''}${previewParam ? '&preview=true' : ''}&_t=${Date.now()}`
        console.log('[LiveChat Preview] Fetching from:', apiUrl)
        const response = await fetch(apiUrl, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        })
        const data = await response.json()

        if (data.businessUnit) {
          setBusinessUnit(data.businessUnit)
        }
        if (data.availableLocales) {
          setAvailableLocales(data.availableLocales)
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
  }, [businessUnitParam, countryParam, langParam, pageSlug, previewParam])

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

  // Build URL with businessUnit and locale params preserved
  const buildUrl = (path: string) => {
    // When on a slug page, Home link goes back to the slug URL
    if (pageSlug && (path === '/livechat' || path === '/')) {
      return `/${pageSlug}`
    }
    if (businessUnitParam) {
      return `${path}?businessUnit=${businessUnitParam}&country=${countryParam}&lang=${langParam}`
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
  const accountUrl = landingPage?.account_url || ''
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

  // Show loading only until page data is ready
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

  // Get policy data from the footer settings
  const getPolicyData = () => {
    if (!policyParam) return null
    // Policy data is now stored in footer settings
    return landingPage?.footer || null
  }

  const policyData = policyParam ? getPolicyData() : null
  const previewSuffix = previewParam ? (pageSlug ? '?preview=true' : '&preview=true') : ''
  const backUrl = pageSlug ? `/${pageSlug}${previewParam ? '?preview=true' : ''}` : `/livechat${businessUnitParam ? `?businessUnit=${businessUnitParam}` : ''}${previewParam ? (businessUnitParam ? '&preview=true' : '?preview=true') : ''}`

  // Render full landing page with database content
  return (
    <div className="min-h-screen bg-white">
      {/* Preview Mode Banner */}
      {previewParam && (
        <div className="bg-amber-500 text-white text-center py-2 px-4 text-sm font-medium sticky top-0 z-[60]">
          PREVIEW MODE — This is the draft version. Not live yet.
        </div>
      )}
      {/* Announcement Bar - Rotating */}
      {!policyParam && announcements.length > 0 && (
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
                <button onClick={() => setShowAccountModal(true)} className="hidden md:flex items-center gap-1.5 p-2 text-black hover:opacity-80 transition-colors">
                  <User className="w-5 h-5" />
                  {authUserName && (
                    <span className={`text-sm font-medium ${getFontClass(landingPage?.body_font || 'Cormorant Garamond')}`}>
                      Hi, {authUserName}
                    </span>
                  )}
                </button>
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

              {/* Language Selector - only show if multiple languages for this country */}
              {languagesForCountry.length > 1 && (
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowLanguageDropdown(!showLanguageDropdown) }}
                    className="hidden md:flex items-center gap-1 p-2 text-black hover:opacity-80 transition-colors"
                  >
                    <Globe className="w-5 h-5" />
                    <span className="text-xs font-medium uppercase">{langParam}</span>
                  </button>
                  {showLanguageDropdown && (
                    <div className="absolute right-0 top-full mt-1 bg-white shadow-lg rounded-lg border border-gray-200 py-1 min-w-[140px] z-50">
                      {languagesForCountry.map((locale) => {
                        const isActive = locale.language_code === langParam
                        const langName: Record<string, string> = { en: 'English', tw: '繁體中文', cn: '简体中文', ja: '日本語', ko: '한국어' }
                        return (
                          <button
                            key={locale.language_code}
                            onClick={() => {
                              setShowLanguageDropdown(false)
                              // Check if we're on a country route (/us, /hk, /sg)
                              const currentPath = window.location.pathname
                              const isCountryRoute = /^\/(us|hk|sg)$/i.test(currentPath)
                              router.push(isCountryRoute
                                ? `${currentPath}?lang=${locale.language_code}`
                                : pageSlug
                                  ? `/${pageSlug}?lang=${locale.language_code}`
                                  : `/livechat?businessUnit=${businessUnitParam}&country=${countryParam}&lang=${locale.language_code}`)
                            }}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 ${isActive ? 'bg-gray-50 font-medium' : ''}`}
                          >
                            <span>{langName[locale.language_code] || locale.language_code}</span>
                            {isActive && <Check className="w-4 h-4 ml-auto text-green-600" />}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
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
                <button
                  className={`px-4 py-3 text-black hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-bold tracking-[0.15em] uppercase w-full text-left ${headlineFont.className}`}
                  onClick={() => { setMobileMenuOpen(false); setShowAccountModal(true) }}
                >
                  <User className="w-4 h-4" />
                  {authUserName ? `Hi, ${authUserName}` : 'My Account'}
                </button>
              )}
              {/* Mobile language selector - only show if multiple languages for this country */}
              {languagesForCountry.length > 1 && (
                <div className="border-t border-gray-100 mt-2 pt-2">
                  <div className="px-4 py-2 text-xs text-gray-500 uppercase tracking-wider">Language</div>
                  {languagesForCountry.map((locale) => {
                    const isActive = locale.language_code === langParam
                    const langName: Record<string, string> = { en: 'English', tw: '繁體中文', cn: '简体中文', ja: '日本語', ko: '한국어' }
                    return (
                      <button
                        key={`mobile-${locale.language_code}`}
                        onClick={() => {
                          setMobileMenuOpen(false)
                          // Check if we're on a country route (/us, /hk, /sg)
                          const currentPath = window.location.pathname
                          const isCountryRoute = /^\/(us|hk|sg)$/i.test(currentPath)
                          router.push(isCountryRoute
                            ? `${currentPath}?lang=${locale.language_code}`
                            : pageSlug
                              ? `/${pageSlug}?lang=${locale.language_code}`
                              : `/livechat?businessUnit=${businessUnitParam}&country=${countryParam}&lang=${locale.language_code}`)
                        }}
                        className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${isActive ? 'bg-gray-50 font-medium' : ''}`}
                      >
                        <span>{langName[locale.language_code] || locale.language_code}</span>
                        {isActive && <Check className="w-4 h-4 ml-auto text-green-600" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Policy Content View - Show instead of hero/blocks when viewing policy */}
      {policyParam && (
        <PolicyContentView
          policyType={policyParam}
          policyData={policyData}
          backUrl={backUrl}
        />
      )}

      {/* Hero Section - Carousel */}
      {!policyParam && (landingPage.hero_slides && landingPage.hero_slides.length > 0) && (() => {
          // Separate slides into carousel and static
          const carouselSlides = landingPage.hero_slides.filter(slide => slide.is_carousel !== false)
          const staticSlides = landingPage.hero_slides.filter(slide => slide.is_carousel === false)

          // Only show carousel section if there are carousel slides
          if (carouselSlides.length === 0) return null

          return (
            <section className="relative w-full h-[500px] md:h-[600px] overflow-hidden">
              {/* All slides rendered simultaneously - fade between them */}
              {carouselSlides.map((slide, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-opacity duration-700 ${
                    index === currentHeroSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                  }`}
                  aria-hidden={index !== currentHeroSlide}
                >
                  {/* Background - with loading fallback */}
                  <div
                    className="absolute inset-0"
                    style={{ backgroundColor: slide.background_color || '#1e293b' }}
                  />
                  {/* Background */}
                  {slide.background_url ? (
                    slide.background_type === 'video' ? (
                      <video
                        ref={(el) => { heroVideoRefs.current[index] = el }}
                        src={slide.background_url}
                        loop
                        muted
                        playsInline
                        autoPlay={index === 0}
                        preload={index === 0 ? "auto" : index === 1 ? "auto" : "metadata"}
                        poster={slide.poster_url || `${slide.background_url}#t=0.1`}
                        className="absolute inset-0 w-full h-full object-cover"
                        style={index === 0 ? { isolation: 'isolate' } : undefined}
                      />
                    ) : (
                      <img
                        src={slide.background_url}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )
                  ) : null}

                  {/* Overlay for text readability */}
                  {slide.background_url && (
                    <div className="absolute inset-0 bg-black/30" />
                  )}

                  {/* Content */}
                  <div className="relative z-10 h-full flex items-center justify-center">
                    <div className="px-4 md:px-12 max-w-4xl w-full">
                      {slide.headline && (
                        <h1
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
                        </h1>
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
                  </div>
                </div>
              ))}

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
      {!policyParam && (landingPage.hero_slides && landingPage.hero_slides.length > 0) && (() => {
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
                        preload="auto"
                        poster={slide.poster_url}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={slide.background_url}
                        alt=""
                        loading="lazy"
                        decoding="async"
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
      {!policyParam && landingPage.blocks && landingPage.blocks.length > 0 ? (
        <BlockRenderer blocks={landingPage.blocks} onAddToCart={addToCart} />
      ) : !policyParam && (
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
              <h2 className={`text-lg font-light tracking-[0.2em] uppercase ${getFontClass(headingFont)}`}>{cartText.shoppingCart} ({cartItemCount})</h2>
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
                  <p className={`text-gray-500 font-light ${getFontClass(bodyFont)}`}>{cartText.cartEmpty}</p>
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
                          title={cartText.removeFromCart}
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
                  <span className={`font-light tracking-[0.15em] uppercase ${getFontClass(headingFont)}`}>{cartText.total}:</span>
                  <span className={`font-bold ${getFontClass(headingFont)}`}>${cartTotal.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => setShowCheckoutModal(true)}
                  className={`block w-full px-6 py-3 bg-black text-white text-center font-bold tracking-[0.15em] uppercase hover:bg-gray-800 transition-colors shadow-lg ${getFontClass(headingFont)}`}
                >
                  {cartText.proceedToCheckout}
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
        language={langParam}
        enableSocialLogin={landingPage?.enable_social_login === true}
      />

      {/* Account Modal */}
      {showAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAccountModal(false)} />

          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-xs animate-in fade-in zoom-in-95 duration-200">
            {/* Close button */}
            <button
              onClick={() => setShowAccountModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {!authUser ? (
              /* Not signed in — social login */
              <div className="p-6">
                <div className="text-center mb-5">
                  <div className="bg-black w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-3">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <h2 className={`text-lg font-semibold text-gray-900 ${getFontClass(headingFont)}`}>My Account</h2>
                  <p className="text-gray-400 mt-1 text-xs">Sign in to view your profile</p>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => handleAccountSocialLogin('google')}
                    disabled={accountSocialLoading !== null}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
                  >
                    {accountSocialLoading === 'google' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    )}
                    <span className="font-medium text-gray-700">Continue with Google</span>
                  </button>
                  <button
                    onClick={() => handleAccountSocialLogin('facebook')}
                    disabled={accountSocialLoading !== null}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
                  >
                    {accountSocialLoading === 'facebook' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    )}
                    <span className="font-medium text-gray-700">Continue with Facebook</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Signed in — profile card */
              <div>
                <div className="flex items-center justify-between px-5 pt-5 pb-3 pr-10">
                  <h2 className={`text-base font-semibold text-gray-900 ${getFontClass(headingFont)}`}>My Account</h2>
                  <button
                    onClick={handleAccountSignOut}
                    className="flex items-center gap-1 text-gray-400 hover:text-red-500 transition-colors text-xs"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
                <div className="px-5 pb-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Profile</span>
                    {!accountEditing ? (
                      <button
                        onClick={() => setAccountEditing(true)}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setAccountEditing(false)}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-3 h-3" />
                          Cancel
                        </button>
                        <button
                          onClick={handleAccountSave}
                          disabled={accountSaving}
                          className="flex items-center gap-1 text-xs bg-black text-white px-2.5 py-1 rounded-md hover:bg-gray-800 disabled:opacity-50"
                        >
                          {accountSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                          Save
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-0.5">Name</label>
                      {accountEditing ? (
                        <input
                          type="text"
                          value={accountEditForm.name}
                          onChange={(e) => setAccountEditForm({ ...accountEditForm, name: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                        />
                      ) : (
                        <p className="text-sm text-gray-900">{accountProfile?.name || accountEditForm.name || 'Not set'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-0.5">Email</label>
                      <p className="text-sm text-gray-900">{authUser.email || 'Not set'}</p>
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-0.5">Phone</label>
                      {accountEditing ? (
                        <input
                          type="tel"
                          value={accountEditForm.phone}
                          onChange={(e) => setAccountEditForm({ ...accountEditForm, phone: e.target.value })}
                          placeholder="Enter phone number"
                          className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                        />
                      ) : (
                        <p className="text-sm text-gray-900">{accountProfile?.phone || 'Not set'}</p>
                      )}
                    </div>
                    <div className="pt-3 border-t border-gray-100">
                      <p className="text-[10px] text-gray-400">
                        Signed in via {authUser.app_metadata?.provider || 'email'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Coach Floating Button - Always render regardless of blocks */}
      {aiStaffList.length > 0 && (
        <AICoach
          businessUnit={businessUnitParam}
          country={countryParam}
          language={langParam}
          aiStaffList={aiStaffList}
          initialOpen={false}
          enableSocialLogin={landingPage?.enable_social_login === true}
        />
      )}

      {/* Footer */}
      <LandingPageFooter
        data={landingPage.footer}
        businessUnitName={businessUnit?.name}
        businessUnitParam={businessUnitParam}
        country={countryParam}
        language={langParam}
        preview={previewParam}
      />
    </div>
  )
}

export default function LandingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>}>
      <LandingPageContentWrapper />
    </Suspense>
  )
}

function LandingPageContentWrapper() {
  const searchParams = useSearchParams()
  const pageSlug = searchParams.get('page') || undefined

  return <LandingPageContent pageSlug={pageSlug} />
}
