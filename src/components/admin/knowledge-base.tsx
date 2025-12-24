'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Package, Wrench, FileText, Plus, Edit, Trash2,
  Upload, Search, Grid, List,
  Loader2, X, BookOpen, Globe, Layout, Save, Image, Video, Copy, Check,
  ChevronDown, ChevronUp, Zap, MessageSquare, Shield, ShoppingCart
} from 'lucide-react'
import PolicyManager from './policy-manager'
import ProductCatalogManager from './product-catalog-manager'
import { type Language, getTranslation } from '@/lib/translations'

// Types
interface Service {
  id: string
  name: string
  description: string
  category: string
  duration?: number
  price?: number
  currency?: string
  tags?: string[]
  created_at: string
  updated_at: string
}

interface IndustryKnowledge {
  id: string
  topic: string
  content: string
  category: string
  keywords?: string[]
  created_at: string
  updated_at: string
}

interface KnowledgeBaseProps {
  businessUnitId: string
  language: Language
}

type ActiveSubTab = 'industry' | 'products' | 'services' | 'landing' | 'media'

interface MediaFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  createdAt: string
}
type ViewMode = 'grid' | 'list'

const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ businessUnitId, language }) => {
  const t = getTranslation(language)

  // State
  const [activeSubTab, setActiveSubTab] = useState<ActiveSubTab>('industry')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Data state
  const [services, setServices] = useState<Service[]>([])
  const [industryKnowledge, setIndustryKnowledge] = useState<IndustryKnowledge[]>([])

  // UI state
  const [showUrlModal, setShowUrlModal] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingMessage, setProcessingMessage] = useState('')

  // Service modal state
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [newService, setNewService] = useState({ name: '', description: '', price: '' })

  // Landing Page state
  const [landingPageData, setLandingPageData] = useState<any>(null)
  const [hasLandingPage, setHasLandingPage] = useState(false)
  const [landingPageLoading, setLandingPageLoading] = useState(false)
  const [landingPageSaving, setLandingPageSaving] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState('US')
  const [selectedLangCode, setSelectedLangCode] = useState('en')
  const [availableLocales, setAvailableLocales] = useState<{country: string, language_code: string}[]>([])
  // Collapsible section state for landing page editor
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    header: false,
    hero: false,
    problem: true,
    solution: true,
    proof: true,
    offer: true,
    footer: true
  })
  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  // Media Library state
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [mediaLoading, setMediaLoading] = useState(false)
  const [mediaUploading, setMediaUploading] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [heroSlideUploading, setHeroSlideUploading] = useState<number | null>(null)
  const heroSlideInputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [showMediaPicker, setShowMediaPicker] = useState<number | null>(null) // slide index or null
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  // File refs
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const industryDocInputRef = useRef<HTMLInputElement>(null)
  const mediaInputRef = useRef<HTMLInputElement>(null)

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [businessUnitId, activeSubTab])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Load based on active tab
      if (activeSubTab === 'industry') {
        const response = await fetch(`/api/knowledge?action=load_knowledge&businessUnitId=${businessUnitId}`)
        const data = await response.json()
        // API returns { data: knowledge } not { success: true, entries: [...] }
        if (data.data) setIndustryKnowledge(data.data || [])
      } else if (activeSubTab === 'services') {
        // Use booking services table (same as Booking Management)
        const response = await fetch(`/api/booking/services?businessUnitId=${businessUnitId}`)
        const data = await response.json()
        // Booking API returns { data: [...] } not { services: [...] }
        if (data.data) setServices(data.data || [])
      }
      // Products tab uses ProductCatalogManager which loads its own data
      // Policies tab uses PolicyManager which loads its own data
      // Landing tab loads its own data via loadLandingPage
      if (activeSubTab === 'landing') {
        loadLandingPage()
      }
      // Media tab loads its own data via loadMediaFiles
      if (activeSubTab === 'media') {
        loadMediaFiles()
      }
    } catch (error) {
      console.error('Failed to load knowledge base data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Landing Page functions
  const loadLandingPage = async (country?: string, langCode?: string) => {
    if (!businessUnitId) return
    const loadCountry = country || selectedCountry
    const loadLang = langCode || selectedLangCode

    setLandingPageLoading(true)
    try {
      const response = await fetch(`/api/landing-page?businessUnit=${businessUnitId}&country=${loadCountry}&language=${loadLang}`)
      const data = await response.json()

      // Update available locales
      if (data.availableLocales) {
        setAvailableLocales(data.availableLocales)
      }

      if (data.landingPage) {
        // Migrate legacy hero data to hero_slides if needed
        const landingPage = { ...data.landingPage }
        if ((!landingPage.hero_slides || landingPage.hero_slides.length === 0) && landingPage.hero_headline) {
          landingPage.hero_slides = [{
            headline: landingPage.hero_headline || '',
            subheadline: landingPage.hero_subheadline || '',
            content: '',
            background_url: '',
            background_type: 'image',
            cta_text: landingPage.hero_cta_text || 'Shop Now',
            cta_url: '#shop',
            text_align: 'center'
          }]
        }
        setLandingPageData(landingPage)
        setHasLandingPage(true)
      } else {
        // No landing page for this locale - create default with the selected locale
        const defaultPage = getDefaultLandingPage()
        defaultPage.country = loadCountry
        defaultPage.language_code = loadLang
        // Set currency based on country
        const currencyInfo = countryCurrencyMap[loadCountry] || countryCurrencyMap['US']
        defaultPage.currency = currencyInfo.currency
        defaultPage.currency_symbol = currencyInfo.symbol
        setLandingPageData(defaultPage)
        setHasLandingPage(false)
      }
    } catch (error) {
      console.error('Error loading landing page:', error)
      const defaultPage = getDefaultLandingPage()
      defaultPage.country = loadCountry
      defaultPage.language_code = loadLang
      setLandingPageData(defaultPage)
      setHasLandingPage(false)
    } finally {
      setLandingPageLoading(false)
    }
  }

  // Handle locale change - load landing page for new locale
  const handleLocaleChange = (newCountry: string, newLangCode: string) => {
    setSelectedCountry(newCountry)
    setSelectedLangCode(newLangCode)
    loadLandingPage(newCountry, newLangCode)
  }

  // Country to currency mapping
  const countryCurrencyMap: Record<string, { currency: string; symbol: string; locale: string }> = {
    'US': { currency: 'USD', symbol: '$', locale: 'en-US' },
    'CA': { currency: 'CAD', symbol: 'CA$', locale: 'en-CA' },
    'GB': { currency: 'GBP', symbol: '£', locale: 'en-GB' },
    'AU': { currency: 'AUD', symbol: 'A$', locale: 'en-AU' },
    'NZ': { currency: 'NZD', symbol: 'NZ$', locale: 'en-NZ' },
    'EU': { currency: 'EUR', symbol: '€', locale: 'de-DE' },
    'JP': { currency: 'JPY', symbol: '¥', locale: 'ja-JP' },
    'CN': { currency: 'CNY', symbol: '¥', locale: 'zh-CN' },
    'HK': { currency: 'HKD', symbol: 'HK$', locale: 'zh-HK' },
    'TW': { currency: 'TWD', symbol: 'NT$', locale: 'zh-TW' },
    'SG': { currency: 'SGD', symbol: 'S$', locale: 'en-SG' },
    'MY': { currency: 'MYR', symbol: 'RM', locale: 'ms-MY' },
    'TH': { currency: 'THB', symbol: '฿', locale: 'th-TH' },
    'KR': { currency: 'KRW', symbol: '₩', locale: 'ko-KR' },
    'IN': { currency: 'INR', symbol: '₹', locale: 'en-IN' },
    'AE': { currency: 'AED', symbol: 'AED', locale: 'ar-AE' },
    'SA': { currency: 'SAR', symbol: 'SAR', locale: 'ar-SA' },
    'MX': { currency: 'MXN', symbol: 'MX$', locale: 'es-MX' },
    'BR': { currency: 'BRL', symbol: 'R$', locale: 'pt-BR' },
  }

  const countryOptions = [
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺' },
    { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
    { code: 'EU', name: 'European Union', flag: '🇪🇺' },
    { code: 'JP', name: 'Japan', flag: '🇯🇵' },
    { code: 'CN', name: 'China', flag: '🇨🇳' },
    { code: 'HK', name: 'Hong Kong', flag: '🇭🇰' },
    { code: 'TW', name: 'Taiwan', flag: '🇹🇼' },
    { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
    { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
    { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
    { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
    { code: 'IN', name: 'India', flag: '🇮🇳' },
    { code: 'AE', name: 'UAE', flag: '🇦🇪' },
    { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
    { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
    { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  ]

  const languageOptions = [
    { code: 'en', short: 'en', name: 'English', native: 'English' },
    { code: 'zh-CN', short: 'cn', name: 'Chinese (Simplified)', native: '简体中文' },
    { code: 'zh-TW', short: 'tw', name: 'Chinese (Traditional)', native: '繁體中文' },
    { code: 'ja', short: 'ja', name: 'Japanese', native: '日本語' },
    { code: 'ko', short: 'ko', name: 'Korean', native: '한국어' },
    { code: 'es', short: 'es', name: 'Spanish', native: 'Español' },
    { code: 'pt', short: 'pt', name: 'Portuguese', native: 'Português' },
    { code: 'fr', short: 'fr', name: 'French', native: 'Français' },
    { code: 'de', short: 'de', name: 'German', native: 'Deutsch' },
    { code: 'it', short: 'it', name: 'Italian', native: 'Italiano' },
    { code: 'th', short: 'th', name: 'Thai', native: 'ไทย' },
    { code: 'vi', short: 'vi', name: 'Vietnamese', native: 'Tiếng Việt' },
    { code: 'ms', short: 'ms', name: 'Malay', native: 'Bahasa Melayu' },
    { code: 'ar', short: 'ar', name: 'Arabic', native: 'العربية' },
    { code: 'hi', short: 'hi', name: 'Hindi', native: 'हिन्दी' },
  ]

  // Helper to get locale path like /us/en
  const getLocalePath = (countryCode: string, langCode: string) => {
    const lang = languageOptions.find(l => l.code === langCode)
    return `/${countryCode.toLowerCase()}/${lang?.short || langCode.substring(0, 2)}`
  }

  const getDefaultLandingPage = () => ({
    // Localization settings
    country: 'US',
    language_code: 'en',
    currency: 'USD',
    currency_symbol: '$',
    announcements: [], // Array of announcement messages that rotate every 5 seconds
    // Menu bar settings
    logo_url: '',
    logo_text: '',
    logo_position: 'left', // 'left' or 'center'
    menu_items: [
      { label: 'Home', url: '#', enabled: true },
      { label: 'Shop', url: '#shop', enabled: true },
      { label: 'About', url: '#about', enabled: false },
      { label: 'Contact', url: '#contact', enabled: false },
    ],
    // Right side utilities
    show_search: true,
    show_account: true,
    show_cart: true,
    account_url: '/account',
    cart_url: '/cart',

    // ═══════════════════════════════════════════════════════════════════
    // SECTION 1: HERO SECTION - First impression
    // ═══════════════════════════════════════════════════════════════════
    hero_slides: [
      { headline: '', subheadline: '', content: '', background_url: '', background_type: 'image', cta_text: 'Shop Now', cta_url: '#shop', text_align: 'center' }
    ],
    hero_headline: '', // Legacy - kept for backwards compatibility
    hero_subheadline: '',
    hero_product_name: '',
    hero_benefits: [],
    hero_cta_text: 'Shop Now',

    // ═══════════════════════════════════════════════════════════════════
    // SECTION 2: PROBLEM / STORY - Make user feel understood
    // ═══════════════════════════════════════════════════════════════════
    problem_section_enabled: false,
    problem_headline: '',
    problem_subheadline: '',
    problem_variant: 'emotional', // 'emotional' | 'fear-based' | 'aspirational' | 'educational'
    problem_statements: [], // Array of { icon: '', text: '', highlight: false }
    story_blocks: [], // Array of { type: 'text' | 'image' | 'quote', content: '', image_url: '', author: '' }
    pain_points: [], // Array of { icon: '', title: '', description: '' }

    // ═══════════════════════════════════════════════════════════════════
    // SECTION 3: SOLUTION / HOW IT WORKS - Explain the idea
    // ═══════════════════════════════════════════════════════════════════
    solution_section_enabled: false,
    solution_headline: '',
    solution_subheadline: '',
    solution_variant: '3-step', // '3-step' | 'visual-cards' | 'video-based'
    solution_steps: [], // Array of { step_number: 1, icon: '', title: '', description: '', image_url: '' }
    solution_features: [], // Array of { icon: '', title: '', description: '', benefits: [] }
    solution_video_url: '',
    // Legacy fields - kept for backwards compatibility
    tech_headline: '',
    tech_subheadline: '',
    tech_features: [],
    performance_metrics: [],
    how_to_use_headline: '',
    how_to_use_steps: [],
    how_to_use_footer: '',
    ingredients_headline: '',
    ingredients_subheadline: '',
    ingredients: [],

    // ═══════════════════════════════════════════════════════════════════
    // SECTION 4: PROOF / TRUST - Build credibility
    // ═══════════════════════════════════════════════════════════════════
    proof_section_enabled: true,
    proof_headline: '',
    proof_subheadline: '',
    proof_variant: 'social', // 'social' | 'clinical' | 'expert'
    // Testimonials
    testimonials_headline: '',
    testimonials: [],
    testimonials_stats: { recommend_pct: 0, five_star_pct: 0 },
    // Clinical/Science Claims
    clinical_results: [],
    science_claims: [], // Array of { claim: '', source: '', link: '' }
    // Expert Quotes
    expert_quotes: [], // Array of { name: '', title: '', organization: '', quote: '', image_url: '' }
    // Partner/Press Logos
    partner_logos: [], // Array of { name: '', image_url: '', link: '' }
    // FAQs
    landing_faqs: [],
    // Trust Badges
    trust_badges: [],

    // ═══════════════════════════════════════════════════════════════════
    // SECTION 5: CTA / OFFER - Drive action
    // ═══════════════════════════════════════════════════════════════════
    offer_section_enabled: true,
    offer_headline: '',
    offer_subheadline: '',
    offer_variant: 'buy', // 'buy' | 'book' | 'quiz' | 'contact'
    offer_cta_text: 'Buy Now',
    offer_cta_url: '#shop',
    offer_urgency_text: '', // e.g., "Limited Time Only!"
    // Pricing
    pricing_headline: '',
    pricing_subheadline: '',
    pricing_options: [],
    show_sold_indicator: false,
    sold_percentage: 0,
    // Guarantee
    guarantee_text: '',
    guarantee_icon: '🛡️',

    // ═══════════════════════════════════════════════════════════════════
    // FOOTER & THEME
    // ═══════════════════════════════════════════════════════════════════
    footer_disclaimer: '',
    primary_color: '#4A90D9',
    secondary_color: '#0D1B2A',
    is_active: true
  })

  const saveLandingPage = async () => {
    console.log('[DEBUG v2] saveLandingPage called')
    if (!businessUnitId || !landingPageData) {
      console.error('Missing businessUnitId or landingPageData', { businessUnitId, landingPageData })
      alert('Cannot save: missing business unit or data')
      return
    }
    setLandingPageSaving(true)
    try {
      // Create payload without id, business_unit_id, created_at, updated_at to prevent conflicts
      const { id, business_unit_id, created_at, updated_at, ...cleanData } = landingPageData
      const payload = {
        businessUnitId: businessUnitId,
        ...cleanData
      }
      console.log('[DEBUG v2] businessUnitId:', businessUnitId)
      console.log('[DEBUG v2] payload keys:', Object.keys(payload))
      console.log('[DEBUG v2] announcements:', payload.announcements)

      console.log('[DEBUG v2] Sending POST to /api/landing-page')
      const response = await fetch('/api/landing-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      console.log('[DEBUG v2] Response status:', response.status, response.statusText)
      const responseText = await response.text()
      console.log('[DEBUG v2] Response text:', responseText.substring(0, 500))

      let result
      try {
        result = JSON.parse(responseText)
        console.log('[DEBUG v2] Parsed result:', result.success ? 'SUCCESS' : result.error)
      } catch (e) {
        console.error('[DEBUG v2] Failed to parse response:', e)
        result = { error: 'Invalid response from server' }
      }
      if (response.ok && result.success) {
        setHasLandingPage(true)
        // Reload the landing page to get the updated data with proper IDs
        // Pass the current locale to ensure we reload the correct page
        await loadLandingPage(landingPageData.country || 'US', landingPageData.language_code || 'en')
        console.log('[DEBUG v2] Landing page saved successfully!')
        alert(t.landingPageSaved || 'Landing page saved successfully!')
      } else {
        console.error('[DEBUG v2] Failed to save landing page:', JSON.stringify(result, null, 2))
        console.error('[DEBUG v2] Response status:', response.status)
        console.error('[DEBUG v2] Response ok:', response.ok)
        const errorMsg = result.error || result.message || 'Unknown error'
        const details = result.details || result.code || ''
        alert(`Failed to save: ${errorMsg}${details ? '\n\nDetails: ' + details : ''}\n\nStatus: ${response.status}`)
      }
    } catch (error) {
      console.error('[DEBUG v2] Error saving landing page:', error)
      alert('Error saving landing page: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setLandingPageSaving(false)
    }
  }

  // Media Library functions
  const loadMediaFiles = async () => {
    if (!businessUnitId) return
    setMediaLoading(true)
    try {
      const response = await fetch(`/api/media-library?businessUnit=${businessUnitId}`)
      const data = await response.json()
      if (data.files) {
        setMediaFiles(data.files)
      }
    } catch (error) {
      console.error('Error loading media files:', error)
    } finally {
      setMediaLoading(false)
    }
  }

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setMediaUploading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formData = new FormData()
        formData.append('file', file)
        formData.append('businessUnit', businessUnitId)

        const response = await fetch('/api/media-library', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          const error = await response.json()
          alert(`Failed to upload ${file.name}: ${error.error}`)
        }
      }
      // Reload media files after upload
      await loadMediaFiles()
    } catch (error) {
      console.error('Error uploading media:', error)
      alert('Error uploading media files')
    } finally {
      setMediaUploading(false)
      if (mediaInputRef.current) {
        mediaInputRef.current.value = ''
      }
    }
  }

  // Logo upload handler
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type - only allow PNG, JPG, WebP, GIF
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a PNG, JPG, WebP, or GIF image.\nSVG files are not supported.')
      return
    }

    // Validate file size (max 2MB for logo)
    if (file.size > 2 * 1024 * 1024) {
      alert('Logo image must be less than 2MB')
      return
    }

    setLogoUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('businessUnitId', businessUnitId)

      const response = await fetch('/api/ecommerce/upload-image', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const data = await response.json()
      if (data.url) {
        setLandingPageData({ ...landingPageData, logo_url: data.url })
      }
    } catch (error: any) {
      console.error('Error uploading logo:', error)
      alert(`Failed to upload logo: ${error.message}`)
    } finally {
      setLogoUploading(false)
      if (logoInputRef.current) {
        logoInputRef.current.value = ''
      }
    }
  }

  // Hero slide background upload handler
  const handleHeroSlideUpload = async (e: React.ChangeEvent<HTMLInputElement>, slideIndex: number) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type - allow images and videos
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')

    if (!isImage && !isVideo) {
      alert('Please select an image or video file')
      return
    }

    // Validate file size (max 10MB for images, 50MB for videos)
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSize) {
      alert(`File must be less than ${isVideo ? '50MB' : '10MB'}`)
      return
    }

    setHeroSlideUploading(slideIndex)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('businessUnitId', businessUnitId)

      const response = await fetch('/api/ecommerce/upload-image', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const data = await response.json()
      if (data.url) {
        const slides = [...(landingPageData.hero_slides || [])]
        slides[slideIndex] = {
          ...slides[slideIndex],
          background_url: data.url,
          background_type: isVideo ? 'video' : 'image'
        }
        setLandingPageData({ ...landingPageData, hero_slides: slides })
      }
    } catch (error: any) {
      console.error('Error uploading hero background:', error)
      alert(`Failed to upload: ${error.message}`)
    } finally {
      setHeroSlideUploading(null)
      if (heroSlideInputRefs.current[slideIndex]) {
        heroSlideInputRefs.current[slideIndex]!.value = ''
      }
    }
  }

  // Select media from library for hero slide
  const selectMediaForHeroSlide = (slideIndex: number, file: MediaFile) => {
    const isVideo = file.type.startsWith('video/')
    const slides = [...(landingPageData.hero_slides || [])]
    slides[slideIndex] = {
      ...slides[slideIndex],
      background_url: file.url,
      background_type: isVideo ? 'video' : 'image'
    }
    setLandingPageData({ ...landingPageData, hero_slides: slides })
    setShowMediaPicker(null)
  }

  const deleteMediaFile = async (fileName: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return

    try {
      const response = await fetch(
        `/api/media-library?businessUnit=${businessUnitId}&fileName=${encodeURIComponent(fileName)}`,
        { method: 'DELETE' }
      )
      if (response.ok) {
        await loadMediaFiles()
      } else {
        const error = await response.json()
        alert(`Failed to delete: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting media:', error)
      alert('Error deleting file')
    }
  }

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedUrl(url)
      setTimeout(() => setCopiedUrl(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const isVideo = (type: string) => type.startsWith('video/')
  const isImage = (type: string) => type.startsWith('image/')

  // Handle Excel/CSV upload
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    setProcessingMessage('Analyzing file with AI...')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', activeSubTab)
      formData.append('businessUnitId', businessUnitId)

      const response = await fetch('/api/knowledge-base/upload-excel', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        setProcessingMessage(`Imported ${result.count} items successfully!`)
        setTimeout(() => {
          setIsProcessing(false)
          setProcessingMessage('')
          loadData()
        }, 2000)
      } else {
        throw new Error(result.error || 'Failed to import')
      }
    } catch (error) {
      console.error('Excel upload error:', error)
      setProcessingMessage('Failed to process file')
      setTimeout(() => {
        setIsProcessing(false)
        setProcessingMessage('')
      }, 3000)
    }

    // Clear input
    if (excelInputRef.current) excelInputRef.current.value = ''
  }

  // Handle document upload (PDF, Word, Excel, etc.) - client-side extraction
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    setProcessingMessage(`Processing ${file.name} with AI...`)

    try {
      const fileName = file.name.toLowerCase()

      // Use AI to understand and extract content from Excel/documents
      // Send to server-side API which uses Gemini to intelligently extract data
      if (activeSubTab === 'products' || activeSubTab === 'services') {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', activeSubTab)
        formData.append('businessUnitId', businessUnitId)

        const response = await fetch('/api/knowledge-base/upload-pdf', {
          method: 'POST',
          body: formData
        })

        const result = await response.json()

        if (result.success) {
          setProcessingMessage(`AI extracted ${result.count} ${activeSubTab} successfully!`)
          setTimeout(() => {
            setIsProcessing(false)
            setProcessingMessage('')
            loadData()
          }, 2000)
        } else {
          throw new Error(result.error || 'Failed to process document')
        }

        if (pdfInputRef.current) pdfInputRef.current.value = ''
        return
      }

      // For non-product/service tabs, extract text and save to knowledge base
      const fileType = file.type
      let extractedText = ''
      const topic = file.name.replace(/\.[^.]+$/, '')

      // Handle DOCX files with mammoth
      if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
        const mammoth = await import('mammoth')
        const arrayBuffer = await file.arrayBuffer()
        const result = await mammoth.extractRawText({ arrayBuffer })
        extractedText = result.value
      }
      // Handle DOC files
      else if (fileName.endsWith('.doc')) {
        try {
          const mammoth = await import('mammoth')
          const arrayBuffer = await file.arrayBuffer()
          const result = await mammoth.extractRawText({ arrayBuffer })
          extractedText = result.value
        } catch {
          extractedText = await file.text()
        }
      }
      // Handle PDF files - send to server API (Gemini can read PDFs properly including Chinese)
      else if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        setProcessingMessage('Uploading PDF to AI for extraction...')
        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', 'industry')
        formData.append('businessUnitId', businessUnitId)

        const response = await fetch('/api/knowledge-base/upload-pdf', {
          method: 'POST',
          body: formData
        })

        const result = await response.json()

        if (result.success) {
          setProcessingMessage(`AI extracted ${result.count} knowledge entries from PDF!`)
          setTimeout(() => {
            setIsProcessing(false)
            setProcessingMessage('')
            loadData()
          }, 2000)
        } else {
          throw new Error(result.error || 'Failed to process PDF')
        }

        if (pdfInputRef.current) pdfInputRef.current.value = ''
        return
      }
      // Handle text/CSV files
      else if (fileType.includes('text') || fileName.endsWith('.txt') || fileName.endsWith('.md') || fileName.endsWith('.csv')) {
        extractedText = await file.text()
      }
      else {
        throw new Error('Unsupported file type. Use Excel (.xlsx) for product lists, or PDF/Word for documents.')
      }

      if (!extractedText.trim()) {
        throw new Error('Could not extract text from document')
      }

      // Save to knowledge base
      const response = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_knowledge',
          businessUnitId: businessUnitId,
          data: {
            topic: topic,
            content: extractedText.trim(),
            category: activeSubTab === 'products' ? 'Product Information' : 'Service Information',
            keywords: [file.name, activeSubTab, 'uploaded'],
            confidence: 0.8
          }
        })
      })

      const result = await response.json()

      if (result.success) {
        setProcessingMessage(`Document "${file.name}" imported successfully!`)
        setTimeout(() => {
          setIsProcessing(false)
          setProcessingMessage('')
          loadData()
        }, 2000)
      } else {
        throw new Error(result.error || 'Failed to save document')
      }
    } catch (error: any) {
      console.error('Document upload error:', error)
      setProcessingMessage(error.message || 'Failed to process document')
      setTimeout(() => {
        setIsProcessing(false)
        setProcessingMessage('')
      }, 3000)
    }

    // Clear input
    if (pdfInputRef.current) pdfInputRef.current.value = ''
  }

  // Handle Industry Document upload - client-side extraction like the original knowledge tab
  const handleIndustryDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    setProcessingMessage('Extracting content from document...')

    try {
      const fileName = file.name
      const fileType = file.type
      let extractedText = ''
      let topic = fileName.replace(/\.[^.]+$/, '') // Remove extension

      // Handle DOCX files with mammoth
      if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
        const mammoth = await import('mammoth')
        const arrayBuffer = await file.arrayBuffer()
        const result = await mammoth.extractRawText({ arrayBuffer })
        extractedText = result.value
      }
      // Handle DOC files (try mammoth)
      else if (fileName.endsWith('.doc')) {
        try {
          const mammoth = await import('mammoth')
          const arrayBuffer = await file.arrayBuffer()
          const result = await mammoth.extractRawText({ arrayBuffer })
          extractedText = result.value
        } catch {
          // If mammoth fails for .doc, read as text
          extractedText = await file.text()
        }
      }
      // Handle PDF files - send to server API (Gemini can read PDFs properly including Chinese)
      else if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        setProcessingMessage('Uploading PDF to AI for extraction...')
        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', 'industry')
        formData.append('businessUnitId', businessUnitId)

        const response = await fetch('/api/knowledge-base/upload-pdf', {
          method: 'POST',
          body: formData
        })

        const result = await response.json()

        if (result.success) {
          setProcessingMessage(`AI extracted ${result.count} knowledge entries from PDF!`)
          setTimeout(() => {
            setIsProcessing(false)
            setProcessingMessage('')
            loadData()
          }, 2000)
        } else {
          throw new Error(result.error || 'Failed to process PDF')
        }

        if (industryDocInputRef.current) industryDocInputRef.current.value = ''
        return
      }
      // Handle text files
      else if (fileType.includes('text') || fileName.endsWith('.txt') || fileName.endsWith('.md') || fileName.endsWith('.csv')) {
        extractedText = await file.text()
      }
      // Handle Excel files
      else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const XLSX = await import('xlsx')
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        let allText = ''
        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName]
          const csv = XLSX.utils.sheet_to_csv(sheet)
          allText += `Sheet: ${sheetName}\n${csv}\n\n`
        }
        extractedText = allText
      }
      // Handle images with Gemini Vision API
      else if (fileType.startsWith('image/') || fileName.match(/\.(png|jpg|jpeg|gif|webp|bmp)$/i)) {
        setProcessingMessage('Extracting text from image with AI...')

        // Convert image to base64
        const arrayBuffer = await file.arrayBuffer()
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        )

        // Determine mime type
        let mimeType = fileType
        if (fileName.endsWith('.png')) mimeType = 'image/png'
        else if (fileName.match(/\.jpe?g$/i)) mimeType = 'image/jpeg'
        else if (fileName.endsWith('.gif')) mimeType = 'image/gif'
        else if (fileName.endsWith('.webp')) mimeType = 'image/webp'

        // Call API to process image with Gemini
        const response = await fetch('/api/knowledge-base/extract-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageData: base64,
            mimeType: mimeType,
            fileName: fileName
          })
        })

        const result = await response.json()
        if (result.success && result.text) {
          extractedText = result.text
        } else {
          throw new Error(result.error || 'Failed to extract text from image')
        }
      }
      else {
        throw new Error('Unsupported file type. Please upload PDF, Word, text files, or images.')
      }

      if (!extractedText.trim()) {
        throw new Error('Could not extract any text from the document')
      }

      // Save to knowledge table via API
      const response = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_knowledge',
          businessUnitId: businessUnitId,
          data: {
            topic: topic,
            content: extractedText.trim(),
            category: 'Industry Knowledge',
            keywords: [fileName, 'document', 'uploaded'],
            confidence: 0.8,
            fileName: fileName
          }
        })
      })

      const result = await response.json()

      if (result.success) {
        setProcessingMessage(`Document "${fileName}" imported successfully!`)
        setTimeout(() => {
          setIsProcessing(false)
          setProcessingMessage('')
          loadData()
        }, 2000)
      } else {
        throw new Error(result.error || 'Failed to save document')
      }
    } catch (error: any) {
      console.error('Industry doc upload error:', error)
      setProcessingMessage(error.message || 'Failed to process document')
      setTimeout(() => {
        setIsProcessing(false)
        setProcessingMessage('')
      }, 3000)
    }

    // Clear input
    if (industryDocInputRef.current) industryDocInputRef.current.value = ''
  }

  // Delete KB item (products, services)
  const handleDeleteKBItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      const endpoint = activeSubTab === 'products' ? 'products' : 'services'

      const response = await fetch(`/api/knowledge-base/${endpoint}?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadData()
      }
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  // Delete industry knowledge
  const handleDeleteIndustryKnowledge = async (id: string) => {
    if (!confirm('Are you sure you want to delete this knowledge entry?')) return

    try {
      // API uses DELETE method with query params
      const response = await fetch(`/api/knowledge?action=delete_knowledge&id=${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      if (result.success) {
        loadData()
      }
    } catch (error) {
      console.error('Delete knowledge error:', error)
    }
  }

  // Handle URL scraping
  const handleUrlScrape = async () => {
    if (!urlInput.trim()) return

    setIsProcessing(true)
    setProcessingMessage('Scraping website content...')
    setShowUrlModal(false)

    try {
      // Validate URL
      let url = urlInput.trim()
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url
      }

      // Call API to scrape URL
      const response = await fetch('/api/knowledge-base/scrape-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url,
          businessUnitId: businessUnitId
        })
      })

      const result = await response.json()

      if (result.success) {
        setProcessingMessage(`Website "${result.title || url}" imported successfully!`)
        setTimeout(() => {
          setIsProcessing(false)
          setProcessingMessage('')
          setUrlInput('')
          loadData()
        }, 2000)
      } else {
        throw new Error(result.error || 'Failed to scrape website')
      }
    } catch (error: any) {
      console.error('URL scrape error:', error)
      setProcessingMessage(error.message || 'Failed to scrape website')
      setTimeout(() => {
        setIsProcessing(false)
        setProcessingMessage('')
      }, 3000)
    }
  }

  // Filter services by search
  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get category color
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'skincare': 'bg-pink-500/20 text-pink-300',
      'supplements': 'bg-green-500/20 text-green-300',
      'devices': 'bg-blue-500/20 text-blue-300',
      'consultation': 'bg-purple-500/20 text-purple-300',
      'treatment': 'bg-cyan-500/20 text-cyan-300',
      'default': 'bg-slate-500/20 text-slate-300'
    }
    return colors[category.toLowerCase()] || colors.default
  }

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {/* Industry Knowledge Tab */}
          <button
            onClick={() => setActiveSubTab('industry')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeSubTab === 'industry'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Industry Knowledge
          </button>

          {/* Products Tab */}
          <button
            onClick={() => setActiveSubTab('products')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeSubTab === 'products'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Package className="w-4 h-4" />
            Products
          </button>

          {/* Services Tab */}
          <button
            onClick={() => setActiveSubTab('services')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeSubTab === 'services'
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Wrench className="w-4 h-4" />
            Services
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{services.length}</span>
          </button>

          {/* Landing Page Tab */}
          <button
            onClick={() => setActiveSubTab('landing')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeSubTab === 'landing'
                ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Layout className="w-4 h-4" />
            Landing Page
          </button>

          {/* Image Library Tab */}
          <button
            onClick={() => setActiveSubTab('media')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeSubTab === 'media'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Image className="w-4 h-4" />
            Image Library
          </button>
        </div>

        {/* View Mode Toggle */}
        {['products', 'services'].includes(activeSubTab) && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Hidden file input for document uploads (used by sub-tabs) */}
      <input
        ref={pdfInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.xlsx,.xls,.csv,.txt"
        onChange={handleDocumentUpload}
        className="hidden"
      />

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 flex items-center gap-4">
            <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
            <div>
              <p className="text-white font-medium">{processingMessage}</p>
              <p className="text-sm text-slate-400">Please wait...</p>
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="bg-slate-700/50 rounded-xl p-4 min-h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
        ) : (
          <>
            {/* Industry Knowledge Tab */}
            {activeSubTab === 'industry' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Industry Knowledge</h2>
                    <p className="text-sm text-slate-400 mt-1">
                      Upload documents or scrape websites for AI staff to learn from
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowUrlModal(true)}
                      disabled={isProcessing}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-slate-600"
                    >
                      <Globe className="w-4 h-4" />
                      Add URL
                    </button>
                    <button
                      onClick={() => industryDocInputRef.current?.click()}
                      disabled={isProcessing}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-600"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Document
                    </button>
                  </div>
                </div>

                {/* Hidden file input for industry documents */}
                <input
                  ref={industryDocInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.xlsx,.xls,.csv,.png,.jpg,.jpeg,.gif,.webp"
                  onChange={handleIndustryDocUpload}
                  className="hidden"
                />

                {/* Document upload area */}
                <div className="border-2 border-dashed border-slate-600 rounded-xl p-12 text-center">
                  <BookOpen className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-300 mb-2">
                    Upload Industry Documents
                  </h3>
                  <p className="text-sm text-slate-400 mb-4">
                    PDFs, Word docs, product manuals, training guides, FAQs, etc.
                  </p>
                  <button
                    onClick={() => industryDocInputRef.current?.click()}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 disabled:bg-slate-600"
                  >
                    Browse Files
                  </button>
                </div>

                {/* Uploaded documents list */}
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  </div>
                ) : industryKnowledge.length === 0 ? (
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <p className="text-slate-400 text-sm text-center">
                      No documents uploaded yet. Upload a document to get started.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium text-white">
                      Uploaded Documents ({industryKnowledge.length})
                    </h3>
                    <div className="grid gap-3">
                      {industryKnowledge.map((entry) => (
                        <div
                          key={entry.id}
                          className="bg-slate-700/50 rounded-lg p-4 hover:bg-slate-700 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-white font-medium">{entry.topic}</h4>
                              <p className="text-slate-400 text-sm mt-1 line-clamp-2">
                                {entry.content.substring(0, 200)}...
                              </p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                                <span className="bg-slate-600 px-2 py-0.5 rounded">
                                  {entry.category}
                                </span>
                                <span>
                                  {new Date(entry.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteIndustryKnowledge(entry.id)}
                              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-600 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Products Tab - Uses ProductCatalogManager */}
            {activeSubTab === 'products' && (
              <ProductCatalogManager
                businessUnitId={businessUnitId}
                language={language}
              />
            )}

            {/* Services Tab */}
            {activeSubTab === 'services' && (
              <div className="space-y-4">
                {/* Header with Add Button */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Manage Services</h3>
                    <p className="text-slate-400 text-sm">Create and manage services for booking</p>
                  </div>
                  <button
                    onClick={() => {
                      setNewService({ name: '', description: '', price: '' })
                      setEditingService(null)
                      setShowServiceModal(true)
                    }}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Service
                  </button>
                </div>

                {/* Services List */}
                {filteredServices.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-slate-800 rounded-lg">
                    <Wrench className="w-12 h-12 mb-4 opacity-50" />
                    <p>No services yet</p>
                    <p className="text-sm">Click "Add Service" to create your first service</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredServices.map(service => (
                      <div key={service.id} className="bg-slate-800 rounded-lg p-4 border border-slate-600">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h4 className="font-semibold text-lg">{service.name}</h4>
                              {service.price && (
                                <span className="text-green-400 font-semibold">${parseFloat(String(service.price)).toFixed(2)}</span>
                              )}
                            </div>
                            <p className="text-slate-400 text-sm">{service.description}</p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => {
                                setEditingService(service)
                                setNewService({
                                  name: service.name,
                                  description: service.description || '',
                                  price: service.price ? service.price.toString() : ''
                                })
                                setShowServiceModal(true)
                              }}
                              className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm(`Are you sure you want to delete "${service.name}"?`)) {
                                  try {
                                    const response = await fetch(`/api/booking/services?id=${service.id}`, {
                                      method: 'DELETE'
                                    })
                                    if (response.ok) {
                                      setServices(services.filter(s => s.id !== service.id))
                                      alert('Service deleted successfully')
                                    } else {
                                      throw new Error('Failed to delete')
                                    }
                                  } catch (error: any) {
                                    alert(`Error: ${error.message}`)
                                  }
                                }
                              }}
                              className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add/Edit Service Modal */}
                {showServiceModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 border border-slate-600">
                      <h3 className="text-xl font-semibold mb-4">
                        {editingService ? 'Edit Service' : 'Add New Service'}
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Service Name</label>
                          <input
                            type="text"
                            value={newService.name}
                            onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                            placeholder="e.g., Facial Treatment"
                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Description</label>
                          <textarea
                            value={newService.description}
                            onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                            placeholder="Describe the service..."
                            rows={3}
                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Price (USD)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={newService.price}
                            onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                            placeholder="0.00"
                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3 mt-6">
                        <button
                          onClick={async () => {
                            if (!newService.name || !newService.description) {
                              alert('Please fill in all required fields')
                              return
                            }
                            try {
                              const method = editingService ? 'POST' : 'POST'  // API uses POST for both create/update
                              const body = editingService
                                ? { id: editingService.id, ...newService, businessUnitId: businessUnitId }
                                : { ...newService, businessUnitId: businessUnitId }

                              const response = await fetch('/api/booking/services', {
                                method,
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(body)
                              })

                              if (response.ok) {
                                const result = await response.json()
                                // API returns { data: {...} } not { service: {...} }
                                const savedService = result.data
                                if (editingService) {
                                  setServices(services.map(s => s.id === savedService.id ? savedService : s))
                                } else {
                                  setServices([...services, savedService])
                                }
                                setShowServiceModal(false)
                                setNewService({ name: '', description: '', price: '' })
                                setEditingService(null)
                                alert('Service saved successfully')
                              } else {
                                throw new Error('Failed to save service')
                              }
                            } catch (error: any) {
                              alert(`Error: ${error.message}`)
                            }
                          }}
                          className="flex-1 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
                        >
                          {editingService ? 'Update' : 'Create'}
                        </button>
                        <button
                          onClick={() => {
                            setShowServiceModal(false)
                            setNewService({ name: '', description: '', price: '' })
                            setEditingService(null)
                          }}
                          className="flex-1 bg-slate-600 hover:bg-slate-500 px-4 py-2 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Landing Page Tab Content */}
            {activeSubTab === 'landing' && (
              <div>
                {/* Header Row with Title and Action Buttons */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
                    <Layout className="w-6 h-6 text-violet-400" />
                    {t.landingPageEditor || 'Landing Page Editor'}
                  </h2>
                  {landingPageData && (
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={saveLandingPage}
                        disabled={landingPageSaving}
                        className="flex items-center gap-1.5 bg-slate-600 hover:bg-slate-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        {landingPageSaving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => window.open(`/livechat?businessUnit=${businessUnitId}&country=${landingPageData.country || 'US'}&lang=${landingPageData.language_code || 'en'}`, '_blank')}
                        className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                      >
                        <Globe className="w-4 h-4" />
                        Preview
                      </button>
                      <button
                        onClick={async () => {
                          if (!hasLandingPage) {
                            alert('Please save the landing page first before publishing.')
                            return
                          }
                          const confirmPublish = landingPageData.is_published
                            ? confirm('This will unpublish the landing page. Continue?')
                            : confirm('This will make the landing page live. Continue?')
                          if (!confirmPublish) return

                          try {
                            const response = await fetch('/api/landing-page/publish', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                businessUnitId,
                                country: landingPageData.country || 'US',
                                language_code: landingPageData.language_code || 'en',
                                is_published: !landingPageData.is_published
                              })
                            })
                            const result = await response.json()
                            if (response.ok) {
                              setLandingPageData({ ...landingPageData, is_published: !landingPageData.is_published })
                              alert(landingPageData.is_published ? 'Landing page unpublished!' : 'Landing page is now live!')
                            } else {
                              alert('Failed to update publish status: ' + (result.error || 'Unknown error'))
                            }
                          } catch (err) {
                            alert('Error updating publish status')
                          }
                        }}
                        disabled={!hasLandingPage}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 ${
                          landingPageData.is_published
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-amber-500 hover:bg-amber-600 text-white'
                        }`}
                      >
                        {landingPageData.is_published ? (
                          <>
                            <Check className="w-4 h-4" />
                            Published
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            Publish
                          </>
                        )}
                      </button>
                      {landingPageData.is_published && (
                        <span className="text-green-400 text-xs">Live</span>
                      )}
                    </div>
                  )}
                </div>

                {landingPageLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                    <span className="ml-3 text-slate-400">Loading...</span>
                  </div>
                ) : landingPageData ? (
                  <div className="space-y-6">
                    {/* Country & Language Section - Compact */}
                    <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Current Locale Badge */}
                        <div className="flex items-center gap-2">
                          <span className="text-cyan-400 text-sm font-medium">Locale:</span>
                          <span className="text-white font-mono bg-cyan-600 px-2 py-1 rounded text-sm">
                            {getLocalePath(landingPageData.country || 'US', landingPageData.language_code || 'en')}
                          </span>
                          <span className="text-slate-300 text-sm">
                            {countryOptions.find(c => c.code === (landingPageData.country || 'US'))?.flag}
                            {' '}{landingPageData.currency_symbol || '$'}{landingPageData.currency || 'USD'}
                          </span>
                          {!hasLandingPage && <span className="text-amber-400 text-xs bg-amber-500/20 px-2 py-0.5 rounded">New</span>}
                        </div>

                        {/* Divider */}
                        <div className="h-6 w-px bg-slate-600 hidden md:block" />

                        {/* Country Selector */}
                        <select
                          value={landingPageData.country || 'US'}
                          onChange={(e) => {
                            const countryCode = e.target.value
                            const currencyInfo = countryCurrencyMap[countryCode] || countryCurrencyMap['US']
                            const exists = availableLocales.some(
                              l => l.country === countryCode && l.language_code === (landingPageData.language_code || 'en')
                            )
                            if (exists) {
                              handleLocaleChange(countryCode, landingPageData.language_code || 'en')
                            } else {
                              setSelectedCountry(countryCode)
                              setLandingPageData({
                                ...landingPageData,
                                country: countryCode,
                                currency: currencyInfo.currency,
                                currency_symbol: currencyInfo.symbol
                              })
                              setHasLandingPage(false)
                            }
                          }}
                          className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        >
                          {countryOptions.map(country => (
                            <option key={country.code} value={country.code}>
                              {country.flag} {country.code}
                            </option>
                          ))}
                        </select>

                        {/* Language Selector */}
                        <select
                          value={landingPageData.language_code || 'en'}
                          onChange={(e) => {
                            const langCode = e.target.value
                            const exists = availableLocales.some(
                              l => l.country === (landingPageData.country || 'US') && l.language_code === langCode
                            )
                            if (exists) {
                              handleLocaleChange(landingPageData.country || 'US', langCode)
                            } else {
                              setSelectedLangCode(langCode)
                              setLandingPageData({
                                ...landingPageData,
                                language_code: langCode
                              })
                              setHasLandingPage(false)
                            }
                          }}
                          className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        >
                          {languageOptions.map(lang => (
                            <option key={lang.code} value={lang.code}>
                              {lang.short.toUpperCase()} - {lang.native}
                            </option>
                          ))}
                        </select>

                        {/* Existing Locales */}
                        {availableLocales.length > 1 && (
                          <>
                            <div className="h-6 w-px bg-slate-600 hidden md:block" />
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="text-slate-400 text-xs">Switch:</span>
                              {availableLocales.map(locale => {
                                const isActive = (landingPageData.country || 'US') === locale.country &&
                                                 (landingPageData.language_code || 'en') === locale.language_code
                                if (isActive) return null
                                const country = countryOptions.find(c => c.code === locale.country)
                                return (
                                  <button
                                    key={`${locale.country}-${locale.language_code}`}
                                    onClick={() => handleLocaleChange(locale.country, locale.language_code)}
                                    className="px-2 py-0.5 rounded text-xs font-mono bg-slate-800 text-slate-300 hover:bg-slate-600 transition-colors"
                                  >
                                    {country?.flag}{getLocalePath(locale.country, locale.language_code)}
                                  </button>
                                )
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Announcement Section */}
                    <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-amber-400">Announcement Banner</h3>
                          <p className="text-sm text-slate-400 mt-1">Add multiple announcements that rotate every 5 seconds</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                setLandingPageData({
                                  ...landingPageData,
                                  announcements: [...(landingPageData.announcements || []), e.target.value]
                                })
                                e.target.value = ''
                              }
                            }}
                            className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                            defaultValue=""
                          >
                            <option value="" disabled>+ Add from suggestions...</option>
                            <option value="FREE SHIPPING ON ORDERS OVER $50">FREE SHIPPING ON ORDERS OVER $50</option>
                            <option value="90-DAY MONEY BACK GUARANTEE">90-DAY MONEY BACK GUARANTEE</option>
                            <option value="LIMITED TIME OFFER - 60% OFF TODAY ONLY">LIMITED TIME OFFER - 60% OFF TODAY ONLY</option>
                            <option value="BUY 2 GET 1 FREE - USE CODE: B2G1">BUY 2 GET 1 FREE - USE CODE: B2G1</option>
                            <option value="NEW CUSTOMERS: 20% OFF YOUR FIRST ORDER">NEW CUSTOMERS: 20% OFF YOUR FIRST ORDER</option>
                            <option value="SUBSCRIBE & SAVE 15% ON EVERY ORDER">SUBSCRIBE & SAVE 15% ON EVERY ORDER</option>
                            <option value="SAME DAY SHIPPING ON ORDERS BEFORE 2PM">SAME DAY SHIPPING ON ORDERS BEFORE 2PM</option>
                            <option value="OVER 50,000+ HAPPY CUSTOMERS WORLDWIDE">OVER 50,000+ HAPPY CUSTOMERS WORLDWIDE</option>
                            <option value="DERMATOLOGIST TESTED & APPROVED">DERMATOLOGIST TESTED & APPROVED</option>
                            <option value="100% NATURAL INGREDIENTS - CRUELTY FREE">100% NATURAL INGREDIENTS - CRUELTY FREE</option>
                          </select>
                          <button
                            onClick={() => setLandingPageData({
                              ...landingPageData,
                              announcements: [...(landingPageData.announcements || []), '']
                            })}
                            className="flex items-center gap-1 px-3 py-2 text-sm bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 rounded-lg transition-colors"
                          >
                            <Plus className="w-4 h-4" /> Custom
                          </button>
                        </div>
                      </div>

                      {(!landingPageData.announcements || landingPageData.announcements.length === 0) ? (
                        <div className="text-center py-6 bg-slate-800/50 rounded-lg border border-dashed border-slate-600">
                          <p className="text-slate-400 mb-3">No announcements yet</p>
                          <p className="text-slate-500 text-sm">Select from suggestions above or add a custom announcement</p>
                          <p className="text-amber-400/70 text-xs mt-2">After adding, click "Save" to save</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {landingPageData.announcements.map((announcement: string, index: number) => (
                            <div key={index} className="flex gap-3 items-center">
                              <span className="text-slate-500 text-sm w-6">{index + 1}.</span>
                              <input
                                type="text"
                                value={announcement}
                                onChange={(e) => {
                                  const updated = [...landingPageData.announcements]
                                  updated[index] = e.target.value
                                  setLandingPageData({...landingPageData, announcements: updated})
                                }}
                                placeholder="e.g., FREE SHIPPING ON ORDERS OVER $50"
                                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                              />
                              <button
                                onClick={() => {
                                  const updated = landingPageData.announcements.filter((_: string, i: number) => i !== index)
                                  setLandingPageData({...landingPageData, announcements: updated})
                                }}
                                className="text-red-400 hover:text-red-300 p-2"
                                title="Remove"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          <p className="text-xs text-slate-500 mt-2">
                            These announcements will rotate automatically every 5 seconds on your landing page.
                          </p>
                          <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                            <span>*</span> Remember to click "Save" to save your changes.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Menu Bar Section */}
                    <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
                      <h3 className="text-lg font-semibold mb-4 text-indigo-400">Menu Bar</h3>

                      {/* Visual Layout Preview */}
                      <div className="bg-slate-800 rounded-lg p-3 mb-4 border border-slate-600">
                        <p className="text-xs text-slate-500 mb-2">Layout Preview (Desktop)</p>
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            {landingPageData.logo_position === 'left' && (
                              <span className="bg-indigo-500/30 text-indigo-300 px-2 py-1 rounded">Logo</span>
                            )}
                            <span className="text-slate-400">Menu Items →</span>
                          </div>
                          {landingPageData.logo_position === 'center' && (
                            <span className="bg-indigo-500/30 text-indigo-300 px-2 py-1 rounded">Logo</span>
                          )}
                          <div className="flex items-center gap-2">
                            {landingPageData.show_search && <span className="text-slate-400">🔍</span>}
                            {landingPageData.show_account && <span className="text-slate-400">👤</span>}
                            {landingPageData.show_cart && <span className="text-slate-400">🛒</span>}
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                          Mobile: {landingPageData.logo_position === 'left' ? 'Logo left, ☰ menu right' : 'Logo center, ☰ menu left'}
                        </p>
                      </div>

                      <div className="grid gap-6">
                        {/* Logo Settings Row */}
                        <div>
                          <label className="block text-sm font-medium mb-2 text-slate-300">Logo Settings</label>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">Position</label>
                              <select
                                value={landingPageData.logo_position || 'left'}
                                onChange={(e) => setLandingPageData({...landingPageData, logo_position: e.target.value})}
                                className="w-full px-2 py-1.5 bg-slate-800 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              >
                                <option value="left">Left</option>
                                <option value="center">Center</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">Logo Text</label>
                              <input
                                type="text"
                                value={landingPageData.logo_text || ''}
                                onChange={(e) => setLandingPageData({...landingPageData, logo_text: e.target.value})}
                                placeholder="Brand Name"
                                className="w-full px-2 py-1.5 bg-slate-800 border border-slate-600 rounded text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-xs text-slate-400 mb-1">Logo Image</label>
                              <div className="flex items-center gap-3">
                                {landingPageData.logo_url ? (
                                  <div className="relative">
                                    <img
                                      src={landingPageData.logo_url}
                                      alt="Logo preview"
                                      className="h-10 w-auto max-w-[120px] object-contain bg-white rounded p-1"
                                    />
                                    <button
                                      onClick={() => setLandingPageData({...landingPageData, logo_url: ''})}
                                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="h-10 w-20 bg-slate-800 border border-dashed border-slate-600 rounded flex items-center justify-center">
                                    <Image className="w-5 h-5 text-slate-500" />
                                  </div>
                                )}
                                <button
                                  onClick={() => logoInputRef.current?.click()}
                                  disabled={logoUploading}
                                  className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                >
                                  {logoUploading ? (
                                    <>
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      Uploading...
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="w-4 h-4" />
                                      {landingPageData.logo_url ? 'Change' : 'Upload'}
                                    </>
                                  )}
                                </button>
                                <input
                                  ref={logoInputRef}
                                  type="file"
                                  accept="image/png,image/jpeg,image/webp,image/gif"
                                  onChange={handleLogoUpload}
                                  className="hidden"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div>
                          <label className="block text-sm font-medium mb-2 text-slate-300">Menu Items (Left Side)</label>
                          <div className="space-y-2">
                            {(landingPageData.menu_items || []).map((item: { label: string; url: string; enabled: boolean }, index: number) => (
                              <div key={index} className="flex items-center gap-2 bg-slate-800/50 p-2 rounded-lg">
                                <input
                                  type="checkbox"
                                  checked={item.enabled}
                                  onChange={(e) => {
                                    const updated = [...(landingPageData.menu_items || [])]
                                    updated[index] = { ...item, enabled: e.target.checked }
                                    setLandingPageData({...landingPageData, menu_items: updated})
                                  }}
                                  className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-indigo-500 focus:ring-indigo-500"
                                />
                                <input
                                  type="text"
                                  value={item.label}
                                  onChange={(e) => {
                                    const updated = [...(landingPageData.menu_items || [])]
                                    updated[index] = { ...item, label: e.target.value }
                                    setLandingPageData({...landingPageData, menu_items: updated})
                                  }}
                                  placeholder="Label"
                                  className="flex-1 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                                <input
                                  type="text"
                                  value={item.url}
                                  onChange={(e) => {
                                    const updated = [...(landingPageData.menu_items || [])]
                                    updated[index] = { ...item, url: e.target.value }
                                    setLandingPageData({...landingPageData, menu_items: updated})
                                  }}
                                  placeholder="URL or #section"
                                  className="flex-1 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                                <button
                                  onClick={() => {
                                    const updated = (landingPageData.menu_items || []).filter((_: any, i: number) => i !== index)
                                    setLandingPageData({...landingPageData, menu_items: updated})
                                  }}
                                  className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => {
                              const updated = [...(landingPageData.menu_items || []), { label: '', url: '#', enabled: true }]
                              setLandingPageData({...landingPageData, menu_items: updated})
                            }}
                            className="mt-2 flex items-center gap-1 px-3 py-1.5 text-sm bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 rounded-lg transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            Add Menu Item
                          </button>
                        </div>

                        {/* Right Side Utilities */}
                        <div>
                          <label className="block text-sm font-medium mb-2 text-slate-300">Right Side Utilities</label>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Search */}
                            <div className="bg-slate-800/50 p-3 rounded-lg">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={landingPageData.show_search !== false}
                                  onChange={(e) => setLandingPageData({...landingPageData, show_search: e.target.checked})}
                                  className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-indigo-500 focus:ring-indigo-500"
                                />
                                <span className="text-sm text-slate-300">🔍 Search Bar</span>
                              </label>
                            </div>

                            {/* My Account */}
                            <div className="bg-slate-800/50 p-3 rounded-lg">
                              <label className="flex items-center gap-2 cursor-pointer mb-2">
                                <input
                                  type="checkbox"
                                  checked={landingPageData.show_account !== false}
                                  onChange={(e) => setLandingPageData({...landingPageData, show_account: e.target.checked})}
                                  className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-indigo-500 focus:ring-indigo-500"
                                />
                                <span className="text-sm text-slate-300">👤 My Account</span>
                              </label>
                              {landingPageData.show_account !== false && (
                                <input
                                  type="text"
                                  value={landingPageData.account_url || '/account'}
                                  onChange={(e) => setLandingPageData({...landingPageData, account_url: e.target.value})}
                                  placeholder="/account"
                                  className="w-full px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                              )}
                            </div>

                            {/* Shopping Cart */}
                            <div className="bg-slate-800/50 p-3 rounded-lg">
                              <label className="flex items-center gap-2 cursor-pointer mb-2">
                                <input
                                  type="checkbox"
                                  checked={landingPageData.show_cart !== false}
                                  onChange={(e) => setLandingPageData({...landingPageData, show_cart: e.target.checked})}
                                  className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-indigo-500 focus:ring-indigo-500"
                                />
                                <span className="text-sm text-slate-300">🛒 Shopping Cart</span>
                              </label>
                              {landingPageData.show_cart !== false && (
                                <input
                                  type="text"
                                  value={landingPageData.cart_url || '/cart'}
                                  onChange={(e) => setLandingPageData({...landingPageData, cart_url: e.target.value})}
                                  placeholder="/cart"
                                  className="w-full px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Hero Section - Carousel Slides */}
                    <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-violet-400">{t.heroSection || 'Hero Carousel'}</h3>
                        <button
                          onClick={() => {
                            const slides = [...(landingPageData.hero_slides || [])]
                            slides.push({ headline: '', subheadline: '', content: '', background_url: '', background_type: 'image', cta_text: 'Shop Now', cta_url: '#shop', text_align: 'center' })
                            setLandingPageData({...landingPageData, hero_slides: slides})
                          }}
                          className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300"
                        >
                          <Plus className="w-4 h-4" />
                          Add Slide
                        </button>
                      </div>

                      <div className="space-y-4">
                        {(landingPageData.hero_slides || []).map((slide: { headline: string; subheadline: string; content?: string; background_url: string; background_type: string; cta_text: string; cta_url: string; text_align?: 'left' | 'center' | 'right' }, index: number) => (
                          <div key={index} className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-sm font-medium text-slate-300">Slide {index + 1}</span>
                              {(landingPageData.hero_slides || []).length > 1 && (
                                <button
                                  onClick={() => {
                                    const slides = [...(landingPageData.hero_slides || [])]
                                    slides.splice(index, 1)
                                    setLandingPageData({...landingPageData, hero_slides: slides})
                                  }}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>

                            {/* Background Upload */}
                            <div className="mb-3">
                              <label className="block text-xs text-slate-400 mb-1">Background Image/Video</label>
                              <div className="flex items-center gap-3">
                                {slide.background_url ? (
                                  <div className="relative">
                                    {slide.background_type === 'video' ? (
                                      <video src={slide.background_url} className="h-16 w-28 object-cover rounded" muted />
                                    ) : (
                                      <img src={slide.background_url} alt="Background" className="h-16 w-28 object-cover rounded" />
                                    )}
                                    <button
                                      onClick={() => {
                                        const slides = [...(landingPageData.hero_slides || [])]
                                        slides[index] = { ...slide, background_url: '', background_type: 'image' }
                                        setLandingPageData({...landingPageData, hero_slides: slides})
                                      }}
                                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                    <span className="absolute bottom-0.5 right-0.5 text-[10px] bg-black/60 text-white px-1 rounded">
                                      {slide.background_type === 'video' ? 'VIDEO' : 'IMAGE'}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="h-16 w-28 bg-slate-800 border border-dashed border-slate-600 rounded flex items-center justify-center">
                                    <Image className="w-6 h-6 text-slate-500" />
                                  </div>
                                )}
                                <button
                                  onClick={() => heroSlideInputRefs.current[index]?.click()}
                                  disabled={heroSlideUploading === index}
                                  className="px-3 py-1.5 bg-violet-600 text-white text-sm rounded hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                >
                                  {heroSlideUploading === index ? (
                                    <>
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      Uploading...
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="w-4 h-4" />
                                      Upload
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => {
                                    loadMediaFiles()
                                    setShowMediaPicker(index)
                                  }}
                                  className="px-3 py-1.5 bg-slate-600 text-white text-sm rounded hover:bg-slate-500 transition-colors flex items-center gap-1.5"
                                >
                                  <Image className="w-4 h-4" />
                                  Library
                                </button>
                                <input
                                  ref={(el) => { heroSlideInputRefs.current[index] = el }}
                                  type="file"
                                  accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm"
                                  onChange={(e) => handleHeroSlideUpload(e, index)}
                                  className="hidden"
                                />
                              </div>
                            </div>

                            {/* Text Overlay */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs text-slate-400 mb-1">Headline</label>
                                <input
                                  type="text"
                                  value={slide.headline || ''}
                                  onChange={(e) => {
                                    const slides = [...(landingPageData.hero_slides || [])]
                                    slides[index] = { ...slide, headline: e.target.value }
                                    setLandingPageData({...landingPageData, hero_slides: slides})
                                  }}
                                  placeholder="e.g., Transform Your Skin"
                                  className="w-full px-2 py-1.5 bg-slate-800 border border-slate-600 rounded text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-slate-400 mb-1">Subheadline</label>
                                <input
                                  type="text"
                                  value={slide.subheadline || ''}
                                  onChange={(e) => {
                                    const slides = [...(landingPageData.hero_slides || [])]
                                    slides[index] = { ...slide, subheadline: e.target.value }
                                    setLandingPageData({...landingPageData, hero_slides: slides})
                                  }}
                                  placeholder="e.g., Discover the secret"
                                  className="w-full px-2 py-1.5 bg-slate-800 border border-slate-600 rounded text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-xs text-slate-400 mb-1">Content (optional)</label>
                                <textarea
                                  value={slide.content || ''}
                                  onChange={(e) => {
                                    const slides = [...(landingPageData.hero_slides || [])]
                                    slides[index] = { ...slide, content: e.target.value }
                                    setLandingPageData({...landingPageData, hero_slides: slides})
                                  }}
                                  placeholder="Additional text content for this slide..."
                                  rows={2}
                                  className="w-full px-2 py-1.5 bg-slate-800 border border-slate-600 rounded text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-xs text-slate-400 mb-1">Text Alignment</label>
                                <div className="flex gap-2">
                                  {(['left', 'center', 'right'] as const).map((align) => (
                                    <button
                                      key={align}
                                      onClick={() => {
                                        const slides = [...(landingPageData.hero_slides || [])]
                                        slides[index] = { ...slide, text_align: align }
                                        setLandingPageData({...landingPageData, hero_slides: slides})
                                      }}
                                      className={`flex-1 px-3 py-1.5 text-sm rounded transition-colors ${
                                        (slide.text_align || 'center') === align
                                          ? 'bg-violet-600 text-white'
                                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                      }`}
                                    >
                                      {align === 'left' && '◀ Left'}
                                      {align === 'center' && '● Center'}
                                      {align === 'right' && 'Right ▶'}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs text-slate-400 mb-1">CTA Button Text</label>
                                <input
                                  type="text"
                                  value={slide.cta_text || ''}
                                  onChange={(e) => {
                                    const slides = [...(landingPageData.hero_slides || [])]
                                    slides[index] = { ...slide, cta_text: e.target.value }
                                    setLandingPageData({...landingPageData, hero_slides: slides})
                                  }}
                                  placeholder="e.g., Shop Now"
                                  className="w-full px-2 py-1.5 bg-slate-800 border border-slate-600 rounded text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-slate-400 mb-1">CTA Button URL</label>
                                <input
                                  type="text"
                                  value={slide.cta_url || ''}
                                  onChange={(e) => {
                                    const slides = [...(landingPageData.hero_slides || [])]
                                    slides[index] = { ...slide, cta_url: e.target.value }
                                    setLandingPageData({...landingPageData, hero_slides: slides})
                                  }}
                                  placeholder="e.g., #shop or /products"
                                  className="w-full px-2 py-1.5 bg-slate-800 border border-slate-600 rounded text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Media Picker Modal */}
                      {showMediaPicker !== null && (
                        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                          <div className="bg-slate-800 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
                            <div className="flex justify-between items-center p-4 border-b border-slate-700">
                              <h3 className="text-lg font-semibold text-white">Select from Image Library</h3>
                              <button
                                onClick={() => setShowMediaPicker(null)}
                                className="text-slate-400 hover:text-white"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                            <div className="p-4 overflow-y-auto max-h-[60vh]">
                              {mediaLoading ? (
                                <div className="flex items-center justify-center py-12">
                                  <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
                                </div>
                              ) : mediaFiles.length === 0 ? (
                                <div className="text-center py-12 text-slate-400">
                                  <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                  <p>No images in library</p>
                                  <p className="text-sm">Upload images in the Image Library tab first</p>
                                </div>
                              ) : (
                                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                                  {mediaFiles.filter(f => f.type.startsWith('image/') || f.type.startsWith('video/')).map((file) => (
                                    <button
                                      key={file.id}
                                      onClick={() => selectMediaForHeroSlide(showMediaPicker, file)}
                                      className="relative aspect-video bg-slate-700 rounded-lg overflow-hidden hover:ring-2 hover:ring-violet-500 transition-all group"
                                    >
                                      {file.type.startsWith('video/') ? (
                                        <video src={file.url} className="w-full h-full object-cover" muted />
                                      ) : (
                                        <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                                      )}
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                        <Check className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </div>
                                      {file.type.startsWith('video/') && (
                                        <span className="absolute bottom-1 right-1 text-[10px] bg-black/60 text-white px-1 rounded">VIDEO</span>
                                      )}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ═══════════════════════════════════════════════════════════════════ */}
                    {/* SECTION 2: PROBLEM / STORY - Make user feel understood */}
                    {/* ═══════════════════════════════════════════════════════════════════ */}
                    <div className="bg-gradient-to-r from-rose-900/20 to-slate-800/50 rounded-lg border border-rose-500/30">
                      <button
                        onClick={() => toggleSection('problem')}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors rounded-t-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center">
                            <MessageSquare className="w-5 h-5 text-rose-400" />
                          </div>
                          <div className="text-left">
                            <h3 className="text-lg font-semibold text-rose-400">2️⃣ Problem / Story</h3>
                            <p className="text-xs text-slate-400">Make user feel understood</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={landingPageData.problem_section_enabled || false}
                              onChange={(e) => {
                                e.stopPropagation()
                                setLandingPageData({...landingPageData, problem_section_enabled: e.target.checked})
                              }}
                              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-rose-500 focus:ring-rose-500"
                            />
                            <span className="text-slate-300">Enabled</span>
                          </label>
                          {collapsedSections.problem ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronUp className="w-5 h-5 text-slate-400" />}
                        </div>
                      </button>

                      {!collapsedSections.problem && (
                        <div className="p-6 pt-2 space-y-4 border-t border-slate-600/50">
                          {/* Variant Selector */}
                          <div>
                            <label className="block text-sm text-slate-400 mb-2">Variant Style</label>
                            <div className="flex gap-2">
                              {['emotional', 'fear-based', 'aspirational', 'educational'].map(variant => (
                                <button
                                  key={variant}
                                  onClick={() => setLandingPageData({...landingPageData, problem_variant: variant})}
                                  className={`px-3 py-1.5 text-sm rounded capitalize ${
                                    (landingPageData.problem_variant || 'emotional') === variant
                                      ? 'bg-rose-600 text-white'
                                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                  }`}
                                >
                                  {variant}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Headline & Subheadline */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm text-slate-400 mb-1">Headline</label>
                              <input
                                type="text"
                                value={landingPageData.problem_headline || ''}
                                onChange={(e) => setLandingPageData({...landingPageData, problem_headline: e.target.value})}
                                placeholder="e.g., Tired of..."
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-slate-400 mb-1">Subheadline</label>
                              <input
                                type="text"
                                value={landingPageData.problem_subheadline || ''}
                                onChange={(e) => setLandingPageData({...landingPageData, problem_subheadline: e.target.value})}
                                placeholder="e.g., You're not alone..."
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500"
                              />
                            </div>
                          </div>

                          {/* Pain Points */}
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <label className="text-sm text-slate-400">Pain Points</label>
                              <button
                                onClick={() => setLandingPageData({
                                  ...landingPageData,
                                  pain_points: [...(landingPageData.pain_points || []), { icon: '😓', title: '', description: '' }]
                                })}
                                className="text-sm text-rose-400 hover:text-rose-300 flex items-center gap-1"
                              >
                                <Plus className="w-4 h-4" /> Add Pain Point
                              </button>
                            </div>
                            <div className="space-y-3">
                              {(landingPageData.pain_points || []).map((point: any, index: number) => (
                                <div key={index} className="flex gap-3 items-start bg-slate-800/50 p-3 rounded-lg">
                                  <input
                                    type="text"
                                    value={point.icon || ''}
                                    onChange={(e) => {
                                      const updated = [...(landingPageData.pain_points || [])]
                                      updated[index] = {...point, icon: e.target.value}
                                      setLandingPageData({...landingPageData, pain_points: updated})
                                    }}
                                    placeholder="😓"
                                    className="w-12 px-2 py-2 bg-slate-700 border border-slate-600 rounded text-center text-lg"
                                  />
                                  <div className="flex-1 space-y-2">
                                    <input
                                      type="text"
                                      value={point.title || ''}
                                      onChange={(e) => {
                                        const updated = [...(landingPageData.pain_points || [])]
                                        updated[index] = {...point, title: e.target.value}
                                        setLandingPageData({...landingPageData, pain_points: updated})
                                      }}
                                      placeholder="Pain point title..."
                                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 text-sm"
                                    />
                                    <textarea
                                      value={point.description || ''}
                                      onChange={(e) => {
                                        const updated = [...(landingPageData.pain_points || [])]
                                        updated[index] = {...point, description: e.target.value}
                                        setLandingPageData({...landingPageData, pain_points: updated})
                                      }}
                                      placeholder="Description..."
                                      rows={2}
                                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 text-sm"
                                    />
                                  </div>
                                  <button
                                    onClick={() => {
                                      const updated = (landingPageData.pain_points || []).filter((_: any, i: number) => i !== index)
                                      setLandingPageData({...landingPageData, pain_points: updated})
                                    }}
                                    className="text-red-400 hover:text-red-300 p-1"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Story Blocks */}
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <label className="text-sm text-slate-400">Story Blocks</label>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setLandingPageData({
                                    ...landingPageData,
                                    story_blocks: [...(landingPageData.story_blocks || []), { type: 'text', content: '' }]
                                  })}
                                  className="text-sm text-rose-400 hover:text-rose-300 flex items-center gap-1"
                                >
                                  <Plus className="w-4 h-4" /> Text
                                </button>
                                <button
                                  onClick={() => setLandingPageData({
                                    ...landingPageData,
                                    story_blocks: [...(landingPageData.story_blocks || []), { type: 'quote', content: '', author: '' }]
                                  })}
                                  className="text-sm text-rose-400 hover:text-rose-300 flex items-center gap-1"
                                >
                                  <Plus className="w-4 h-4" /> Quote
                                </button>
                              </div>
                            </div>
                            <div className="space-y-3">
                              {(landingPageData.story_blocks || []).map((block: any, index: number) => (
                                <div key={index} className="bg-slate-800/50 p-3 rounded-lg">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs text-slate-500 uppercase">{block.type}</span>
                                    <button
                                      onClick={() => {
                                        const updated = (landingPageData.story_blocks || []).filter((_: any, i: number) => i !== index)
                                        setLandingPageData({...landingPageData, story_blocks: updated})
                                      }}
                                      className="text-red-400 hover:text-red-300"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                  <textarea
                                    value={block.content || ''}
                                    onChange={(e) => {
                                      const updated = [...(landingPageData.story_blocks || [])]
                                      updated[index] = {...block, content: e.target.value}
                                      setLandingPageData({...landingPageData, story_blocks: updated})
                                    }}
                                    placeholder={block.type === 'quote' ? 'Enter quote...' : 'Enter story text...'}
                                    rows={3}
                                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 text-sm"
                                  />
                                  {block.type === 'quote' && (
                                    <input
                                      type="text"
                                      value={block.author || ''}
                                      onChange={(e) => {
                                        const updated = [...(landingPageData.story_blocks || [])]
                                        updated[index] = {...block, author: e.target.value}
                                        setLandingPageData({...landingPageData, story_blocks: updated})
                                      }}
                                      placeholder="- Author name"
                                      className="w-full mt-2 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 text-sm"
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ═══════════════════════════════════════════════════════════════════ */}
                    {/* SECTION 3: SOLUTION / HOW IT WORKS - Explain the idea */}
                    {/* ═══════════════════════════════════════════════════════════════════ */}
                    <div className="bg-gradient-to-r from-emerald-900/20 to-slate-800/50 rounded-lg border border-emerald-500/30">
                      <button
                        onClick={() => toggleSection('solution')}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors rounded-t-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-emerald-400" />
                          </div>
                          <div className="text-left">
                            <h3 className="text-lg font-semibold text-emerald-400">3️⃣ Solution / How It Works</h3>
                            <p className="text-xs text-slate-400">Explain the idea</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={landingPageData.solution_section_enabled || false}
                              onChange={(e) => {
                                e.stopPropagation()
                                setLandingPageData({...landingPageData, solution_section_enabled: e.target.checked})
                              }}
                              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                            />
                            <span className="text-slate-300">Enabled</span>
                          </label>
                          {collapsedSections.solution ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronUp className="w-5 h-5 text-slate-400" />}
                        </div>
                      </button>

                      {!collapsedSections.solution && (
                        <div className="p-6 pt-2 space-y-4 border-t border-slate-600/50">
                          {/* Variant Selector */}
                          <div>
                            <label className="block text-sm text-slate-400 mb-2">Variant Style</label>
                            <div className="flex gap-2">
                              {['3-step', 'visual-cards', 'video-based'].map(variant => (
                                <button
                                  key={variant}
                                  onClick={() => setLandingPageData({...landingPageData, solution_variant: variant})}
                                  className={`px-3 py-1.5 text-sm rounded capitalize ${
                                    (landingPageData.solution_variant || '3-step') === variant
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                  }`}
                                >
                                  {variant}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Headline & Subheadline */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm text-slate-400 mb-1">Headline</label>
                              <input
                                type="text"
                                value={landingPageData.solution_headline || ''}
                                onChange={(e) => setLandingPageData({...landingPageData, solution_headline: e.target.value})}
                                placeholder="e.g., How It Works"
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-slate-400 mb-1">Subheadline</label>
                              <input
                                type="text"
                                value={landingPageData.solution_subheadline || ''}
                                onChange={(e) => setLandingPageData({...landingPageData, solution_subheadline: e.target.value})}
                                placeholder="e.g., Simple 3-step process..."
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500"
                              />
                            </div>
                          </div>

                          {/* Video URL (for video-based variant) */}
                          {landingPageData.solution_variant === 'video-based' && (
                            <div>
                              <label className="block text-sm text-slate-400 mb-1">Video URL</label>
                              <input
                                type="text"
                                value={landingPageData.solution_video_url || ''}
                                onChange={(e) => setLandingPageData({...landingPageData, solution_video_url: e.target.value})}
                                placeholder="https://youtube.com/... or video file URL"
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500"
                              />
                            </div>
                          )}

                          {/* Solution Steps */}
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <label className="text-sm text-slate-400">Steps</label>
                              <button
                                onClick={() => setLandingPageData({
                                  ...landingPageData,
                                  solution_steps: [...(landingPageData.solution_steps || []), {
                                    step_number: (landingPageData.solution_steps || []).length + 1,
                                    icon: '✨',
                                    title: '',
                                    description: ''
                                  }]
                                })}
                                className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                              >
                                <Plus className="w-4 h-4" /> Add Step
                              </button>
                            </div>
                            <div className="space-y-3">
                              {(landingPageData.solution_steps || []).map((step: any, index: number) => (
                                <div key={index} className="flex gap-3 items-start bg-slate-800/50 p-3 rounded-lg">
                                  <div className="flex flex-col items-center gap-1">
                                    <span className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                      {step.step_number || index + 1}
                                    </span>
                                    <input
                                      type="text"
                                      value={step.icon || ''}
                                      onChange={(e) => {
                                        const updated = [...(landingPageData.solution_steps || [])]
                                        updated[index] = {...step, icon: e.target.value}
                                        setLandingPageData({...landingPageData, solution_steps: updated})
                                      }}
                                      placeholder="✨"
                                      className="w-10 px-1 py-1 bg-slate-700 border border-slate-600 rounded text-center text-lg"
                                    />
                                  </div>
                                  <div className="flex-1 space-y-2">
                                    <input
                                      type="text"
                                      value={step.title || ''}
                                      onChange={(e) => {
                                        const updated = [...(landingPageData.solution_steps || [])]
                                        updated[index] = {...step, title: e.target.value}
                                        setLandingPageData({...landingPageData, solution_steps: updated})
                                      }}
                                      placeholder="Step title..."
                                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 text-sm font-medium"
                                    />
                                    <textarea
                                      value={step.description || ''}
                                      onChange={(e) => {
                                        const updated = [...(landingPageData.solution_steps || [])]
                                        updated[index] = {...step, description: e.target.value}
                                        setLandingPageData({...landingPageData, solution_steps: updated})
                                      }}
                                      placeholder="Step description..."
                                      rows={2}
                                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 text-sm"
                                    />
                                  </div>
                                  <button
                                    onClick={() => {
                                      const updated = (landingPageData.solution_steps || []).filter((_: any, i: number) => i !== index)
                                      setLandingPageData({...landingPageData, solution_steps: updated})
                                    }}
                                    className="text-red-400 hover:text-red-300 p-1"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Solution Features */}
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <label className="text-sm text-slate-400">Feature Highlights</label>
                              <button
                                onClick={() => setLandingPageData({
                                  ...landingPageData,
                                  solution_features: [...(landingPageData.solution_features || []), { icon: '⭐', title: '', description: '', benefits: [] }]
                                })}
                                className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                              >
                                <Plus className="w-4 h-4" /> Add Feature
                              </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {(landingPageData.solution_features || []).map((feature: any, index: number) => (
                                <div key={index} className="bg-slate-800/50 p-3 rounded-lg">
                                  <div className="flex justify-between items-start mb-2">
                                    <input
                                      type="text"
                                      value={feature.icon || ''}
                                      onChange={(e) => {
                                        const updated = [...(landingPageData.solution_features || [])]
                                        updated[index] = {...feature, icon: e.target.value}
                                        setLandingPageData({...landingPageData, solution_features: updated})
                                      }}
                                      placeholder="⭐"
                                      className="w-10 px-1 py-1 bg-slate-700 border border-slate-600 rounded text-center text-lg"
                                    />
                                    <button
                                      onClick={() => {
                                        const updated = (landingPageData.solution_features || []).filter((_: any, i: number) => i !== index)
                                        setLandingPageData({...landingPageData, solution_features: updated})
                                      }}
                                      className="text-red-400 hover:text-red-300"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                  <input
                                    type="text"
                                    value={feature.title || ''}
                                    onChange={(e) => {
                                      const updated = [...(landingPageData.solution_features || [])]
                                      updated[index] = {...feature, title: e.target.value}
                                      setLandingPageData({...landingPageData, solution_features: updated})
                                    }}
                                    placeholder="Feature title..."
                                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 text-sm mb-2"
                                  />
                                  <textarea
                                    value={feature.description || ''}
                                    onChange={(e) => {
                                      const updated = [...(landingPageData.solution_features || [])]
                                      updated[index] = {...feature, description: e.target.value}
                                      setLandingPageData({...landingPageData, solution_features: updated})
                                    }}
                                    placeholder="Description..."
                                    rows={2}
                                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 text-sm"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ═══════════════════════════════════════════════════════════════════ */}
                    {/* SECTION 4: PROOF / TRUST - Build credibility */}
                    {/* ═══════════════════════════════════════════════════════════════════ */}
                    <div className="bg-gradient-to-r from-blue-900/20 to-slate-800/50 rounded-lg border border-blue-500/30">
                      <button
                        onClick={() => toggleSection('proof')}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors rounded-t-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-blue-400" />
                          </div>
                          <div className="text-left">
                            <h3 className="text-lg font-semibold text-blue-400">4️⃣ Proof / Trust</h3>
                            <p className="text-xs text-slate-400">Build credibility</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={landingPageData.proof_section_enabled !== false}
                              onChange={(e) => {
                                e.stopPropagation()
                                setLandingPageData({...landingPageData, proof_section_enabled: e.target.checked})
                              }}
                              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
                            />
                            <span className="text-slate-300">Enabled</span>
                          </label>
                          {collapsedSections.proof ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronUp className="w-5 h-5 text-slate-400" />}
                        </div>
                      </button>

                      {!collapsedSections.proof && (
                        <div className="p-6 pt-2 space-y-4 border-t border-slate-600/50">
                          {/* Variant Selector */}
                          <div>
                            <label className="block text-sm text-slate-400 mb-2">Primary Proof Type</label>
                            <div className="flex gap-2">
                              {['social', 'clinical', 'expert'].map(variant => (
                                <button
                                  key={variant}
                                  onClick={() => setLandingPageData({...landingPageData, proof_variant: variant})}
                                  className={`px-3 py-1.5 text-sm rounded capitalize ${
                                    (landingPageData.proof_variant || 'social') === variant
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                  }`}
                                >
                                  {variant === 'social' ? 'Social Proof' : variant === 'clinical' ? 'Clinical Proof' : 'Expert Quotes'}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Sub-sections within Proof */}
                          <div className="space-y-4">
                            {/* Clinical Results - nested */}
                            <div className="bg-slate-800/50 rounded-lg p-4">
                              <div className="flex justify-between items-center mb-3">
                                <h4 className="text-sm font-semibold text-blue-300">📊 Clinical Results</h4>
                                <button
                                  onClick={() => setLandingPageData({...landingPageData, clinical_results: [...(landingPageData.clinical_results || []), {value: '', label: ''}]})}
                                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                                >
                                  <Plus className="w-3 h-3" /> Add
                                </button>
                              </div>
                              <div className="space-y-2">
                                {(landingPageData.clinical_results || []).map((result: any, index: number) => (
                                  <div key={index} className="flex gap-2 items-center">
                                    <input
                                      type="text"
                                      value={result.value || ''}
                                      onChange={(e) => {
                                        const updated = [...landingPageData.clinical_results]
                                        updated[index] = {...result, value: e.target.value}
                                        setLandingPageData({...landingPageData, clinical_results: updated})
                                      }}
                                      placeholder="94%"
                                      className="w-20 px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                                    />
                                    <input
                                      type="text"
                                      value={result.label || ''}
                                      onChange={(e) => {
                                        const updated = [...landingPageData.clinical_results]
                                        updated[index] = {...result, label: e.target.value}
                                        setLandingPageData({...landingPageData, clinical_results: updated})
                                      }}
                                      placeholder="saw improvement"
                                      className="flex-1 px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                                    />
                                    <button
                                      onClick={() => {
                                        const updated = landingPageData.clinical_results.filter((_: any, i: number) => i !== index)
                                        setLandingPageData({...landingPageData, clinical_results: updated})
                                      }}
                                      className="text-red-400 hover:text-red-300"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Expert Quotes - nested */}
                            <div className="bg-slate-800/50 rounded-lg p-4">
                              <div className="flex justify-between items-center mb-3">
                                <h4 className="text-sm font-semibold text-blue-300">👨‍⚕️ Expert Quotes</h4>
                                <button
                                  onClick={() => setLandingPageData({...landingPageData, expert_quotes: [...(landingPageData.expert_quotes || []), {name: '', title: '', quote: ''}]})}
                                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                                >
                                  <Plus className="w-3 h-3" /> Add
                                </button>
                              </div>
                              <div className="space-y-3">
                                {(landingPageData.expert_quotes || []).map((expert: any, index: number) => (
                                  <div key={index} className="bg-slate-700/50 p-3 rounded-lg">
                                    <div className="flex gap-2 mb-2">
                                      <input
                                        type="text"
                                        value={expert.name || ''}
                                        onChange={(e) => {
                                          const updated = [...(landingPageData.expert_quotes || [])]
                                          updated[index] = {...expert, name: e.target.value}
                                          setLandingPageData({...landingPageData, expert_quotes: updated})
                                        }}
                                        placeholder="Dr. Jane Smith"
                                        className="flex-1 px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                                      />
                                      <input
                                        type="text"
                                        value={expert.title || ''}
                                        onChange={(e) => {
                                          const updated = [...(landingPageData.expert_quotes || [])]
                                          updated[index] = {...expert, title: e.target.value}
                                          setLandingPageData({...landingPageData, expert_quotes: updated})
                                        }}
                                        placeholder="Dermatologist"
                                        className="flex-1 px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                                      />
                                      <button
                                        onClick={() => {
                                          const updated = (landingPageData.expert_quotes || []).filter((_: any, i: number) => i !== index)
                                          setLandingPageData({...landingPageData, expert_quotes: updated})
                                        }}
                                        className="text-red-400 hover:text-red-300"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                    <textarea
                                      value={expert.quote || ''}
                                      onChange={(e) => {
                                        const updated = [...(landingPageData.expert_quotes || [])]
                                        updated[index] = {...expert, quote: e.target.value}
                                        setLandingPageData({...landingPageData, expert_quotes: updated})
                                      }}
                                      placeholder="Expert quote..."
                                      rows={2}
                                      className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Partner Logos - nested */}
                            <div className="bg-slate-800/50 rounded-lg p-4">
                              <div className="flex justify-between items-center mb-3">
                                <h4 className="text-sm font-semibold text-blue-300">🏢 Partner/Press Logos</h4>
                                <button
                                  onClick={() => setLandingPageData({...landingPageData, partner_logos: [...(landingPageData.partner_logos || []), {name: '', image_url: ''}]})}
                                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                                >
                                  <Plus className="w-3 h-3" /> Add
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                {(landingPageData.partner_logos || []).map((logo: any, index: number) => (
                                  <div key={index} className="flex gap-2 items-center">
                                    <input
                                      type="text"
                                      value={logo.name || ''}
                                      onChange={(e) => {
                                        const updated = [...(landingPageData.partner_logos || [])]
                                        updated[index] = {...logo, name: e.target.value}
                                        setLandingPageData({...landingPageData, partner_logos: updated})
                                      }}
                                      placeholder="Partner name"
                                      className="flex-1 px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                                    />
                                    <button
                                      onClick={() => {
                                        const updated = (landingPageData.partner_logos || []).filter((_: any, i: number) => i !== index)
                                        setLandingPageData({...landingPageData, partner_logos: updated})
                                      }}
                                      className="text-red-400 hover:text-red-300"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Testimonials Section (under Proof) */}
                    <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-violet-400">{t.testimonialsSection || 'Testimonials'}</h3>
                        <button
                          onClick={() => setLandingPageData({...landingPageData, testimonials: [...(landingPageData.testimonials || []), {name: '', age: '', text: '', rating: 5}]})}
                          className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300"
                        >
                          <Plus className="w-4 h-4" /> {t.addTestimonial || 'Add Testimonial'}
                        </button>
                      </div>
                      <div className="space-y-4">
                        {(landingPageData.testimonials || []).map((testimonial: any, index: number) => (
                          <div key={index} className="p-4 bg-slate-800 rounded-lg border border-slate-600">
                            <div className="flex gap-3 mb-2">
                              <input
                                type="text"
                                value={testimonial.name || ''}
                                onChange={(e) => {
                                  const updated = [...landingPageData.testimonials]
                                  updated[index] = {...testimonial, name: e.target.value}
                                  setLandingPageData({...landingPageData, testimonials: updated})
                                }}
                                placeholder={t.customerName || 'Customer Name'}
                                className="w-32 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500"
                              />
                              <input
                                type="text"
                                value={testimonial.age || ''}
                                onChange={(e) => {
                                  const updated = [...landingPageData.testimonials]
                                  updated[index] = {...testimonial, age: e.target.value}
                                  setLandingPageData({...landingPageData, testimonials: updated})
                                }}
                                placeholder={t.customerAge || 'Age'}
                                className="w-20 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500"
                              />
                              <button
                                onClick={() => {
                                  const updated = landingPageData.testimonials.filter((_: any, i: number) => i !== index)
                                  setLandingPageData({...landingPageData, testimonials: updated})
                                }}
                                className="text-red-400 hover:text-red-300 ml-auto"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <textarea
                              value={testimonial.text || ''}
                              onChange={(e) => {
                                const updated = [...landingPageData.testimonials]
                                updated[index] = {...testimonial, text: e.target.value}
                                setLandingPageData({...landingPageData, testimonials: updated})
                              }}
                              placeholder={t.testimonialText || 'Testimonial Text'}
                              rows={2}
                              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* FAQ Section */}
                    <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-violet-400">{t.faqSection || 'FAQ Section'}</h3>
                        <button
                          onClick={() => setLandingPageData({...landingPageData, landing_faqs: [...(landingPageData.landing_faqs || []), {question: '', answer: ''}]})}
                          className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300"
                        >
                          <Plus className="w-4 h-4" /> {t.addFaqItem || 'Add FAQ'}
                        </button>
                      </div>
                      <div className="space-y-4">
                        {(landingPageData.landing_faqs || []).map((faq: any, index: number) => (
                          <div key={index} className="p-4 bg-slate-800 rounded-lg border border-slate-600">
                            <div className="flex justify-between items-start mb-2">
                              <input
                                type="text"
                                value={faq.question || ''}
                                onChange={(e) => {
                                  const updated = [...landingPageData.landing_faqs]
                                  updated[index] = {...faq, question: e.target.value}
                                  setLandingPageData({...landingPageData, landing_faqs: updated})
                                }}
                                placeholder="Question"
                                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm font-medium text-white placeholder-slate-500"
                              />
                              <button
                                onClick={() => {
                                  const updated = landingPageData.landing_faqs.filter((_: any, i: number) => i !== index)
                                  setLandingPageData({...landingPageData, landing_faqs: updated})
                                }}
                                className="text-red-400 hover:text-red-300 ml-2"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <textarea
                              value={faq.answer || ''}
                              onChange={(e) => {
                                const updated = [...landingPageData.landing_faqs]
                                updated[index] = {...faq, answer: e.target.value}
                                setLandingPageData({...landingPageData, landing_faqs: updated})
                              }}
                              placeholder="Answer"
                              rows={2}
                              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Trust Badges Section */}
                    <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-violet-400">{t.trustBadges || 'Trust Badges'}</h3>
                        <button
                          onClick={() => setLandingPageData({...landingPageData, trust_badges: [...(landingPageData.trust_badges || []), {icon: '', label: ''}]})}
                          className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300"
                        >
                          <Plus className="w-4 h-4" /> {t.addBadge || 'Add Badge'}
                        </button>
                      </div>
                      <div className="space-y-3">
                        {(landingPageData.trust_badges || []).map((badge: any, index: number) => (
                          <div key={index} className="flex gap-3 items-center">
                            <input
                              type="text"
                              value={badge.icon || ''}
                              onChange={(e) => {
                                const updated = [...landingPageData.trust_badges]
                                updated[index] = {...badge, icon: e.target.value}
                                setLandingPageData({...landingPageData, trust_badges: updated})
                              }}
                              placeholder={t.badgeIcon || 'Icon (emoji)'}
                              className="w-16 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-center text-lg text-white placeholder-slate-500"
                            />
                            <input
                              type="text"
                              value={badge.label || ''}
                              onChange={(e) => {
                                const updated = [...landingPageData.trust_badges]
                                updated[index] = {...badge, label: e.target.value}
                                setLandingPageData({...landingPageData, trust_badges: updated})
                              }}
                              placeholder={t.badgeLabel || 'Label'}
                              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500"
                            />
                            <button
                              onClick={() => {
                                const updated = landingPageData.trust_badges.filter((_: any, i: number) => i !== index)
                                setLandingPageData({...landingPageData, trust_badges: updated})
                              }}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ═══════════════════════════════════════════════════════════════════ */}
                    {/* SECTION 5: CTA / OFFER - Drive action */}
                    {/* ═══════════════════════════════════════════════════════════════════ */}
                    <div className="bg-gradient-to-r from-amber-900/20 to-slate-800/50 rounded-lg border border-amber-500/30">
                      <button
                        onClick={() => toggleSection('offer')}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors rounded-t-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                            <ShoppingCart className="w-5 h-5 text-amber-400" />
                          </div>
                          <div className="text-left">
                            <h3 className="text-lg font-semibold text-amber-400">5️⃣ CTA / Offer</h3>
                            <p className="text-xs text-slate-400">Drive action</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={landingPageData.offer_section_enabled !== false}
                              onChange={(e) => {
                                e.stopPropagation()
                                setLandingPageData({...landingPageData, offer_section_enabled: e.target.checked})
                              }}
                              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-amber-500 focus:ring-amber-500"
                            />
                            <span className="text-slate-300">Enabled</span>
                          </label>
                          {collapsedSections.offer ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronUp className="w-5 h-5 text-slate-400" />}
                        </div>
                      </button>

                      {!collapsedSections.offer && (
                        <div className="p-6 pt-2 space-y-4 border-t border-slate-600/50">
                          {/* Variant Selector */}
                          <div>
                            <label className="block text-sm text-slate-400 mb-2">CTA Type</label>
                            <div className="flex gap-2">
                              {['buy', 'book', 'quiz', 'contact'].map(variant => (
                                <button
                                  key={variant}
                                  onClick={() => setLandingPageData({...landingPageData, offer_variant: variant})}
                                  className={`px-3 py-1.5 text-sm rounded capitalize ${
                                    (landingPageData.offer_variant || 'buy') === variant
                                      ? 'bg-amber-600 text-white'
                                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                  }`}
                                >
                                  {variant === 'buy' ? '🛒 Buy' : variant === 'book' ? '📅 Book' : variant === 'quiz' ? '📝 Quiz' : '📧 Contact'}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Headline & Subheadline */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm text-slate-400 mb-1">Offer Headline</label>
                              <input
                                type="text"
                                value={landingPageData.offer_headline || ''}
                                onChange={(e) => setLandingPageData({...landingPageData, offer_headline: e.target.value})}
                                placeholder="e.g., Special Launch Offer"
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-slate-400 mb-1">Offer Subheadline</label>
                              <input
                                type="text"
                                value={landingPageData.offer_subheadline || ''}
                                onChange={(e) => setLandingPageData({...landingPageData, offer_subheadline: e.target.value})}
                                placeholder="e.g., Limited time only..."
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500"
                              />
                            </div>
                          </div>

                          {/* CTA Button */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm text-slate-400 mb-1">CTA Button Text</label>
                              <input
                                type="text"
                                value={landingPageData.offer_cta_text || ''}
                                onChange={(e) => setLandingPageData({...landingPageData, offer_cta_text: e.target.value})}
                                placeholder="e.g., Buy Now"
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-slate-400 mb-1">CTA Button URL</label>
                              <input
                                type="text"
                                value={landingPageData.offer_cta_url || ''}
                                onChange={(e) => setLandingPageData({...landingPageData, offer_cta_url: e.target.value})}
                                placeholder="e.g., #shop or /checkout"
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500"
                              />
                            </div>
                          </div>

                          {/* Urgency & Guarantee */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm text-slate-400 mb-1">Urgency Text</label>
                              <input
                                type="text"
                                value={landingPageData.offer_urgency_text || ''}
                                onChange={(e) => setLandingPageData({...landingPageData, offer_urgency_text: e.target.value})}
                                placeholder="e.g., Only 5 left in stock!"
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-slate-400 mb-1">Guarantee Text</label>
                              <input
                                type="text"
                                value={landingPageData.guarantee_text || ''}
                                onChange={(e) => setLandingPageData({...landingPageData, guarantee_text: e.target.value})}
                                placeholder="e.g., 30-Day Money Back Guarantee"
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500"
                              />
                            </div>
                          </div>

                          {/* Pricing Section (nested) */}
                          <div className="bg-slate-800/50 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="text-sm font-semibold text-amber-300">💰 Pricing Options</h4>
                              <button
                                onClick={() => setLandingPageData({
                                  ...landingPageData,
                                  pricing_options: [...(landingPageData.pricing_options || []), {
                                    id: `option-${Date.now()}`,
                                    label: '',
                                    originalPrice: 0,
                                    salePrice: 0,
                                    discount: 0,
                                    popular: false
                                  }]
                                })}
                                className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300"
                              >
                                <Plus className="w-3 h-3" /> Add Option
                              </button>
                            </div>
                            <div className="space-y-3">
                              {(landingPageData.pricing_options || []).map((option: any, index: number) => (
                                <div key={index} className="bg-slate-700/50 p-3 rounded-lg">
                                  <div className="flex gap-2 items-center mb-2">
                                    <input
                                      type="text"
                                      value={option.label || ''}
                                      onChange={(e) => {
                                        const updated = [...(landingPageData.pricing_options || [])]
                                        updated[index] = {...option, label: e.target.value}
                                        setLandingPageData({...landingPageData, pricing_options: updated})
                                      }}
                                      placeholder="Package name"
                                      className="flex-1 px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                                    />
                                    <label className="flex items-center gap-1 text-xs text-slate-300">
                                      <input
                                        type="checkbox"
                                        checked={option.popular || false}
                                        onChange={(e) => {
                                          const updated = [...(landingPageData.pricing_options || [])]
                                          updated[index] = {...option, popular: e.target.checked}
                                          setLandingPageData({...landingPageData, pricing_options: updated})
                                        }}
                                        className="w-3 h-3"
                                      />
                                      Popular
                                    </label>
                                    <button
                                      onClick={() => {
                                        const updated = (landingPageData.pricing_options || []).filter((_: any, i: number) => i !== index)
                                        setLandingPageData({...landingPageData, pricing_options: updated})
                                      }}
                                      className="text-red-400 hover:text-red-300"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2">
                                    <div>
                                      <label className="block text-xs text-slate-500 mb-1">Original $</label>
                                      <input
                                        type="number"
                                        value={option.originalPrice || 0}
                                        onChange={(e) => {
                                          const updated = [...(landingPageData.pricing_options || [])]
                                          const original = parseFloat(e.target.value) || 0
                                          const sale = option.salePrice || 0
                                          const discount = original > 0 ? Math.round((1 - sale / original) * 100) : 0
                                          updated[index] = {...option, originalPrice: original, discount}
                                          setLandingPageData({...landingPageData, pricing_options: updated})
                                        }}
                                        className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs text-slate-500 mb-1">Sale $</label>
                                      <input
                                        type="number"
                                        value={option.salePrice || 0}
                                        onChange={(e) => {
                                          const updated = [...(landingPageData.pricing_options || [])]
                                          const sale = parseFloat(e.target.value) || 0
                                          const original = option.originalPrice || 0
                                          const discount = original > 0 ? Math.round((1 - sale / original) * 100) : 0
                                          updated[index] = {...option, salePrice: sale, discount}
                                          setLandingPageData({...landingPageData, pricing_options: updated})
                                        }}
                                        className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs text-slate-500 mb-1">Discount %</label>
                                      <input
                                        type="number"
                                        value={option.discount || 0}
                                        readOnly
                                        className="w-full px-2 py-1 bg-slate-600 border border-slate-600 rounded text-slate-300 text-sm"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Sold Indicator */}
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={landingPageData.show_sold_indicator || false}
                                onChange={(e) => setLandingPageData({...landingPageData, show_sold_indicator: e.target.checked})}
                                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-amber-500"
                              />
                              <span className="text-slate-300">Show Sold Indicator</span>
                            </label>
                            {landingPageData.show_sold_indicator && (
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={landingPageData.sold_percentage || 0}
                                  onChange={(e) => setLandingPageData({...landingPageData, sold_percentage: parseInt(e.target.value) || 0})}
                                  className="w-16 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                                />
                                <span className="text-slate-400 text-sm">% Sold</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Theme Colors & Footer */}
                    <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
                      <h3 className="text-lg font-semibold mb-4 text-violet-400">{t.themeColors || 'Theme Colors'}</h3>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium mb-1 text-slate-300">{t.primaryColor || 'Primary Color'}</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={landingPageData.primary_color || '#4A90D9'}
                              onChange={(e) => setLandingPageData({...landingPageData, primary_color: e.target.value})}
                              className="w-12 h-10 border border-slate-600 rounded cursor-pointer bg-transparent"
                            />
                            <input
                              type="text"
                              value={landingPageData.primary_color || '#4A90D9'}
                              onChange={(e) => setLandingPageData({...landingPageData, primary_color: e.target.value})}
                              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1 text-slate-300">{t.secondaryColor || 'Secondary Color'}</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={landingPageData.secondary_color || '#0D1B2A'}
                              onChange={(e) => setLandingPageData({...landingPageData, secondary_color: e.target.value})}
                              className="w-12 h-10 border border-slate-600 rounded cursor-pointer bg-transparent"
                            />
                            <input
                              type="text"
                              value={landingPageData.secondary_color || '#0D1B2A'}
                              onChange={(e) => setLandingPageData({...landingPageData, secondary_color: e.target.value})}
                              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-slate-300">{t.footerDisclaimer || 'Footer Disclaimer'}</label>
                        <textarea
                          value={landingPageData.footer_disclaimer || ''}
                          onChange={(e) => setLandingPageData({...landingPageData, footer_disclaimer: e.target.value})}
                          rows={2}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                      </div>
                    </div>

                    {/* Policies Section (Footnote) */}
                    <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
                      <h3 className="text-lg font-semibold mb-4 text-orange-400 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Policies & Legal
                      </h3>
                      <p className="text-sm text-slate-400 mb-4">Manage your store policies (Return Policy, Privacy Policy, Terms of Service, etc.)</p>
                      <PolicyManager businessUnitId={businessUnitId} language={language} />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-slate-400 mb-4">{t.noLandingPageYet || 'No landing page configured yet. Create one to customize what customers see.'}</p>
                    <button
                      onClick={() => setLandingPageData(getDefaultLandingPage())}
                      className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2 rounded-lg"
                    >
                      {t.createLandingPage || 'Create Landing Page'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Media Library Tab Content */}
            {activeSubTab === 'media' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
                      <Image className="w-6 h-6 text-pink-400" />
                      Image Library
                    </h2>
                    <p className="text-slate-400 mt-1">Upload and manage images and videos for your landing pages and products.</p>
                  </div>
                  <button
                    onClick={() => mediaInputRef.current?.click()}
                    disabled={mediaUploading}
                    className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
                  >
                    {mediaUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload Files
                      </>
                    )}
                  </button>
                </div>

                {/* Hidden file input */}
                <input
                  ref={mediaInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleMediaUpload}
                  className="hidden"
                />

                {/* Media Grid */}
                {mediaLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
                    <span className="ml-3 text-slate-400">Loading media files...</span>
                  </div>
                ) : mediaFiles.length === 0 ? (
                  <div className="text-center py-16 bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-600">
                    <Image className="w-16 h-16 mx-auto text-slate-500 mb-4" />
                    <h3 className="text-xl font-semibold text-slate-300 mb-2">No media files yet</h3>
                    <p className="text-slate-400 mb-6">Upload images and videos to use in your landing pages and products.</p>
                    <button
                      onClick={() => mediaInputRef.current?.click()}
                      className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-all"
                    >
                      <Upload className="w-5 h-5" />
                      Upload Your First File
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {mediaFiles.map((file) => (
                      <div key={file.id || file.name} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 group">
                        {/* Preview */}
                        <div className="aspect-square relative bg-slate-900">
                          {isImage(file.type) ? (
                            <img
                              src={file.url}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          ) : isVideo(file.type) ? (
                            <div className="w-full h-full flex items-center justify-center">
                              <video
                                src={file.url}
                                className="max-w-full max-h-full"
                                muted
                                playsInline
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <Video className="w-12 h-12 text-white/80" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FileText className="w-12 h-12 text-slate-500" />
                            </div>
                          )}

                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              onClick={() => copyToClipboard(file.url)}
                              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                              title="Copy URL"
                            >
                              {copiedUrl === file.url ? (
                                <Check className="w-5 h-5 text-green-400" />
                              ) : (
                                <Copy className="w-5 h-5 text-white" />
                              )}
                            </button>
                            <button
                              onClick={() => deleteMediaFile(file.name)}
                              className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-5 h-5 text-red-400" />
                            </button>
                          </div>
                        </div>

                        {/* File info */}
                        <div className="p-3">
                          <p className="text-sm text-white truncate" title={file.name}>
                            {file.name.replace(/^\d+_/, '')}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload tips */}
                <div className="mt-8 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Supported formats</h4>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300">JPG</span>
                    <span className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300">PNG</span>
                    <span className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300">GIF</span>
                    <span className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300">WebP</span>
                    <span className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300">SVG</span>
                    <span className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300">MP4</span>
                    <span className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300">WebM</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Maximum file size: 50MB</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* URL Scrape Modal */}
      {showUrlModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-purple-400" />
                Add Website URL
              </h3>
              <button
                onClick={() => { setShowUrlModal(false); setUrlInput(''); }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  Website URL
                </label>
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUrlScrape()
                  }}
                />
              </div>

              <p className="text-xs text-slate-400">
                The website content will be scraped and added to your knowledge base for AI training.
              </p>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowUrlModal(false); setUrlInput(''); }}
                className="px-4 py-2 text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleUrlScrape}
                disabled={!urlInput.trim()}
                className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Globe className="w-4 h-4" />
                Scrape Website
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default KnowledgeBase
