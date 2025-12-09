'use client'

/**
 * AI-Guided Catalog Setup Wizard
 *
 * A conversational interface that guides users through:
 * 1. Choosing how to set up their catalog (template, import, manual)
 * 2. Importing products from documents or URLs
 * 3. Creating categories and product types
 * 4. Batch creating products
 */

import { useState, useEffect, useRef } from 'react'
import {
  Loader2, Send, Bot, User, Sparkles, FileText, Link2,
  FolderTree, Plus, Check, ChevronRight, Upload, Package,
  Store, Utensils, Shirt, Flower2, Laptop, ShoppingBag,
  X, AlertCircle, CheckCircle2
} from 'lucide-react'

interface Message {
  id: string
  role: 'assistant' | 'user' | 'system'
  content: string
  actions?: WizardAction[]
  extractedProducts?: any[]
  timestamp: Date
}

interface WizardAction {
  type: string
  label: string
  icon?: string
  data?: any
}

interface CatalogSituation {
  hasCategories: boolean
  hasProductTypes: boolean
  hasProducts: boolean
  categoryCount: number
  productTypeCount: number
  productCount: number
  categories: string[]
  productTypes: string[]
}

interface IndustryTemplate {
  id: string
  name: string
  icon: any
}

const INDUSTRY_ICONS: Record<string, any> = {
  'skincare': Store,
  'restaurant': Utensils,
  'florist': Flower2,
  'apparel': Shirt,
  'electronics': Laptop,
  'general': ShoppingBag,
}

interface CatalogSetupWizardProps {
  businessUnitId: string
  onComplete?: () => void
  onClose?: () => void
}

