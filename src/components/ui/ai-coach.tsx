'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Send, Sparkles, MessageCircle, Loader2, Plus, Minus, Globe, Image, Trash2, Calendar } from 'lucide-react'
import { loadFAQCategories, loadFAQs } from '@/lib/api-client'
import { type Language, getTranslation, languageNames } from '@/lib/translations'
import { BookingModal } from '@/components/appointments/booking-modal'
import { supabase } from '@/lib/supabase'

interface FAQ {
  id: string
  question: string
  answer: string
  isExpanded: boolean
}

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  faqs?: FAQ[]
  image?: string  // Base64 encoded image data
  imageUrl?: string  // URL for displaying the image
}

interface AIStaff {
  id: string
  name: string
  role: 'coach' | 'sales' | 'customer-service' | 'scientist'
  createdAt: Date
  trainingMemory: {[key: string]: string[]}
  totalSessions: number
}

interface AICoachProps {
  className?: string
  businessUnit?: string
  country?: string
  language?: string
  initialOpen?: boolean
  selectedStaff?: AIStaff | null
  aiStaffList?: AIStaff[]
  enableSocialLogin?: boolean
}

// Function to get role-specific greeting with translation
const getRoleGreeting = (staff: AIStaff | null, lang: Language, userName?: string) => {
  const t = getTranslation(lang)

  if (!staff) return t.greeting('AI', '', 'any questions you may have')

  const roleEmoji = staff.role === 'coach' ? '🎓' :
                    staff.role === 'sales' ? '💰' :
                    staff.role === 'customer-service' ? '🛡️' : '🔬'

  let tasks = ''
  switch (staff.role) {
    case 'coach':
      tasks = t.coachTasks
      break
    case 'sales':
      tasks = t.salesTasks
      break
    case 'customer-service':
      tasks = t.customerServiceTasks
      break
    case 'scientist':
      tasks = t.scientistTasks
      break
    default:
      tasks = 'any questions you may have'
  }

  // Add personalized greeting if user name is provided
  const personalGreeting = userName ? `Hi ${userName}! ` : ''
  return personalGreeting + t.greeting(staff.name, roleEmoji, tasks)
}

