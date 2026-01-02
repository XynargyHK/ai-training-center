'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Star, Check, ChevronDown, ChevronUp, ShoppingCart, Sparkles, Shield, Truck, RotateCcw, Menu, X, User, Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import BlockRenderer from '@/components/landing-page/BlockRenderer'

// Navigation menu items
const navItems = [
  { label: 'Home', href: '/livechat/landing' },
  { label: 'Shop', href: '/livechat' },
  { label: 'Contact Us', href: '#contact' },
  { label: 'Shipping & Returns', href: '#shipping' },
]

// FAQ Data
const faqs = [
  {
    question: "What is PDRN?",
    answer: "Salmon DNA-derived regeneration factor that activates cell repair and boosts collagen production. It's the #1 ingredient in Korean 'baby skin' facials."
  },
  {
    question: "When will I see results?",
    answer: "Hydration and glow from first use. Visible firming and wrinkle reduction in 4-6 weeks. Dramatic transformation by week 8-12."
  },
  {
    question: "Does it hurt?",
    answer: "Mild tingling that fades in seconds. Safe and painless. Much gentler than professional microneedling."
  },
  {
    question: "Why is the serum blue?",
    answer: "The blue color comes from Copper Tripeptide-1 (GHK-Cu). This is proof of authentic, properly concentrated copper peptide. Beware of colorless 'copper peptide' products."
  },
  {
    question: "Suitable for sensitive skin?",
    answer: "Yes! All three ingredients have anti-inflammatory properties. This formula is excellent for sensitive, rosacea-prone, or post-procedure skin."
  },
  {
    question: "How often should I use it?",
    answer: "Every two weeks for best results. Each session takes only 5 minutes."
  }
]

// Testimonials
const testimonials = [
  {
    name: "Jane L.",
    age: "30s",
    text: "My skin is noticeably firmer, fine lines less visible",
    rating: 5
  },
  {
    name: "Christy T.",
    age: "40s",
    text: "Visible improvement in 3 months. Friends keep asking what I did",
    rating: 5
  },
  {
    name: "Annie P.",
    age: "30s",
    text: "Eye area improved the most. Results exceeded expectations",
    rating: 5
  },
  {
    name: "Emily S.",
    age: "45",
    text: "After 6 weeks, the fine lines around my eyes visibly reduced. My skin feels so much firmer.",
    rating: 5
  }
]

// Pricing options
const pricingOptions = [
  {
    id: '4-month',
    label: '4-Month Supply',
    sessions: 8,
    originalPrice: 399,
    salePrice: 199,
    perSession: 25,
    discount: 60,
    popular: true
  },
  {
    id: '3-month',
    label: '3-Month Supply',
    sessions: 6,
    originalPrice: 299,
    salePrice: 149,
    perSession: 25,
    discount: 50,
    popular: false
  },
  {
    id: '1-month',
    label: '1-Month Trial',
    sessions: 2,
    originalPrice: 99,
    salePrice: 99,
    perSession: 50,
    discount: 0,
    popular: false
  }
]

