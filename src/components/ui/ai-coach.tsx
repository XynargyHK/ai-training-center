'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Send, Sparkles, MessageCircle, Loader2, Plus, Minus, Globe, Camera, Image, Trash2 } from 'lucide-react'
import { loadFAQCategories, loadFAQs } from '@/lib/api-client'
import { type Language, getTranslation, languageNames } from '@/lib/translations'

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
  initialOpen?: boolean
  selectedStaff?: AIStaff | null
  aiStaffList?: AIStaff[]
}

// Function to get role-specific greeting with translation
const getRoleGreeting = (staff: AIStaff | null, lang: Language) => {
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

  return t.greeting(staff.name, roleEmoji, tasks)
}

const AICoach = ({ className = '', businessUnit = 'skincoach', initialOpen = false, selectedStaff = null, aiStaffList = [] }: AICoachProps) => {
  const [isOpen, setIsOpen] = useState(false) // Always start closed to avoid hydration error
  const [currentStaff, setCurrentStaff] = useState<AIStaff | null>(
    selectedStaff || (aiStaffList.length > 0 ? aiStaffList[0] : null)
  )
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en')

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
  const [showCamera, setShowCamera] = useState(false)
  const [chatSessionId, setChatSessionId] = useState<string | null>(null)
  const [showPreChatForm, setShowPreChatForm] = useState(true)
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Get translations
  const t = getTranslation(selectedLanguage)

  // Open after mount if initialOpen is true (avoids hydration error)
  useEffect(() => {
    if (initialOpen) {
      setIsOpen(true)
    }
  }, [initialOpen])

  // Update greeting when current staff or language changes
  useEffect(() => {
    setMessages([{
      id: '1',
      type: 'ai',
      content: getRoleGreeting(currentStaff, selectedLanguage),
      timestamp: new Date()
    }])
  }, [currentStaff, selectedLanguage])

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

      // Try to find by slug, id, or name (case-insensitive)
      const businessUnitData = businessUnits.find((bu: any) =>
        bu.slug?.toLowerCase() === businessUnit.toLowerCase() ||
        bu.id?.toLowerCase() === businessUnit.toLowerCase() ||
        bu.name?.toLowerCase() === businessUnit.toLowerCase()
      )

      if (!businessUnitData) {
        console.error('Business unit not found:', businessUnit)
        console.error('Available business units:', businessUnits.map((bu: any) => ({ id: bu.id, name: bu.name })))

        // Use first business unit as fallback
        if (businessUnits.length > 0) {
          console.warn('Using first available business unit as fallback')
          const fallbackBU = businessUnits[0]

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

      // Load data from Supabase
      let knowledgeBase = []
      let trainingData = []
      let guidelines = []

      try {
        // Load all data in parallel for faster performance
        const [kb, td, gl] = await Promise.all([
          loadKnowledge(businessUnit),
          loadTrainingData(businessUnit),
          loadGuidelines(businessUnit)
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

      // Build training memory context from current staff
      let trainingMemoryContext = ''
      if (currentStaff && currentStaff.trainingMemory) {
        const memoryEntries = Object.entries(currentStaff.trainingMemory)
        if (memoryEntries.length > 0) {
          trainingMemoryContext = '\n\n📝 TRAINING MEMORY (Learned from previous sessions):\n' +
            memoryEntries.map(([scenario, lessons]) =>
              `${scenario}:\n${lessons.map(lesson => `  - ${lesson}`).join('\n')}`
            ).join('\n\n')
        }
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
        image: imageData  // Add image data for vision models
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

  // Handle camera capture
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setShowCamera(true)
      }
    } catch (error) {
      console.error('Camera error:', error)
      alert('Unable to access camera. Please check permissions.')
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0)
        const imageData = canvas.toDataURL('image/png')
        setSelectedImage(imageData)
        stopCamera()
      }
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setShowCamera(false)
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
    // Load FAQs from Supabase
    try {
      const allFaqs = await loadFAQs()
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
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 p-2 rounded-full">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{t.aiStaff}</h3>
                <p className="text-xs text-gray-600">{t.selectStaffMember}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
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

          {/* Staff selector buttons */}
          {aiStaffList.length > 0 && (
            <div className="px-4 pb-3 flex flex-wrap gap-2">
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
                    {roleEmoji} {staff.name} ({roleLabel})
                  </button>
                )
              })}
            </div>
          )}
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

              <div className="space-y-2 pt-4">
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

          {/* Camera Modal */}
          {showCamera && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg p-4 max-w-md w-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Take a Photo</h3>
                  <button onClick={stopCamera} className="text-gray-500 hover:text-gray-700">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <video ref={videoRef} autoPlay className="w-full rounded-lg mb-4" />
                <canvas ref={canvasRef} className="hidden" />
                <div className="flex gap-2">
                  <button
                    onClick={capturePhoto}
                    className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
                  >
                    Capture Photo
                  </button>
                  <button
                    onClick={stopCamera}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
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
              title="Upload image"
              disabled={isTyping}
            >
              <Image className="w-4 h-4" />
            </button>

            {/* Camera Button */}
            <button
              onClick={startCamera}
              className="bg-gray-100 text-gray-600 p-2 rounded-xl hover:bg-gray-200 transition-all duration-200"
              title="Take photo"
              disabled={isTyping}
            >
              <Camera className="w-4 h-4" />
            </button>

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
    </div>
  )
}

export default AICoach