const AICoach = ({ className = '', businessUnit = 'skincoach', country, language, initialOpen = false, selectedStaff = null, aiStaffList = [], enableSocialLogin = false }: AICoachProps) => {
  const [isOpen, setIsOpen] = useState(false) // Always start closed to avoid hydration error
  const [currentStaff, setCurrentStaff] = useState<AIStaff | null>(
    selectedStaff || (aiStaffList.length > 0 ? aiStaffList[0] : null)
  )
  // Initialize language from prop — map short URL codes (tw/cn) to Language type (zh-TW/zh-CN)
  const mapLangToLanguageType = (lang?: string): Language => {
    if (!lang) return 'en'
    const mapping: Record<string, Language> = { 'tw': 'zh-TW', 'cn': 'zh-CN', 'en': 'en', 'vi': 'vi', 'zh-TW': 'zh-TW', 'zh-CN': 'zh-CN' }
    return mapping[lang] || 'en'
  }
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(mapLangToLanguageType(language))

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: getRoleGreeting(currentStaff, selectedLanguage),
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [faqCategories, setFaqCategories] = useState<string[]>([])  // Will load from Supabase
  const [translatedCategories, setTranslatedCategories] = useState<{[key: string]: string}>({})
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [chatSessionId, setChatSessionId] = useState<string | null>(null)
  const [showPreChatForm, setShowPreChatForm] = useState(true)
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [businessUnitId, setBusinessUnitId] = useState<string | null>(null)
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null)
  const [hasActiveServices, setHasActiveServices] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Check if already signed in — auto-fill name/email and skip pre-chat form
  useEffect(() => {
    if (!enableSocialLogin) return

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const meta = session.user.user_metadata || {}
        setUserName(meta.full_name || meta.name || '')
        setUserEmail(session.user.email || '')
        setShowPreChatForm(false)
      }
    }
    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const meta = session.user.user_metadata || {}
        setUserName(meta.full_name || meta.name || '')
        setUserEmail(session.user.email || '')
        setSocialLoading(null)
        setShowPreChatForm(false)
      }
    })
    return () => subscription.unsubscribe()
  }, [enableSocialLogin])

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setSocialLoading(provider)
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
        setSocialLoading(null)
      }
    } catch (err) {
      console.error('Social login failed:', err)
      setSocialLoading(null)
    }
  }

  // Get translations
  const t = getTranslation(selectedLanguage)

  // Open after mount if initialOpen is true (avoids hydration error)
  useEffect(() => {
    if (initialOpen) {
      setIsOpen(true)
    }
  }, [initialOpen])

  // Sync language prop to selectedLanguage state when prop changes
  useEffect(() => {
    if (language) {
      setSelectedLanguage(mapLangToLanguageType(language))
    }
  }, [language])

  // Update greeting when current staff, language, or userName changes
  useEffect(() => {
    setMessages([{
      id: '1',
      type: 'ai',
      content: getRoleGreeting(currentStaff, selectedLanguage, userName),
      timestamp: new Date()
    }])
  }, [currentStaff, selectedLanguage, userName])

  // Create chat session when pre-chat form is submitted or skipped
  useEffect(() => {
    if (isOpen && !chatSessionId && !showPreChatForm) {
      createChatSession()
    }
  }, [isOpen, showPreChatForm])

  // Create a new chat session in database
  const createChatSession = async () => {
    try {
      // Get business unit ID from businessUnit slug
      const buResponse = await fetch(`/api/knowledge?action=load_business_units`)
      const buData = await buResponse.json()

      console.log('Business units loaded:', buData)
      console.log('Looking for business unit:', businessUnit)

      // API returns { data: [...] }
      const businessUnits = buData.data || []

      console.log('Available business units:', businessUnits)

      // Try to find by slug, id, or name (case-insensitive)
      const businessUnitData = businessUnits.find((bu: any) =>
        bu.slug?.toLowerCase() === businessUnit.toLowerCase() ||
        bu.id?.toLowerCase() === businessUnit.toLowerCase() ||
        bu.name?.toLowerCase() === businessUnit.toLowerCase()
      )

      console.log('Found business unit data:', businessUnitData)

      if (!businessUnitData) {
        console.error('Business unit not found:', businessUnit)
        console.error('Available business units:', businessUnits.map((bu: any) => ({ id: bu.id, name: bu.name, slug: bu.slug })))

        // Use first business unit as fallback
        if (businessUnits.length > 0) {
          console.warn('Using first available business unit as fallback')
          const fallbackBU = businessUnits[0]

          // Set business unit ID in state
          setBusinessUnitId(fallbackBU.id)

          // Create user identifier from name/email or anonymous
          const userIdentifier = userEmail || userName || `anon-${Date.now()}`

          const response = await fetch('/api/chat-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'create_session',
              businessUnitId: fallbackBU.id,
              aiStaffId: currentStaff?.id,
              userIdentifier,
              userName: userName || undefined,
              userEmail: userEmail || undefined,
              language: selectedLanguage
            })
          })

          const data = await response.json()
          if (data.success && data.sessionId) {
            setChatSessionId(data.sessionId)
            console.log('✅ Chat session created (fallback):', data.sessionId)
          }
        }
        return
      }

      // Set business unit ID in state
      setBusinessUnitId(businessUnitData.id)

      // Create user identifier from name/email or anonymous
      const userIdentifier = userEmail || userName || `anon-${Date.now()}`

      const response = await fetch('/api/chat-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_session',
          businessUnitId: businessUnitData.id,
          aiStaffId: currentStaff?.id,
          userIdentifier,
          userName: userName || undefined,
          userEmail: userEmail || undefined,
          language: selectedLanguage
        })
      })

      const data = await response.json()
      if (data.success && data.sessionId) {
        setChatSessionId(data.sessionId)
        console.log('✅ Chat session created:', data.sessionId)
      }
    } catch (error) {
      console.error('Failed to create chat session:', error)
    }
  }

  // Save message to database
  const saveMessageToDatabase = async (
    messageType: 'user' | 'ai',
    content: string,
    imageBase64?: string,
    aiModel?: string,
    aiProvider?: string
  ) => {
    if (!chatSessionId) {
      console.warn('No chat session ID, skipping message save')
      return
    }

    try {
      await fetch('/api/chat-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_message',
          sessionId: chatSessionId,
          messageType,
          content,
          imageBase64,
          aiModel,
          aiProvider
        })
      })
      console.log(`✅ ${messageType} message saved to database`)
    } catch (error) {
      console.error('Failed to save message:', error)
    }
  }

  // Handle staff switch
  const handleStaffSwitch = (staff: AIStaff) => {
    setCurrentStaff(staff)
  }

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Check if there are active booking services
  useEffect(() => {
    const checkActiveServices = async () => {
      try {
        const res = await fetch(`/api/booking/services?businessUnitId=${businessUnit}&activeOnly=true`)
        if (res.ok) {
          const { data } = await res.json()
          setHasActiveServices(Array.isArray(data) && data.length > 0)
        }
      } catch {
        setHasActiveServices(false)
      }
    }
    checkActiveServices()
  }, [businessUnit])

  // Load FAQ categories from Supabase
  useEffect(() => {
    if (!isOpen) return

    const loadCategories = async () => {
      try {
        const categories = await loadFAQCategories()
        if (categories && categories.length > 0) {
          setFaqCategories(categories)
        }
      } catch (e) {
        console.error('Failed to load FAQ categories:', e)
      }
    }

    loadCategories()
  }, [businessUnit, isOpen])

  // Translate FAQ categories when language changes
  useEffect(() => {
    if (faqCategories.length === 0 || selectedLanguage === 'en') {
      // Reset to original categories if English
      const resetTranslations: {[key: string]: string} = {}
      faqCategories.forEach(cat => resetTranslations[cat] = cat)
      setTranslatedCategories(resetTranslations)
      return
    }

    const translateCategories = async () => {
      const translations: {[key: string]: string} = {}

      for (const category of faqCategories) {
        const translated = await translateText(category, selectedLanguage, 'faq_category')
        translations[category] = translated
      }

      setTranslatedCategories(translations)
    }

    translateCategories()
  }, [faqCategories, selectedLanguage])

  const generateAIResponse = async (userMessage: string, imageData?: string): Promise<string> => {
    try {
      // Prepare conversation history for context
      const conversationHistory = messages.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content,
        image: msg.imageUrl
      }))

      // Load knowledge base, training data, and guidelines via client-safe API
      console.log('=== AICoach Frontend DEBUG ===')
      console.log('Business Unit:', businessUnit)

      // Import client-safe API functions dynamically
      const { loadKnowledge, loadTrainingData, loadGuidelines } = await import('@/lib/api-client')

      // Load data from Supabase — pass locale params so data is filtered by country/language
      let knowledgeBase = []
      let trainingData = []
      let guidelines = []

      try {
        // Load all data in parallel for faster performance
        const [kb, td, gl] = await Promise.all([
          loadKnowledge(businessUnit, country, language),
          loadTrainingData(businessUnit),
          loadGuidelines(businessUnit, language)
        ])

        knowledgeBase = kb || []
        trainingData = td || []
        guidelines = gl || []

        console.log('✅ Loaded from Supabase:')
        console.log('  - Knowledge entries:', knowledgeBase.length)
        console.log('  - Training data entries:', trainingData.length)
        console.log('  - Guidelines:', guidelines.length)

        if (knowledgeBase.length > 0) {
          console.log('First knowledge entry:', knowledgeBase[0])
        } else {
          console.warn('⚠️ WARNING: Knowledge base is EMPTY!')
        }
      } catch (error) {
        console.error('❌ Error loading training data from Supabase:', error)
      }

      // Call the backend AI API with knowledge base context
      const requestBody = {
        message: userMessage,
        context: 'coach',
        conversationHistory,
        knowledgeBase,
        trainingData,
        guidelines,
        staffName: currentStaff?.name,
        staffRole: currentStaff?.role,
        trainingMemory: currentStaff?.trainingMemory || {},
        language: selectedLanguage,  // Add selected language
        image: imageData,  // Add image data for vision models
        userName: userName || undefined  // Add user's name for personalized greeting
      }

      console.log('Sending to API - knowledgeBase entries:', knowledgeBase.length)
      console.log('Sending to API - trainingData entries:', trainingData.length)
      console.log('Sending to API - guidelines entries:', guidelines.length)
      console.log('Sending to API - Staff:', currentStaff?.name, '(', currentStaff?.role, ')')
      console.log('Sending to API - Training Memory scenarios:', Object.keys(currentStaff?.trainingMemory || {}).length)

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error('AI service temporarily unavailable')
      }

      // Safely parse JSON response
      const text = await response.text()
      try {
        const data = JSON.parse(text)
        return data.response || "I'm here to help! Could you please rephrase your question?"
      } catch (parseError) {
        console.error('JSON parse error:', parseError, 'Response:', text)
        throw new Error('Invalid response from AI service')
      }

    } catch (error) {
      console.error('AI response error:', error)

      // NO HARDCODED FALLBACK RESPONSES - If API fails, return generic error
      return "I'm having trouble connecting right now. Please try again in a moment."
    }
  }

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const imageData = event.target?.result as string
      setSelectedImage(imageData)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setSelectedImage(null)
  }

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && !selectedImage) || isTyping) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim() || 'What do you see in this image?',
      timestamp: new Date(),
      imageUrl: selectedImage || undefined
    }

    setMessages(prev => [...prev, userMessage])
    const messageText = inputValue.trim()
    const messageImage = selectedImage
    setInputValue('')
    setSelectedImage(null)
    setIsTyping(true)

    // Save user message to database
    saveMessageToDatabase('user', messageText || 'What do you see in this image?', messageImage || undefined)

    try {
      const aiResponse = await generateAIResponse(messageText || 'What do you see in this image?', messageImage || undefined)

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])

      // Save AI response to database
      saveMessageToDatabase('ai', aiResponse, undefined, 'gemini-2.5-flash', 'google')
    } catch (error) {
      console.error('Error generating AI response:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: "I apologize, but I'm having trouble responding right now. Please try again in a moment!",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Function to translate text using AI with context
  const translateText = async (text: string, targetLanguage: string, context?: string): Promise<string> => {
    if (targetLanguage === 'en') return text // No translation needed for English

    try {
      const languageNames: {[key: string]: string} = {
        'zh-CN': 'Simplified Chinese',
        'zh-TW': 'Traditional Chinese',
        'vi': 'Vietnamese'
      }

      const response = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          targetLanguage: languageNames[targetLanguage] || targetLanguage,
          context // Pass context for better translation
        })
      })

      if (response.ok) {
        const data = await response.json()
        return data.translation || text
      }
    } catch (error) {
      console.error('Translation failed:', error)
    }
    return text // Return original if translation fails
  }

  const handleCategoryClick = async (category: string) => {
    // Load FAQs from Supabase — pass businessUnit and language for locale filtering
    try {
      const allFaqs = await loadFAQs(businessUnit, language)
      const categoryFaqs = allFaqs.filter((faq: any) => faq.category === category && faq.is_active)

      if (categoryFaqs.length > 0) {
        // Translate FAQs if language is not English
        const faqData: FAQ[] = await Promise.all(
          categoryFaqs.map(async (faq: any) => {
            const translatedQuestion = selectedLanguage !== 'en'
              ? await translateText(faq.question, selectedLanguage, 'faq')
              : faq.question
            const translatedAnswer = selectedLanguage !== 'en'
              ? await translateText(faq.answer, selectedLanguage, 'faq')
              : faq.answer

            return {
              id: faq.id,
              question: translatedQuestion,
              answer: translatedAnswer,
              isExpanded: false
            }
          })
        )

        const faqMessage: Message = {
          id: `faq-${Date.now()}`,
          type: 'ai',
          content: t.faqAbout(category),
          timestamp: new Date(),
          faqs: faqData
        }
        setMessages(prev => [...prev, faqMessage])
      } else {
        // No FAQs found for this category
        const noFaqMessage: Message = {
          id: `no-faq-${Date.now()}`,
          type: 'ai',
          content: t.noFaqAvailable(category),
          timestamp: new Date()
        }
        setMessages(prev => [...prev, noFaqMessage])
      }
    } catch (e) {
      console.error('Failed to load FAQs:', e)
    }
  }

  const toggleFaqExpansion = (messageId: string, faqId: string) => {
    setMessages(prevMessages =>
      prevMessages.map(msg => {
        if (msg.id === messageId && msg.faqs) {
          return {
            ...msg,
            faqs: msg.faqs.map(faq =>
              faq.id === faqId ? { ...faq, isExpanded: !faq.isExpanded } : faq
            )
          }
        }
        return msg
      })
    )
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (!isOpen) {
    return (
      <div className={`fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 ${className}`}>
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 text-white px-6 py-3 md:px-8 md:py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-pulse flex items-center gap-2"
          aria-label="Open AI Chat"
        >
          <Sparkles className="w-5 h-5 md:w-6 md:h-6" />
          <span className="font-semibold text-base md:text-lg">{t.chatNow}</span>
        </button>
      </div>
    )
  }

  return (
    <div className={`fixed bottom-4 right-4 top-20 left-4 md:bottom-6 md:right-6 md:top-auto md:left-auto z-50 ${className}`}>
      <div className="bg-white/95 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl w-full h-full md:w-[500px] md:h-[600px] max-w-[500px] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200/50 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-cyan-500/10">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {aiStaffList.length > 1 ? (
                <div className="flex flex-wrap gap-1.5">
                  {aiStaffList.map((staff) => {
                    const roleEmoji = staff.role === 'coach' ? '🎓' :
                                      staff.role === 'sales' ? '💰' :
                                      staff.role === 'customer-service' ? '🛡️' : '🔬'
                    const isActive = currentStaff?.id === staff.id
                    const roleLabel = staff.role === 'coach' ? t.coach :
                                     staff.role === 'sales' ? t.sales :
                                     staff.role === 'customer-service' ? t.customerService : t.scientist

                    return (
                      <button
                        key={staff.id}
                        onClick={() => handleStaffSwitch(staff)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {roleEmoji} {staff.name} · {roleLabel}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div>
                  <h3 className="font-semibold text-gray-800 truncate">
                    {currentStaff ? `${currentStaff.role === 'coach' ? '🎓' : currentStaff.role === 'sales' ? '💰' : currentStaff.role === 'customer-service' ? '🛡️' : '🔬'} ${currentStaff.name}` : t.aiStaff}
                  </h3>
                  {currentStaff?.role && (
                    <p className="text-xs text-gray-600">
                      {currentStaff.role === 'coach' ? t.coach :
                       currentStaff.role === 'sales' ? t.sales :
                       currentStaff.role === 'customer-service' ? t.customerService : t.scientist}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Language Selector */}
              <div className="relative">
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value as Language)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-1.5 pr-8 text-sm text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  title={t.language}
                >
                  {Object.entries(languageNames).map(([code, name]) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  ))}
                </select>
                <Globe className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Pre-Chat Form */}
        {showPreChatForm && (
          <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
            <div className="w-full max-w-sm space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Welcome! 👋</h3>
                <p className="text-sm text-gray-600">
                  Help us serve you better by sharing your information (optional)
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name
                  </label>
                  <input
                    id="userName"
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Enter your name (optional)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Email
                  </label>
                  <input
                    id="userEmail"
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="Enter your email (optional)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Social Login */}
              {enableSocialLogin && (
              <div className="pt-2">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 border-t border-gray-200" />
                  <span className="text-xs text-gray-400">or sign in with</span>
                  <div className="flex-1 border-t border-gray-200" />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('google')}
                    disabled={socialLoading !== null}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {socialLoading === 'google' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    )}
                    <span className="text-sm text-gray-700">Google</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('facebook')}
                    disabled={socialLoading !== null}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {socialLoading === 'facebook' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    )}
                    <span className="text-sm text-gray-700">Facebook</span>
                  </button>
                </div>
              </div>
              )}

              <div className="space-y-2 pt-3">
                <button
                  onClick={() => setShowPreChatForm(false)}
                  className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  {userName || userEmail ? 'Start Chat' : 'Continue as Guest'}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  By continuing, your chat will be saved for quality and compliance purposes
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {!showPreChatForm && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`${message.faqs ? 'max-w-md w-full' : 'max-w-xs'} px-3 py-2 rounded-2xl ${
                  message.type === 'user'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {message.imageUrl && (
                  <img
                    src={message.imageUrl}
                    alt="Uploaded"
                    className="max-w-full rounded-lg mb-2"
                  />
                )}
                <p className="text-sm whitespace-pre-line">{message.content}</p>

                {/* FAQ List */}
                {message.faqs && message.faqs.length > 0 && (
                  <div className="mt-1.5 space-y-0.5">
                    {message.faqs.map((faq) => (
                      <div
                        key={faq.id}
                        className="bg-white rounded border border-gray-200 overflow-hidden"
                      >
                        {/* Question with expand button */}
                        <button
                          onClick={() => toggleFaqExpansion(message.id, faq.id)}
                          className="w-full flex items-center justify-between px-2 py-1.5 text-left hover:bg-gray-50 transition-colors"
                        >
                          <span className="text-sm font-medium text-gray-700 flex-1 pr-2">
                            {faq.question}
                          </span>
                          {faq.isExpanded ? (
                            <Minus className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          ) : (
                            <Plus className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          )}
                        </button>

                        {/* Answer - shown when expanded */}
                        {faq.isExpanded && (
                          <div className="px-2 pb-1.5 pt-0.5 text-sm text-gray-600 border-t border-gray-100">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <p className={`text-xs mt-2 ${
                  message.type === 'user' ? 'text-cyan-100' : 'text-gray-500'
                }`}>
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-2xl max-w-xs">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">{t.aiTyping}</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
        )}

        {/* Input */}
        {!showPreChatForm && (
        <div className="p-4 border-t border-gray-200/50">
          {/* Image Preview */}
          {selectedImage && (
            <div className="mb-3 relative inline-block">
              <img src={selectedImage} alt="Preview" className="max-w-xs max-h-40 rounded-lg border border-gray-300" />
              <button
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-center space-x-2">
            {/* File Upload Button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-gray-100 text-gray-600 p-2 rounded-xl hover:bg-gray-200 transition-all duration-200"
              title="Upload or capture image"
              disabled={isTyping}
            >
              <Image className="w-4 h-4" />
            </button>

            {/* Booking Button - only shown when active services exist */}
            {hasActiveServices && (
              <button
                onClick={() => setShowBookingModal(true)}
                className="bg-blue-500 text-white p-2 rounded-xl hover:bg-blue-600 transition-all duration-200"
                title="Book Appointment"
                disabled={isTyping}
              >
                <Calendar className="w-4 h-4" />
              </button>
            )}

            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t.placeholder}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              disabled={isTyping}
            />
            <button
              onClick={handleSendMessage}
              disabled={(!inputValue.trim() && !selectedImage) || isTyping}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-2 rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title={t.send}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Quick suggestions - FAQ Categories */}
          {faqCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {faqCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryClick(category)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded-full transition-colors capitalize"
                  disabled={isTyping}
                >
                  {translatedCategories[category] || category}
                </button>
              ))}
            </div>
          )}
        </div>
        )}
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        businessUnitId={businessUnitId || businessUnit}
        chatSessionId={chatSessionId || undefined}
        userIdentifier={userEmail || userName || `anon-${Date.now()}`}
        userName={userName}
        userEmail={userEmail}
      />
    </div>
  )
}

export default AICoach