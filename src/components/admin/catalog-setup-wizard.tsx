'use client'

/**
 * AI-Guided Catalog Setup Wizard
 *
 * Smart conversational interface that:
 * 1. Asks intelligent contextual questions based on business type
 * 2. Suggests options with buttons + allows free text input
 * 3. Executes actions immediately when user chooses
 * 4. User can exit anytime (X) - work is saved
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
  'factory-outlet': Package,
  'grocery': ShoppingBag,
  'bakery': Store,
  'jewelry': Sparkles,
  'furniture': Store,
  'pharmacy': Store,
  'pet-store': Store,
  'liquor': Store,
  'spa-salon': Sparkles,
}

// Sub-categories for factory outlet (what kind of products?)
const FACTORY_OUTLET_TYPES = [
  { id: 'apparel', name: 'Apparel & Fashion' },
  { id: 'electronics', name: 'Electronics' },
  { id: 'home-goods', name: 'Home Goods' },
  { id: 'sporting', name: 'Sporting Goods' },
  { id: 'mixed', name: 'Mixed / General' },
]

interface CatalogSetupWizardProps {
  businessUnitId: string
  businessUnitName?: string
  onComplete?: () => void
  onClose?: () => void
}

export default function CatalogSetupWizard({
  businessUnitId,
  businessUnitName,
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

  // Track wizard phase for smarter responses
  const [phase, setPhase] = useState<'init' | 'choose_setup' | 'choose_industry' | 'choose_subtype' | 'confirm_template' | 'add_products' | 'importing' | 'done'>('init')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Initialize wizard
  useEffect(() => {
    initializeWizard()
  }, [businessUnitId])

  // Initialize - analyze situation and ask smart first question
  const initializeWizard = async () => {
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

        // Smart initial message based on situation
        if (data.situation.hasCategories && data.situation.hasProducts) {
          // Already set up
          setPhase('done')
          addMessage('assistant',
            `Your catalog already has ${data.situation.categoryCount} categories and ${data.situation.productCount} products. What would you like to do?`,
            [
              { type: 'import_url', label: 'Import More Products', icon: 'Link2' },
              { type: 'close', label: 'Close Wizard', icon: 'Check' }
            ]
          )
        } else if (data.situation.hasCategories) {
          // Has categories, needs products
          setPhase('add_products')
          addMessage('assistant',
            `You have ${data.situation.categoryCount} categories set up (${data.situation.categories.slice(0, 3).join(', ')}${data.situation.categoryCount > 3 ? '...' : ''}). Ready to add products! How would you like to proceed?`,
            [
              { type: 'import_url', label: 'Import from URL', icon: 'Link2' },
              { type: 'import_file', label: 'Upload File', icon: 'FileText' },
              { type: 'close', label: 'Add Manually (Close Wizard)', icon: 'Plus' }
            ]
          )
        } else {
          // Empty catalog - ask how to set up
          setPhase('choose_setup')
          const buName = businessUnitName || 'your business'
          addMessage('assistant',
            `Let's set up the catalog for ${buName}! How would you like to start?`,
            [
              { type: 'use_template', label: 'Use Industry Template', icon: 'FolderTree' },
              { type: 'import_url', label: 'Import from URL', icon: 'Link2' },
              { type: 'import_file', label: 'Upload Product File', icon: 'FileText' },
              { type: 'manual', label: 'Set Up Manually', icon: 'Plus' }
            ]
          )
        }
      }
    } catch (error) {
      console.error('Failed to initialize wizard:', error)
      addMessage('assistant', "I encountered an error. Please try again or close and set up manually.")
    } finally {
      setIsLoading(false)
    }
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

  // Handle user text input
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage = inputValue.trim()
    setInputValue('')
    addMessage('user', userMessage)

    setIsLoading(true)
    try {
      // Use AI to understand what user wants
      const response = await fetch('/api/ecommerce/catalog-wizard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          businessUnitId,
          message: userMessage,
          context: { ...situation, phase }
        })
      })

      const data = await response.json()

      if (response.ok) {
        // If AI detected an industry from user text
        if (data.detectedIndustry) {
          setSelectedIndustry(data.detectedIndustry)
          setPhase('confirm_template')

          // Show what will be created
          addMessage('assistant',
            `Got it! For "${data.detectedIndustry.replace('-', ' ')}" I'll create the standard categories and product types. Ready to set this up?`,
            [
              { type: 'apply_template', label: 'Yes, Create Now', icon: 'Check', data: { industry: data.detectedIndustry } },
              { type: 'choose_different', label: 'Show Other Options', icon: 'FolderTree' }
            ]
          )
        } else {
          // General AI response with suggested actions
          const actions = getActionsForPhase(phase, data.suggestedActions)
          addMessage('assistant', data.response, actions.length > 0 ? actions : undefined)
        }
      }
    } catch (error) {
      addMessage('assistant', "I didn't understand that. Could you try again or pick an option below?")
    } finally {
      setIsLoading(false)
    }
  }

  // Get appropriate actions for current phase
  const getActionsForPhase = (currentPhase: string, aiSuggestions?: string[]): WizardAction[] => {
    switch (currentPhase) {
      case 'choose_setup':
        return [
          { type: 'use_template', label: 'Use Template', icon: 'FolderTree' },
          { type: 'manual', label: 'Manual Setup', icon: 'Plus' }
        ]
      case 'add_products':
        return [
          { type: 'import_url', label: 'Import from URL', icon: 'Link2' },
          { type: 'close', label: 'Add Manually', icon: 'Plus' }
        ]
      default:
        return []
    }
  }

  // Handle action button click
  const handleAction = async (action: WizardAction) => {
    switch (action.type) {
      case 'use_template':
        setPhase('choose_industry')
        addMessage('assistant',
          "What type of business is this? Select below or type your own:",
          availableIndustries.slice(0, 8).map(ind => ({
            type: 'select_industry',
            label: ind.name,
            icon: 'Store',
            data: { industry: ind.id }
          }))
        )
        break

      case 'select_industry':
        const industry = action.data?.industry
        if (industry === 'factory-outlet') {
          // Factory outlet needs sub-type
          setSelectedIndustry(industry)
          setPhase('choose_subtype')
          addMessage('assistant',
            "What type of products will your factory outlet sell?",
            FACTORY_OUTLET_TYPES.map(type => ({
              type: 'select_subtype',
              label: type.name,
              icon: 'Package',
              data: { subtype: type.id }
            }))
          )
        } else {
          // Direct template application
          setSelectedIndustry(industry)
          setPhase('confirm_template')
          addMessage('assistant',
            `Great choice! I'll set up categories and product types for ${action.label}. Ready?`,
            [
              { type: 'apply_template', label: 'Yes, Create Now', icon: 'Check', data: { industry } },
              { type: 'choose_different', label: 'Choose Different', icon: 'FolderTree' }
            ]
          )
        }
        break

      case 'select_subtype':
        // For factory outlet, use the selected subtype to customize
        setPhase('confirm_template')
        addMessage('assistant',
          `Perfect! I'll create Factory Outlet categories (Clearance, Overstock, Seconds, etc.) optimized for ${action.label}. Ready to create?`,
          [
            { type: 'apply_template', label: 'Yes, Create Now', icon: 'Check', data: { industry: 'factory-outlet', subtype: action.data?.subtype } },
            { type: 'choose_different', label: 'Choose Different', icon: 'FolderTree' }
          ]
        )
        break

      case 'apply_template':
        await applyTemplate(action.data?.industry || selectedIndustry)
        break

      case 'choose_different':
        setPhase('choose_industry')
        addMessage('assistant',
          "No problem! Select a different industry:",
          availableIndustries.map(ind => ({
            type: 'select_industry',
            label: ind.name,
            icon: 'Store',
            data: { industry: ind.id }
          }))
        )
        break

      case 'import_url':
        setShowUrlImport(true)
        setPhase('importing')
        addMessage('assistant', "Enter a product page URL below. I'll extract the product information for you.")
        break

      case 'import_file':
        setShowFileUpload(true)
        setPhase('importing')
        addMessage('assistant', "Click to upload your product file (PDF, Excel, CSV, etc.).")
        break

      case 'manual':
        addMessage('assistant', "Closing the wizard. You can now add categories and products manually using the tabs above.")
        setTimeout(() => onComplete?.(), 1000)
        break

      case 'close':
        addMessage('assistant', "Got it! You can now add products manually. The wizard will close.")
        setTimeout(() => onComplete?.(), 1000)
        break

      case 'import_products':
        if (extractedProducts.length > 0) {
          await createProductsBatch(extractedProducts)
        }
        break

      case 'import_more':
        setShowUrlImport(true)
        setPhase('importing')
        addMessage('assistant', "Enter another URL to import more products:")
        break

      case 'done':
        addMessage('assistant', "Your catalog is set up! Closing the wizard now.")
        setTimeout(() => onComplete?.(), 1000)
        break

      default:
        addMessage('assistant', `You selected: ${action.label}`)
    }
  }

  // Apply industry template
  const applyTemplate = async (industry: string | null) => {
    if (!industry) return

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
        setPhase('add_products')

        // Update situation
        setSituation(prev => prev ? {
          ...prev,
          hasCategories: true,
          categoryCount: data.createdCategories?.length || 0,
          hasProductTypes: true,
          productTypeCount: data.createdTypes?.length || 0
        } : null)

        addMessage('assistant',
          `Done! Created ${data.createdCategories?.length || 0} categories and ${data.createdTypes?.length || 0} product types.\n\nNow you can add products. How would you like to proceed?`,
          [
            { type: 'import_url', label: 'Import from URL', icon: 'Link2' },
            { type: 'import_file', label: 'Upload Product File', icon: 'FileText' },
            { type: 'close', label: 'Add Manually (Close)', icon: 'Plus' }
          ]
        )
      } else {
        addMessage('assistant', `Failed to apply template: ${data.error}. Please try again.`)
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

        addMessage('assistant',
          `Found ${data.extractedProducts.length} product(s)! Review below and click "Import All" to add them:`,
          [
            { type: 'import_products', label: `Import All ${data.extractedProducts.length} Products`, icon: 'Check' },
            { type: 'import_more', label: 'Try Different URL', icon: 'Link2' },
            { type: 'close', label: 'Cancel & Close', icon: 'X' }
          ],
          data.extractedProducts
        )
      } else {
        addMessage('assistant', data.error || "Couldn't find products on that page. Try a different URL or add products manually.")
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

        addMessage('assistant',
          `Extracted ${data.extractedProducts.length} product(s) from "${file.name}". Review and import:`,
          [
            { type: 'import_products', label: `Import All ${data.extractedProducts.length} Products`, icon: 'Check' },
            { type: 'import_file', label: 'Upload Different File', icon: 'FileText' },
            { type: 'close', label: 'Cancel & Close', icon: 'X' }
          ],
          data.extractedProducts
        )
      } else {
        addMessage('assistant', data.error || "Couldn't extract products from that file. Try a different format.")
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
        setPhase('done')

        addMessage('assistant',
          `Successfully created ${data.createdCount} product(s)!${data.errorCount > 0 ? ` (${data.errorCount} failed)` : ''}\n\nWhat's next?`,
          [
            { type: 'import_more', label: 'Import More Products', icon: 'Link2' },
            { type: 'done', label: 'All Done - Close Wizard', icon: 'Check' }
          ]
        )
      } else {
        addMessage('assistant', `Failed to create products: ${data.error}`)
      }
    } catch (error) {
      addMessage('assistant', 'Failed to create products. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Get icon component
  const getIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      'FolderTree': FolderTree,
      'Link2': Link2,
      'FileText': FileText,
      'Plus': Plus,
      'Check': Check,
      'Store': Store,
      'Package': Package,
      'X': X,
    }
    return icons[iconName] || ChevronRight
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-none overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 border border-purple-200 rounded-none">
            <Sparkles className="w-5 h-5 text-gray-800" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Catalog Setup</h2>
            <p className="text-xs sm:text-sm text-gray-500">AI-guided setup</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-none transition-colors"
            title="Close (work is saved)"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* Status bar */}
      <div className="px-4 sm:px-6 py-2 border-b border-gray-200 bg-gray-50 text-xs text-gray-500">
        {situation && (
          <span>
            {situation.categoryCount} categories | {situation.productCount} products
            {phase !== 'done' && ' | Setup in progress...'}
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
            {message.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-gray-800" />
              </div>
            )}

            <div className={`max-w-[85%] ${message.role === 'user' ? 'order-first' : ''}`}>
              <div className={`rounded-none px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-blue-50 border border-blue-200 text-gray-800'
                  : message.role === 'system'
                  ? 'bg-gray-100 text-gray-600 italic'
                  : 'bg-white text-slate-100'
              }`}>
                <p className="whitespace-pre-wrap text-sm sm:text-base">{message.content}</p>
              </div>

              {/* Action buttons */}
              {message.actions && message.actions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {message.actions.map((action, idx) => {
                    const IconComponent = action.icon ? getIcon(action.icon) : ChevronRight

                    return (
                      <button
                        key={idx}
                        onClick={() => handleAction(action)}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-100 hover:bg-gray-100 text-gray-700 rounded-none text-xs sm:text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        <IconComponent className="w-4 h-4" />
                        {action.label}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Extracted products preview */}
              {message.extractedProducts && message.extractedProducts.length > 0 && (
                <div className="mt-3 bg-white rounded-none border border-gray-200 overflow-hidden">
                  <div className="px-4 py-2 bg-gray-100 text-sm font-medium text-gray-700">
                    Products to Import ({message.extractedProducts.length})
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {message.extractedProducts.map((product, idx) => (
                      <div key={idx} className="px-4 py-3 border-b border-gray-200 last:border-0">
                        <div className="flex items-start gap-3">
                          <Package className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-800 text-sm">{product.title}</h4>
                            {product.title_en && product.title_en !== product.title && (
                              <p className="text-xs text-gray-500">{product.title_en}</p>
                            )}
                            {product.tagline && (
                              <p className="text-xs text-gray-500 truncate">{product.tagline}</p>
                            )}

                            {/* Price row */}
                            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                              {product.price && (
                                <span className="text-green-600 font-medium">
                                  {product.currency || '$'}{product.price}
                                  {product.original_price && product.original_price !== product.price && (
                                    <span className="text-gray-400 line-through ml-1">{product.original_price}</span>
                                  )}
                                </span>
                              )}
                              {product.sku && <span className="text-gray-400">SKU: {product.sku}</span>}
                              {product.volume && <span className="text-gray-400">{product.volume}</span>}
                              {product.brand && <span className="text-gray-400">{product.brand}</span>}
                            </div>

                            {/* Industry-specific tags */}
                            <div className="flex flex-wrap gap-1 mt-1">
                              {/* Apparel */}
                              {product.colors?.length > 0 && (
                                <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded-none text-gray-600">
                                  {product.colors.length} colors
                                </span>
                              )}
                              {product.sizes?.length > 0 && (
                                <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded-none text-gray-600">
                                  {product.sizes.join(', ')}
                                </span>
                              )}

                              {/* Skincare */}
                              {product.skin_type && (
                                <span className="text-xs bg-pink-900/50 px-1.5 py-0.5 rounded-none text-pink-600">
                                  {product.skin_type}
                                </span>
                              )}
                              {product.concerns?.length > 0 && (
                                <span className="text-xs bg-pink-900/50 px-1.5 py-0.5 rounded-none text-pink-600">
                                  {product.concerns.slice(0, 2).join(', ')}
                                </span>
                              )}

                              {/* Restaurant */}
                              {product.calories && (
                                <span className="text-xs bg-orange-50/50 px-1.5 py-0.5 rounded-none text-orange-600">
                                  {product.calories} cal
                                </span>
                              )}
                              {product.dietary?.length > 0 && (
                                <span className="text-xs bg-green-50/50 px-1.5 py-0.5 rounded-none text-green-600">
                                  {product.dietary.join(', ')}
                                </span>
                              )}
                              {product.spice_level && (
                                <span className="text-xs bg-red-50/50 px-1.5 py-0.5 rounded-none text-red-600">
                                  {product.spice_level} spice
                                </span>
                              )}

                              {/* Florist */}
                              {product.flowers?.length > 0 && (
                                <span className="text-xs bg-pink-900/50 px-1.5 py-0.5 rounded-none text-pink-600">
                                  {product.flowers.slice(0, 3).join(', ')}
                                </span>
                              )}
                              {product.occasion?.length > 0 && (
                                <span className="text-xs bg-purple-50/50 px-1.5 py-0.5 rounded-none text-purple-600">
                                  {product.occasion[0]}
                                </span>
                              )}

                              {/* Electronics */}
                              {product.warranty && (
                                <span className="text-xs bg-blue-50/50 px-1.5 py-0.5 rounded-none text-blue-600">
                                  {product.warranty}
                                </span>
                              )}

                              {/* Category suggestion (all) */}
                              {product.category_suggestion && (
                                <span className="text-xs bg-purple-50/50 px-1.5 py-0.5 rounded-none text-purple-600">
                                  {product.category_suggestion}
                                </span>
                              )}
                            </div>

                            {/* Features/Key info */}
                            {product.features?.length > 0 && (
                              <p className="text-xs text-gray-400 mt-1 truncate">
                                {product.features.slice(0, 3).join(' • ')}
                              </p>
                            )}
                            {product.key_actives && (
                              <p className="text-xs text-gray-400 mt-1 truncate">
                                Key actives: {product.key_actives}
                              </p>
                            )}
                            {product.ingredients && !product.key_actives && (
                              <p className="text-xs text-gray-400 mt-1 truncate">
                                {product.ingredients.substring(0, 60)}...
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {message.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-gray-800" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-gray-800 animate-spin" />
            </div>
            <div className="bg-white rounded-none px-4 py-3">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <span>Working</span>
                <span className="animate-pulse">...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* URL Import Panel */}
      {showUrlImport && (
        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-white">
          <div className="flex gap-2">
            <input
              type="url"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              placeholder="https://example.com/product-page"
              className="flex-1 px-3 sm:px-4 py-2 bg-gray-100 border border-gray-200 rounded-none text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleUrlImport()}
            />
            <button
              onClick={handleUrlImport}
              disabled={isLoading || !importUrl.trim()}
              className="px-3 sm:px-4 py-2 bg-purple-50 border border-purple-200 hover:bg-purple-100 text-gray-800 rounded-none font-medium disabled:opacity-50 flex items-center gap-2 text-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Analyze</span>
            </button>
            <button
              onClick={() => { setShowUrlImport(false); setImportUrl('') }}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-none"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* File Upload Panel */}
      {showFileUpload && (
        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-white">
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
              className="flex-1 px-4 py-3 border-2 border-dashed border-gray-300 rounded-none text-gray-600 hover:border-purple-500 hover:text-purple-600 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Upload className="w-5 h-5" />
              Click to upload (PDF, Excel, CSV, etc.)
            </button>
            <button
              onClick={() => setShowFileUpload(false)}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-none"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Text Input - always visible for free typing */}
      <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your answer or describe what you need..."
            className="flex-1 px-3 sm:px-4 py-3 bg-gray-100 border border-gray-200 rounded-none text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
            className="px-4 py-3 bg-purple-50 border border-purple-200 hover:bg-purple-100 text-gray-800 rounded-none disabled:opacity-50 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Select a button above or type your own response
        </p>
      </div>
    </div>
  )
}
