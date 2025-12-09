'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Package, Wrench, FileText, Plus, Edit, Trash2,
  Upload, Search, Grid, List,
  Loader2, X, BookOpen, Globe
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

type ActiveSubTab = 'industry' | 'products' | 'services' | 'policies'
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

  // File refs
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const industryDocInputRef = useRef<HTMLInputElement>(null)

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
    } catch (error) {
      console.error('Failed to load knowledge base data:', error)
    } finally {
      setIsLoading(false)
    }
  }

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
      // Handle PDF files with pdf.js
      else if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
        const arrayBuffer = await file.arrayBuffer()
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
        const pdf = await loadingTask.promise
        let fullText = ''
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum)
          const textContent = await page.getTextContent()
          const pageText = textContent.items.map((item: any) => item.str).join(' ')
          fullText += pageText + '\n\n'
        }
        extractedText = fullText
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
      // Handle PDF files with pdf.js
      else if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

        const arrayBuffer = await file.arrayBuffer()
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
        const pdf = await loadingTask.promise

        let fullText = ''
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum)
          const textContent = await page.getTextContent()
          const pageText = textContent.items.map((item: any) => item.str).join(' ')
          fullText += pageText + '\n\n'
        }
        extractedText = fullText
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

  // Delete KB item (products, services, policies)
  const handleDeleteKBItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      const endpoint = activeSubTab === 'products' ? 'products' :
                       activeSubTab === 'services' ? 'services' : 'policies'

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

          {/* Policies Tab */}
          <button
            onClick={() => setActiveSubTab('policies')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeSubTab === 'policies'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <FileText className="w-4 h-4" />
            Policies
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

            {/* Policies Tab */}
            {activeSubTab === 'policies' && (
              <PolicyManager businessUnitId={businessUnitId} language={language} />
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