export default function CatalogSetupWizard({
  businessUnitId,
  onComplete,
  onClose
}: CatalogSetupWizardProps) {
  // State
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [situation, setSituation] = useState<CatalogSituation | null>(null)
  const [availableIndustries, setAvailableIndustries] = useState<IndustryTemplate[]>([])
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null)
  const [extractedProducts, setExtractedProducts] = useState<any[]>([])
  const [importUrl, setImportUrl] = useState('')
  const [showUrlImport, setShowUrlImport] = useState(false)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [currentStep, setCurrentStep] = useState<'analyze' | 'choose' | 'template' | 'import' | 'review' | 'complete'>('analyze')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Initialize wizard
  useEffect(() => {
    analyzeSituation()
  }, [businessUnitId])

  // Analyze current catalog situation
  const analyzeSituation = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/ecommerce/catalog-wizard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze_situation',
          businessUnitId
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSituation(data.situation)
        setAvailableIndustries(data.availableIndustries || [])

        // Add initial assistant message based on situation
        const initialMessage: Message = {
          id: '1',
          role: 'assistant',
          content: data.recommendation,
          actions: getActionsForSituation(data.suggestedPath),
          timestamp: new Date()
        }
        setMessages([initialMessage])
        setCurrentStep('choose')
      }
    } catch (error) {
      console.error('Failed to analyze situation:', error)
      addMessage('assistant', "I encountered an error analyzing your catalog. Let's start fresh - what would you like to do?")
    } finally {
      setIsLoading(false)
    }
  }

  // Get action buttons based on situation
  const getActionsForSituation = (path: string): WizardAction[] => {
    const actions: WizardAction[] = []

    if (path === 'template_or_import' || path === 'add_products') {
      actions.push(
        { type: 'show_templates', label: 'Use Industry Template', icon: 'FolderTree' },
        { type: 'show_url_import', label: 'Import from URL', icon: 'Link2' },
        { type: 'show_file_upload', label: 'Upload Documents', icon: 'FileText' },
        { type: 'manual_start', label: 'Start from Scratch', icon: 'Plus' }
      )
    } else if (path === 'add_categories') {
      actions.push(
        { type: 'show_templates', label: 'Use Industry Template', icon: 'FolderTree' },
        { type: 'manual_categories', label: 'Create Categories Manually', icon: 'Plus' }
      )
    } else {
      actions.push(
        { type: 'show_url_import', label: 'Import More Products', icon: 'Link2' },
        { type: 'manual_add', label: 'Add Product Manually', icon: 'Plus' },
        { type: 'done', label: 'Done for Now', icon: 'Check' }
      )
    }

    return actions
  }

  // Add message to conversation
  const addMessage = (role: 'assistant' | 'user' | 'system', content: string, actions?: WizardAction[], extractedProducts?: any[]) => {
    const message: Message = {
      id: Date.now().toString(),
      role,
      content,
      actions,
      extractedProducts,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, message])
  }

  // Handle user message
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage = inputValue.trim()
    setInputValue('')
    addMessage('user', userMessage)

    setIsLoading(true)
    try {
      const response = await fetch('/api/ecommerce/catalog-wizard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          businessUnitId,
          message: userMessage,
          context: situation
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Check if AI detected an industry
        if (data.detectedIndustry) {
          setSelectedIndustry(data.detectedIndustry)
        }

        addMessage('assistant', data.response,
          data.suggestedActions?.length > 0 ?
            data.suggestedActions.map((a: string) => ({ type: a, label: formatActionLabel(a) })) :
            undefined
        )
      }
    } catch (error) {
      addMessage('assistant', "I'm having trouble understanding. Could you try rephrasing that?")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle action button click
  const handleAction = async (action: WizardAction) => {
    switch (action.type) {
      case 'show_templates':
        setCurrentStep('template')
        addMessage('assistant', "Great choice! Select an industry template below that best matches your business. This will set up categories and product types automatically.",
          availableIndustries.map(ind => ({
            type: 'apply_template',
            label: ind.name,
            data: { industry: ind.id }
          }))
        )
        break

      case 'apply_template':
        await applyTemplate(action.data.industry)
        break

      case 'show_url_import':
        setShowUrlImport(true)
        setCurrentStep('import')
        addMessage('assistant', "Enter a product page URL below. I'll analyze the page and extract product information for you.")
        break

      case 'show_file_upload':
        setShowFileUpload(true)
        setCurrentStep('import')
        addMessage('assistant', "Upload your product documents (PDF, Excel, etc.). I'll extract product information from them.")
        break

      case 'manual_start':
        addMessage('assistant', "Let's set up your catalog from scratch. First, tell me about your business - what kind of products do you sell?")
        break

      case 'import_products':
        if (extractedProducts.length > 0) {
          await createProductsBatch(extractedProducts)
        }
        break

      case 'done':
        addMessage('assistant', "Your catalog setup is complete! You can always come back to add more products or make changes.")
        setCurrentStep('complete')
        onComplete?.()
        break

      default:
        addMessage('assistant', `You selected: ${action.label}. Let me help you with that.`)
    }
  }

  // Apply industry template
  const applyTemplate = async (industry: string) => {
    setIsLoading(true)
    addMessage('user', `Apply ${industry} template`)

    try {
      const response = await fetch('/api/ecommerce/catalog-wizard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply_template',
          businessUnitId,
          industry
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSelectedIndustry(industry)
        addMessage('assistant',
          `${data.message}\n\nYour catalog structure is now ready! Would you like to:\n- Import products from a URL or document\n- Add products manually\n- You're all set for now`,
          [
            { type: 'show_url_import', label: 'Import from URL', icon: 'Link2' },
            { type: 'show_file_upload', label: 'Upload Documents', icon: 'FileText' },
            { type: 'manual_add', label: 'Add Manually', icon: 'Plus' },
            { type: 'done', label: "I'm Done", icon: 'Check' }
          ]
        )
        // Refresh situation
        analyzeSituation()
      } else {
        addMessage('assistant', `Failed to apply template: ${data.error}`)
      }
    } catch (error) {
      addMessage('assistant', 'Failed to apply template. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Import from URL
  const handleUrlImport = async () => {
    if (!importUrl.trim()) return

    setIsLoading(true)
    addMessage('user', `Import from: ${importUrl}`)

    try {
      const response = await fetch('/api/ecommerce/catalog-wizard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'extract_from_url',
          businessUnitId,
          url: importUrl
        })
      })

      const data = await response.json()

      if (response.ok && data.extractedProducts?.length > 0) {
        setExtractedProducts(data.extractedProducts)
        setShowUrlImport(false)
        setImportUrl('')
        setCurrentStep('review')

        addMessage('assistant',
          `I found ${data.extractedProducts.length} product(s) from that page. Review them below and click "Import All" to add them to your catalog.`,
          [
            { type: 'import_products', label: `Import All ${data.extractedProducts.length} Products`, icon: 'Check' },
            { type: 'show_url_import', label: 'Try Another URL', icon: 'Link2' }
          ],
          data.extractedProducts
        )
      } else {
        addMessage('assistant', data.error || "I couldn't extract any products from that URL. Try a different page or enter products manually.")
      }
    } catch (error) {
      addMessage('assistant', 'Failed to analyze the URL. Please check the URL and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    addMessage('user', `Uploaded: ${file.name}`)

    try {
      // Read file content
      const content = await file.text()

      const response = await fetch('/api/ecommerce/catalog-wizard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'extract_from_document',
          businessUnitId,
          content,
          filename: file.name
        })
      })

      const data = await response.json()

      if (response.ok && data.extractedProducts?.length > 0) {
        setExtractedProducts(data.extractedProducts)
        setShowFileUpload(false)
        setCurrentStep('review')

        addMessage('assistant',
          `I extracted ${data.extractedProducts.length} product(s) from "${file.name}". Review them below and click "Import All" to add them to your catalog.`,
          [
            { type: 'import_products', label: `Import All ${data.extractedProducts.length} Products`, icon: 'Check' },
            { type: 'show_file_upload', label: 'Upload Another File', icon: 'FileText' }
          ],
          data.extractedProducts
        )
      } else {
        addMessage('assistant', data.error || "I couldn't extract products from that file. Try a different format or enter products manually.")
      }
    } catch (error) {
      addMessage('assistant', 'Failed to process the file. Please try again.')
    } finally {
      setIsLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Create products batch
  const createProductsBatch = async (products: any[]) => {
    setIsLoading(true)
    addMessage('system', `Creating ${products.length} products...`)

    try {
      const response = await fetch('/api/ecommerce/catalog-wizard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_products_batch',
          businessUnitId,
          products
        })
      })

      const data = await response.json()

      if (response.ok) {
        setExtractedProducts([])
        addMessage('assistant',
          `Successfully created ${data.createdCount} product(s)!${data.errorCount > 0 ? ` (${data.errorCount} failed)` : ''}\n\nWould you like to add more products or are you done?`,
          [
            { type: 'show_url_import', label: 'Import More from URL', icon: 'Link2' },
            { type: 'show_file_upload', label: 'Upload More Documents', icon: 'FileText' },
            { type: 'done', label: "I'm Done", icon: 'Check' }
          ]
        )
        // Refresh situation
        analyzeSituation()
      } else {
        addMessage('assistant', `Failed to create products: ${data.error}`)
      }
    } catch (error) {
      addMessage('assistant', 'Failed to create products. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Format action label
  const formatActionLabel = (action: string): string => {
    const labels: Record<string, string> = {
      'apply_template': 'Use Template',
      'import_products': 'Import Products',
      'manual_add': 'Add Manually',
      'manage_categories': 'Manage Categories',
    }
    return labels[action] || action.replace(/_/g, ' ')
  }

  // Get icon component
  const getIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      'FolderTree': FolderTree,
      'Link2': Link2,
      'FileText': FileText,
      'Plus': Plus,
      'Check': Check,
    }
    return icons[iconName] || ChevronRight
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-600 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Catalog Setup Wizard</h2>
            <p className="text-sm text-slate-400">AI-guided product catalog setup</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        )}
      </div>

      {/* Progress indicator */}
      <div className="px-6 py-3 border-b border-slate-700 bg-slate-800/50">
        <div className="flex items-center gap-2 text-sm">
          <span className={`px-2 py-1 rounded ${currentStep === 'analyze' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
            Analyze
          </span>
          <ChevronRight className="w-4 h-4 text-slate-500" />
          <span className={`px-2 py-1 rounded ${currentStep === 'choose' || currentStep === 'template' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
            Setup
          </span>
          <ChevronRight className="w-4 h-4 text-slate-500" />
          <span className={`px-2 py-1 rounded ${currentStep === 'import' || currentStep === 'review' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
            Import
          </span>
          <ChevronRight className="w-4 h-4 text-slate-500" />
          <span className={`px-2 py-1 rounded ${currentStep === 'complete' ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
            Complete
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
            {message.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
            )}

            <div className={`max-w-[80%] ${message.role === 'user' ? 'order-first' : ''}`}>
              <div className={`rounded-lg px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : message.role === 'system'
                  ? 'bg-slate-700 text-slate-300 italic'
                  : 'bg-slate-800 text-slate-100'
              }`}>
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>

              {/* Action buttons */}
              {message.actions && message.actions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {message.actions.map((action, idx) => {
                    const IconComponent = action.icon ? getIcon(action.icon) : ChevronRight
                    const IndustryIcon = action.data?.industry ? INDUSTRY_ICONS[action.data.industry] : null

                    return (
                      <button
                        key={idx}
                        onClick={() => handleAction(action)}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {IndustryIcon ? <IndustryIcon className="w-4 h-4" /> : <IconComponent className="w-4 h-4" />}
                        {action.label}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Extracted products preview */}
              {message.extractedProducts && message.extractedProducts.length > 0 && (
                <div className="mt-3 bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                  <div className="px-4 py-2 bg-slate-700 text-sm font-medium text-slate-200">
                    Extracted Products ({message.extractedProducts.length})
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {message.extractedProducts.map((product, idx) => (
                      <div key={idx} className="px-4 py-3 border-b border-slate-700 last:border-0">
                        <div className="flex items-start gap-3">
                          <Package className="w-5 h-5 text-slate-400 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-white truncate">{product.title}</h4>
                            {product.tagline && (
                              <p className="text-sm text-slate-400 truncate">{product.tagline}</p>
                            )}
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                              {product.price && <span>${product.price}</span>}
                              {product.sku && <span>SKU: {product.sku}</span>}
                              {product.category_suggestion && <span>{product.category_suggestion}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {message.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            </div>
            <div className="bg-slate-800 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2 text-slate-400">
                <span>Thinking</span>
                <span className="animate-pulse">...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* URL Import Panel */}
      {showUrlImport && (
        <div className="px-6 py-4 border-t border-slate-700 bg-slate-800">
          <div className="flex gap-2">
            <input
              type="url"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              placeholder="https://example.com/product-page"
              className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              onKeyDown={(e) => e.key === 'Enter' && handleUrlImport()}
            />
            <button
              onClick={handleUrlImport}
              disabled={isLoading || !importUrl.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Analyze
            </button>
            <button
              onClick={() => { setShowUrlImport(false); setImportUrl('') }}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* File Upload Panel */}
      {showFileUpload && (
        <div className="px-6 py-4 border-t border-slate-700 bg-slate-800">
          <div className="flex gap-2 items-center">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              accept=".pdf,.txt,.csv,.xlsx,.xls,.doc,.docx"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="flex-1 px-4 py-3 border-2 border-dashed border-slate-600 rounded-lg text-slate-300 hover:border-purple-500 hover:text-purple-400 transition-colors flex items-center justify-center gap-2"
            >
              <Upload className="w-5 h-5" />
              Click to upload PDF, Excel, or text file
            </button>
            <button
              onClick={() => setShowFileUpload(false)}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-6 py-4 border-t border-slate-700 bg-slate-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message or describe your business..."
            className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
            className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