function LandingPageContent() {
  const searchParams = useSearchParams()
  const businessUnit = searchParams.get('businessUnit') || 'skincoach'

  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [selectedPricing, setSelectedPricing] = useState('4-month')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Landing page data from database
  const [landingData, setLandingData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Announcement rotation state
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  // Fetch landing page data
  useEffect(() => {
    const fetchLandingPage = async () => {
      try {
        const response = await fetch(`/api/landing-page?businessUnit=${businessUnit}`)
        const data = await response.json()
        if (data.landingPage) {
          setLandingData(data.landingPage)
        }
      } catch (error) {
        console.error('Error fetching landing page:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchLandingPage()
  }, [businessUnit])

  // Rotate announcements every 5 seconds
  useEffect(() => {
    const announcements = landingData?.announcements || []
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
  }, [landingData?.announcements])

  // Get current announcement
  const announcements = landingData?.announcements || []
  const currentAnnouncement = announcements[currentAnnouncementIndex] || ''

  return (
    <div className="min-h-screen bg-white">
      {/* Announcement Bar - Rotating */}
      {announcements.length > 0 && (
        <div className="bg-[#0D1B2A] text-white text-center py-2.5 px-4 text-sm overflow-hidden">
          <div
            className={`inline-flex items-center gap-2 transition-all duration-300 ${
              isAnimating ? 'opacity-0 transform -translate-y-2' : 'opacity-100 transform translate-y-0'
            }`}
          >
            <Sparkles className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium">{currentAnnouncement}</span>
            <Sparkles className="w-4 h-4 flex-shrink-0" />
          </div>
          {/* Dots indicator for multiple announcements */}
          {announcements.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-1.5">
              {announcements.map((_: string, index: number) => (
                <button
                  key={index}
                  onClick={() => setCurrentAnnouncementIndex(index)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    index === currentAnnouncementIndex
                      ? 'bg-white'
                      : 'bg-white/40 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Header Navigation */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left - Menu Button (Mobile) / Nav Links (Desktop) */}
            <div className="flex items-center gap-8">
              {/* Mobile Menu Toggle */}
              <button
                className="md:hidden p-2 text-gray-700"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-6">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="text-gray-700 hover:text-[#4A90D9] transition-colors text-sm font-medium"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Center - Logo */}
            <Link href="/livechat/landing" className="absolute left-1/2 transform -translate-x-1/2">
              <span className="text-xl font-bold text-[#0D1B2A]">SkinCoach</span>
            </Link>

            {/* Right side - Account & Cart */}
            <div className="flex items-center gap-4">
              {/* Account */}
              <button className="hidden md:flex items-center gap-1 text-gray-700 hover:text-[#4A90D9] transition-colors">
                <User className="w-5 h-5" />
                <span className="text-sm">Account</span>
              </button>

              {/* Cart */}
              <button className="relative p-2 text-gray-700 hover:text-[#4A90D9] transition-colors">
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-[#4A90D9] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  0
                </span>
              </button>
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
                  className="px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-[#4A90D9] transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="#account"
                className="px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-[#4A90D9] transition-colors flex items-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <User className="w-5 h-5" />
                My Account
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Dynamic Blocks */}
      {landingData?.blocks && landingData.blocks.length > 0 && (
        <BlockRenderer blocks={landingData.blocks} />
      )}

      {/* Clinical Results */}
      <section className="py-16 px-4 bg-[#0D1B2A] text-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-serif text-center mb-12">Clinical Results</h2>
          <div className="grid grid-cols-3 gap-4 md:gap-8 text-center">
            <div>
              <div className="text-4xl md:text-6xl font-bold text-[#4A90D9]">94%</div>
              <div className="text-sm md:text-base mt-2 text-gray-300">Crow's Feet<br />Improved</div>
            </div>
            <div>
              <div className="text-4xl md:text-6xl font-bold text-[#4A90D9]">97%</div>
              <div className="text-sm md:text-base mt-2 text-gray-300">Smile Lines<br />Softened</div>
            </div>
            <div>
              <div className="text-4xl md:text-6xl font-bold text-[#4A90D9]">90%</div>
              <div className="text-sm md:text-base mt-2 text-gray-300">Forehead<br />Smoothed</div>
            </div>
          </div>
        </div>
      </section>

      {/* Dual Technology */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-serif text-center mb-4">Dual Technology. Reverse Skin Aging.</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Professional-grade ingredients delivered deep into your skin with micro-infusion technology
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Serum */}
            <div className="bg-gray-50 rounded-2xl p-8">
              <div className="w-24 h-24 bg-gradient-to-br from-[#4A90D9] to-[#2563EB] rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🧪</span>
              </div>
              <h3 className="text-xl font-bold text-center mb-4">Triple Regeneration Serum</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <span className="text-xl">🧬</span>
                  <span><strong>PDRN</strong> Salmon DNA - Cell Repair</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-xl">🔷</span>
                  <span><strong>GHK-Cu</strong> Copper Peptide - Collagen Rebuild</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-xl">🫐</span>
                  <span><strong>Goji Exosomes</strong> - Glass Skin Glow</span>
                </li>
              </ul>
            </div>

            {/* Device */}
            <div className="bg-gray-50 rounded-2xl p-8">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">✨</span>
              </div>
              <h3 className="text-xl font-bold text-center mb-4">Micro-Infusion Device</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>0.25mm Medical-Grade Needles</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>300% Absorption Boost</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Safe & Painless</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Performance Metrics */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl md:text-4xl font-bold text-[#4A90D9]">30x</div>
              <div className="text-sm text-gray-600 mt-2">Absorption<br />vs Creams</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl md:text-4xl font-bold text-[#4A90D9]">15x</div>
              <div className="text-sm text-gray-600 mt-2">Penetration<br />vs Home Devices</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl md:text-4xl font-bold text-[#4A90D9]">15x</div>
              <div className="text-sm text-gray-600 mt-2">Value vs<br />Clinic</div>
            </div>
          </div>
        </div>
      </section>

      {/* Before/After Placeholder */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-serif text-center mb-12">Real Results</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-100 rounded-2xl overflow-hidden">
                <div className="aspect-[4/3] bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                  <span className="text-gray-500">Before / After {i}</span>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-600 italic">"Results after {i * 2} weeks of use"</p>
                  <p className="text-xs text-gray-400 mt-1">— Verified Customer</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How To Use */}
      <section className="py-16 px-4 bg-[#0D1B2A] text-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-serif text-center mb-12">Simple 4 Steps</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="w-16 h-16 bg-[#4A90D9]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">①</span>
              </div>
              <p className="text-sm">Pour serum</p>
            </div>
            <div>
              <div className="w-16 h-16 bg-[#4A90D9]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">②</span>
              </div>
              <p className="text-sm">Wait 1-2 min</p>
            </div>
            <div>
              <div className="w-16 h-16 bg-[#4A90D9]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">③</span>
              </div>
              <p className="text-sm">Press on face</p>
            </div>
            <div>
              <div className="w-16 h-16 bg-[#4A90D9]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">④</span>
              </div>
              <p className="text-sm">Apply remaining</p>
            </div>
          </div>
          <div className="flex justify-center gap-6 mt-8 text-sm text-gray-300">
            <span>5 minutes</span>
            <span>•</span>
            <span>Twice monthly</span>
            <span>•</span>
            <span>Safe & painless</span>
          </div>
        </div>
      </section>

      {/* Ingredients Detail */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-serif text-center mb-4">Triple Active Formula</h2>
          <p className="text-center text-gray-600 mb-12">The 2024-2025 "Regeneration Cocktail" trending in Korean luxury clinics</p>

          <div className="space-y-6">
            {/* PDRN */}
            <div className="bg-gradient-to-r from-blue-50 to-white rounded-2xl p-6 border border-blue-100">
              <div className="flex items-start gap-4">
                <div className="text-3xl">🧬</div>
                <div>
                  <h3 className="font-bold text-lg mb-2">PDRN 3%</h3>
                  <p className="text-gray-600 text-sm mb-3">Deep-sea salmon DNA regeneration factor</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Activates cell repair at molecular level</li>
                    <li>• Boosts collagen & elastin production</li>
                    <li>• Creates plumper, denser skin</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* GHK-Cu */}
            <div className="bg-gradient-to-r from-indigo-50 to-white rounded-2xl p-6 border border-indigo-100">
              <div className="flex items-start gap-4">
                <div className="text-3xl">🔷</div>
                <div>
                  <h3 className="font-bold text-lg mb-2">GHK-Cu Copper Tripeptide</h3>
                  <p className="text-gray-600 text-sm mb-3">Activates 4,000+ genes for skin remodeling</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Firms & tightens loose skin</li>
                    <li>• Reduces fine lines & deep wrinkles</li>
                    <li>• Evens skin tone & fades dark spots</li>
                  </ul>
                  <div className="mt-3 bg-blue-100 text-blue-800 text-xs px-3 py-1.5 rounded-full inline-block">
                    💡 Blue serum = Proof of authentic concentration
                  </div>
                </div>
              </div>
            </div>

            {/* Goji */}
            <div className="bg-gradient-to-r from-purple-50 to-white rounded-2xl p-6 border border-purple-100">
              <div className="flex items-start gap-4">
                <div className="text-3xl">🫐</div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Goji Berry Exosomes</h3>
                  <p className="text-gray-600 text-sm mb-3">Korean glass-skin secret ingredient</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Delivers "water glow" effect</li>
                    <li>• Powerful antioxidant protection</li>
                    <li>• Enhances penetration of other actives</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-serif text-center mb-4">Limited Time Offer</h2>
          <p className="text-center text-gray-600 mb-8">Choose your package</p>

          <div className="space-y-4">
            {pricingOptions.map((option) => (
              <div
                key={option.id}
                onClick={() => setSelectedPricing(option.id)}
                className={`relative bg-white rounded-2xl p-6 cursor-pointer transition-all ${
                  selectedPricing === option.id
                    ? 'ring-2 ring-[#4A90D9] shadow-lg'
                    : 'border border-gray-200 hover:border-[#4A90D9]'
                }`}
              >
                {option.popular && (
                  <div className="absolute -top-3 left-6 bg-[#4A90D9] text-white text-xs px-3 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{option.label}</h3>
                    <p className="text-gray-500 text-sm">{option.sessions} sessions</p>
                  </div>
                  <div className="text-right">
                    {option.discount > 0 && (
                      <span className="text-gray-400 line-through text-sm">${option.originalPrice}</span>
                    )}
                    <div className="text-2xl font-bold">${option.salePrice}</div>
                    <p className="text-xs text-gray-500">${option.perSession}/session</p>
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

          {/* Sold indicator */}
          <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-red-600">
              <span className="text-2xl">🔥</span>
              <span className="font-semibold">83% Sold</span>
            </div>
            <div className="w-full bg-red-200 rounded-full h-2 mt-2">
              <div className="bg-red-500 h-2 rounded-full" style={{width: '83%'}}></div>
            </div>
          </div>

          {/* Buy Button */}
          <button className="w-full mt-6 bg-[#0D1B2A] text-white py-4 rounded-xl font-semibold text-lg hover:bg-[#1a2d42] transition-colors flex items-center justify-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Buy Now - Save {pricingOptions.find(o => o.id === selectedPricing)?.discount || 0}%
          </button>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-serif text-center mb-4">Customer Reviews</h2>
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="flex">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="text-gray-600">4.89 average</span>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {testimonials.map((testimonial, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-6">
                <div className="flex mb-3">
                  {[1,2,3,4,5].map(j => (
                    <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4">"{testimonial.text}"</p>
                <p className="text-sm text-gray-500">— {testimonial.name}, {testimonial.age}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <div className="inline-flex gap-8 text-sm text-gray-600">
              <span><strong>98%</strong> Recommend</span>
              <span><strong>91%</strong> 5-Star Reviews</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-serif text-center mb-12">Frequently Asked Questions</h2>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left"
                >
                  <span className="font-medium">{faq.question}</span>
                  {openFaq === i ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-gray-600 text-sm">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-8 px-4 border-t">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-xl">🇰🇷</span>
              </div>
              <span className="text-gray-600">Made in Korea</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-gray-600" />
              </div>
              <span className="text-gray-600">Medical-Grade</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-gray-600" />
              </div>
              <span className="text-gray-600">30-Day Guarantee</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <Truck className="w-5 h-5 text-gray-600" />
              </div>
              <span className="text-gray-600">Free Shipping</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-[#0D1B2A] text-white text-center text-sm">
        <p className="text-gray-400 mb-4">
          Our products are not intended to diagnose, cure, or prevent specific diseases or medical conditions.
        </p>
        <p className="text-gray-500">© 2024 SkinCoach. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default function LandingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    }>
      <LandingPageContent />
    </Suspense>
  )
}
