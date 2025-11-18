'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Send, Sparkles, MessageCircle, Loader2, Plus, Minus } from 'lucide-react'
import { loadFAQCategories, loadFAQs } from '@/lib/api-client'

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
}

const AICoach = ({ className = '', businessUnit = 'skincoach', initialOpen = false, selectedStaff = null }: AICoachProps) => {
  const [isOpen, setIsOpen] = useState(false) // Always start closed to avoid hydration error

  // Get staff name and role for greeting
  const staffName = selectedStaff?.name || 'AI Coach'
  const staffRole = selectedStaff?.role || 'coach'
  const roleEmoji = staffRole === 'coach' ? '🎓' :
                    staffRole === 'sales' ? '💰' :
                    staffRole === 'customer-service' ? '🛡️' : '🔬'

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: `Hi! I'm ${staffName} ${roleEmoji} I can help you with beauty tips, product recommendations, pricing questions, and advanced skin analysis. What would you like to know?`,
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [faqCategories, setFaqCategories] = useState<string[]>([])  // Will load from Supabase

  // Open after mount if initialOpen is true (avoids hydration error)
  useEffect(() => {
    if (initialOpen) {
      setIsOpen(true)
    }
  }, [initialOpen])

  // Update greeting when selected staff changes
  useEffect(() => {
    setMessages([{
      id: '1',
      type: 'ai',
      content: `Hi! I'm ${staffName} ${roleEmoji} I can help you with beauty tips, product recommendations, pricing questions, and advanced skin analysis. What would you like to know?`,
      timestamp: new Date()
    }])
  }, [selectedStaff])

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

  const generateAIResponse = async (userMessage: string): Promise<string> => {
    try {
      // Prepare conversation history for context
      const conversationHistory = messages.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))

      // Load knowledge base, training data, and guidelines directly from Supabase storage
      console.log('=== AICoach Frontend DEBUG ===')
      console.log('Business Unit:', businessUnit)

      // Import Supabase storage functions dynamically
      const { loadKnowledge, loadTrainingData, loadGuidelines } = await import('@/lib/supabase-storage')

      // Load data from Supabase
      let knowledgeBase = []
      let trainingData = []
      let guidelines = []

      try {
        // Load all data in parallel for faster performance
        const [kb, td, gl] = await Promise.all([
          loadKnowledge(),
          loadTrainingData(),
          loadGuidelines()
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

      // Build training memory context from selected staff
      let trainingMemoryContext = ''
      if (selectedStaff && selectedStaff.trainingMemory) {
        const memoryEntries = Object.entries(selectedStaff.trainingMemory)
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
        staffName: selectedStaff?.name,
        staffRole: selectedStaff?.role,
        trainingMemory: selectedStaff?.trainingMemory || {}
      }

      console.log('Sending to API - knowledgeBase entries:', knowledgeBase.length)
      console.log('Sending to API - trainingData entries:', trainingData.length)
      console.log('Sending to API - guidelines entries:', guidelines.length)
      console.log('Sending to API - Staff:', selectedStaff?.name, '(', selectedStaff?.role, ')')
      console.log('Sending to API - Training Memory scenarios:', Object.keys(selectedStaff?.trainingMemory || {}).length)

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

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    try {
      const aiResponse = await generateAIResponse(userMessage.content)

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])
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

  const handleCategoryClick = async (category: string) => {
    // Load FAQs from Supabase
    try {
      const allFaqs = await loadFAQs()
      const categoryFaqs = allFaqs.filter((faq: any) => faq.category === category && faq.is_active)

      if (categoryFaqs.length > 0) {
        // Create FAQ message with expandable questions
        const faqData: FAQ[] = categoryFaqs.map((faq: any) => ({
          id: faq.id,
          question: faq.question,
          answer: faq.answer,
          isExpanded: false
        }))

        const faqMessage: Message = {
          id: `faq-${Date.now()}`,
          type: 'ai',
          content: `Here are our FAQs about ${category}:`,
          timestamp: new Date(),
          faqs: faqData
        }
        setMessages(prev => [...prev, faqMessage])
      } else {
        // No FAQs found for this category
        const noFaqMessage: Message = {
          id: `no-faq-${Date.now()}`,
          type: 'ai',
          content: `I don't have any specific FAQs for ${category} at the moment, but feel free to ask me anything!`,
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
          className="bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 text-white p-3 md:p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-pulse"
          aria-label="Open AI Coach"
        >
          <Sparkles className="w-6 h-6" />
        </button>

        {/* Floating tooltip */}
        <div className="absolute bottom-16 right-0 bg-black/80 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
          Ask your AI customer service Coach
        </div>
      </div>
    )
  }

  return (
    <div className={`fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 ${className}`}>
      <div className="bg-white/95 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl w-[calc(100vw-2rem)] h-[calc(100vh-2rem)] md:w-[500px] md:h-[600px] max-w-[500px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200/50 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-cyan-500/10">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 p-2 rounded-full">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">AI customer service Coach</h3>
              <p className="text-xs text-gray-600">Always here to help!</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
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
                  <span className="text-sm">AI Coach is typing...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200/50">
          <div className="flex items-center space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about customer service, products, pricing..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              disabled={isTyping}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-2 rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  {category}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AICoach