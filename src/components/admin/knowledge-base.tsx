'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Package, Wrench, FileText, Plus, Edit, Trash2,
  Upload, Search, Grid, List,
  Loader2, X, BookOpen, Globe, Layout, Save, Image, Video, Copy, Check,
  ChevronDown, ChevronUp, Zap, MessageSquare, Shield, ShoppingCart,
  AlignLeft, AlignCenter, AlignRight, Menu, Sparkles, Bold, Italic, Languages
} from 'lucide-react'
import PolicyManager from './policy-manager'
import ProductCatalogManager from './product-catalog-manager'
import { type Language, getTranslation } from '@/lib/translations'
import BlockManager from './landing-page/BlockManager'
import FooterEditor from './landing-page/FooterEditor'
import BlockPreview from './landing-page/BlockPreview'
import { createNewBlock } from './landing-page/block-registry'
import type { LandingPageBlock } from '@/types/landing-page-blocks'
import TextEditorControls from './landing-page/TextEditorControls'
import PolicyRichTextEditor from './landing-page/PolicyRichTextEditor'
import { policyTemplates } from '@/data/policy-templates'
import LanguageBar from './landing-page/LanguageBar'
import AddLocaleModal from './landing-page/AddLocaleModal'

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
  const landingPageDataRef = useRef<any>(null)
  const loadRequestIdRef = useRef<number>(0) // To track latest request and ignore stale responses
  const [hasLandingPage, setHasLandingPage] = useState(false)
  const [landingPageLoading, setLandingPageLoading] = useState(false)
  const [landingPageSaving, setLandingPageSaving] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState('US')
  const [selectedLangCode, setSelectedLangCode] = useState('en')
  const [availableLocales, setAvailableLocales] = useState<{country: string, language_code: string}[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [showCopyModal, setShowCopyModal] = useState(false)
  const [copyTargetCountry, setCopyTargetCountry] = useState('')
  const [isCopying, setIsCopying] = useState(false)
  // Collapsible section state for landing page editor
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    announcement: true,
    menuBar: true,
    hero: true,
    header: false,
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
  const [showFontMenu, setShowFontMenu] = useState<string | null>(null) // font menu key or null
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null) // color picker key or null
  const [showFooterPicker, setShowFooterPicker] = useState<string | null>(null) // footer styling picker
  const [editingPolicyType, setEditingPolicyType] = useState<string | null>(null) // policy being edited
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [showAddBlockMenu, setShowAddBlockMenu] = useState(false)
  const [footerCollapsed, setFooterCollapsed] = useState(false)
  const [showAddLocaleModal, setShowAddLocaleModal] = useState(false)
  const [translationMode, setTranslationMode] = useState(false)
  const [translationSourceData, setTranslationSourceData] = useState<any>(null)
  const [translatingSectionKey, setTranslatingSectionKey] = useState<string | null>(null)

  // Color palette for text colors
  const COLOR_PALETTE = [
    { name: 'White', value: '#ffffff' },
    { name: 'Black', value: '#000000' },
    { name: 'Dark Gray', value: '#374151' },
    { name: 'Gray', value: '#6b7280' },
    { name: 'Light Gray', value: '#d1d5db' },
    { name: 'Slate', value: '#1e293b' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Gold', value: '#d97706' },
  ]

  // File refs
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const industryDocInputRef = useRef<HTMLInputElement>(null)
  const mediaInputRef = useRef<HTMLInputElement>(null)

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [businessUnitId, activeSubTab])

  // Keep ref synced with state for closure-safe access in save function
  useEffect(() => {
    landingPageDataRef.current = landingPageData
  }, [landingPageData])

  // Fetch products for pricing plan linking
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`/api/shop/products?businessUnit=${businessUnitId}`)
        const data = await response.json()
        if (data.products) {
          setProducts(data.products)
        }
      } catch (error) {
        console.error('Error fetching products:', error)
      }
    }
    if (businessUnitId) {
      fetchProducts()
    }
  }, [businessUnitId])

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

    // Increment request ID to track this specific request
    const thisRequestId = ++loadRequestIdRef.current
    console.log(`[LoadLandingPage] Starting request #${thisRequestId} for ${loadCountry}/${loadLang}`)

    setLandingPageLoading(true)
    try {
      // Add cache-busting timestamp to prevent stale data when switching locales
      const response = await fetch(`/api/landing-page?businessUnit=${businessUnitId}&country=${loadCountry}&language=${loadLang}&_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      const data = await response.json()

      // CRITICAL: Check if this is still the latest request
      // If user switched locales while we were loading, ignore this stale response
      if (thisRequestId !== loadRequestIdRef.current) {
        console.log(`[LoadLandingPage] Ignoring stale response #${thisRequestId} (current is #${loadRequestIdRef.current})`)
        return
      }

      console.log(`[LoadLandingPage] Processing response #${thisRequestId} for ${loadCountry}/${loadLang}`)

      // Update available locales
      if (data.availableLocales) {
        setAvailableLocales(data.availableLocales)
      }

      if (data.landingPage) {
        // Verify the response matches what we requested
        if (data.landingPage.country !== loadCountry || data.landingPage.language_code !== loadLang) {
          console.warn(`[LoadLandingPage] Response mismatch! Requested ${loadCountry}/${loadLang}, got ${data.landingPage.country}/${data.landingPage.language_code}`)
          // Don't use mismatched data
          return
        }
        // Migrate legacy hero data to hero_slides if needed
        const landingPage = { ...data.landingPage }
        if ((!landingPage.hero_slides || landingPage.hero_slides.length === 0) && landingPage.hero_headline) {
          landingPage.hero_slides = [{
            headline: landingPage.hero_headline || '',
            subheadline: landingPage.hero_subheadline || '',
            content: '',
            background_url: '',
            background_color: '#1e293b',
            background_type: 'image',
            cta_text: landingPage.hero_cta_text || 'Shop Now',
            cta_url: '#shop',
            text_align: 'center',
            is_carousel: true
          }]
        }

        // Initialize missing font fields for all slides to prevent undefined values
        if (landingPage.hero_slides) {
          landingPage.hero_slides = landingPage.hero_slides.map(slide => ({
            ...slide,
            // Headline
            headline_font_family: slide.headline_font_family || 'Josefin Sans',
            headline_font_size: slide.headline_font_size || '2.5rem',
            headline_color: slide.headline_color || '#000000',
            headline_bold: slide.headline_bold ?? false,
            headline_italic: slide.headline_italic ?? false,
            headline_text_align: slide.headline_text_align || 'center',
            // Subheadline
            subheadline_font_family: slide.subheadline_font_family || 'Josefin Sans',
            subheadline_font_size: slide.subheadline_font_size || '1.25rem',
            subheadline_color: slide.subheadline_color || '#000000',
            subheadline_bold: slide.subheadline_bold ?? false,
            subheadline_italic: slide.subheadline_italic ?? false,
            subheadline_text_align: slide.subheadline_text_align || 'center',
            // Content/Features
            content_font_family: slide.content_font_family || 'Cormorant Garamond',
            content_font_size: slide.content_font_size || '1.125rem',
            content_color: slide.content_color || '#374151',
            content_bold: slide.content_bold ?? false,
            content_italic: slide.content_italic ?? false,
            content_text_align: slide.content_text_align || 'left'
          }))
        }

        // Initialize missing font fields for blocks to prevent undefined values
        if (landingPage.blocks) {
          landingPage.blocks = landingPage.blocks.map(block => {
            if (block.type === 'steps' && block.data?.steps) {
              return {
                ...block,
                data: {
                  ...block.data,
                  steps: block.data.steps.map(step => ({
                    ...step,
                    subheadline: step.subheadline || '',
                    subheadline_font_size: step.subheadline_font_size || '1.5rem',
                    subheadline_font_family: step.subheadline_font_family || 'Josefin Sans',
                    subheadline_color: step.subheadline_color || '#000000',
                    subheadline_bold: step.subheadline_bold ?? false,
                    subheadline_italic: step.subheadline_italic ?? false,
                    subheadline_align: step.subheadline_align || 'left',
                    text_font_family: step.text_font_family || 'Cormorant Garamond',
                    text_font_size: step.text_font_size || '1.125rem',
                    text_color: step.text_color || '#374151',
                    text_bold: step.text_bold ?? false,
                    text_italic: step.text_italic ?? false,
                    text_align: step.text_align || 'left'
                  }))
                }
              }
            }
            if (block.type === 'accordion') {
              return {
                ...block,
                data: {
                  ...block.data,
                  heading: block.data?.heading || 'Frequently Asked Questions',
                  heading_font_size: block.data?.heading_font_size || '2.5rem',
                  heading_font_family: block.data?.heading_font_family || 'Josefin Sans',
                  heading_color: block.data?.heading_color || '#000000',
                  items: (block.data?.items || []).map((item: any) => ({
                    ...item,
                    title_font_size: item.title_font_size || '1rem',
                    title_font_family: item.title_font_family || 'Josefin Sans',
                    title_color: item.title_color || '#111827',
                    title_bold: item.title_bold ?? false,
                    title_italic: item.title_italic ?? false,
                    content_font_size: item.content_font_size || '1rem',
                    content_font_family: item.content_font_family || 'Cormorant Garamond',
                    content_color: item.content_color || '#374151',
                    content_bold: item.content_bold ?? false,
                    content_italic: item.content_italic ?? false
                  }))
                }
              }
            }
            return block
          })
        }

        setLandingPageData(landingPage)
        setHasLandingPage(true)
      } else {
        // Check again for stale request before setting default
        if (thisRequestId !== loadRequestIdRef.current) {
          console.log(`[LoadLandingPage] Ignoring stale default #${thisRequestId}`)
          return
        }
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
      // Check for stale request before setting error default
      if (thisRequestId !== loadRequestIdRef.current) {
        console.log(`[LoadLandingPage] Ignoring stale error #${thisRequestId}`)
        return
      }
      const defaultPage = getDefaultLandingPage()
      defaultPage.country = loadCountry
      defaultPage.language_code = loadLang
      setLandingPageData(defaultPage)
      setHasLandingPage(false)
    } finally {
      // Only clear loading if this is still the current request
      if (thisRequestId === loadRequestIdRef.current) {
        setLandingPageLoading(false)
      }
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
      { label: 'Micro Infusion System', url: '/livechat', enabled: true },
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
      { headline: '', subheadline: '', content: '', background_url: '', background_color: '#1e293b', background_type: 'image', cta_text: 'Shop Now', cta_url: '#shop', text_align: 'center', is_carousel: true }
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

  // Handle adding a new block
  const handleAddBlock = (blockType: string) => {
    const blocks = landingPageData.blocks || []
    const newBlock = createNewBlock(blockType, '', blocks.length)
    if (newBlock) {
      setLandingPageData({
        ...landingPageData,
        blocks: [...blocks, newBlock]
      })
      setShowAddBlockMenu(false)
    }
  }

  // Handle updating blocks
  const handleBlocksChange = (updatedBlocks: LandingPageBlock[]) => {
    setLandingPageData({
      ...landingPageData,
      blocks: updatedBlocks
    })
  }

  const saveLandingPage = async () => {
    console.log('[DEBUG v2] saveLandingPage called')
    // Use ref to get the latest data (handles async state updates)
    const dataToSave = landingPageDataRef.current || landingPageData
    if (!businessUnitId || !dataToSave) {
      console.error('Missing businessUnitId or landingPageData', { businessUnitId, dataToSave })
      alert('Cannot save: missing business unit or data')
      return
    }
    setLandingPageSaving(true)
    try {
      // Create payload without id, business_unit_id, created_at, updated_at to prevent conflicts
      const { id, business_unit_id, created_at, updated_at, ...cleanData } = dataToSave
      const payload = {
        businessUnitId: businessUnitId,
        ...cleanData
      }
      console.log('[DEBUG v2] businessUnitId:', businessUnitId)
      console.log('[DEBUG v2] payload keys:', Object.keys(payload))
      console.log('[DEBUG v2] announcements:', payload.announcements)
      console.log('[DEBUG v2] blocks count:', payload.blocks?.length || 0)

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
        await loadLandingPage(dataToSave.country || 'US', dataToSave.language_code || 'en')
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

  // Copy landing page to another locale (same language, different country)
  const copyToLocale = async (targetCountry: string) => {
    if (!businessUnitId || !landingPageData) {
      alert('Cannot copy: missing business unit or data')
      return
    }

    const sourceCountry = landingPageData.country || 'US'
    const languageCode = landingPageData.language_code || 'en'

    // Check if target already exists
    const targetExists = availableLocales.some(
      l => l.country === targetCountry && l.language_code === languageCode
    )

    if (targetExists) {
      const confirmOverwrite = confirm(
        `A landing page already exists for ${targetCountry}/${languageCode}. Do you want to overwrite it?`
      )
      if (!confirmOverwrite) return
    }

    setIsCopying(true)
    try {
      // Create a copy of the landing page data with the new country
      const { id, business_unit_id, created_at, updated_at, ...cleanData } = landingPageData

      // Update country and currency for target locale
      const currencyInfo = countryCurrencyMap[targetCountry] || countryCurrencyMap['US']

      const payload = {
        businessUnitId: businessUnitId,
        ...cleanData,
        country: targetCountry,
        currency: currencyInfo.currency,
        currency_symbol: currencyInfo.symbol
      }

      console.log('[Copy] Copying from', sourceCountry, 'to', targetCountry, 'with language', languageCode)
      const response = await fetch('/api/landing-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()
      if (response.ok && result.success) {
        alert(`Successfully copied landing page to ${targetCountry}/${languageCode}!`)
        setShowCopyModal(false)
        setCopyTargetCountry('')
        // Reload to refresh available locales
        await loadLandingPage(sourceCountry, languageCode)
      } else {
        const errorMsg = result.error || result.message || 'Unknown error'
        alert(`Failed to copy: ${errorMsg}`)
      }
    } catch (error) {
      console.error('[Copy] Error copying landing page:', error)
      alert('Error copying landing page: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsCopying(false)
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
        // Handle carousel slides (always use slides array)
        const slides = [...(landingPageData.hero_slides || [])]
        slides[slideIndex] = {
          ...slides[slideIndex],
          background_url: data.url,
          background_type: isVideo ? 'video' : 'image',
          original_filename: file.name // Store original filename
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

    // Handle carousel slides (always use slides array)
    const slides = [...(landingPageData.hero_slides || [])]
    slides[slideIndex] = {
      ...slides[slideIndex],
      background_url: file.url,
      background_type: isVideo ? 'video' : 'image',
      original_filename: file.name // Store original filename from library
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
                {/* Language Bar */}
                <LanguageBar
                  businessUnitId={businessUnitId}
                  currentCountry={selectedCountry}
                  currentLanguage={selectedLangCode}
                  onLocaleChange={(country, lang) => {
                    // Clear current data first to prevent stale data showing
                    setLandingPageData(null)
                    landingPageDataRef.current = null
                    // Also clear translation mode when switching locales
                    setTranslationMode(false)
                    setTranslationSourceData(null)
                    setSelectedCountry(country)
                    setSelectedLangCode(lang)
                    // Reload landing page for new locale - pass values directly to avoid stale state
                    loadLandingPage(country, lang)
                  }}
                  onAddLocale={() => setShowAddLocaleModal(true)}
                  onDeleteLocale={async (country, lang) => {
                    try {
                      const response = await fetch(
                        `/api/landing-pages/delete-locale?businessUnit=${businessUnitId}&country=${country}&language=${lang}`,
                        { method: 'DELETE' }
                      )
                      const data = await response.json()
                      if (data.success) {
                        // If deleting current locale, switch to first available
                        if (country === selectedCountry && lang === selectedLangCode) {
                          const otherLocale = availableLocales.find(
                            l => l.country !== country || l.language_code !== lang
                          )
                          if (otherLocale) {
                            setSelectedCountry(otherLocale.country)
                            setSelectedLangCode(otherLocale.language_code)
                            // Reload with new locale values
                            loadLandingPage(otherLocale.country, otherLocale.language_code)
                          }
                        } else {
                          // Reload current locale
                          loadLandingPage(selectedCountry, selectedLangCode)
                        }
                      } else {
                        alert(data.error || 'Failed to delete locale')
                      }
                    } catch (err) {
                      console.error('Delete locale error:', err)
                      alert('Failed to delete locale')
                    }
                  }}
                  onSyncRequest={async (sourceCountry, sourceLanguage) => {
                    // Sync from source locale to current locale
                    if (confirm(`Sync content from ${sourceCountry}/${sourceLanguage} to ${selectedCountry}/${selectedLangCode}?\n\nThis will copy structure and media from the source locale. Text content will be preserved.`)) {
                      try {
                        // Get source locale data
                        const sourceResponse = await fetch(
                          `/api/landing-page?businessUnit=${businessUnitId}&country=${sourceCountry}&language=${sourceLanguage}`
                        )
                        const sourceData = await sourceResponse.json()

                        if (!sourceData.landingPage) {
                          alert('Source locale not found')
                          return
                        }

                        // Copy structure from source, keeping current locale's text where possible
                        const currentData = landingPageData || {}
                        const syncedData = {
                          ...currentData,
                          // Sync blocks structure (media URLs, layout) from source
                          blocks: sourceData.landingPage.blocks || [],
                          // Sync hero slides from source
                          hero_slides: sourceData.landingPage.hero_slides || [],
                          // Keep current locale's text fields
                          // (These would be translated separately)
                        }

                        // Save synced data
                        const saveResponse = await fetch('/api/landing-page', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            businessUnitId,
                            country: selectedCountry,
                            language_code: selectedLangCode,
                            ...syncedData
                          })
                        })

                        const saveResult = await saveResponse.json()
                        if (saveResult.success) {
                          alert('Sync complete! Reload to see changes.')
                          loadLandingPage(selectedCountry, selectedLangCode)
                        } else {
                          alert(saveResult.error || 'Sync failed')
                        }
                      } catch (err) {
                        console.error('Sync error:', err)
                        alert('Failed to sync locales')
                      }
                    }
                  }}
                />

                {/* Header Row with Title and Action Buttons */}
                <div className="flex items-center justify-between mb-4 mt-4">
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

                      {/* Add Block Button */}
                      <div className="relative">
                        <button
                          onClick={() => setShowAddBlockMenu(!showAddBlockMenu)}
                          className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                        >
                          <Plus className="w-4 h-4" />
                          Add Block
                        </button>

                        {/* Dropdown Menu */}
                        {showAddBlockMenu && (
                          <div className="fixed md:absolute left-4 right-4 md:left-auto md:right-0 top-1/2 -translate-y-1/2 md:top-auto md:translate-y-0 mt-0 md:mt-2 w-auto md:w-64 max-w-xs mx-auto bg-slate-800 border border-slate-600 rounded-lg shadow-2xl z-50 overflow-hidden">
                            <div className="p-2 border-b border-slate-600">
                              <p className="text-xs text-slate-400 font-medium">Select Block Type</p>
                            </div>
                            <div className="py-1">
                              {/* Split Block */}
                              <button
                                onClick={() => handleAddBlock('split')}
                                className="w-full px-3 py-2.5 hover:bg-slate-700 transition-colors flex items-center gap-3 text-left"
                              >
                                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                                  <span className="text-2xl">⬌</span>
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-white">Split</div>
                                  <div className="text-xs text-slate-400">Text alongside image</div>
                                </div>
                              </button>

                              {/* Card Block */}
                              <button
                                onClick={() => handleAddBlock('card')}
                                className="w-full px-3 py-2.5 hover:bg-slate-700 transition-colors flex items-center gap-3 text-left"
                              >
                                <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                                  <span className="text-2xl">💬</span>
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-white">Card</div>
                                  <div className="text-xs text-slate-400">Testimonials & reviews grid</div>
                                </div>
                              </button>

                              {/* Accordion Block */}
                              <button
                                onClick={() => handleAddBlock('accordion')}
                                className="w-full px-3 py-2.5 hover:bg-slate-700 transition-colors flex items-center gap-3 text-left"
                              >
                                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                                  <span className="text-2xl">▼</span>
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-white">Accordion</div>
                                  <div className="text-xs text-slate-400">Expandable FAQ sections</div>
                                </div>
                              </button>

                              {/* Pricing Table Block */}
                              <button
                                onClick={() => handleAddBlock('pricing')}
                                className="w-full px-3 py-2.5 hover:bg-slate-700 transition-colors flex items-center gap-3 text-left"
                              >
                                <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                                  <span className="text-2xl">💰</span>
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-white">Pricing Table</div>
                                  <div className="text-xs text-slate-400">Pricing comparison with discounts</div>
                                </div>
                              </button>

                              {/* Testimonials Block */}
                              <button
                                onClick={() => handleAddBlock('testimonials')}
                                className="w-full px-3 py-2.5 hover:bg-slate-700 transition-colors flex items-center gap-3 text-left"
                              >
                                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                                  <span className="text-2xl">⭐</span>
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-white">Testimonials</div>
                                  <div className="text-xs text-slate-400">Customer reviews carousel</div>
                                </div>
                              </button>

                              {/* Steps (Text/Image Grid) Block */}
                              <button
                                onClick={() => handleAddBlock('steps')}
                                className="w-full px-3 py-2.5 hover:bg-slate-700 transition-colors flex items-center gap-3 text-left"
                              >
                                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                                  <span className="text-2xl">📝</span>
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-white">Text/Image Grid</div>
                                  <div className="text-xs text-slate-400">Flexible text & image layout</div>
                                </div>
                              </button>

                              {/* Static Banner Block */}
                              <button
                                onClick={() => handleAddBlock('static_banner')}
                                className="w-full px-3 py-2.5 hover:bg-slate-700 transition-colors flex items-center gap-3 text-left"
                              >
                                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                                  <span className="text-2xl">🖼️</span>
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-white">Static Banner</div>
                                  <div className="text-xs text-slate-400">Full-width banner with overlay</div>
                                </div>
                              </button>

                              {/* Table Block */}
                              <button
                                onClick={() => handleAddBlock('table')}
                                className="w-full px-3 py-2.5 hover:bg-slate-700 transition-colors flex items-center gap-3 text-left"
                              >
                                <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                                  <span className="text-2xl">📊</span>
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-white">Table</div>
                                  <div className="text-xs text-slate-400">Customizable rows & columns</div>
                                </div>
                              </button>

                            </div>
                          </div>
                        )}
                      </div>

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
                  <>
                    {/* Translation Mode Header */}
                    {translationMode && translationSourceData && (
                      <div className="mb-4 p-3 bg-amber-900/30 border border-amber-500/50 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Languages className="w-5 h-5 text-amber-400" />
                          <span className="text-amber-300">
                            Translation Mode: Copying from <strong>{translationSourceData.country}/{translationSourceData.language_code}</strong>
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setTranslationMode(false)
                            setTranslationSourceData(null)
                          }}
                          className="px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded"
                        >
                          Exit Translation Mode
                        </button>
                      </div>
                    )}

                    {/* Resume Translation Button - shows for non-English locales when not in translation mode */}
                    {!translationMode && selectedLangCode !== 'en' && (
                      <div className="mb-4 p-3 bg-blue-900/30 border border-blue-500/50 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Languages className="w-5 h-5 text-blue-400" />
                          <span className="text-blue-300">
                            Viewing <strong>{selectedCountry}/{selectedLangCode}</strong> - Enable translation mode to see translate buttons
                          </span>
                        </div>
                        <button
                          onClick={async () => {
                            // Load source data (US/en by default)
                            try {
                              const response = await fetch(`/api/landing-page?businessUnit=${businessUnitId}&country=US&language=en`)
                              const data = await response.json()
                              if (data.landingPage) {
                                setTranslationSourceData(data.landingPage)
                                setTranslationMode(true)
                              } else {
                                alert('No source locale (US/en) found. Please create it first.')
                              }
                            } catch (err) {
                              console.error('Failed to load source data:', err)
                              alert('Failed to load source data')
                            }
                          }}
                          className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded flex items-center gap-2"
                        >
                          <Languages className="w-4 h-4" />
                          Enable Translation Mode
                        </button>
                      </div>
                    )}

                    {/* Main content area */}
                    <div className="space-y-6">
                    {/* Announcement Section */}
                    <div className="bg-gradient-to-r from-amber-900/20 to-slate-800/50 rounded-lg border border-amber-500/30">
                      <div
                        onClick={() => toggleSection('announcement')}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors rounded-t-lg cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                            <MessageSquare className="w-5 h-5 text-amber-400" />
                          </div>
                          <div className="text-left">
                            <h3 className="text-lg font-semibold text-amber-400">Announcement Banner</h3>
                            <p className="text-xs text-slate-400">Rotating announcements (5s interval)</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-slate-400">
                            {(landingPageData.announcements || []).length} announcements
                          </span>
                          {translationMode && translationSourceData && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation()
                                setTranslatingSectionKey('announcements')
                                try {
                                  const response = await fetch('/api/landing-pages/translate-section', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      content: translationSourceData.announcements,
                                      targetLanguage: selectedLangCode
                                    })
                                  })
                                  const data = await response.json()
                                  if (data.success) {
                                    setLandingPageData(prev => prev ? { ...prev, announcements: data.translated } : prev)
                                    setTimeout(() => saveLandingPage(), 500)
                                  }
                                } catch (err) { console.error(err) }
                                setTranslatingSectionKey(null)
                              }}
                              disabled={translatingSectionKey === 'announcements'}
                              className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs flex items-center gap-1 disabled:opacity-50"
                            >
                              {translatingSectionKey === 'announcements' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Languages className="w-3 h-3" />}
                              Translate
                            </button>
                          )}
                          {collapsedSections.announcement ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronUp className="w-5 h-5 text-slate-400" />}
                        </div>
                      </div>

                      {!collapsedSections.announcement && (
                        <div className="p-6 pt-2 space-y-4 border-t border-slate-600/50">
                          <div className="flex justify-between items-center">
                            <p className="text-sm text-slate-400">Add announcements that rotate every 5 seconds</p>
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
                      )}
                    </div>

                    {/* Menu Bar Section */}
                    <div className="bg-gradient-to-r from-indigo-900/20 to-slate-800/50 rounded-lg border border-indigo-500/30">
                      <div
                        onClick={() => toggleSection('menuBar')}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors rounded-t-lg cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                            <Menu className="w-5 h-5 text-indigo-400" />
                          </div>
                          <div className="text-left">
                            <h3 className="text-lg font-semibold text-indigo-400">Menu Bar</h3>
                            <p className="text-xs text-slate-400">Logo, navigation links & utilities</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-slate-400">
                            {(landingPageData.menu_items || []).length} menu items
                          </span>
                          {translationMode && translationSourceData && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation()
                                setTranslatingSectionKey('menu')
                                try {
                                  const response = await fetch('/api/landing-pages/translate-section', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      content: translationSourceData.menu_items,
                                      targetLanguage: selectedLangCode
                                    })
                                  })
                                  const data = await response.json()
                                  if (data.success) {
                                    setLandingPageData(prev => prev ? { ...prev, menu_items: data.translated } : prev)
                                    setTimeout(() => saveLandingPage(), 500)
                                  }
                                } catch (err) { console.error(err) }
                                setTranslatingSectionKey(null)
                              }}
                              disabled={translatingSectionKey === 'menu'}
                              className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs flex items-center gap-1 disabled:opacity-50"
                            >
                              {translatingSectionKey === 'menu' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Languages className="w-3 h-3" />}
                              Translate
                            </button>
                          )}
                          {collapsedSections.menuBar ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronUp className="w-5 h-5 text-slate-400" />}
                        </div>
                      </div>

                      {!collapsedSections.menuBar && (
                        <div className="p-6 pt-2 space-y-6 border-t border-slate-600/50">
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
                              <div className="flex items-center gap-2 flex-wrap">
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
                              <div key={index} className="bg-slate-800/50 p-2 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
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
                                  <button
                                    onClick={() => {
                                      const updated = (landingPageData.menu_items || []).filter((_: any, i: number) => i !== index)
                                      setLandingPageData({...landingPageData, menu_items: updated})
                                    }}
                                    className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded flex-shrink-0"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                                <input
                                  type="text"
                                  value={item.url}
                                  onChange={(e) => {
                                    const updated = [...(landingPageData.menu_items || [])]
                                    updated[index] = { ...item, url: e.target.value }
                                    setLandingPageData({...landingPageData, menu_items: updated})
                                  }}
                                  placeholder="URL or #section"
                                  className="w-full px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
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
                      )}
                    </div>

                    {/* Hero Section */}
                    <div className="bg-gradient-to-r from-violet-900/20 to-slate-800/50 rounded-lg border border-violet-500/30">
                      <div
                        onClick={() => toggleSection('hero')}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors rounded-t-lg cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-violet-400" />
                          </div>
                          <div className="text-left">
                            <h3 className="text-lg font-semibold text-violet-400">Hero Banner</h3>
                            <p className="text-xs text-slate-400">Carousel with {(landingPageData.hero_slides || []).length} slides</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-slate-400">📱 Horizontal Scroll</span>
                          {translationMode && translationSourceData && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation()
                                setTranslatingSectionKey('hero')
                                try {
                                  const response = await fetch('/api/landing-pages/translate-section', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      content: translationSourceData.hero_slides,
                                      targetLanguage: selectedLangCode
                                    })
                                  })
                                  const data = await response.json()
                                  if (data.success) {
                                    setLandingPageData(prev => prev ? { ...prev, hero_slides: data.translated } : prev)
                                    setTimeout(() => saveLandingPage(), 500)
                                  }
                                } catch (err) { console.error(err) }
                                setTranslatingSectionKey(null)
                              }}
                              disabled={translatingSectionKey === 'hero'}
                              className="px-2 py-1 bg-violet-600 hover:bg-violet-700 text-white rounded text-xs flex items-center gap-1 disabled:opacity-50"
                            >
                              {translatingSectionKey === 'hero' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Languages className="w-3 h-3" />}
                              Translate
                            </button>
                          )}
                          {collapsedSections.hero ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronUp className="w-5 h-5 text-slate-400" />}
                        </div>
                      </div>

                      {!collapsedSections.hero && (
                        <div className="p-6 pt-2 space-y-4 border-t border-slate-600/50">
                          {/* Carousel Slides */}
                          <div className="flex justify-between items-center mb-4">
                            <label className="text-sm font-medium text-slate-300">Carousel Slides</label>
                            <button
                              onClick={() => {
                                const slides = [...(landingPageData.hero_slides || [])]
                                slides.push({ headline: '', subheadline: '', content: '', background_url: '', background_color: '#1e293b', background_type: 'image', cta_text: 'Shop Now', cta_url: '#shop', text_align: 'center', is_carousel: true })
                                setLandingPageData({...landingPageData, hero_slides: slides})
                              }}
                              className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300"
                            >
                              <Plus className="w-4 h-4" />
                              Add Slide
                            </button>
                          </div>

                      <div className="space-y-4">
                        {(landingPageData.hero_slides || []).map((slide: { headline: string; subheadline: string; content?: string; background_url: string; background_type: string; cta_text: string; cta_url: string; text_align?: 'left' | 'center' | 'right'; original_filename?: string }, index: number) => (
                          <div key={index} className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
                            <div className="flex justify-between items-center mb-3">
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-slate-300">Slide {index + 1}</span>
                                {/* Carousel Toggle */}
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={slide.is_carousel !== false} // Default to true for backwards compatibility
                                    onChange={(e) => {
                                      const slides = [...(landingPageData.hero_slides || [])]
                                      slides[index] = { ...slide, is_carousel: e.target.checked }
                                      setLandingPageData({...landingPageData, hero_slides: slides})
                                    }}
                                    className="w-4 h-4 rounded border-slate-600 text-violet-600 focus:ring-violet-500"
                                  />
                                  <span className="text-xs text-slate-400">
                                    {slide.is_carousel !== false ? 'Carousel' : 'Static Banner'}
                                  </span>
                                </label>
                              </div>
                              <div className="flex items-center gap-2">
                                {/* Move Up */}
                                {index > 0 && (
                                  <button
                                    onClick={() => {
                                      const slides = [...(landingPageData.hero_slides || [])]
                                      const temp = slides[index]
                                      slides[index] = slides[index - 1]
                                      slides[index - 1] = temp
                                      setLandingPageData({...landingPageData, hero_slides: slides})
                                    }}
                                    className="text-slate-400 hover:text-slate-200"
                                    title="Move up"
                                  >
                                    <ChevronUp className="w-4 h-4" />
                                  </button>
                                )}
                                {/* Move Down */}
                                {index < (landingPageData.hero_slides || []).length - 1 && (
                                  <button
                                    onClick={() => {
                                      const slides = [...(landingPageData.hero_slides || [])]
                                      const temp = slides[index]
                                      slides[index] = slides[index + 1]
                                      slides[index + 1] = temp
                                      setLandingPageData({...landingPageData, hero_slides: slides})
                                    }}
                                    className="text-slate-400 hover:text-slate-200"
                                    title="Move down"
                                  >
                                    <ChevronDown className="w-4 h-4" />
                                  </button>
                                )}
                                {/* Delete */}
                                {(landingPageData.hero_slides || []).length > 1 && (
                                  <button
                                    onClick={() => {
                                      const slides = [...(landingPageData.hero_slides || [])]
                                      slides.splice(index, 1)
                                      setLandingPageData({...landingPageData, hero_slides: slides})
                                    }}
                                    className="text-red-400 hover:text-red-300"
                                    title="Delete slide"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Background Upload - Hidden for price banners */}
                            {!slide.is_price_banner && (
                              <div className="mb-3">
                                <label className="block text-xs text-slate-400 mb-1">Background Image/Video</label>
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {slide.background_url ? (
                                    <div className="relative">
                                      {slide.background_type === 'video' ? (
                                        <video
                                          src={slide.background_url}
                                          className="h-16 w-28 object-cover rounded bg-slate-800"
                                          muted
                                          playsInline
                                          preload="metadata"
                                        />
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
                                  {/* Show original filename if available */}
                                  {slide.background_url && (
                                    <div className="text-xs font-mono max-w-xs">
                                      {(() => {
                                        // Use original_filename if set
                                        if (slide.original_filename) {
                                          return (
                                            <span className="text-green-300" title={slide.original_filename}>
                                              📄 {slide.original_filename}
                                            </span>
                                          )
                                        }
                                        // Try to extract from URL (works for media-library uploads with format: timestamp_filename.ext)
                                        try {
                                          const urlPath = new URL(slide.background_url).pathname
                                          const fullName = urlPath.split('/').pop() || ''
                                          // Check if it's media-library format (timestamp_filename) vs product-images format (timestamp-random)
                                          if (fullName.includes('_') && !fullName.match(/^\d+-[a-z0-9]+\./i)) {
                                            const filename = fullName.replace(/^\d+_/, '')
                                            if (filename && filename !== fullName) {
                                              return (
                                                <span className="text-green-300" title={filename}>
                                                  📄 {filename}
                                                </span>
                                              )
                                            }
                                          }
                                        } catch {}
                                        // Can't determine filename - show truncated URL
                                        try {
                                          const urlPath = new URL(slide.background_url).pathname
                                          const shortName = urlPath.split('/').pop() || ''
                                          return (
                                            <span className="text-slate-400 text-[10px]" title={shortName}>
                                              📎 {shortName.length > 20 ? shortName.substring(0, 17) + '...' : shortName}
                                            </span>
                                          )
                                        } catch {
                                          return null
                                        }
                                      })()}
                                    </div>
                                  )}
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
                                  {/* Background Color Picker */}
                                  <div className="relative">
                                    <button
                                      onClick={() => {
                                        const key = `bgColor_${index}`
                                        setShowColorPicker(showColorPicker === key ? null : key)
                                      }}
                                      className="px-3 py-1.5 bg-slate-600 text-white text-sm rounded hover:bg-slate-500 transition-colors flex items-center gap-1.5"
                                      title="Background Color"
                                    >
                                      <div
                                        className="w-4 h-4 rounded border border-white"
                                        style={{ backgroundColor: slide.background_color || '#1e293b' }}
                                      />
                                      BG
                                    </button>
                                    {showColorPicker === `bgColor_${index}` && (
                                      <div className="fixed md:absolute left-4 right-4 md:left-auto md:right-auto top-1/2 -translate-y-1/2 md:top-auto md:translate-y-0 z-50 mt-0 md:mt-1 bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl max-w-xs mx-auto">
                                        <div className="grid grid-cols-7 gap-2 mb-2">
                                          {COLOR_PALETTE.map((color) => (
                                            <button
                                              key={color.value}
                                              onClick={() => {
                                                const slides = [...(landingPageData.hero_slides || [])]
                                                slides[index] = { ...slide, background_color: color.value }
                                                setLandingPageData({...landingPageData, hero_slides: slides})
                                                setShowColorPicker(null)
                                              }}
                                              className="w-7 h-7 rounded border-2 border-slate-600 hover:border-violet-400 transition-colors"
                                              style={{ backgroundColor: color.value }}
                                              title={color.name}
                                            />
                                          ))}
                                        </div>
                                        <button
                                          onClick={() => setShowColorPicker(null)}
                                          className="w-full text-xs text-slate-400 hover:text-slate-200"
                                        >
                                          Close
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  <input
                                    ref={(el) => { heroSlideInputRefs.current[index] = el }}
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm"
                                    onChange={(e) => handleHeroSlideUpload(e, index)}
                                    className="hidden"
                                  />
                                </div>

                              </div>
                              </div>
                            )}

                            {/* Text Overlay */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <label className="text-xs text-slate-400">Headline</label>
                                  <div className="flex items-center gap-1">
                                    {/* Alignment buttons */}
                                    <button
                                      onClick={() => {
                                        const slides = [...(landingPageData.hero_slides || [])]
                                        slides[index] = { ...slide, headline_text_align: 'left' }
                                        setLandingPageData({...landingPageData, hero_slides: slides})
                                      }}
                                      className={`p-1 rounded ${
                                        (slide.headline_text_align || 'center') === 'left'
                                          ? 'bg-violet-600 text-white'
                                          : 'text-slate-400 hover:text-slate-200'
                                      }`}
                                      title="Align Left"
                                    >
                                      <AlignLeft className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        const slides = [...(landingPageData.hero_slides || [])]
                                        slides[index] = { ...slide, headline_text_align: 'center' }
                                        setLandingPageData({...landingPageData, hero_slides: slides})
                                      }}
                                      className={`p-1 rounded ${
                                        (slide.headline_text_align || 'center') === 'center'
                                          ? 'bg-violet-600 text-white'
                                          : 'text-slate-400 hover:text-slate-200'
                                      }`}
                                      title="Align Center"
                                    >
                                      <AlignCenter className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        const slides = [...(landingPageData.hero_slides || [])]
                                        slides[index] = { ...slide, headline_text_align: 'right' }
                                        setLandingPageData({...landingPageData, hero_slides: slides})
                                      }}
                                      className={`p-1 rounded ${
                                        (slide.headline_text_align || 'center') === 'right'
                                          ? 'bg-violet-600 text-white'
                                          : 'text-slate-400 hover:text-slate-200'
                                      }`}
                                      title="Align Right"
                                    >
                                      <AlignRight className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {/* Bold button */}
                                    <button
                                      onClick={() => {
                                        const slides = [...(landingPageData.hero_slides || [])]
                                        slides[index] = { ...slide, headline_bold: !slide.headline_bold }
                                        setLandingPageData({...landingPageData, hero_slides: slides})
                                      }}
                                      className={`p-1 rounded ${
                                        slide.headline_bold
                                          ? 'bg-violet-600 text-white'
                                          : 'text-slate-400 hover:text-slate-200'
                                      }`}
                                      title="Bold"
                                    >
                                      <Bold className="w-3 h-3" />
                                    </button>
                                    {/* Italic button */}
                                    <button
                                      onClick={() => {
                                        const slides = [...(landingPageData.hero_slides || [])]
                                        slides[index] = { ...slide, headline_italic: !slide.headline_italic }
                                        setLandingPageData({...landingPageData, hero_slides: slides})
                                      }}
                                      className={`p-1 rounded ${
                                        slide.headline_italic
                                          ? 'bg-violet-600 text-white'
                                          : 'text-slate-400 hover:text-slate-200'
                                      }`}
                                      title="Italic"
                                    >
                                      <Italic className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {/* Font Size Dropdown */}
                                    <div className="relative">
                                      <button
                                        onClick={() => {
                                          const key = `sizeMenu_${index}_headline`
                                          setShowFontMenu(showFontMenu === key ? null : key)
                                        }}
                                        className="px-2 py-0.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded border border-slate-600"
                                      >
                                        {Math.round(parseFloat(slide.headline_font_size || '3.75') * 16) || 60}
                                      </button>
                                      {showFontMenu === `sizeMenu_${index}_headline` && (
                                        <div className="fixed md:absolute left-4 md:left-0 top-1/2 -translate-y-1/2 md:top-auto md:translate-y-0 mt-0 md:mt-1 w-20 bg-slate-700 border border-slate-600 rounded shadow-lg z-50 max-h-48 overflow-y-auto">
                                          {[24, 32, 40, 48, 56, 64, 72, 80, 96, 112, 128].map(size => (
                                            <button
                                              key={size}
                                              onClick={() => {
                                                const slides = [...(landingPageData.hero_slides || [])]
                                                slides[index] = { ...slide, headline_font_size: `${size / 16}rem` }
                                                setLandingPageData({...landingPageData, hero_slides: slides})
                                                setShowFontMenu(null)
                                              }}
                                              className={`w-full px-3 py-1.5 text-left text-xs hover:bg-slate-600 ${
                                                Math.round(parseFloat(slide.headline_font_size || '3.75') * 16) === size ? 'bg-violet-600 text-white' : 'text-slate-200'
                                              }`}
                                            >
                                              {size}
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    {/* Font Family Dropdown */}
                                    <div className="relative">
                                      <button
                                        onClick={() => {
                                          const key = `fontMenu_${index}_headline`
                                          setShowFontMenu(showFontMenu === key ? null : key)
                                        }}
                                        className="px-2 py-0.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded border border-slate-600"
                                      >
                                        {(slide.headline_font_family || 'Josefin Sans').split(' ')[0]}
                                      </button>
                                      {showFontMenu === `fontMenu_${index}_headline` && (
                                        <div className="fixed md:absolute left-4 md:left-0 top-1/2 -translate-y-1/2 md:top-auto md:translate-y-0 mt-0 md:mt-1 w-40 max-w-[calc(100vw-2rem)] bg-slate-700 border border-slate-600 rounded shadow-lg z-50 max-h-64 overflow-y-auto">
                                          {['Josefin Sans', 'Cormorant Garamond', 'Playfair Display', 'Montserrat', 'Inter', 'Lora', 'Raleway', 'Open Sans'].map(font => (
                                            <button
                                              key={font}
                                              onClick={() => {
                                                const slides = [...(landingPageData.hero_slides || [])]
                                                slides[index] = { ...slide, headline_font_family: font }
                                                setLandingPageData({...landingPageData, hero_slides: slides})
                                                setShowFontMenu(null)
                                              }}
                                              className={`w-full px-3 py-1.5 text-left text-xs hover:bg-slate-600 ${
                                                (slide.headline_font_family || 'Josefin Sans') === font ? 'bg-violet-600 text-white' : 'text-slate-200'
                                              }`}
                                            >
                                              {font}
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    {/* Color Picker */}
                                    <div className="relative">
                                      <button
                                        onClick={() => {
                                          const key = `colorPicker_${index}_headline`
                                          setShowColorPicker(showColorPicker === key ? null : key)
                                        }}
                                        className="w-7 h-7 rounded border border-slate-600 cursor-pointer hover:scale-110 transition-transform"
                                        style={{ backgroundColor: slide.headline_color || '#ffffff' }}
                                        title="Headline color"
                                      />
                                      {showColorPicker === `colorPicker_${index}_headline` && (
                                        <div className="fixed md:absolute left-4 right-4 md:left-auto md:right-0 top-1/2 -translate-y-1/2 md:top-full md:translate-y-0 mt-0 md:mt-2 p-3 bg-slate-700 border border-slate-600 rounded-lg shadow-xl z-50 max-w-xs mx-auto">
                                          <div className="grid grid-cols-7 gap-2">
                                            {COLOR_PALETTE.map((color) => (
                                              <button
                                                key={color.value}
                                                onClick={() => {
                                                  const slides = [...(landingPageData.hero_slides || [])]
                                                  slides[index] = { ...slide, headline_color: color.value }
                                                  setLandingPageData({...landingPageData, hero_slides: slides})
                                                  setShowColorPicker(null)
                                                }}
                                                className="w-7 h-7 rounded border-2 hover:scale-110 transition-transform"
                                                style={{
                                                  backgroundColor: color.value,
                                                  borderColor: (slide.headline_color || '#ffffff') === color.value ? '#a855f7' : '#475569'
                                                }}
                                                title={color.name}
                                              />
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
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
                                <div className="flex items-center gap-2 mb-1">
                                  <label className="text-xs text-slate-400">Subheadline</label>
                                  <div className="flex items-center gap-1">
                                    {/* Alignment buttons */}
                                    <button
                                      onClick={() => {
                                        const slides = [...(landingPageData.hero_slides || [])]
                                        slides[index] = { ...slide, subheadline_text_align: 'left' }
                                        setLandingPageData({...landingPageData, hero_slides: slides})
                                      }}
                                      className={`p-1 rounded ${
                                        (slide.subheadline_text_align || 'center') === 'left'
                                          ? 'bg-violet-600 text-white'
                                          : 'text-slate-400 hover:text-slate-200'
                                      }`}
                                      title="Align Left"
                                    >
                                      <AlignLeft className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        const slides = [...(landingPageData.hero_slides || [])]
                                        slides[index] = { ...slide, subheadline_text_align: 'center' }
                                        setLandingPageData({...landingPageData, hero_slides: slides})
                                      }}
                                      className={`p-1 rounded ${
                                        (slide.subheadline_text_align || 'center') === 'center'
                                          ? 'bg-violet-600 text-white'
                                          : 'text-slate-400 hover:text-slate-200'
                                      }`}
                                      title="Align Center"
                                    >
                                      <AlignCenter className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        const slides = [...(landingPageData.hero_slides || [])]
                                        slides[index] = { ...slide, subheadline_text_align: 'right' }
                                        setLandingPageData({...landingPageData, hero_slides: slides})
                                      }}
                                      className={`p-1 rounded ${
                                        (slide.subheadline_text_align || 'center') === 'right'
                                          ? 'bg-violet-600 text-white'
                                          : 'text-slate-400 hover:text-slate-200'
                                      }`}
                                      title="Align Right"
                                    >
                                      <AlignRight className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {/* Bold button */}
                                    <button
                                      onClick={() => {
                                        const slides = [...(landingPageData.hero_slides || [])]
                                        slides[index] = { ...slide, subheadline_bold: !slide.subheadline_bold }
                                        setLandingPageData({...landingPageData, hero_slides: slides})
                                      }}
                                      className={`p-1 rounded ${
                                        slide.subheadline_bold
                                          ? 'bg-violet-600 text-white'
                                          : 'text-slate-400 hover:text-slate-200'
                                      }`}
                                      title="Bold"
                                    >
                                      <Bold className="w-3 h-3" />
                                    </button>
                                    {/* Italic button */}
                                    <button
                                      onClick={() => {
                                        const slides = [...(landingPageData.hero_slides || [])]
                                        slides[index] = { ...slide, subheadline_italic: !slide.subheadline_italic }
                                        setLandingPageData({...landingPageData, hero_slides: slides})
                                      }}
                                      className={`p-1 rounded ${
                                        slide.subheadline_italic
                                          ? 'bg-violet-600 text-white'
                                          : 'text-slate-400 hover:text-slate-200'
                                      }`}
                                      title="Italic"
                                    >
                                      <Italic className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {/* Font Size Dropdown */}
                                    <div className="relative">
                                      <button
                                        onClick={() => {
                                          const key = `sizeMenu_${index}_subheadline`
                                          setShowFontMenu(showFontMenu === key ? null : key)
                                        }}
                                        className="px-2 py-0.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded border border-slate-600"
                                      >
                                        {Math.round(parseFloat(slide.subheadline_font_size || '1.25') * 16) || 20}
                                      </button>
                                      {showFontMenu === `sizeMenu_${index}_subheadline` && (
                                        <div className="fixed md:absolute left-4 md:left-0 top-1/2 -translate-y-1/2 md:top-auto md:translate-y-0 mt-0 md:mt-1 w-20 bg-slate-700 border border-slate-600 rounded shadow-lg z-50 max-h-48 overflow-y-auto">
                                          {[12, 14, 16, 18, 20, 24, 28, 32, 36, 40].map(size => (
                                            <button
                                              key={size}
                                              onClick={() => {
                                                const slides = [...(landingPageData.hero_slides || [])]
                                                slides[index] = { ...slide, subheadline_font_size: `${size / 16}rem` }
                                                setLandingPageData({...landingPageData, hero_slides: slides})
                                                setShowFontMenu(null)
                                              }}
                                              className={`w-full px-3 py-1.5 text-left text-xs hover:bg-slate-600 ${
                                                Math.round(parseFloat(slide.subheadline_font_size || '1.25') * 16) === size ? 'bg-violet-600 text-white' : 'text-slate-200'
                                              }`}
                                            >
                                              {size}
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    {/* Font Family Dropdown */}
                                    <div className="relative">
                                      <button
                                        onClick={() => {
                                          const key = `fontMenu_${index}_subheadline`
                                          setShowFontMenu(showFontMenu === key ? null : key)
                                        }}
                                        className="px-2 py-0.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded border border-slate-600"
                                      >
                                        {(slide.subheadline_font_family || 'Josefin Sans').split(' ')[0]}
                                      </button>
                                      {showFontMenu === `fontMenu_${index}_subheadline` && (
                                        <div className="fixed md:absolute left-4 md:left-0 top-1/2 -translate-y-1/2 md:top-auto md:translate-y-0 mt-0 md:mt-1 w-40 max-w-[calc(100vw-2rem)] bg-slate-700 border border-slate-600 rounded shadow-lg z-50 max-h-64 overflow-y-auto">
                                          {['Josefin Sans', 'Cormorant Garamond', 'Playfair Display', 'Montserrat', 'Inter', 'Lora', 'Raleway', 'Open Sans'].map(font => (
                                            <button
                                              key={font}
                                              onClick={() => {
                                                const slides = [...(landingPageData.hero_slides || [])]
                                                slides[index] = { ...slide, subheadline_font_family: font }
                                                setLandingPageData({...landingPageData, hero_slides: slides})
                                                setShowFontMenu(null)
                                              }}
                                              className={`w-full px-3 py-1.5 text-left text-xs hover:bg-slate-600 ${
                                                (slide.subheadline_font_family || 'Josefin Sans') === font ? 'bg-violet-600 text-white' : 'text-slate-200'
                                              }`}
                                            >
                                              {font}
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    {/* Color Picker */}
                                    <div className="relative">
                                      <button
                                        onClick={() => {
                                          const key = `colorPicker_${index}_subheadline`
                                          setShowColorPicker(showColorPicker === key ? null : key)
                                        }}
                                        className="w-7 h-7 rounded border border-slate-600 cursor-pointer hover:scale-110 transition-transform"
                                        style={{ backgroundColor: slide.subheadline_color || '#ffffff' }}
                                        title="Subheadline color"
                                      />
                                      {showColorPicker === `colorPicker_${index}_subheadline` && (
                                        <div className="fixed md:absolute left-4 right-4 md:left-auto md:right-0 top-1/2 -translate-y-1/2 md:top-full md:translate-y-0 mt-0 md:mt-2 p-3 bg-slate-700 border border-slate-600 rounded-lg shadow-xl z-50 max-w-xs mx-auto">
                                          <div className="grid grid-cols-7 gap-2">
                                            {COLOR_PALETTE.map((color) => (
                                              <button
                                                key={color.value}
                                                onClick={() => {
                                                  const slides = [...(landingPageData.hero_slides || [])]
                                                  slides[index] = { ...slide, subheadline_color: color.value }
                                                  setLandingPageData({...landingPageData, hero_slides: slides})
                                                  setShowColorPicker(null)
                                                }}
                                                className="w-7 h-7 rounded border-2 hover:scale-110 transition-transform"
                                                style={{
                                                  backgroundColor: color.value,
                                                  borderColor: (slide.subheadline_color || '#ffffff') === color.value ? '#a855f7' : '#475569'
                                                }}
                                                title={color.name}
                                              />
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
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
                                <div className="flex items-center gap-2 mb-1">
                                  <label className="text-xs text-slate-400">{slide.is_price_banner ? 'Features' : 'Content (optional)'}</label>
                                  <div className="flex items-center gap-1">
                                    {/* Alignment buttons */}
                                    <button
                                      onClick={() => {
                                        const slides = [...(landingPageData.hero_slides || [])]
                                        slides[index] = { ...slide, content_text_align: 'left' }
                                        setLandingPageData({...landingPageData, hero_slides: slides})
                                      }}
                                      className={`p-1 rounded ${
                                        (slide.content_text_align || 'center') === 'left'
                                          ? 'bg-violet-600 text-white'
                                          : 'text-slate-400 hover:text-slate-200'
                                      }`}
                                      title="Align Left"
                                    >
                                      <AlignLeft className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        const slides = [...(landingPageData.hero_slides || [])]
                                        slides[index] = { ...slide, content_text_align: 'center' }
                                        setLandingPageData({...landingPageData, hero_slides: slides})
                                      }}
                                      className={`p-1 rounded ${
                                        (slide.content_text_align || 'center') === 'center'
                                          ? 'bg-violet-600 text-white'
                                          : 'text-slate-400 hover:text-slate-200'
                                      }`}
                                      title="Align Center"
                                    >
                                      <AlignCenter className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        const slides = [...(landingPageData.hero_slides || [])]
                                        slides[index] = { ...slide, content_text_align: 'right' }
                                        setLandingPageData({...landingPageData, hero_slides: slides})
                                      }}
                                      className={`p-1 rounded ${
                                        (slide.content_text_align || 'center') === 'right'
                                          ? 'bg-violet-600 text-white'
                                          : 'text-slate-400 hover:text-slate-200'
                                      }`}
                                      title="Align Right"
                                    >
                                      <AlignRight className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {/* Bold button */}
                                    <button
                                      onClick={() => {
                                        const slides = [...(landingPageData.hero_slides || [])]
                                        slides[index] = { ...slide, content_bold: !slide.content_bold }
                                        setLandingPageData({...landingPageData, hero_slides: slides})
                                      }}
                                      className={`p-1 rounded ${
                                        slide.content_bold
                                          ? 'bg-violet-600 text-white'
                                          : 'text-slate-400 hover:text-slate-200'
                                      }`}
                                      title="Bold"
                                    >
                                      <Bold className="w-3 h-3" />
                                    </button>
                                    {/* Italic button */}
                                    <button
                                      onClick={() => {
                                        const slides = [...(landingPageData.hero_slides || [])]
                                        slides[index] = { ...slide, content_italic: !slide.content_italic }
                                        setLandingPageData({...landingPageData, hero_slides: slides})
                                      }}
                                      className={`p-1 rounded ${
                                        slide.content_italic
                                          ? 'bg-violet-600 text-white'
                                          : 'text-slate-400 hover:text-slate-200'
                                      }`}
                                      title="Italic"
                                    >
                                      <Italic className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {/* Font Size Dropdown */}
                                    <div className="relative">
                                      <button
                                        onClick={() => {
                                          const key = `sizeMenu_${index}_content`
                                          setShowFontMenu(showFontMenu === key ? null : key)
                                        }}
                                        className="px-2 py-0.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded border border-slate-600"
                                      >
                                        {Math.round(parseFloat(slide.content_font_size || '1.125') * 16) || 18}
                                      </button>
                                      {showFontMenu === `sizeMenu_${index}_content` && (
                                        <div className="fixed md:absolute left-4 md:left-0 top-1/2 -translate-y-1/2 md:top-auto md:translate-y-0 mt-0 md:mt-1 w-20 bg-slate-700 border border-slate-600 rounded shadow-lg z-50 max-h-48 overflow-y-auto">
                                          {[12, 14, 16, 18, 20, 24, 28, 32].map(size => (
                                            <button
                                              key={size}
                                              onClick={() => {
                                                const slides = [...(landingPageData.hero_slides || [])]
                                                slides[index] = { ...slide, content_font_size: `${size / 16}rem` }
                                                setLandingPageData({...landingPageData, hero_slides: slides})
                                                setShowFontMenu(null)
                                              }}
                                              className={`w-full px-3 py-1.5 text-left text-xs hover:bg-slate-600 ${
                                                Math.round(parseFloat(slide.content_font_size || '1.125') * 16) === size ? 'bg-violet-600 text-white' : 'text-slate-200'
                                              }`}
                                            >
                                              {size}
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    {/* Font Family Dropdown */}
                                    <div className="relative">
                                      <button
                                        onClick={() => {
                                          const key = `fontMenu_${index}_content`
                                          setShowFontMenu(showFontMenu === key ? null : key)
                                        }}
                                        className="px-2 py-0.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded border border-slate-600"
                                      >
                                        {(slide.content_font_family || 'Cormorant Garamond').split(' ')[0]}
                                      </button>
                                      {showFontMenu === `fontMenu_${index}_content` && (
                                        <div className="fixed md:absolute left-4 md:left-0 top-1/2 -translate-y-1/2 md:top-auto md:translate-y-0 mt-0 md:mt-1 w-40 max-w-[calc(100vw-2rem)] bg-slate-700 border border-slate-600 rounded shadow-lg z-50 max-h-64 overflow-y-auto">
                                          {['Josefin Sans', 'Cormorant Garamond', 'Playfair Display', 'Montserrat', 'Inter', 'Lora', 'Raleway', 'Open Sans'].map(font => (
                                            <button
                                              key={font}
                                              onClick={() => {
                                                const slides = [...(landingPageData.hero_slides || [])]
                                                slides[index] = { ...slide, content_font_family: font }
                                                setLandingPageData({...landingPageData, hero_slides: slides})
                                                setShowFontMenu(null)
                                              }}
                                              className={`w-full px-3 py-1.5 text-left text-xs hover:bg-slate-600 ${
                                                (slide.content_font_family || 'Cormorant Garamond') === font ? 'bg-violet-600 text-white' : 'text-slate-200'
                                              }`}
                                            >
                                              {font}
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    {/* Color Picker */}
                                    <div className="relative">
                                      <button
                                        onClick={() => {
                                          const key = `colorPicker_${index}_content`
                                          setShowColorPicker(showColorPicker === key ? null : key)
                                        }}
                                        className="w-7 h-7 rounded border border-slate-600 cursor-pointer hover:scale-110 transition-transform"
                                        style={{ backgroundColor: slide.content_color || '#ffffff' }}
                                        title="Content color"
                                      />
                                      {showColorPicker === `colorPicker_${index}_content` && (
                                        <div className="fixed md:absolute left-4 right-4 md:left-auto md:right-0 top-1/2 -translate-y-1/2 md:top-full md:translate-y-0 mt-0 md:mt-2 p-3 bg-slate-700 border border-slate-600 rounded-lg shadow-xl z-50 max-w-xs mx-auto">
                                          <div className="grid grid-cols-7 gap-2">
                                            {COLOR_PALETTE.map((color) => (
                                              <button
                                                key={color.value}
                                                onClick={() => {
                                                  const slides = [...(landingPageData.hero_slides || [])]
                                                  slides[index] = { ...slide, content_color: color.value }
                                                  setLandingPageData({...landingPageData, hero_slides: slides})
                                                  setShowColorPicker(null)
                                                }}
                                                className="w-7 h-7 rounded border-2 hover:scale-110 transition-transform"
                                                style={{
                                                  backgroundColor: color.value,
                                                  borderColor: (slide.content_color || '#ffffff') === color.value ? '#a855f7' : '#475569'
                                                }}
                                                title={color.name}
                                              />
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {slide.is_price_banner ? (
                                  /* Features list for price banners */
                                  <div className="space-y-2">
                                    {(slide.features || []).map((feature: string, fIndex: number) => (
                                      <div key={fIndex} className="flex gap-2">
                                        <input
                                          type="text"
                                          value={feature}
                                          onChange={(e) => {
                                            const slides = [...(landingPageData.hero_slides || [])]
                                            const features = [...(slide.features || [])]
                                            features[fIndex] = e.target.value
                                            slides[index] = { ...slide, features }
                                            setLandingPageData({...landingPageData, hero_slides: slides})
                                          }}
                                          placeholder="Feature description"
                                          className="flex-1 px-2 py-1.5 bg-slate-800 border border-slate-600 rounded text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                                        />
                                        <button
                                          onClick={() => {
                                            const slides = [...(landingPageData.hero_slides || [])]
                                            const features = [...(slide.features || [])]
                                            features.splice(fIndex, 1)
                                            slides[index] = { ...slide, features }
                                            setLandingPageData({...landingPageData, hero_slides: slides})
                                          }}
                                          className="text-red-400 hover:text-red-300 p-1.5"
                                          title="Remove feature"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    ))}
                                    <button
                                      onClick={() => {
                                        const slides = [...(landingPageData.hero_slides || [])]
                                        const features = [...(slide.features || []), 'New Feature']
                                        slides[index] = { ...slide, features }
                                        setLandingPageData({...landingPageData, hero_slides: slides})
                                      }}
                                      className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300"
                                    >
                                      <Plus className="w-4 h-4" />
                                      Add Feature
                                    </button>
                                  </div>
                                ) : (
                                  /* Regular content textarea for normal slides */
                                  <textarea
                                    value={slide.content || ''}
                                    onChange={(e) => {
                                      const slides = [...(landingPageData.hero_slides || [])]
                                      slides[index] = { ...slide, content: e.target.value }
                                      setLandingPageData({...landingPageData, hero_slides: slides})
                                    }}
                                    placeholder="Additional text content for this slide..."
                                    rows={3}
                                    className="w-full px-2 py-1.5 bg-slate-800 border border-slate-600 rounded text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-y break-words whitespace-pre-wrap"
                                  />
                                )}
                              </div>
                              {/* CTA Button - Hidden for price banners */}
                              {!slide.is_price_banner && (
                                <>
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
                                </>
                              )}
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
                      )}
                    </div>

                    {/* Added Blocks */}
                    {landingPageData.blocks && landingPageData.blocks.length > 0 && (
                      <BlockManager
                        blocks={landingPageData.blocks}
                        onChange={handleBlocksChange}
                        businessUnitId={businessUnitId}
                        translationMode={translationMode}
                        translationSourceBlocks={translationSourceData?.blocks}
                        targetLanguage={selectedLangCode}
                        onTranslateBlock={(index, translatedBlock) => {
                          setLandingPageData(prev => {
                            if (!prev) return prev
                            const updatedBlocks = [...prev.blocks]
                            updatedBlocks[index] = translatedBlock
                            return { ...prev, blocks: updatedBlocks }
                          })
                          // Auto-save after translation (using ref for latest data)
                          setTimeout(() => saveLandingPage(), 500)
                        }}
                      />
                    )}

                    {/* Footer Configuration */}
                    <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-violet-400 flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          Footer
                        </h3>
                        {translationMode && translationSourceData && (
                          <button
                            onClick={async () => {
                              setTranslatingSectionKey('footer')
                              try {
                                const response = await fetch('/api/landing-pages/translate-section', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    content: translationSourceData.footer,
                                    targetLanguage: selectedLangCode
                                  })
                                })
                                const data = await response.json()
                                if (data.success) {
                                  setLandingPageData(prev => prev ? { ...prev, footer: data.translated } : prev)
                                  setTimeout(() => saveLandingPage(), 500)
                                }
                              } catch (err) { console.error(err) }
                              setTranslatingSectionKey(null)
                            }}
                            disabled={translatingSectionKey === 'footer'}
                            className="px-2 py-1 bg-pink-600 hover:bg-pink-700 text-white rounded text-xs flex items-center gap-1 disabled:opacity-50"
                          >
                            {translatingSectionKey === 'footer' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Languages className="w-3 h-3" />}
                            Translate
                          </button>
                        )}
                        {/* Footer Styling Controls - inline with title */}
                        {(() => {
                          const footerData = landingPageData.footer || {}
                          const fontSize = footerData.text_font_size || '0.875rem'
                          const fontFamily = footerData.text_font_family || 'Josefin Sans'
                          const textColor = footerData.text_color || '#ffffff'
                          const bgColor = footerData.background_color || '#0D1B2A'
                          const textAlign = footerData.text_align || 'center'
                          const bold = footerData.text_bold || false
                          const italic = footerData.text_italic || false

                          const COLOR_PALETTE = [
                            { name: 'White', value: '#ffffff' },
                            { name: 'Black', value: '#000000' },
                            { name: 'Dark Gray', value: '#374151' },
                            { name: 'Gray', value: '#6b7280' },
                            { name: 'Slate', value: '#1e293b' },
                            { name: 'Navy', value: '#0D1B2A' },
                            { name: 'Red', value: '#ef4444' },
                            { name: 'Orange', value: '#f97316' },
                            { name: 'Yellow', value: '#eab308' },
                            { name: 'Green', value: '#22c55e' },
                            { name: 'Teal', value: '#14b8a6' },
                            { name: 'Blue', value: '#3b82f6' },
                            { name: 'Violet', value: '#8b5cf6' },
                            { name: 'Pink', value: '#ec4899' },
                          ]

                          const updateFooter = (key: string, value: any) => {
                            setLandingPageData(prev => prev ? {
                              ...prev,
                              footer: { ...prev.footer, [key]: value }
                            } : prev)
                          }

                          return (
                            <div className="flex items-center gap-1">
                              {/* Alignment buttons */}
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => updateFooter('text_align', 'left')}
                                  className={`p-1 rounded ${
                                    textAlign === 'left'
                                      ? 'bg-violet-600 text-white'
                                      : 'text-slate-400 hover:text-slate-200'
                                  }`}
                                  title="Align Left"
                                >
                                  <AlignLeft className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => updateFooter('text_align', 'center')}
                                  className={`p-1 rounded ${
                                    textAlign === 'center'
                                      ? 'bg-violet-600 text-white'
                                      : 'text-slate-400 hover:text-slate-200'
                                  }`}
                                  title="Align Center"
                                >
                                  <AlignCenter className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => updateFooter('text_align', 'right')}
                                  className={`p-1 rounded ${
                                    textAlign === 'right'
                                      ? 'bg-violet-600 text-white'
                                      : 'text-slate-400 hover:text-slate-200'
                                  }`}
                                  title="Align Right"
                                >
                                  <AlignRight className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Bold/Italic buttons */}
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => updateFooter('text_bold', !bold)}
                                  className={`p-1 rounded ${
                                    bold
                                      ? 'bg-violet-600 text-white'
                                      : 'text-slate-400 hover:text-slate-200'
                                  }`}
                                  title="Bold"
                                >
                                  <Bold className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => updateFooter('text_italic', !italic)}
                                  className={`p-1 rounded ${
                                    italic
                                      ? 'bg-violet-600 text-white'
                                      : 'text-slate-400 hover:text-slate-200'
                                  }`}
                                  title="Italic"
                                >
                                  <Italic className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Font Size */}
                              <div className="relative">
                                <button
                                  onClick={() => setShowFooterPicker(showFooterPicker === 'fontSize' ? null : 'fontSize')}
                                  className="px-2 py-0.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded border border-slate-600"
                                >
                                  {Math.round(parseFloat(fontSize) * 16) || 14}
                                </button>
                                {showFooterPicker === 'fontSize' && (
                                  <div className="absolute right-0 top-full mt-1 w-20 bg-slate-700 border border-slate-600 rounded shadow-lg z-50 max-h-48 overflow-y-auto">
                                    {[10, 12, 14, 16, 18, 20, 24, 28, 32].map(size => (
                                      <button
                                        key={size}
                                        onClick={() => {
                                          updateFooter('text_font_size', `${size / 16}rem`)
                                          setShowFooterPicker(null)
                                        }}
                                        className={`w-full px-3 py-1.5 text-left text-xs hover:bg-slate-600 ${
                                          Math.round(parseFloat(fontSize) * 16) === size ? 'bg-violet-600 text-white' : 'text-slate-200'
                                        }`}
                                      >
                                        {size}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Font Family */}
                              <div className="relative">
                                <button
                                  onClick={() => setShowFooterPicker(showFooterPicker === 'fontFamily' ? null : 'fontFamily')}
                                  className="px-2 py-0.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded border border-slate-600"
                                >
                                  {fontFamily.split(' ')[0]}
                                </button>
                                {showFooterPicker === 'fontFamily' && (
                                  <div className="absolute right-0 top-full mt-1 w-40 bg-slate-700 border border-slate-600 rounded shadow-lg z-50 max-h-64 overflow-y-auto">
                                    {['Josefin Sans', 'Cormorant Garamond', 'Playfair Display', 'Montserrat', 'Inter', 'Lora', 'Raleway', 'Open Sans'].map(font => (
                                      <button
                                        key={font}
                                        onClick={() => {
                                          updateFooter('text_font_family', font)
                                          setShowFooterPicker(null)
                                        }}
                                        className={`w-full px-3 py-1.5 text-left text-xs hover:bg-slate-600 ${
                                          fontFamily === font ? 'bg-violet-600 text-white' : 'text-slate-200'
                                        }`}
                                      >
                                        {font}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Text Color */}
                              <div className="relative flex flex-col items-center gap-0.5">
                                <button
                                  onClick={() => setShowFooterPicker(showFooterPicker === 'textColor' ? null : 'textColor')}
                                  className="w-7 h-7 rounded border border-slate-600 cursor-pointer hover:scale-110 transition-transform"
                                  style={{ backgroundColor: textColor }}
                                  title="Text color"
                                />
                                <span className="text-[9px] text-slate-500">Text</span>
                                {showFooterPicker === 'textColor' && (
                                  <div className="absolute right-0 top-full mt-2 p-3 bg-slate-700 border border-slate-600 rounded-lg shadow-xl z-50">
                                    <div className="grid grid-cols-7 gap-2">
                                      {COLOR_PALETTE.map((c) => (
                                        <button
                                          key={c.value}
                                          onClick={() => {
                                            updateFooter('text_color', c.value)
                                            setShowFooterPicker(null)
                                          }}
                                          className="w-7 h-7 rounded border-2 hover:scale-110 transition-transform"
                                          style={{
                                            backgroundColor: c.value,
                                            borderColor: textColor === c.value ? '#a855f7' : '#475569'
                                          }}
                                          title={c.name}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Background Color */}
                              <div className="relative flex flex-col items-center gap-0.5">
                                <button
                                  onClick={() => setShowFooterPicker(showFooterPicker === 'bgColor' ? null : 'bgColor')}
                                  className="w-7 h-7 rounded border border-slate-600 cursor-pointer hover:scale-110 transition-transform"
                                  style={{ backgroundColor: bgColor }}
                                  title="Background color"
                                />
                                <span className="text-[9px] text-slate-500">BG</span>
                                {showFooterPicker === 'bgColor' && (
                                  <div className="absolute right-0 top-full mt-2 p-3 bg-slate-700 border border-slate-600 rounded-lg shadow-xl z-50">
                                    <div className="grid grid-cols-7 gap-2">
                                      {COLOR_PALETTE.map((c) => (
                                        <button
                                          key={c.value}
                                          onClick={() => {
                                            updateFooter('background_color', c.value)
                                            setShowFooterPicker(null)
                                          }}
                                          className="w-7 h-7 rounded border-2 hover:scale-110 transition-transform"
                                          style={{
                                            backgroundColor: c.value,
                                            borderColor: bgColor === c.value ? '#a855f7' : '#475569'
                                          }}
                                          title={c.name}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                      {/* Footer Section - Collapsible */}
                      <div className="mt-6 border border-slate-600 rounded-lg overflow-hidden">
                        <div
                          className="flex items-center justify-between px-4 py-3 bg-slate-700 cursor-pointer hover:bg-slate-600 transition-colors"
                          onClick={() => setFooterCollapsed(!footerCollapsed)}
                        >
                          <h3 className="text-sm font-medium text-white flex items-center gap-2">
                            📜 Footer & Policies
                          </h3>
                          <button className="text-slate-300 hover:text-white">
                            {footerCollapsed ? (
                              <ChevronDown className="w-5 h-5" />
                            ) : (
                              <ChevronUp className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                        {!footerCollapsed && (
                          <div className="p-4 bg-slate-800/50">
                            <FooterEditor
                              data={landingPageData.footer || {}}
                              onChange={(footerData) => {
                                setLandingPageData(prev => prev ? { ...prev, footer: footerData } : prev)
                              }}
                              onEditPolicy={(policyType) => {
                                setEditingPolicyType(policyType)
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    </div>
                  </>
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

                {/* Add Locale Modal */}
                <AddLocaleModal
                  isOpen={showAddLocaleModal}
                  onClose={() => setShowAddLocaleModal(false)}
                  businessUnitId={businessUnitId}
                  existingLocales={availableLocales}
                  onLocaleCreated={async (country, lang, openTranslationMode, sourceLocale) => {
                    setShowAddLocaleModal(false)
                    setSelectedCountry(country)
                    setSelectedLangCode(lang)
                    // Reload to show new locale - pass values directly to avoid stale state
                    await loadLandingPage(country, lang)

                    // If translation mode should open, fetch source data for side-by-side view
                    if (openTranslationMode && sourceLocale) {
                      const [srcCountry, srcLang] = sourceLocale.split('/')
                      try {
                        const response = await fetch(`/api/landing-page?businessUnit=${businessUnitId}&country=${srcCountry}&language=${srcLang}`)
                        const data = await response.json()
                        if (data.landingPage) {
                          setTranslationSourceData(data.landingPage)
                          setTranslationMode(true)
                        }
                      } catch (err) {
                        console.error('Failed to load source data:', err)
                      }
                    }
                  }}
                />

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

      {/* Copy to Locale Modal */}
      {showCopyModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <Copy className="w-5 h-5 text-cyan-400" />
                Copy to Another Country
              </h3>
              <button
                onClick={() => { setShowCopyModal(false); setCopyTargetCountry(''); }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  Source: <span className="font-semibold text-white">{landingPageData?.country || 'US'}/{landingPageData?.language_code || 'en'}</span>
                </label>
                <p className="text-xs text-slate-400">
                  All content, blocks, and settings will be copied to the target country with the same language.
                </p>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  Target Country
                </label>
                <select
                  value={copyTargetCountry}
                  onChange={(e) => setCopyTargetCountry(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Select a country...</option>
                  {countryOptions
                    .filter(country => country.code !== (landingPageData?.country || 'US'))
                    .map(country => {
                      const hasExistingPage = availableLocales.some(
                        l => l.country === country.code && l.language_code === (landingPageData?.language_code || 'en')
                      )
                      return (
                        <option key={country.code} value={country.code}>
                          {country.flag} {country.name} ({country.code}) {hasExistingPage ? '✓ Already exists' : ''}
                        </option>
                      )
                    })}
                </select>
              </div>

              {/* Visual list of countries with their status */}
              <div className="bg-slate-700/50 rounded-lg p-3 max-h-40 overflow-y-auto">
                <div className="text-xs text-slate-400 mb-2">Available Countries:</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {countryOptions
                    .filter(country => country.code !== (landingPageData?.country || 'US'))
                    .map(country => {
                      const hasExistingPage = availableLocales.some(
                        l => l.country === country.code && l.language_code === (landingPageData?.language_code || 'en')
                      )
                      return (
                        <div
                          key={country.code}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${
                            hasExistingPage
                              ? 'bg-green-500/10 border border-green-500/30 text-green-300'
                              : 'bg-slate-600/30 border border-slate-600 text-slate-400'
                          }`}
                        >
                          <span>{country.flag}</span>
                          <span className="font-mono">{country.code}</span>
                          {hasExistingPage && <Check className="w-3 h-3" />}
                        </div>
                      )
                    })}
                </div>
              </div>

              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
                <p className="text-xs text-cyan-300">
                  <strong>Note:</strong> Currency will be automatically updated based on the target country.
                  {availableLocales.some(l => l.country === copyTargetCountry && l.language_code === (landingPageData?.language_code || 'en')) && (
                    <span className="block mt-1 text-amber-300">
                      ⚠️ This will overwrite the existing page for {copyTargetCountry}/{landingPageData?.language_code || 'en'}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowCopyModal(false); setCopyTargetCountry(''); }}
                className="px-4 py-2 text-slate-400 hover:text-white"
                disabled={isCopying}
              >
                Cancel
              </button>
              <button
                onClick={() => copyToLocale(copyTargetCountry)}
                disabled={!copyTargetCountry || isCopying}
                className="flex items-center gap-2 px-6 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCopying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Copying...
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Content
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Policy Editor Modal */}
      {editingPolicyType && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">
                Edit {editingPolicyType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </h3>
              <button
                onClick={() => setEditingPolicyType(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <p className="text-sm text-slate-400 mb-3">
                Select text and use the toolbar to format. Your changes appear exactly as they will on the page.
              </p>
              {(() => {
                // Get existing content or load from template (with placeholders intact)
                const policyKey = editingPolicyType.replace(/-/g, '_') as keyof typeof policyTemplates
                const existingContent = landingPageData?.footer?.policy_content?.[editingPolicyType]

                // Load raw template content with placeholders
                const template = policyTemplates[policyKey]

                // Convert markdown to HTML for WYSIWYG editing if loading template
                const markdownToHtml = (md: string): string => {
                  return md
                    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
                    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
                    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
                    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.+?)\*/g, '<em>$1</em>')
                    .replace(/^- (.+)$/gm, '<li>$1</li>')
                    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
                    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
                    .replace(/\n\n/g, '</p><p>')
                    .replace(/\n/g, '<br/>')
                }

                // Use existing content (HTML) or convert template markdown to HTML
                const displayContent = existingContent || (template ? markdownToHtml(template.content) : '')

                // Available variables for this template
                const availableVars = template?.fields?.map((f: { key: string }) => `{{${f.key}}}`) || []

                return (
                  <>
                    {template && (
                      <div className="mb-3 p-3 bg-violet-900/30 border border-violet-600/50 rounded">
                        <p className="text-xs text-violet-300 mb-2">
                          Available variables (will be replaced with your footer settings):
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {availableVars.map((v: string) => (
                            <span key={v} className="px-1.5 py-0.5 bg-violet-800/50 rounded text-[10px] text-violet-200 font-mono cursor-pointer hover:bg-violet-700/50"
                              onClick={() => {
                                // Insert variable at cursor position
                                document.execCommand('insertText', false, v)
                              }}
                              title="Click to insert"
                            >
                              {v}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <PolicyRichTextEditor
                      value={displayContent}
                      onChange={(newContent) => {
                        setLandingPageData(prev => prev ? {
                          ...prev,
                          footer: {
                            ...prev.footer,
                            policy_content: {
                              ...prev.footer?.policy_content,
                              [editingPolicyType]: newContent
                            }
                          }
                        } : prev)
                      }}
                      placeholder={`Start typing your ${editingPolicyType.split('-').join(' ')} content here...`}
                    />
                  </>
                )
              })()}
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-slate-700">
              <button
                onClick={() => setEditingPolicyType(null)}
                className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setEditingPolicyType(null)}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default KnowledgeBase
