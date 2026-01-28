'use client'

import { useState, useEffect, useRef } from 'react'
import { Brain, Database, Plus, Edit, Trash2, Save, BarChart3, Book, Sparkles, Users, User, HelpCircle, Mail, Upload, FileText, TestTube, Settings, Calendar, Globe, X } from 'lucide-react'
import ProfileModal from './profile-modal'
import RoleplayTraining from './roleplay-training'
import KnowledgeBase from './knowledge-base'
import AddLocaleModal from './landing-page/AddLocaleModal'
import { FAQ, CannedMessage } from '@/lib/faq-library'
import { type Language, languageNames, getTranslation } from '@/lib/translations'
import {
  loadKnowledge, saveKnowledge, deleteKnowledge,
  loadFAQs, saveFAQ, deleteFAQ,
  loadCannedMessages, saveCannedMessage, deleteCannedMessage,
  loadFAQCategories, loadCannedCategories, saveCategory, deleteCategory,
  loadGuidelines, saveGuidelines, saveGuideline, deleteGuideline, copyDefaultGuidelines,
  loadTrainingData, saveTrainingData,
  loadBusinessUnits, saveBusinessUnit, deleteBusinessUnit,
  loadAIStaff, saveAIStaff, deleteAIStaff,
  loadTrainingScenarios, saveTrainingScenario, deleteTrainingScenario,
  loadTrainingSessions, saveTrainingSession, deleteTrainingSession,
  loadServices, saveService, deleteService,
  loadStaff, saveStaff, deleteStaff,
  loadAssignments, saveAssignment, deleteAssignment,
  loadOutlets, saveOutlet, deleteOutlet,
  loadRooms, saveRoom, deleteRoom,
  loadRoomServices, saveRoomServices
} from '@/lib/api-client'

interface KnowledgeEntry {
  id: string
  category: string
  topic: string
  content: string
  keywords: string[]
  confidence: number
  createdAt: Date
  updatedAt: Date
  filePath?: string
  fileName?: string
}

interface TrainingData {
  id: string
  question: string
  answer: string
  category: string
  keywords: string[]
  variations: string[]
  tone: 'professional' | 'friendly' | 'expert' | 'casual'
  priority: number
  active: boolean
  createdAt: Date
}

const AITrainingCenter = () => {
  const [activeTab, setActiveTab] = useState<'knowledge' | 'training' | 'analytics' | 'roleplay' | 'faq' | 'canned' | 'aimodel' | 'booking'>('knowledge')
  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntry[]>([])
  const [trainingData, setTrainingData] = useState<TrainingData[]>([])
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [cannedMsgs, setCannedMsgs] = useState<CannedMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | TrainingData | FAQ | CannedMessage | null>(null)
  const [testQuery, setTestQuery] = useState('')
  const [testResponse, setTestResponse] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [trainingSession, setTrainingSession] = useState<any>(null)
  const [modelInfo, setModelInfo] = useState<any>(null)
  const [trainingProgress, setTrainingProgress] = useState(0)
  const [validationResults, setValidationResults] = useState<any>(null)
  const [trainingSessions, setTrainingSessions] = useState<any[]>([])
  const [trainingMemory, setTrainingMemory] = useState<{[key: string]: string[]}>({})
  const [completedTrainingSessions, setCompletedTrainingSessions] = useState<any[]>([])
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en')

  // Locale state: country + language code (e.g., "US" + "en", "HK" + "tw")
  const [selectedCountry, setSelectedCountry] = useState<string>('US')
  const [selectedLangCode, setSelectedLangCode] = useState<string>('en')
  const [availableLocales, setAvailableLocales] = useState<{country: string, language_code: string}[]>([])
  const [showAddLocaleModal, setShowAddLocaleModal] = useState(false)

  // Map short lang code to Language type for UI translations
  const langCodeToLanguage = (code: string): Language => {
    const map: Record<string, Language> = { 'tw': 'zh-TW', 'cn': 'zh-CN', 'en': 'en', 'vi': 'vi' }
    return map[code] || 'en'
  }

  // Get translations
  const t = getTranslation(selectedLanguage)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const isLoadingDataRef = useRef(false) // Track loading state to prevent auto-save during load
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [fetchingUrl, setFetchingUrl] = useState(false)
  const [generatingFaqs, setGeneratingFaqs] = useState(false)
  const [regeneratingAnswer, setRegeneratingAnswer] = useState(false)
  const [faqCategories, setFaqCategories] = useState<string[]>(['pricing', 'products', 'shipping', 'returns', 'product results', 'ingredients', 'general'])
  const [selectedFaqCategory, setSelectedFaqCategory] = useState<string>('pricing')
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editingCategoryValue, setEditingCategoryValue] = useState('')

  // Canned message categories state
  const [cannedCategories, setCannedCategories] = useState<string[]>(['beauty tips', 'product recommendations', 'skincare advice', 'general responses'])
  const [selectedCannedCategory, setSelectedCannedCategory] = useState<string>('beauty tips')
  const [showAddCannedCategory, setShowAddCannedCategory] = useState(false)
  const [newCannedCategoryName, setNewCannedCategoryName] = useState('')
  const [editingCannedCategory, setEditingCannedCategory] = useState<string | null>(null)
  const [editingCannedCategoryValue, setEditingCannedCategoryValue] = useState('')
  const [cannedGenerationSource, setCannedGenerationSource] = useState<'knowledge' | 'research'>('knowledge')
  const [showGenerationOptions, setShowGenerationOptions] = useState(false)
  const [showCannedGuidelines, setShowCannedGuidelines] = useState(false)
  const [selectedKnowledgeEntries, setSelectedKnowledgeEntries] = useState<string[]>([])
  const [showKnowledgeSelector, setShowKnowledgeSelector] = useState(false)
  const [researchSources, setResearchSources] = useState<Array<{id: string, name: string, description: string, credibility: string}>>([])
  const [selectedResearchSources, setSelectedResearchSources] = useState<string[]>([])
  const [showResearchSources, setShowResearchSources] = useState(false)
  const [isResearching, setIsResearching] = useState(false)

  // Guidelines state
  interface Guideline {
    id: string
    category: 'faq' | 'canned' | 'roleplay' | 'general'
    title: string
    content: string
    createdAt: Date
    updatedAt: Date
  }
  const [guidelines, setGuidelines] = useState<Guideline[]>([])
  const [editingGuideline, setEditingGuideline] = useState<Guideline | null>(null)
  const [generatingGuidelines, setGeneratingGuidelines] = useState(false)
  const [expandedGuidelines, setExpandedGuidelines] = useState<Set<string>>(new Set())

  // Booking state
  interface AppointmentService {
    id: string
    name: string
    description: string
    business_unit_id: string
  }
  interface RealStaffMember {
    id: string
    name: string
    email: string | null
    staff_type: string | null
    business_unit_id: string
    is_active: boolean
  }
  const [services, setServices] = useState<AppointmentService[]>([])
  const [showAddService, setShowAddService] = useState(false)
  const [editingService, setEditingService] = useState<AppointmentService | null>(null)
  const [newService, setNewService] = useState({ name: '', description: '', price: '' })

  const [staff, setStaff] = useState<RealStaffMember[]>([])
  const [showAddStaff, setShowAddStaff] = useState(false)
  const [editingStaff, setEditingStaff] = useState<RealStaffMember | null>(null)
  const [newStaff, setNewStaff] = useState({ name: '', email: '', staff_type: '' })

  const [assignments, setAssignments] = useState<any[]>([])
  const [showAddAssignment, setShowAddAssignment] = useState(false)
  const [newAssignment, setNewAssignment] = useState({ service_id: '', staff_id: '' })
  const [selectedServiceForAssignment, setSelectedServiceForAssignment] = useState<string>('')
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([])

  const [outlets, setOutlets] = useState<any[]>([])
  const [showAddOutlet, setShowAddOutlet] = useState(false)
  const [editingOutlet, setEditingOutlet] = useState<any | null>(null)
  const [newOutlet, setNewOutlet] = useState({
    name: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state_province: '',
    postal_code: '',
    country: 'USA',
    phone: '',
    email: '',
    display_order: 0
  })

  const [rooms, setRooms] = useState<any[]>([])
  const [showAddRoom, setShowAddRoom] = useState(false)
  const [editingRoom, setEditingRoom] = useState<any | null>(null)
  const [newRoom, setNewRoom] = useState({ room_number: '', room_name: '', outlet_id: '' })

  const [showRoomServices, setShowRoomServices] = useState(false)
  const [selectedRoomForServices, setSelectedRoomForServices] = useState<any | null>(null)
  const [roomServiceIds, setRoomServiceIds] = useState<string[]>([])
  const [allRoomServices, setAllRoomServices] = useState<any[]>([])

  const [appointments, setAppointments] = useState<any[]>([])

  // Business Unit state
  interface BusinessUnit {
    id: string
    name: string
    industry: string
    createdAt: Date
  }
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([])
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState<string>('skincoach')
  const [showAddBusinessUnit, setShowAddBusinessUnit] = useState(false)
  const [newBusinessUnitName, setNewBusinessUnitName] = useState('')
  const [newBusinessUnitIndustry, setNewBusinessUnitIndustry] = useState('')

  // Profile Modal state
  const [showProfileModal, setShowProfileModal] = useState(false)

  // LLM Settings state
  const [llmSettings, setLLMSettings] = useState({
    provider: 'anthropic',
    model: 'claude-3-haiku-20240307',
    anthropicKey: '',
    openaiKey: '',
    ollamaUrl: 'http://localhost:11434',
    temperature: 0.7
  })

  const categories = [ 'Product Information', 'Service Information',
    'Policies & Procedures', 'Technical Support', 'Billing & Pricing',
    'Account Management', 'Troubleshooting', 'Best Practices',
    'Features & Benefits', 'FAQs', 'Training & Tutorials'
  ]

  useEffect(() => {
    loadBusinessUnitsData()
    loadData()
    loadModelInfo()
    loadTrainingMemoryAndSessions()
    loadLLMSettings()
  }, [])

  // Reload data when business unit changes
  useEffect(() => {
    if (selectedBusinessUnit) {
      loadData()
      loadTrainingMemoryAndSessions()
      // Fetch available locales for this business unit
      fetch(`/api/landing-pages/locales?businessUnit=${selectedBusinessUnit}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.locales?.length > 0) {
            setAvailableLocales(data.locales.map((l: any) => ({ country: l.country, language_code: l.language_code })))
          } else {
            // Default locale if none exist yet
            setAvailableLocales([{ country: 'US', language_code: 'en' }])
          }
        })
        .catch(() => setAvailableLocales([{ country: 'US', language_code: 'en' }]))
    }
  }, [selectedBusinessUnit])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (trainingSession && trainingSession.status !== 'completed' && trainingSession.status !== 'failed') {
      interval = setInterval(checkTrainingProgress, 2000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [trainingSession])

  // REMOVED: Auto-save useEffect hooks no longer needed
  // Supabase saves data immediately when CRUD operations are performed
  // No need to watch state changes and save to localStorage/files

  // Data sync functions - save to both localStorage and file system
  const syncDataToFile = async (dataType: string, data: any) => {
    try {
      const response = await fetch('/api/data-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessUnit: selectedBusinessUnit,
          dataType: dataType,
          data: data
        })
      })

      if (!response.ok) {
        console.error(`Failed to sync ${dataType} to file`)
      }
    } catch (error) {
      console.error(`Error syncing ${dataType} to file:`, error)
    }
  }

  const loadDataFromFile = async (dataType: string) => {
    try {
      const response = await fetch(`/api/data-sync?businessUnit=${selectedBusinessUnit}&dataType=${dataType}`)
      const result = await response.json()

      if (result.success && result.data) {
        return result.data
      }
      return null
    } catch (error) {
      console.error(`Error loading ${dataType} from file:`, error)
      return null
    }
  }

  // Enhanced save function that saves to Supabase database
  const saveDataWithSync = async (key: string, data: any) => {
    console.log('🔄 Saving to Supabase:', key, data?.length || 0, 'items')

    // Extract dataType from key (e.g., 'skincoach_ai_training_knowledge' -> 'knowledge')
    const dataType = key.replace(`${selectedBusinessUnit}_ai_training_`, '')

    // Save to Supabase based on data type
    try {
      if (dataType === 'faqs') {
        // Save all FAQs to Supabase
        for (const faq of data) {
          await saveFAQ(faq)
        }
        console.log('✅ Saved', data.length, 'FAQs to Supabase')
      } else if (dataType === 'canned_messages') {
        // Save all canned messages to Supabase
        for (const msg of data) {
          await saveCannedMessage(msg)
        }
        console.log('✅ Saved', data.length, 'canned messages to Supabase')
      } else if (dataType === 'knowledge') {
        // Save all knowledge entries to Supabase
        for (const entry of data) {
          await saveKnowledge(entry)
        }
        console.log('✅ Saved', data.length, 'knowledge entries to Supabase')
      } else {
        // For other data types (guidelines, training, categories), still use files
        await syncDataToFile(dataType, data)
      }
    } catch (error) {
      console.error('Error saving to Supabase:', error)
      // Fallback to file system if Supabase fails
      await syncDataToFile(dataType, data)
    }
  }

  const loadBusinessUnitsData = async () => {
    try {
      const units = await loadBusinessUnits()
      if (units && units.length > 0) {
        setBusinessUnits(units)
        // If skincoach doesn't exist, add it
        if (!units.find((u: BusinessUnit) => u.id === 'skincoach')) {
          const defaultUnit: BusinessUnit = {
            id: 'skincoach',
            name: 'SkinCoach',
            industry: 'Skincare & Beauty',
            createdAt: new Date()
          }
          await saveBusinessUnit(defaultUnit)
          setBusinessUnits([defaultUnit, ...units])
        }
        return
      }
    } catch (error) {
      console.error('Error loading business units:', error)
    }

    // Initialize with default skincoach business unit
    const defaultUnit: BusinessUnit = {
      id: 'skincoach',
      name: 'SkinCoach',
      industry: 'Skincare & Beauty',
      createdAt: new Date()
    }
    await saveBusinessUnit(defaultUnit)
    setBusinessUnits([defaultUnit])
  }

  const addBusinessUnit = async () => {
    if (!newBusinessUnitName.trim()) return

    // Generate slug: trim, lowercase, replace spaces with dashes, remove leading/trailing dashes
    const slug = newBusinessUnitName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes

    const newUnit: BusinessUnit = {
      id: slug,
      name: newBusinessUnitName.trim(),
      industry: newBusinessUnitIndustry.trim() || 'General',
      createdAt: new Date()
    }

    await saveBusinessUnit(newUnit)

    // Copy default guidelines from SkinCoach template to new business unit
    try {
      await copyDefaultGuidelines(newUnit.id)
      console.log(`✅ Default guidelines copied to ${newUnit.name}`)
    } catch (error) {
      console.error('Error copying default guidelines:', error)
      // Don't fail the whole operation if guideline copy fails
    }

    const updatedUnits = [...businessUnits, newUnit]
    setBusinessUnits(updatedUnits)
    setSelectedBusinessUnit(newUnit.id)
    setShowAddBusinessUnit(false)
    setNewBusinessUnitName('')
    setNewBusinessUnitIndustry('')
  }

  // Load LLM settings from API (reads .env.local) and localStorage
  const loadLLMSettings = async () => {
    try {
      // First, try to load from API (reads from .env.local)
      const response = await fetch('/api/llm-config')
      if (response.ok) {
        const data = await response.json()
        const apiConfig = data.config

        // Load from API config (which reads from .env.local)
        // API keys are NOT stored in localStorage or exposed in UI
        setLLMSettings({
          provider: apiConfig.provider || 'openai',
          model: apiConfig.model || 'gpt-4o',
          anthropicKey: '',  // API keys only in .env.local
          openaiKey: '',      // API keys only in .env.local
          ollamaUrl: apiConfig.ollamaUrl || 'http://localhost:11434',
          temperature: apiConfig.temperature ?? 0.7
        })

        console.log('✅ Loaded LLM settings from API:', apiConfig.provider, apiConfig.model)
      } else {
        // API failed, use defaults
        console.warn('Failed to load LLM settings from API, using defaults')
        setLLMSettings({
          provider: 'openai',
          model: 'gpt-4o',
          anthropicKey: '',  // API keys only in .env.local
          openaiKey: '',      // API keys only in .env.local
          ollamaUrl: 'http://localhost:11434',
          temperature: 0.7
        })
      }
    } catch (error) {
      console.error('Error loading LLM settings:', error)
      // Use defaults on error
      setLLMSettings({
        provider: 'openai',
        model: 'gpt-4o',
        anthropicKey: '',  // API keys only in .env.local
        openaiKey: '',      // API keys only in .env.local
        ollamaUrl: 'http://localhost:11434',
        temperature: 0.7
      })
    }
  }

  // Save LLM settings (provider, model, temperature, ollamaUrl only - no API keys)
  const handleSaveLLMSettings = async () => {
    try {
      // Only save non-sensitive settings (no API keys)
      const settingsToSave = {
        provider: llmSettings.provider,
        model: llmSettings.model,
        ollamaUrl: llmSettings.ollamaUrl,
        temperature: llmSettings.temperature
        // API keys are NOT saved - they stay in .env.local only
      }

      // Update server-side configuration via API
      const response = await fetch('/api/llm-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsToSave)
      })

      if (response.ok) {
        alert(t.settingsSaved)
      } else {
        const error = await response.json()
        alert(t.failedToSave(error.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error saving LLM settings:', error)
      alert(t.errorSavingSettings)
    }
  }

  const handleDeleteBusinessUnit = async (unitId: string) => {
    if (unitId === 'skincoach') {
      alert(t.cannotDeleteDefault)
      return
    }

    if (!confirm(t.confirmDeleteBusinessUnit)) {
      return
    }

    // Delete business unit from Supabase (cascade will delete all related data)
    await deleteBusinessUnit(unitId)

    const updatedUnits = businessUnits.filter(u => u.id !== unitId)
    setBusinessUnits(updatedUnits)

    // Switch to skincoach if deleting current unit
    if (selectedBusinessUnit === unitId) {
      setSelectedBusinessUnit('skincoach')
    }
  }

  const loadData = async () => {
    isLoadingDataRef.current = true // Set ref BEFORE any state changes
    setIsLoading(true)

    // Clear all state immediately to prevent stale data
    setKnowledgeEntries([])
    setTrainingData([])
    setFaqs([])
    setCannedMsgs([])
    setGuidelines([])

    try {
      // Load data from Supabase database
      console.log(`📊 Loading data from Supabase for business unit: ${selectedBusinessUnit}`)

      // Load knowledge base
      const knowledgeData = await loadKnowledge(selectedBusinessUnit)
      setKnowledgeEntries(knowledgeData || [])
      console.log(`✅ Loaded ${knowledgeData?.length || 0} knowledge entries`)

      // Load FAQs — filtered by selected locale
      const faqData = await loadFAQs(selectedBusinessUnit, selectedLangCode)
      setFaqs(faqData || [])
      console.log(`✅ Loaded ${faqData?.length || 0} FAQs for locale: ${selectedCountry}/${selectedLangCode}`)

      // Load canned messages — filtered by selected locale
      const cannedData = await loadCannedMessages(selectedBusinessUnit, selectedLangCode)
      setCannedMsgs(cannedData || [])
      console.log(`✅ Loaded ${cannedData?.length || 0} canned messages for locale: ${selectedCountry}/${selectedLangCode}`)

      // Load FAQ categories
      const faqCategoriesData = await loadFAQCategories(selectedBusinessUnit)
      if (faqCategoriesData && faqCategoriesData.length > 0) {
        setFaqCategories(faqCategoriesData)
      } else {
        // Initialize with default categories
        const defaultCategories = ['pricing', 'products', 'shipping', 'returns', 'product results', 'ingredients', 'general']
        setFaqCategories(defaultCategories)
      }
      console.log(`✅ Loaded ${faqCategoriesData?.length || 0} FAQ categories`)

      // Load canned message categories
      const cannedCategoriesData = await loadCannedCategories(selectedBusinessUnit)
      if (cannedCategoriesData && cannedCategoriesData.length > 0) {
        setCannedCategories(cannedCategoriesData)
      } else {
        // Initialize with default categories
        const defaultCannedCategories = ['beauty tips', 'product recommendations', 'skincare advice', 'general responses']
        setCannedCategories(defaultCannedCategories)
      }
      console.log(`✅ Loaded ${cannedCategoriesData?.length || 0} canned message categories`)

      // Load services
      const servicesData = await loadServices(selectedBusinessUnit)
      setServices(servicesData || [])
      console.log(`✅ Loaded ${servicesData?.length || 0} services`)

      // Load staff
      const staffData = await loadStaff(selectedBusinessUnit)
      setStaff(staffData || [])
      console.log(`✅ Loaded ${staffData?.length || 0} staff members`)

      // Load assignments
      const assignmentsData = await loadAssignments(selectedBusinessUnit)
      setAssignments(assignmentsData || [])
      console.log(`✅ Loaded ${assignmentsData?.length || 0} assignments`)

      // Load outlets
      const outletsData = await loadOutlets(selectedBusinessUnit)
      setOutlets(outletsData || [])
      console.log(`✅ Loaded ${outletsData?.length || 0} outlets`)

      // Load rooms
      const roomsData = await loadRooms(selectedBusinessUnit)
      setRooms(roomsData || [])
      console.log(`✅ Loaded ${roomsData?.length || 0} rooms`)

      // Load all room-service assignments
      const roomServicesData = await loadRoomServices()
      setAllRoomServices(roomServicesData || [])
      console.log(`✅ Loaded ${roomServicesData?.length || 0} room-service assignments`)

      // Load appointments
      const appointmentsResponse = await fetch(`/api/appointments?businessUnitId=${selectedBusinessUnit}`)
      if (appointmentsResponse.ok) {
        const appointmentsData = await appointmentsResponse.json()
        setAppointments(appointmentsData.appointments || [])
        console.log(`✅ Loaded ${appointmentsData.appointments?.length || 0} appointments`)
      }

      // Load training data from Supabase
      const trainingDataFile = await loadTrainingData(selectedBusinessUnit)
      setTrainingData(trainingDataFile || [])
      console.log(`✅ Loaded ${trainingDataFile?.length || 0} training data entries from Supabase`)

      // Load guidelines from Supabase — filtered by selected locale
      const guidelinesData = await loadGuidelines(selectedBusinessUnit, selectedLangCode)
      setGuidelines(guidelinesData || [])
      console.log(`✅ Loaded ${guidelinesData?.length || 0} guidelines for locale: ${selectedCountry}/${selectedLangCode}`)

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
      isLoadingDataRef.current = false // Clear ref AFTER all state is set
    }
  }

  // Legacy save function - no longer used (using saveDataWithSync instead)
  // Keeping for reference but can be removed
  /*
  const saveData = async () => {
    try {
      saveByKey('ai_training_knowledge', knowledgeEntries)
      saveByKey('ai_training_training', trainingData)
      saveByKey('ai_training_faqs', faqs)
      saveByKey('ai_training_canned_messages', cannedMsgs)

      // In production, this would sync to the database
      await fetch('/api/admin/ai-training/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          knowledge: knowledgeEntries,
          training: trainingData
        })
      }).catch(() => {}) // Fail silently for now
    } catch (error) {
      console.error('Error saving data:', error)
    }
  }
  */

  const addKnowledgeEntry = () => {
    const newEntry: KnowledgeEntry = {
      id: `kb-temp-${Date.now()}`, // Temporary ID, will be replaced when saved to Supabase
      category: categories[0],
      topic: '',
      content: '',
      keywords: [],
      confidence: 0.8,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    // Add to local state for immediate UI update
    setKnowledgeEntries([...knowledgeEntries, newEntry])
    setEditingEntry(newEntry)
    // Note: Will be saved to Supabase when user fills in and saves the entry
  }

  const uploadFileToServer = async (file: File, category: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', category)

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error('File upload failed')
    }

    return await response.json()
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsLoading(true)
    const newEntries: KnowledgeEntry[] = []

    for (const file of Array.from(files)) {
      try {
        const fileType = file.type
        const fileName = file.name
        let content = ''

        // First, upload file to server to save to filesystem
        let uploadResult
        try {
          uploadResult = await uploadFileToServer(file, categories[0])
        } catch (error) {
          console.error('Failed to upload file to server:', error)
          // Continue with client-side processing even if server upload fails
        }

        // Handle different file types
        if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
          // Plain text file
          content = await file.text()
          const entry: KnowledgeEntry = {
            id: Date.now().toString() + Math.random(),
            category: categories[0],
            topic: fileName.replace('.txt', ''),
            content: content,
            keywords: [],
            confidence: 0.8,
            createdAt: new Date(),
            updatedAt: new Date(),
            filePath: uploadResult?.file?.filePath,
            fileName: fileName
          }
          newEntries.push(entry)

        } else if (fileType === 'application/json' || fileName.endsWith('.json')) {
          // JSON file
          const jsonContent = await file.text()
          const jsonData = JSON.parse(jsonContent)

          // If it's an array of knowledge entries
          if (Array.isArray(jsonData)) {
            jsonData.forEach((item: any) => {
              const entry: KnowledgeEntry = {
                id: Date.now().toString() + Math.random(),
                category: item.category || categories[0],
                topic: item.topic || item.title || 'Untitled',
                content: item.content || item.text || JSON.stringify(item),
                keywords: item.keywords || [],
                confidence: item.confidence || 0.8,
                createdAt: new Date(),
                updatedAt: new Date()
              }
              newEntries.push(entry)
            })
          } else {
            // Single JSON object
            const entry: KnowledgeEntry = {
              id: Date.now().toString() + Math.random(),
              category: jsonData.category || categories[0],
              topic: jsonData.topic || jsonData.title || fileName.replace('.json', ''),
              content: jsonData.content || jsonData.text || JSON.stringify(jsonData),
              keywords: jsonData.keywords || [],
              confidence: jsonData.confidence || 0.8,
              createdAt: new Date(),
              updatedAt: new Date()
            }
            newEntries.push(entry)
          }

        } else if (fileType === 'text/csv' || fileName.endsWith('.csv')) {
          // CSV file
          const csvContent = await file.text()
          const lines = csvContent.split('\n')
          const headers = lines[0].split(',').map(h => h.trim())

          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue
            const values = lines[i].split(',').map(v => v.trim())
            const entry: KnowledgeEntry = {
              id: Date.now().toString() + Math.random(),
              category: values[headers.indexOf('category')] || categories[0],
              topic: values[headers.indexOf('topic')] || values[headers.indexOf('title')] || `Entry ${i}`,
              content: values[headers.indexOf('content')] || values[headers.indexOf('text')] || values.join(' '),
              keywords: values[headers.indexOf('keywords')]?.split(';') || [],
              confidence: parseFloat(values[headers.indexOf('confidence')]) || 0.8,
              createdAt: new Date(),
              updatedAt: new Date()
            }
            newEntries.push(entry)
          }

        } else if (fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                   fileType === 'application/vnd.ms-excel' ||
                   fileName.endsWith('.xlsx') ||
                   fileName.endsWith('.xls')) {
          // Excel file - extract all data
          const XLSX = await import('xlsx')
          const arrayBuffer = await file.arrayBuffer()
          const workbook = XLSX.read(arrayBuffer, { type: 'array' })

          // Extract data from all sheets
          let extractedData = ''
          workbook.SheetNames.forEach((sheetName) => {
            const sheet = workbook.Sheets[sheetName]
            const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 })
            extractedData += `Sheet: ${sheetName}\n`
            jsonData.forEach((row: any) => {
              extractedData += row.join(' | ') + '\n'
            })
            extractedData += '\n'
          })

          const entry: KnowledgeEntry = {
            id: Date.now().toString() + Math.random(),
            category: categories[0],
            topic: fileName.replace('.xlsx', '').replace('.xls', ''),
            content: extractedData.trim() || fileName,
            keywords: [fileName, 'excel', 'spreadsheet'],
            confidence: 0.8,
            createdAt: new Date(),
            updatedAt: new Date(),
            filePath: uploadResult?.file?.filePath,
            fileName: fileName
          }
          newEntries.push(entry)

        } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
          // DOCX file with mammoth.js
          const mammoth = await import('mammoth')
          const arrayBuffer = await file.arrayBuffer()
          const result = await mammoth.extractRawText({ arrayBuffer })
          const extractedText = result.value

          const entry: KnowledgeEntry = {
            id: Date.now().toString() + Math.random(),
            category: categories[0],
            topic: fileName.replace('.docx', '').replace('.doc', ''),
            content: extractedText.trim() || fileName,
            keywords: [fileName, 'document', 'docx'],
            confidence: 0.8,
            createdAt: new Date(),
            updatedAt: new Date(),
            filePath: uploadResult?.file?.filePath,
            fileName: fileName
          }
          newEntries.push(entry)

        } else if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
          // PDF file with pdf.js
          const pdfjsLib = await import('pdfjs-dist')
          // Set up PDF.js worker
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

          const entry: KnowledgeEntry = {
            id: Date.now().toString() + Math.random(),
            category: categories[0],
            topic: fileName.replace('.pdf', ''),
            content: fullText.trim() || fileName,
            keywords: [],
            confidence: 0.8,
            createdAt: new Date(),
            updatedAt: new Date(),
            filePath: uploadResult?.file?.filePath,
            fileName: fileName
          }
          newEntries.push(entry)

        } else {
          // Unknown file type
          alert(t.unsupportedFileType(fileType || fileName))
        }

      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error)
        alert(t.errorProcessingFile(file.name))
      }
    }

    if (newEntries.length > 0) {
      const updated = [...knowledgeEntries, ...newEntries]
      setKnowledgeEntries(updated)
      // Save to Supabase
      for (const entry of updated) {
        try {
          await saveKnowledge(entry)
        } catch (error) {
          console.error('Error saving knowledge entry:', error)
        }
      }
      alert(t.importSuccess(newEntries.length))
    }

    setIsLoading(false)
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUrlFetch = async () => {
    if (!urlInput.trim()) {
      alert(t.pleaseEnterUrl)
      return
    }

    setFetchingUrl(true)
    try {
      const response = await fetch('/api/fetch-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: urlInput.trim(),
          category: categories[0]
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        alert(t.error(result.error || t.failedToFetchUrl))
        return
      }

      // Create a new knowledge entry from the fetched data
      const newEntry: KnowledgeEntry = {
        id: Date.now().toString() + Math.random(),
        category: result.data.category || categories[0],
        topic: result.data.title,
        content: result.data.content,
        keywords: result.data.keywords || [result.data.url],
        confidence: 0.8,
        createdAt: new Date(),
        updatedAt: new Date(),
        fileName: result.data.isYouTube ? t.youtubeVideo : t.webContent,
        filePath: result.data.url
      }

      await saveKnowledge(newEntry)  // Save to Supabase
      const updated = [...knowledgeEntries, newEntry]
      setKnowledgeEntries(updated)
      setUrlInput('')
      setShowUrlInput(false)
      alert(`Successfully imported content from: ${result.data.title}`)
    } catch (error) {
      console.error('Error fetching URL:', error)
      alert(t.failedToFetchUrl)
    } finally {
      setFetchingUrl(false)
    }
  }

  const handleGenerateFaqs = async () => {
    if (knowledgeEntries.length === 0) {
      alert(t.pleaseAddKnowledgeFirst)
      return
    }

    setGeneratingFaqs(true)
    try {
      // Get FAQ-specific guidelines from the training guidelines
      const faqGuidelines = guidelines.filter(g => g.category === 'faq')

      // Use ALL knowledge base entries
      const response = await fetch('/api/generate-faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          knowledgeEntries: knowledgeEntries,
          targetCount: 10,
          category: selectedFaqCategory,
          guidelines: faqGuidelines
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        alert(t.error(result.error || t.failedToGenerateFaqs))
        return
      }

      // Add generated FAQs directly to the FAQ list
      // Save each FAQ to Supabase
      for (const faq of result.faqs) {
        await saveFAQ(faq)
      }
      setFaqs(prev => [...prev, ...result.faqs])

      alert(`Successfully generated ${result.faqs.length} FAQs for ${selectedFaqCategory}!`)
    } catch (error) {
      console.error('Error generating FAQs:', error)
      alert(t.failedToGenerateFaqs)
    } finally {
      setGeneratingFaqs(false)
    }
  }

  const regenerateFaqAnswer = async () => {
    if (!editingEntry || !('question' in editingEntry)) return

    const faq = editingEntry as FAQ

    setRegeneratingAnswer(true)
    try {
      // Get FAQ-specific guidelines
      const faqGuidelines = guidelines.filter(g => g.category === 'faq')

      // Call API to regenerate answer
      const response = await fetch('/api/generate-faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          knowledgeEntries: knowledgeEntries,
          targetCount: 1,
          category: faq.category,
          guidelines: faqGuidelines,
          existingQuestion: faq.question, // Pass the existing question
          comments: faq.comments || '' // Pass improvement comments
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        alert(t.error(result.error || 'Failed to regenerate answer'))
        return
      }

      // Update the answer with the newly generated one
      if (result.faqs && result.faqs.length > 0) {
        const newAnswer = result.faqs[0].answer
        setEditingEntry({ ...faq, answer: newAnswer })
        alert('Answer regenerated successfully!')
      }
    } catch (error) {
      console.error('Error regenerating answer:', error)
      alert('Failed to regenerate answer. Please try again.')
    } finally {
      setRegeneratingAnswer(false)
    }
  }

  const handleDeepResearch = async () => {
    setIsResearching(true)
    try {
      const response = await fetch('/api/research-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedCannedCategory
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        alert(t.error(result.error || 'Failed to research sources'))
        return
      }

      // Set the research sources
      setResearchSources(result.sources)
      setShowResearchSources(true)

    } catch (error) {
      console.error('Error researching sources:', error)
      alert('Failed to research sources. Please try again.')
    } finally {
      setIsResearching(false)
    }
  }

  const handleGenerateCannedMessages = async () => {
    // Validate based on source
    if (cannedGenerationSource === 'knowledge') {
      if (knowledgeEntries.length === 0) {
        alert('Please add some knowledge base entries first, or switch to "Deep AI Research" mode')
        return
      }
      if (selectedKnowledgeEntries.length === 0) {
        alert('Please select at least one knowledge base file to generate from')
        return
      }
    } else if (cannedGenerationSource === 'research') {
      if (selectedResearchSources.length === 0) {
        alert('Please select at least one research source to generate from')
        return
      }
    }

    setGeneratingFaqs(true)
    try {
      // Get canned message guidelines from the training guidelines
      const cannedGuidelines = guidelines.filter(g => g.category === 'canned')

      // Get only the selected knowledge entries
      const entriesToUse = cannedGenerationSource === 'knowledge'
        ? knowledgeEntries.filter(entry => selectedKnowledgeEntries.includes(entry.id))
        : []

      // Get selected research sources
      const selectedSources = cannedGenerationSource === 'research'
        ? researchSources.filter(source => selectedResearchSources.includes(source.id))
        : []

      const response = await fetch('/api/generate-canned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          knowledgeEntries: entriesToUse,
          targetCount: 10,
          guidelines: cannedGuidelines,
          category: selectedCannedCategory,
          generationMode: cannedGenerationSource,
          researchSources: selectedSources,
          copywritingStyle: 'high-converting' // Request high-converting copy
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        alert(t.error(result.error || 'Failed to generate canned messages'))
        return
      }

      // Add generated canned messages to the list
      // Save each canned message to Supabase
      for (const msg of result.messages) {
        await saveCannedMessage(msg)
      }
      setCannedMsgs(prev => [...prev, ...result.messages])

      const sourceText = cannedGenerationSource === 'knowledge'
        ? `from ${selectedKnowledgeEntries.length} selected file(s)`
        : `using ${selectedResearchSources.length} expert source(s)`
      alert(`Successfully generated ${result.messages.length} high-converting canned messages for ${selectedCannedCategory} ${sourceText}!`)

      // Close selectors after successful generation
      setShowKnowledgeSelector(false)
      setShowResearchSources(false)
    } catch (error) {
      console.error('Error generating canned messages:', error)
      alert('Failed to generate canned messages. Please try again.')
    } finally {
      setGeneratingFaqs(false)
    }
  }

  const addFaqCategory = async () => {
    if (newCategoryName.trim() && !faqCategories.includes(newCategoryName.toLowerCase())) {
      await saveCategory(newCategoryName.toLowerCase(), 'faq')  // Save to Supabase
      const updatedCategories = [...faqCategories, newCategoryName.toLowerCase()]
      setFaqCategories(updatedCategories)
      setSelectedFaqCategory(newCategoryName.toLowerCase())
      setNewCategoryName('')
      setShowAddCategory(false)
    }
  }

  const handleCategoryDoubleClick = (category: string) => {
    setEditingCategory(category)
    setEditingCategoryValue(category)
  }

  const handleCategoryEdit = async () => {
    const trimmedValue = editingCategoryValue.trim().toLowerCase()

    if (trimmedValue === '') {
      // Delete category if left blank
      await deleteCategory(editingCategory, 'faq')  // Delete from Supabase
      const updatedCategories = faqCategories.filter(cat => cat !== editingCategory)
      setFaqCategories(updatedCategories)

      // Update FAQs that had this category to 'general'
      const updatedFaqs = faqs.map(faq =>
        faq.category === editingCategory ? { ...faq, category: 'general' } : faq
      )
      // Save each updated FAQ to Supabase
      for (const faq of updatedFaqs.filter(f => f.category === 'general' && faqs.find(orig => orig.id === f.id)?.category === editingCategory)) {
        await saveFAQ(faq)
      }
      setFaqs(updatedFaqs)

      // Switch to general category if the deleted one was selected
      if (selectedFaqCategory === editingCategory) {
        setSelectedFaqCategory('general')
      }
    } else if (trimmedValue !== editingCategory && !faqCategories.includes(trimmedValue)) {
      // Rename category if changed
      await deleteCategory(editingCategory, 'faq')  // Delete old
      await saveCategory(trimmedValue, 'faq')  // Save new
      const updatedCategories = faqCategories.map(cat =>
        cat === editingCategory ? trimmedValue : cat
      )
      setFaqCategories(updatedCategories)

      // Update all FAQs with the old category to use the new category name
      const updatedFaqs = faqs.map(faq =>
        faq.category === editingCategory ? { ...faq, category: trimmedValue } : faq
      )
      // Save each updated FAQ to Supabase
      for (const faq of updatedFaqs.filter(f => f.category === trimmedValue && faqs.find(orig => orig.id === f.id)?.category === editingCategory)) {
        await saveFAQ(faq)
      }
      setFaqs(updatedFaqs)

      // Update selected category if it was the one being edited
      if (selectedFaqCategory === editingCategory) {
        setSelectedFaqCategory(trimmedValue)
      }
    }

    setEditingCategory(null)
    setEditingCategoryValue('')
  }

  const cancelCategoryEdit = () => {
    setEditingCategory(null)
    setEditingCategoryValue('')
  }

  // Canned message category functions
  const addCannedCategory = async () => {
    if (newCannedCategoryName.trim() && !cannedCategories.includes(newCannedCategoryName.toLowerCase())) {
      await saveCategory(newCannedCategoryName.toLowerCase(), 'canned')  // Save to Supabase
      const updatedCategories = [...cannedCategories, newCannedCategoryName.toLowerCase()]
      setCannedCategories(updatedCategories)
      setSelectedCannedCategory(newCannedCategoryName.toLowerCase())
      setNewCannedCategoryName('')
      setShowAddCannedCategory(false)
    }
  }

  const handleCannedCategoryDoubleClick = (category: string) => {
    setEditingCannedCategory(category)
    setEditingCannedCategoryValue(category)
  }

  const handleCannedCategoryEdit = async () => {
    const trimmedValue = editingCannedCategoryValue.trim().toLowerCase()

    if (trimmedValue === '') {
      // Delete category if left blank
      await deleteCategory(editingCannedCategory, 'canned')  // Delete from Supabase
      const updatedCategories = cannedCategories.filter(cat => cat !== editingCannedCategory)
      setCannedCategories(updatedCategories)

      // Update canned messages that had this category to 'general responses'
      const updatedMsgs = cannedMsgs.map(msg =>
        msg.category === editingCannedCategory ? { ...msg, category: 'general responses' } : msg
      )
      // Save each updated message to Supabase
      for (const msg of updatedMsgs.filter(m => m.category === 'general responses' && cannedMsgs.find(orig => orig.id === m.id)?.category === editingCannedCategory)) {
        await saveCannedMessage(msg)
      }
      setCannedMsgs(updatedMsgs)

      // Switch to general responses category if the deleted one was selected
      if (selectedCannedCategory === editingCannedCategory) {
        setSelectedCannedCategory('general responses')
      }
    } else if (trimmedValue !== editingCannedCategory && !cannedCategories.includes(trimmedValue)) {
      // Rename category if changed
      await deleteCategory(editingCannedCategory, 'canned')  // Delete old
      await saveCategory(trimmedValue, 'canned')  // Save new
      const updatedCategories = cannedCategories.map(cat =>
        cat === editingCannedCategory ? trimmedValue : cat
      )
      setCannedCategories(updatedCategories)

      // Update all canned messages with the old category to use the new category name
      const updatedMsgs = cannedMsgs.map(msg =>
        msg.category === editingCannedCategory ? { ...msg, category: trimmedValue } : msg
      )
      // Save each updated message to Supabase
      for (const msg of updatedMsgs.filter(m => m.category === trimmedValue && cannedMsgs.find(orig => orig.id === m.id)?.category === editingCannedCategory)) {
        await saveCannedMessage(msg)
      }
      setCannedMsgs(updatedMsgs)

      // Update selected category if it was the one being edited
      if (selectedCannedCategory === editingCannedCategory) {
        setSelectedCannedCategory(trimmedValue)
      }
    }

    setEditingCannedCategory(null)
    setEditingCannedCategoryValue('')
  }

  const cancelCannedCategoryEdit = () => {
    setEditingCannedCategory(null)
    setEditingCannedCategoryValue('')
  }

  // Guidelines functions
  const generateGuidelines = async () => {
    setGeneratingGuidelines(true)
    try {
      const response = await fetch('/api/ai/coach-training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Generate comprehensive training guidelines for an AI customer service chatbot. Create 4 separate guidelines for:

1. FAQ Library - Guidelines for managing and responding to FAQs
2. Canned Messages - Guidelines for using pre-written responses effectively
3. Role-Play Training - Guidelines for AI behavior during customer interactions
4. General Guidelines - Overall best practices for customer service

For each guideline, provide:
- A clear title
- Detailed content (3-5 key points with explanations)

Format as JSON array:
[
  {
    "category": "faq|canned|roleplay|general",
    "title": "Guideline Title",
    "content": "Detailed guideline content with multiple points..."
  }
]`
          }]
        })
      })

      const data = await response.json()

      if (data.response) {
        // Try to parse JSON from response
        const jsonMatch = data.response.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          const guidelinesData = JSON.parse(jsonMatch[0])
          const newGuidelines: Guideline[] = guidelinesData.map((g: any) => ({
            id: `guideline-${Date.now()}-${Math.random()}`,
            category: g.category,
            title: g.title,
            content: g.content,
            createdAt: new Date(),
            updatedAt: new Date()
          }))

          setGuidelines([...guidelines, ...newGuidelines])
          // Save to Supabase (handled by state management)
          alert(`Generated ${newGuidelines.length} guidelines successfully!`)
        }
      }
    } catch (error) {
      console.error('Error generating guidelines:', error)
      alert('Failed to generate guidelines. Please try again.')
    } finally {
      setGeneratingGuidelines(false)
    }
  }

  const addGuideline = (category: 'faq' | 'canned' | 'roleplay' | 'general') => {
    const newGuideline: Guideline = {
      id: `guideline-${Date.now()}`,
      category,
      title: 'New Guideline',
      content: 'Enter guideline content here...',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    const updated = [...guidelines, newGuideline]
    setGuidelines(updated)
    // Saved to Supabase automatically
    setEditingEntry(newGuideline as any)
  }

  const saveGuideline = async (guideline: Guideline) => {
    const updated = guidelines.map(g =>
      g.id === guideline.id ? { ...guideline, updatedAt: new Date() } : g
    )
    setGuidelines(updated)
    // Save to Supabase with business unit ID
    await saveGuidelines(updated, selectedBusinessUnit)
    setEditingGuideline(null)
  }

  const deleteGuideline = async (id: string) => {
    if (confirm(t.deleteGuideline)) {
      const updated = guidelines.filter(g => g.id !== id)
      setGuidelines(updated)
      // Delete from Supabase
      await deleteGuideline(id)
    }
  }

  const addTrainingData = async () => {
    const newTraining: TrainingData = {
      id: Date.now().toString(),
      question: '',
      answer: '',
      category: categories[0],
      keywords: [],
      variations: [],
      tone: 'friendly',
      priority: 5,
      active: true,
      createdAt: new Date()
    }
    const updated = [...trainingData, newTraining]
    setTrainingData(updated)
    await saveTrainingData(updated)  // Save to Supabase
    setEditingEntry(newTraining)
  }

  const deleteEntry = async (id: string, type: 'knowledge' | 'training') => {
    if (type === 'knowledge') {
      await deleteKnowledge(id)  // Delete from Supabase
      const updated = knowledgeEntries.filter(e => e.id !== id)
      setKnowledgeEntries(updated)  // Update UI
    } else {
      const updated = trainingData.filter(e => e.id !== id)
      await saveTrainingData(updated)  // Save to Supabase
      setTrainingData(updated)  // Update UI
    }
  }

  const loadModelInfo = async () => {
    try {
      const response = await fetch('/api/admin/ai-training/train?action=model_info')
      if (!response.ok) {
        // API not available in demo mode - use mock data
        setModelInfo({
          name: 'GPT-4o-mini',
          status: 'ready',
          version: '1.0.0',
          lastTrained: new Date().toISOString()
        })
        return
      }
      const data = await response.json()
      if (data.success) {
        setModelInfo(data.model)
      }
    } catch (error) {
      console.error('Error loading model info:', error)
      // Set mock data on error
      setModelInfo({
        name: 'GPT-4o-mini',
        status: 'ready',
        version: '1.0.0',
        lastTrained: new Date().toISOString()
      })
    }
  }

  const checkTrainingProgress = async () => {
    if (!trainingSession?.id) return

    try {
      const response = await fetch(`/api/admin/ai-training/train?action=status&sessionId=${trainingSession.id}`)
      if (!response.ok) {
        // API not available - silently ignore
        return
      }
      const data = await response.json()

      if (data.success) {
        setTrainingSession(data.session)
        setTrainingProgress(data.session.progress)

        if (data.session.status === 'completed') {
          loadModelInfo() // Refresh model info after training
        }
      }
    } catch (error) {
      // Silently ignore - API may not exist
    }
  }

  const validateTrainingData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/ai-training/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'validate_data',
          data: trainingData
        })
      })

      if (!response.ok) {
        alert('Validation API not available')
        return
      }

      const result = await response.json()
      setValidationResults(result.validation)

      if (result.success) {
        alert(`Validation complete:\n✅ Valid: ${result.validation.valid}\n❌ Invalid: ${result.validation.invalid}\n\nRecommend training: ${result.recommendTraining ? t.yes : t.no}`)
      }
    } catch (error) {
      console.error('Validation error:', error)
      alert('Error validating training data')
    } finally {
      setIsLoading(false)
    }
  }

  const startTraining = async () => {
    if (trainingData.length < 10) {
      alert('Need at least 10 training examples to start training')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/ai-training/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start_training',
          data: trainingData
        })
      })

      if (!response.ok) {
        alert('Training API not available')
        return
      }

      const result = await response.json()
      if (result.success) {
        setTrainingSession({ id: result.sessionId, status: result.status, progress: 0 })
        alert('Training started! Monitor progress in the training tab.')
      }
    } catch (error) {
      console.error('Training start error:', error)
      alert('Error starting training')
    } finally {
      setIsLoading(false)
    }
  }

  const deployModel = async () => {
    if (!modelInfo) {
      alert('No trained model available for deployment')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/ai-training/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deploy_model',
          data: { version: modelInfo.version }
        })
      })

      const result = await response.json()
      if (result.success) {
        alert(`Model ${result.version} deployed successfully!`)
        loadModelInfo()
      }
    } catch (error) {
      console.error('Deployment error:', error)
      alert('Error deploying model')
    } finally {
      setIsLoading(false)
    }
  }

  const loadTrainingMemoryAndSessions = async () => {
    // Clear state first
    setTrainingMemory({})
    setCompletedTrainingSessions([])

    try {
      // Load AI staff (which includes training memory)
      const staff = await loadAIStaff(selectedBusinessUnit)
      if (staff.length > 0) {
        // Merge all staff training memories into one object
        const mergedMemory = staff.reduce((acc: any, s: any) => {
          return { ...acc, ...s.trainingMemory }
        }, {})
        setTrainingMemory(mergedMemory)
      }

      // Load completed training sessions from Supabase
      const sessions = await loadTrainingSessions(selectedBusinessUnit)
      setCompletedTrainingSessions(sessions)

      if (sessions.length > 0) {
        console.log(`✅ Loaded ${sessions.length} training sessions`)
      }
    } catch (error) {
      console.error('❌ Error loading training memory and sessions:', error)
    }
  }

  const clearTrainingMemory = async () => {
    if (confirm(`${t.areYouSure} ${t.actionCannotBeUndone}`)) {
      try {
        // Clear training memory for all AI staff in Supabase
        const staff = await loadAIStaff(selectedBusinessUnit)
        for (const s of staff) {
          await saveAIStaff({ ...s, trainingMemory: {} }, selectedBusinessUnit)
        }
        setTrainingMemory({})
        console.log('✅ Cleared all training memory in Supabase')
      } catch (error) {
        console.error('Error clearing training memory:', error)
      }
    }
  }

  const testAI = async () => {
    if (!testQuery.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: testQuery,
          context: 'admin_test',
          conversationHistory: [],
          knowledgeBase: knowledgeEntries,
          trainingData: trainingData
        })
      })

      const data = await response.json()
      setTestResponse(data.response || 'No response generated')
    } catch (error) {
      setTestResponse('Error testing AI: ' + error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredKnowledge = knowledgeEntries.filter(entry =>
    entry.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const filteredTraining = trainingData.filter(entry =>
    entry.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 tracking-tight" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      <div className="max-w-7xl mx-auto p-2 sm:p-3">
        {/* Header */}
        <div className="mb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h1 className="text-xs font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 bg-clip-text text-transparent mb-0.5">
              {t.adminTitle}
            </h1>
            <p className="text-gray-500 text-xs">{t.adminSubtitle}</p>
          </div>

          {/* Biz Unit, Country, Profile, Language, Live Chat */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto flex-wrap justify-end">
            {/* Business Unit Dropdown */}
            <div className="flex items-center gap-0.5">
              <select
                value={selectedBusinessUnit}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === '__add__') {
                    setShowAddBusinessUnit(true)
                    return
                  }
                  setSelectedBusinessUnit(value)
                }}
                className="bg-gray-100 border border-gray-200 rounded-none px-2 py-1.5 text-xs text-gray-700 cursor-pointer"
              >
                {businessUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name} ({unit.industry})
                  </option>
                ))}
                <option value="__add__">＋ Add</option>
              </select>
              {selectedBusinessUnit !== 'skincoach' && (
                <button
                  onClick={() => handleDeleteBusinessUnit(selectedBusinessUnit)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete business unit"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Country Dropdown */}
            <select
              value={selectedCountry}
              onChange={(e) => {
                const value = e.target.value
                if (value === '__add__') {
                  setShowAddLocaleModal(true)
                  return
                }
                setSelectedCountry(value)
                const firstLocale = availableLocales.find(l => l.country === value)
                if (firstLocale) {
                  setSelectedLangCode(firstLocale.language_code)
                  setSelectedLanguage(langCodeToLanguage(firstLocale.language_code))
                }
              }}
              className="bg-gray-100 border border-gray-200 rounded-none px-2 py-1.5 text-xs text-gray-700 cursor-pointer"
            >
              {[...new Set(availableLocales.map(l => l.country))].map((country) => {
                const flags: Record<string, string> = { US: '🇺🇸', HK: '🇭🇰', CN: '🇨🇳', TW: '🇹🇼', JP: '🇯🇵', KR: '🇰🇷', GB: '🇬🇧', FR: '🇫🇷', DE: '🇩🇪', ES: '🇪🇸' }
                return (
                  <option key={country} value={country}>
                    {flags[country] || '🌍'} {country}
                  </option>
                )
              })}
              <option value="__add__">＋ Add</option>
            </select>

            {/* Profile Button */}
            <button
              onClick={() => setShowProfileModal(true)}
              className="bg-white border border-gray-200 hover:border-purple-500 text-gray-900 px-2 py-1.5 rounded-none font-medium flex items-center gap-1 transition-all duration-200 hover:shadow-sm text-xs"
              title={t.profile || 'Profile'}
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.profile || 'Profile'}</span>
            </button>

            {/* Admin UI Language */}
            <div className="relative">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value as Language)}
                className="appearance-none bg-white border border-gray-200 rounded-none px-2 py-1.5 pr-6 text-xs text-gray-900 hover:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-300 cursor-pointer transition-colors"
                title="Admin UI Language"
              >
                {Object.entries(languageNames).map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
              <Globe className="absolute right-1.5 sm:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>

            {/* View Live Chat Button */}
            <a
              href={`/livechat?businessUnit=${selectedBusinessUnit}&country=${selectedCountry}&lang=${selectedLangCode}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 hover:from-purple-600 hover:via-pink-600 hover:to-cyan-600 text-gray-900 px-2 py-1.5 rounded-none font-medium flex items-center gap-1 transition-all duration-200 hover:shadow-sm hover:scale-105 text-xs justify-center"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.viewLiveChat}</span>
              <span className="sm:hidden">Chat</span>
            </a>
          </div>
        </div>

        {/* Add Business Unit Form */}
        {showAddBusinessUnit && (
          <div className="mb-3 bg-white rounded-none p-2 border border-gray-100">
              <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 mb-2">{t.businessName}</label>
                  <input
                    type="text"
                    value={newBusinessUnitName}
                    onChange={(e) => setNewBusinessUnitName(e.target.value)}
                    placeholder={t.businessNamePlaceholder}
                    className="w-full bg-gray-100 border border-gray-200 rounded-none px-3 py-2 text-gray-900 placeholder-gray-400 text-xs"
                    autoFocus
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 mb-2">{t.industry}</label>
                  <input
                    type="text"
                    value={newBusinessUnitIndustry}
                    onChange={(e) => setNewBusinessUnitIndustry(e.target.value)}
                    placeholder={t.industryPlaceholder}
                    className="w-full bg-gray-100 border border-gray-200 rounded-none px-3 py-2 text-gray-900 placeholder-gray-400 text-xs"
                  />
                </div>
                <div className="flex gap-2 sm:gap-3">
                  <button
                    onClick={addBusinessUnit}
                    disabled={!newBusinessUnitName.trim()}
                    className="flex-1 sm:flex-none bg-green-50 border border-green-200 hover:bg-green-100 disabled:bg-gray-200 px-4 py-2 rounded-none transition-colors text-gray-800 text-xs"
                  >
                    {t.add}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddBusinessUnit(false)
                      setNewBusinessUnitName('')
                      setNewBusinessUnitIndustry('')
                    }}
                    className="flex-1 sm:flex-none bg-gray-200 hover:bg-gray-500 px-4 py-2 rounded-none transition-colors text-gray-800 text-xs"
                  >
                    {t.cancel}
                  </button>
                </div>
              </div>
            </div>
          )}

        {/* Navigation Tabs */}
        <div className="mb-3">
          <div className="flex flex-wrap gap-0.5 bg-white rounded-none p-0.5">
            {[
              { id: 'knowledge', label: t.knowledge, icon: Book },
              { id: 'booking', label: t.booking, icon: Calendar },
              { id: 'training', label: t.training, icon: Brain },
              { id: 'faq', label: t.faq, icon: HelpCircle },
              { id: 'canned', label: t.cannedMessages, icon: Mail },
              { id: 'roleplay', label: t.roleplay, icon: Users },
              { id: 'aimodel', label: t.aiModel, icon: Settings }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center gap-1 px-2 py-1 rounded-none transition-all whitespace-nowrap text-xs ${
                  activeTab === id
                    ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-gray-900'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Sections */}
        <div className="bg-white rounded-none p-3">

          {/* Knowledge Base Tab */}
          {activeTab === 'knowledge' && (
            <KnowledgeBase
              businessUnitId={selectedBusinessUnit}
              language={selectedLanguage}
              country={selectedCountry}
            />
          )}

          {/* Training Data Tab */}
          {activeTab === 'training' && (
            <div>
              <h2 className="text-xs font-bold mb-3 flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-600" />
                {t.trainingDataTitle}
              </h2>

              {/* Training Guidelines Section */}
              <div className="mb-3">
                <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-2">
                      <Book className="w-3.5 h-3.5 text-blue-600" />
                      {t.trainingGuidelines}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {t.guidelinesDescription}
                      <span className="text-cyan-600 ml-2">FAQ</span> = FAQ generation,
                      <span className="text-purple-600 ml-2">CANNED</span> = Canned message generation,
                      <span className="text-pink-600 ml-2">ROLEPLAY</span> = Roleplay training,
                      <span className="text-blue-600 ml-2">GENERAL</span> = Chatbot + all features
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const newGuideline: Guideline = {
                        id: `guideline-${Date.now()}`,
                        category: 'general',
                        title: t.newGuideline,
                        content: '',
                        createdAt: new Date(),
                        updatedAt: new Date()
                      }
                      setEditingEntry(newGuideline)
                    }}
                    className="flex items-center gap-1 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-2 py-1 rounded-none text-xs transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    {t.addGuideline}
                  </button>
                </div>

                {guidelines.length === 0 ? (
                  <div className="bg-gray-100 rounded-none p-3 text-center">
                    <p className="text-gray-500">{t.noGuidelinesYet}</p>
                    <p className="text-gray-400 text-xs mt-2">{t.addGuidelinesHelp}</p>
                  </div>
                ) : (
                  <div className="max-h-[600px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                    {guidelines.map((guideline) => {
                      const isExpanded = expandedGuidelines.has(guideline.id)
                      const contentPreview = guideline.content.split('\n')[0].substring(0, 100)
                      const hasMoreContent = guideline.content.length > 100 || guideline.content.includes('\n')

                      return (
                        <div key={guideline.id} className="bg-gray-100 rounded-none p-2.5 border border-gray-200">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex gap-2 items-center flex-1">
                              <span className={`px-2 py-1 rounded-none text-xs ${
                                guideline.category === 'faq' ? 'bg-cyan-50 text-cyan-600' :
                                guideline.category === 'canned' ? 'bg-purple-50 text-purple-600' :
                                guideline.category === 'roleplay' ? 'bg-pink-50 text-pink-600' :
                                'bg-blue-50 text-blue-600'
                              }`}>
                                {guideline.category.toUpperCase()}
                              </span>
                              <h4 className="font-medium text-xs text-gray-900">{guideline.title}</h4>
                            </div>
                            <div className="flex gap-2">
                              {hasMoreContent && (
                                <button
                                  onClick={() => {
                                    const newExpanded = new Set(expandedGuidelines)
                                    if (isExpanded) {
                                      newExpanded.delete(guideline.id)
                                    } else {
                                      newExpanded.add(guideline.id)
                                    }
                                    setExpandedGuidelines(newExpanded)
                                  }}
                                  className="text-gray-500 hover:text-gray-600"
                                  title={isExpanded ? t.collapse : t.expand}
                                >
                                  {isExpanded ? '-' : '+'}
                                </button>
                              )}
                              <button
                                onClick={() => setEditingEntry(guideline)}
                                className="text-blue-600 hover:text-blue-600"
                                title={t.editGuideline}
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={async () => {
                                  if (confirm(t.deleteGuideline)) {
                                    await deleteGuideline(guideline.id)  // Delete from Supabase
                                    const updated = guidelines.filter(g => g.id !== guideline.id)
                                    setGuidelines(updated)
                                  }
                                }}
                                className="text-red-600 hover:text-red-600"
                                title={t.deleteGuideline}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="text-gray-600 text-xs whitespace-pre-wrap">
                            {isExpanded ? guideline.content : (
                              <>
                                {contentPreview}
                                {hasMoreContent && <span className="text-gray-400">...</span>}
                              </>
                            )}
                          </div>

                          <div className="flex gap-2 mt-3 text-xs text-gray-500">
                            <span>{t.created}: {new Date(guideline.createdAt).toLocaleDateString()}</span>
                            <span>{t.updated}: {new Date(guideline.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                  width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: #1e293b;
                  border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background: #475569;
                  border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: #64748b;
                }
              `}</style>

              {/* AI Guidelines Management - Hidden from UI but kept in backend */}
              {/* Guidelines are still loaded from localStorage and used in API calls */}

              {/* Guideline Edit Modal */}
              {editingEntry && 'title' in editingEntry && 'category' in editingEntry && !('scenario' in editingEntry) && !('question' in editingEntry) && (
                <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-none p-3 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <h3 className="text-xs font-bold mb-4">{t.editGuideline}</h3>

                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs font-medium mb-2">{t.category}</label>
                        <select
                          value={(editingEntry as any).category}
                          onChange={(e) => setEditingEntry({ ...editingEntry, category: e.target.value })}
                          className="w-full bg-gray-100 border border-gray-200 rounded-none px-2 py-1.5 text-gray-900 text-xs"
                        >
                          <option value="faq">{t.categoryFaqLibrary}</option>
                          <option value="canned">{t.categoryCannedMessages}</option>
                          <option value="roleplay">{t.categoryRoleplay}</option>
                          <option value="general">{t.categoryGeneral}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-2">{t.title}</label>
                        <input
                          type="text"
                          value={(editingEntry as any).title}
                          onChange={(e) => setEditingEntry({ ...editingEntry, title: e.target.value })}
                          className="w-full bg-gray-100 border border-gray-200 rounded-none px-2 py-1.5 text-gray-900 text-xs"
                          placeholder={t.guidelineTitlePlaceholder}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-2">{t.content}</label>
                        <textarea
                          value={(editingEntry as any).content}
                          onChange={(e) => setEditingEntry({ ...editingEntry, content: e.target.value })}
                          rows={10}
                          className="w-full bg-gray-100 border border-gray-200 rounded-none px-2 py-1.5 text-gray-900 text-xs"
                          placeholder={t.guidelineContentPlaceholder}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={async () => {
                          const guidelineToSave = { ...editingEntry, updatedAt: new Date() } as Guideline

                          // Check if this is a new guideline or updating existing
                          const existingIndex = guidelines.findIndex(g => g.id === (editingEntry as any).id)
                          let updated: Guideline[]

                          if (existingIndex >= 0) {
                            // Update existing
                            updated = guidelines.map(g =>
                              g.id === (editingEntry as any).id ? guidelineToSave : g
                            )
                          } else {
                            // Add new
                            updated = [...guidelines, guidelineToSave]
                          }

                          await saveGuideline(guidelineToSave)  // Save to Supabase
                          setGuidelines(updated)
                          setEditingEntry(null)
                        }}
                        className="flex-1 bg-green-50 border border-green-200 hover:bg-green-100 px-3 py-1.5 rounded-none text-xs"
                      >
                        {t.save}
                      </button>
                      <button
                        onClick={() => setEditingEntry(null)}
                        className="flex-1 bg-gray-200 hover:bg-gray-100 px-3 py-1.5 rounded-none text-xs"
                      >
                        {t.cancel}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Training Sessions History */}
              <div className="mb-3">
                <h3 className="text-xs font-semibold mb-4 text-gray-900">{t.completedTrainingSessions}</h3>
                {trainingSessions.length === 0 ? (
                  <div className="bg-gray-100 rounded-none p-3 text-center">
                    <p className="text-gray-500">{t.noTrainingSessionsYet}</p>
                    <p className="text-gray-400 text-xs mt-2">{t.trainingSessionsHelp}</p>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {trainingSessions.map((session, idx) => (
                      <div key={session.id || idx} className="bg-gray-100 rounded-none p-2.5 border border-gray-200">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium text-xs text-gray-900">{session.scenario?.name || t.trainingSession}</h4>
                            <p className="text-gray-600 text-xs">{session.customerPersona} {t.customer}</p>
                          </div>
                          <div className="text-right">
                            <span className="bg-green-50 text-green-600 px-2 py-1 rounded-none text-xs">
                              {t.score}: {session.score || 0}%
                            </span>
                            <p className="text-gray-500 text-xs mt-1">
                              {new Date(session.endTime).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="mb-3">
                          <p className="text-gray-600 text-xs">{session.summary}</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">{t.messages}:</span>
                            <span className="text-gray-900 ml-1">{session.conversation?.length || 0}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">{t.feedback}:</span>
                            <span className="text-gray-900 ml-1">{session.feedback?.length || 0}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">{t.duration}:</span>
                            <span className="text-gray-900 ml-1">
                              {session.startTime && session.endTime
                                ? Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 60000) + ` ${t.min}`
                                : t.na
                              }
                            </span>
                          </div>
                        </div>

                        {session.objectives && session.objectives.length > 0 && (
                          <div className="mt-3">
                            <p className="text-gray-500 text-xs">{t.objectives}:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {session.objectives.map((obj, objIdx) => (
                                <span key={objIdx} className="bg-gray-200 text-gray-600 px-2 py-1 rounded-none text-xs">
                                  {obj}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                {filteredTraining.map((entry) => (
                  <div key={entry.id} className="bg-gray-100 rounded-none p-2.5 border border-gray-200">
                    <div className="flex justify-between items-start mb-3 gap-3">
                      <div className="flex gap-2 items-center flex-wrap min-w-0">
                        <span className="bg-purple-50 text-purple-600 px-2 py-1 rounded-none text-xs whitespace-nowrap">
                          {entry.category}
                        </span>
                        <span className={`px-2 py-1 rounded-none text-xs whitespace-nowrap ${
                          entry.active ? 'bg-green-50 text-green-600' : 'bg-red-50/20 text-red-600'
                        }`}>
                          {entry.active ? t.active : t.inactive}
                        </span>
                        <span className="bg-yellow-500/20 text-yellow-600 px-2 py-1 rounded-none text-xs whitespace-nowrap">
                          {t.priority}: {entry.priority}
                        </span>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => setEditingEntry(entry)}
                          className="text-blue-600 hover:text-blue-600 p-1"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteEntry(entry.id, 'training')}
                          className="text-red-600 hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mb-3">
                      <h4 className="font-medium text-xs text-cyan-600 mb-0.5">{t.question}:</h4>
                      <p className="text-gray-600 text-xs break-words">{entry.question}</p>
                    </div>

                    <div className="mb-3">
                      <h4 className="font-medium text-xs text-green-600 mb-0.5">{t.answer}:</h4>
                      <p className="text-gray-600 text-xs break-words">{entry.answer}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-2">
                      {entry.keywords.map((keyword, idx) => (
                        <span key={idx} className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs">
                          {keyword}
                        </span>
                      ))}
                    </div>

                    {entry.variations.length > 0 && (
                      <div className="text-xs text-gray-500">
                        {t.variations}: {entry.variations.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Testing Tab */}
          {activeTab === 'testing' && (
            <div>
              <h2 className="text-xs font-bold mb-3 flex items-center gap-2">
                <TestTube className="w-4 h-4 text-green-600" />
                AI Testing
              </h2>

              <div className="bg-gray-100 rounded-none p-3">
                <div className="mb-3">
                  <label className="block text-xs font-medium mb-2">{t.testQuery}</label>
                  <input
                    type="text"
                    value={testQuery}
                    onChange={(e) => setTestQuery(e.target.value)}
                    placeholder={t.testQueryPlaceholder}
                    className="w-full bg-white border border-gray-200 rounded-none px-2 py-1.5 text-gray-900 text-xs"
                  />
                  <button
                    onClick={testAI}
                    disabled={isLoading || !testQuery.trim()}
                    className="mt-2 bg-green-50 border border-green-200 hover:bg-green-100 disabled:bg-gray-200 px-2 py-1 rounded-none text-xs transition-colors"
                  >
                    {isLoading ? 'Testing...' : 'Test AI Response'}
                  </button>
                </div>

                {testResponse && (
                  <div>
                    <label className="block text-xs font-medium mb-2">{t.aiResponse}</label>
                    <div className="bg-white border border-gray-200 rounded-none p-4">
                      <p className="text-gray-600 whitespace-pre-wrap">{testResponse}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Role-Play Training Tab */}
          <div style={{ display: activeTab === 'roleplay' ? 'block' : 'none' }}>
            <RoleplayTraining
              onTrainingSessionsUpdate={setTrainingSessions}
              businessUnit={selectedBusinessUnit}
              knowledgeEntries={knowledgeEntries}
              guidelines={guidelines}
              language={selectedLanguage}
              onAddGuideline={async (guideline) => {
                const newGuideline: Guideline = {
                  id: `guideline-${Date.now()}`,
                  category: guideline.category,
                  title: guideline.title,
                  content: guideline.content,
                  createdAt: new Date(),
                  updatedAt: new Date()
                }
                await saveGuideline(newGuideline)  // Save to Supabase
                const updated = [...guidelines, newGuideline]
                setGuidelines(updated)
              }}
            />
          </div>

          {/* FAQ Library Tab */}
          {activeTab === 'faq' && (
            <div>
              <div className="flex flex-wrap justify-between items-center mb-3 gap-2">
                <h2 className="text-xs font-bold flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-cyan-600" />
                  {t.faqLibrary}
                </h2>
                <button
                  onClick={handleGenerateFaqs}
                  disabled={knowledgeEntries.length === 0 || generatingFaqs}
                  className="flex items-center gap-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-slate-600 disabled:to-slate-600 px-2 py-1 rounded-none text-xs transition-colors"
                  title={t.generateFaqTitle}
                >
                  <Sparkles className="w-4 h-4" />
                  {generatingFaqs ? t.generating : t.generateFaq}
                </button>
              </div>

              {/* Category Tabs Row */}
              <div className="mb-3 flex flex-wrap gap-2 items-center">
                {faqCategories.map((category) => (
                  editingCategory === category ? (
                    <div key={category} className="flex gap-2">
                      <input
                        type="text"
                        value={editingCategoryValue}
                        onChange={(e) => setEditingCategoryValue(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') handleCategoryEdit()
                          if (e.key === 'Escape') cancelCategoryEdit()
                        }}
                        onBlur={handleCategoryEdit}
                        placeholder={t.leaveBlankToDelete}
                        className="bg-gray-100 border border-purple-500 rounded-none px-2 py-1 text-gray-900 text-xs capitalize"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <button
                      key={category}
                      onClick={() => setSelectedFaqCategory(category)}
                      onDoubleClick={() => handleCategoryDoubleClick(category)}
                      className={`px-2 py-1 rounded-none text-xs transition-colors capitalize ${
                        selectedFaqCategory === category
                          ? 'bg-purple-50 border border-purple-200 text-gray-900'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={t.doubleClickToEdit}
                    >
                      {category}
                    </button>
                  )
                ))}
                {showAddCategory ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addFaqCategory()}
                      placeholder={t.categoryNamePlaceholder}
                      className="bg-gray-100 border border-gray-200 rounded-none px-2 py-1 text-gray-900 text-xs"
                      autoFocus
                    />
                    <button
                      onClick={addFaqCategory}
                      className="bg-green-50 border border-green-200 hover:bg-green-100 px-2 py-1 rounded-none text-xs"
                    >
                      {t.add}
                    </button>
                    <button
                      onClick={() => {
                        setShowAddCategory(false)
                        setNewCategoryName('')
                      }}
                      className="bg-gray-200 hover:bg-gray-100 px-2 py-1 rounded-none text-xs"
                    >
                      {t.cancel}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddCategory(true)}
                    className="px-2 py-1 rounded-none bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors flex items-center gap-1 text-xs"
                  >
                    <Plus className="w-4 h-4" />
                    {t.addCategory}
                  </button>
                )}
              </div>

              <div className="grid gap-2">
                {faqs.filter(faq => faq.category === selectedFaqCategory).map((faq) => (
                  <div key={faq.id} className="bg-gray-100 rounded-none p-2.5 border border-gray-200">
                    <div className="flex justify-between items-start mb-3 gap-3">
                      <div className="flex-1 min-w-0">
                        <span className="bg-cyan-50 text-cyan-600 px-2 py-1 rounded-none text-xs whitespace-nowrap inline-block">
                          {faq.category}
                        </span>
                        <h3 className="text-xs font-medium mt-1 break-words">{faq.question}</h3>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => setEditingEntry(faq)}
                          className="text-blue-600 hover:text-blue-600 p-1"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm(t.deleteFaq)) {
                              await deleteFAQ(faq.id)  // Delete from Supabase
                              const updatedFaqs = faqs.filter(f => f.id !== faq.id)
                              setFaqs(updatedFaqs)
                            }
                          }}
                          className="text-red-600 hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-gray-600 text-xs mb-2 whitespace-pre-line break-words">{faq.answer}</p>

                    <div className="flex flex-wrap gap-2 mb-2">
                      {faq.keywords.map((keyword, idx) => (
                        <span key={idx} className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs">
                          {keyword}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className={`px-2 py-1 rounded-none ${faq.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50/20 text-red-600'}`}>
                        {faq.is_active ? t.active : t.inactive}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {editingEntry && 'question' in editingEntry && (
                <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-none p-3 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <h3 className="text-xs font-bold mb-4">{t.editFaq}</h3>

                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs font-medium mb-2">{t.category}</label>
                        <select
                          value={(editingEntry as FAQ).category}
                          onChange={(e) => setEditingEntry({ ...editingEntry, category: e.target.value as FAQ['category'] })}
                          className="w-full bg-gray-100 border border-gray-200 rounded-none px-2 py-1.5 text-xs"
                        >
                          {faqCategories.map((cat) => (
                            <option key={cat} value={cat} className="capitalize">
                              {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-2">{t.question}</label>
                        <input
                          type="text"
                          value={(editingEntry as FAQ).question}
                          onChange={(e) => setEditingEntry({ ...editingEntry, question: e.target.value })}
                          className="w-full bg-gray-100 border border-gray-200 rounded-none px-2 py-1.5 text-xs"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-xs font-medium">{t.answer}</label>
                          <button
                            onClick={regenerateFaqAnswer}
                            disabled={regeneratingAnswer}
                            className="flex items-center gap-1 text-xs bg-purple-50 border border-purple-200 hover:bg-purple-100 disabled:bg-purple-800 disabled:cursor-not-allowed px-3 py-1 rounded-none"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            {regeneratingAnswer ? t.regenerating : t.regenerate}
                          </button>
                        </div>
                        <textarea
                          value={(editingEntry as FAQ).answer}
                          onChange={(e) => setEditingEntry({ ...editingEntry, answer: e.target.value })}
                          rows={6}
                          className="w-full bg-gray-100 border border-gray-200 rounded-none px-2 py-1.5 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-2">
                          Comments
                          <span className="text-gray-500 text-xs ml-2">{t.commentsNote}</span>
                        </label>
                        <textarea
                          value={(editingEntry as FAQ).comments || ''}
                          onChange={(e) => setEditingEntry({ ...editingEntry, comments: e.target.value })}
                          rows={3}
                          className="w-full bg-gray-100 border border-gray-200 rounded-none px-2 py-1.5 text-xs"
                          placeholder={t.commentsPlaceholder}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-2">{t.keywords}</label>
                        <input
                          type="text"
                          value={(editingEntry as FAQ).keywords.join(', ')}
                          onChange={(e) => setEditingEntry({
                            ...editingEntry,
                            keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                          })}
                          className="w-full bg-gray-100 border border-gray-200 rounded-none px-2 py-1.5 text-xs"
                          placeholder={t.keywordsPlaceholder}
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={(editingEntry as FAQ).is_active ?? true}
                          onChange={(e) => setEditingEntry({ ...editingEntry, is_active: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <label className="text-xs">Active</label>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={async () => {
                          const faq = editingEntry as FAQ

                          // Save the FAQ to Supabase and state
                          await saveFAQ(faq)  // Save to Supabase
                          const updatedFaqs = faqs.map(f => f.id === faq.id ? faq : f)
                          setFaqs(updatedFaqs)

                          // If there are comments, add them to training guidelines
                          if (faq.comments && faq.comments.trim()) {
                            const existingGuideline = guidelines.find(g =>
                              g.category === 'faq' &&
                              g.title === `FAQ Comment: ${faq.question.substring(0, 50)}${faq.question.length > 50 ? '...' : ''}`
                            )

                            if (!existingGuideline) {
                              const newGuideline: Guideline = {
                                id: `guideline-faq-comment-${Date.now()}`,
                                category: 'faq',
                                title: `FAQ Comment: ${faq.question.substring(0, 50)}${faq.question.length > 50 ? '...' : ''}`,
                                content: `**Question:** ${faq.question}\n\n**Category:** ${faq.category}\n\n**Improvement Notes:**\n${faq.comments}\n\n**Current Answer:**\n${faq.answer}`,
                                createdAt: new Date(),
                                updatedAt: new Date()
                              }

                              await saveGuideline(newGuideline)  // Save to Supabase
                              const updatedGuidelines = [...guidelines, newGuideline]
                              setGuidelines(updatedGuidelines)
                            }
                          }

                          setEditingEntry(null)
                        }}
                        className="flex-1 bg-green-50 border border-green-200 hover:bg-green-100 px-3 py-1.5 rounded-none text-xs"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingEntry(null)}
                        className="flex-1 bg-gray-200 hover:bg-gray-100 px-3 py-1.5 rounded-none text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Canned Messages Tab */}
          {activeTab === 'canned' && (
            <div>
              <div className="flex flex-wrap justify-between items-center mb-3 gap-2">
                <h2 className="text-xs font-bold flex items-center gap-2">
                  <Mail className="w-4 h-4 text-pink-600" />
                  {t.cannedMessages}
                </h2>
                <div className="flex gap-2 items-center flex-wrap justify-end">
                  {/* Knowledge Base Selector */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setCannedGenerationSource('knowledge')
                        setShowKnowledgeSelector(!showKnowledgeSelector)
                      }}
                      className={`flex items-center gap-1 px-2 py-1 rounded-none text-xs transition-colors border ${
                        cannedGenerationSource === 'knowledge' && selectedKnowledgeEntries.length > 0
                          ? 'bg-cyan-50 hover:bg-cyan-700 border-cyan-500'
                          : 'bg-gray-100 hover:bg-gray-200 border-gray-300'
                      }`}
                    >
                      <Database className="w-4 h-4" />
                      {t.knowledgeBaseBtn}
                      {selectedKnowledgeEntries.length > 0 && (
                        <span className="bg-cyan-800 text-cyan-200 px-2 py-0.5 rounded-full text-xs">
                          {selectedKnowledgeEntries.length}
                        </span>
                      )}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {showKnowledgeSelector && (
                      <div className="absolute right-0 mt-2 w-96 max-w-[90vw] bg-gray-100 rounded-none shadow-sm border border-gray-200 z-10 max-h-96 overflow-y-auto">
                        <div className="sticky top-0 bg-gray-100 border-b border-gray-300 p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-xs text-gray-900">{t.selectKnowledgeFiles}</h4>
                            <button
                              onClick={() => setShowKnowledgeSelector(false)}
                              className="text-gray-500 hover:text-gray-900"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedKnowledgeEntries(knowledgeEntries.map(e => e.id))
                              }}
                              className="text-xs bg-gray-200 hover:bg-gray-100 px-2 py-1 rounded-none"
                            >
                              {t.selectAll}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedKnowledgeEntries([])
                              }}
                              className="text-xs bg-gray-200 hover:bg-gray-100 px-2 py-1 rounded-none"
                            >
                              {t.clearAll}
                            </button>
                          </div>
                        </div>

                        <div className="p-2">
                          {knowledgeEntries.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                              <p>{t.noKnowledgeYet}</p>
                              <p className="text-xs mt-2">{t.uploadInKnowledgeTab}</p>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {knowledgeEntries.map((entry) => (
                                <label
                                  key={entry.id}
                                  className="flex items-start gap-2 p-1.5 hover:bg-gray-200 rounded-none cursor-pointer transition-colors text-xs"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedKnowledgeEntries.includes(entry.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedKnowledgeEntries([...selectedKnowledgeEntries, entry.id])
                                      } else {
                                        setSelectedKnowledgeEntries(selectedKnowledgeEntries.filter(id => id !== entry.id))
                                      }
                                    }}
                                    className="mt-1 w-4 h-4"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 truncate">
                                      {entry.fileName || entry.topic}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate">
                                      {entry.content.substring(0, 80)}...
                                    </div>
                                  </div>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Deep AI Research Button */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setCannedGenerationSource('research')
                        setSelectedKnowledgeEntries([])
                        setShowKnowledgeSelector(false)
                        if (researchSources.length === 0 && !isResearching) {
                          handleDeepResearch()
                        } else {
                          setShowResearchSources(!showResearchSources)
                        }
                      }}
                      disabled={isResearching}
                      className={`flex items-center gap-1 px-2 py-1 rounded-none text-xs transition-colors border ${
                        cannedGenerationSource === 'research' && selectedResearchSources.length > 0
                          ? 'bg-purple-50 border border-purple-200 hover:bg-purple-100 border-purple-500'
                          : 'bg-gray-100 hover:bg-gray-200 border-gray-300'
                      } ${isResearching ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Brain className="w-4 h-4" />
                      {isResearching ? t.researching : t.deepAiResearch}
                      {selectedResearchSources.length > 0 && (
                        <span className="bg-purple-800 text-purple-200 px-2 py-0.5 rounded-full text-xs">
                          {selectedResearchSources.length}
                        </span>
                      )}
                      {!isResearching && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </button>

                    {/* Research Sources Selector */}
                    {showResearchSources && researchSources.length > 0 && (
                      <div className="absolute right-0 mt-2 w-96 max-w-[90vw] bg-gray-100 rounded-none shadow-sm border border-gray-200 z-10 max-h-96 overflow-y-auto">
                        <div className="sticky top-0 bg-gray-100 border-b border-gray-300 p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-xs text-gray-900">{t.selectExpertSources}</h4>
                            <button
                              onClick={() => setShowResearchSources(false)}
                              className="text-gray-500 hover:text-gray-900"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedResearchSources(researchSources.map(s => s.id))
                              }}
                              className="text-xs bg-gray-200 hover:bg-gray-100 px-2 py-1 rounded-none"
                            >
                              {t.selectAll}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedResearchSources([])
                              }}
                              className="text-xs bg-gray-200 hover:bg-gray-100 px-2 py-1 rounded-none"
                            >
                              {t.clearAll}
                            </button>
                            <button
                              onClick={handleDeepResearch}
                              className="text-xs bg-purple-50 border border-purple-200 hover:bg-purple-50 px-2 py-1 rounded-none ml-auto"
                            >
                              {t.researchAgain}
                            </button>
                          </div>
                        </div>

                        <div className="p-2">
                          <div className="space-y-1">
                            {researchSources.map((source) => (
                              <label
                                key={source.id}
                                className="flex items-start gap-2 p-2 hover:bg-gray-200 rounded-none cursor-pointer transition-colors text-xs border border-gray-200"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedResearchSources.includes(source.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedResearchSources([...selectedResearchSources, source.id])
                                    } else {
                                      setSelectedResearchSources(selectedResearchSources.filter(id => id !== source.id))
                                    }
                                  }}
                                  className="mt-1 w-4 h-4"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 flex items-center gap-2">
                                    {source.name}
                                    <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-none">
                                      {source.credibility}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-600 mt-1">
                                    {source.description}
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleGenerateCannedMessages}
                    disabled={generatingFaqs || (cannedGenerationSource === 'knowledge' && knowledgeEntries.length === 0)}
                    className="flex items-center gap-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed px-2 py-1 rounded-none text-xs transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    {generatingFaqs ? t.generating : t.generate}
                  </button>
                </div>
              </div>

              {/* Category Tabs Row */}
              <div className="mb-3 flex flex-wrap gap-2 items-center">
                {cannedCategories.map((category) => (
                  editingCannedCategory === category ? (
                    <div key={category} className="flex gap-2">
                      <input
                        type="text"
                        value={editingCannedCategoryValue}
                        onChange={(e) => setEditingCannedCategoryValue(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') handleCannedCategoryEdit()
                          if (e.key === 'Escape') cancelCannedCategoryEdit()
                        }}
                        onBlur={handleCannedCategoryEdit}
                        placeholder={t.leaveBlankToDelete}
                        className="bg-gray-100 border border-pink-500 rounded-none px-2 py-1 text-gray-900 text-xs capitalize"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <button
                      key={category}
                      onClick={() => setSelectedCannedCategory(category)}
                      onDoubleClick={() => handleCannedCategoryDoubleClick(category)}
                      className={`px-2 py-1 rounded-none text-xs transition-colors capitalize ${
                        selectedCannedCategory === category
                          ? 'bg-purple-50 border border-purple-200 text-gray-900'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={t.doubleClickToEdit}
                    >
                      {category}
                    </button>
                  )
                ))}
                {showAddCannedCategory ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCannedCategoryName}
                      onChange={(e) => setNewCannedCategoryName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addCannedCategory()}
                      placeholder={t.categoryNamePlaceholder}
                      className="bg-gray-100 border border-gray-200 rounded-none px-2 py-1 text-gray-900 text-xs"
                      autoFocus
                    />
                    <button
                      onClick={addCannedCategory}
                      className="bg-green-50 border border-green-200 hover:bg-green-100 px-2 py-1 rounded-none text-xs"
                    >
                      {t.add}
                    </button>
                    <button
                      onClick={() => {
                        setShowAddCannedCategory(false)
                        setNewCannedCategoryName('')
                      }}
                      className="bg-gray-200 hover:bg-gray-100 px-2 py-1 rounded-none text-xs"
                    >
                      {t.cancel}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddCannedCategory(true)}
                    className="px-2 py-1 rounded-none bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors flex items-center gap-1 text-xs"
                  >
                    <Plus className="w-4 h-4" />
                    {t.addCategory}
                  </button>
                )}
              </div>

              <div className="grid gap-2">
                {cannedMsgs.filter(msg => msg.category === selectedCannedCategory).map((msg) => (
                  <div key={msg.id} className="bg-gray-100 rounded-none p-2.5 border border-gray-200">
                    <div className="flex justify-between items-start mb-3 gap-3">
                      <div className="flex-1 min-w-0">
                        <span className="bg-pink-50 text-pink-600 px-2 py-1 rounded-none text-xs capitalize whitespace-nowrap inline-block">
                          {msg.category || 'general responses'}
                        </span>
                        <h3 className="text-xs font-medium mt-1 break-words">{msg.scenario}</h3>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => setEditingEntry(msg)}
                          className="text-blue-600 hover:text-blue-600 p-1"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm(t.deleteCannedMessage)) {
                              await deleteCannedMessage(msg.id)  // Delete from Supabase
                              const updated = cannedMsgs.filter(m => m.id !== msg.id)
                              setCannedMsgs(updated)
                            }
                          }}
                          className="text-red-600 hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-gray-600 text-xs mb-2 whitespace-pre-line break-words">{msg.template}</p>

                    {msg.variables && msg.variables.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs text-gray-500">{t.variablesLabel}:</span>
                        {msg.variables.map((variable, idx) => (
                          <span key={idx} className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs">
                            {variable}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {editingEntry && 'scenario' in editingEntry && (
                <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-none p-3 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <h3 className="text-xs font-bold mb-4">{t.editCannedMessage}</h3>

                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs font-medium mb-2">{t.category}</label>
                        <select
                          value={(editingEntry as CannedMessage).category || selectedCannedCategory}
                          onChange={(e) => setEditingEntry({ ...editingEntry, category: e.target.value })}
                          className="w-full bg-gray-100 border border-gray-200 rounded-none px-3 py-2 text-gray-900 capitalize"
                        >
                          {cannedCategories.map((cat) => (
                            <option key={cat} value={cat} className="capitalize">
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-2">{t.id}</label>
                        <input
                          type="text"
                          value={(editingEntry as CannedMessage).id}
                          onChange={(e) => setEditingEntry({ ...editingEntry, id: e.target.value })}
                          className="w-full bg-gray-100 border border-gray-200 rounded-none px-2 py-1.5 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-2">{t.scenarioDescription}</label>
                        <input
                          type="text"
                          value={(editingEntry as CannedMessage).scenario}
                          onChange={(e) => setEditingEntry({ ...editingEntry, scenario: e.target.value })}
                          className="w-full bg-gray-100 border border-gray-200 rounded-none px-2 py-1.5 text-xs"
                          placeholder={t.scenarioPlaceholder}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-2">{t.template}</label>
                        <textarea
                          value={(editingEntry as CannedMessage).template}
                          onChange={(e) => setEditingEntry({ ...editingEntry, template: e.target.value })}
                          rows={8}
                          className="w-full bg-gray-100 border border-gray-200 rounded-none px-2 py-1.5 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-2">{t.variables}</label>
                        <input
                          type="text"
                          value={(editingEntry as CannedMessage).variables?.join(', ') || ''}
                          onChange={(e) => setEditingEntry({
                            ...editingEntry,
                            variables: e.target.value.split(',').map(v => v.trim()).filter(v => v)
                          })}
                          className="w-full bg-gray-100 border border-gray-200 rounded-none px-2 py-1.5 text-xs"
                          placeholder={t.variablesPlaceholder}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={async () => {
                          const msg = editingEntry as CannedMessage
                          await saveCannedMessage(msg)  // Save to Supabase
                          const updated = cannedMsgs.map(m => m.id === msg.id ? msg : m)
                          setCannedMsgs(updated)
                          setEditingEntry(null)
                        }}
                        className="flex-1 bg-green-50 border border-green-200 hover:bg-green-100 px-3 py-1.5 rounded-none text-xs"
                      >
                        {t.save}
                      </button>
                      <button
                        onClick={() => setEditingEntry(null)}
                        className="flex-1 bg-gray-200 hover:bg-gray-100 px-3 py-1.5 rounded-none text-xs"
                      >
                        {t.cancel}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div>
              <h2 className="text-xs font-bold mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-orange-600" />
                Analytics
              </h2>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="bg-gray-100 rounded-none p-3 border border-gray-200">
                  <div className="flex items-center gap-3 mb-3">
                    <Database className="w-8 h-8 text-cyan-600" />
                    <div>
                      <h3 className="font-semibold">{t.knowledgeEntries}</h3>
                      <p className="text-xs font-bold text-cyan-600">{knowledgeEntries.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-100 rounded-none p-3 border border-gray-200">
                  <div className="flex items-center gap-3 mb-3">
                    <Brain className="w-8 h-8 text-purple-600" />
                    <div>
                      <h3 className="font-semibold">{t.trainingExamples}</h3>
                      <p className="text-xs font-bold text-purple-600">{trainingData.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-100 rounded-none p-3 border border-gray-200">
                  <div className="flex items-center gap-3 mb-3">
                    <Sparkles className="w-8 h-8 text-green-600" />
                    <div>
                      <h3 className="font-semibold">{t.activeTraining}</h3>
                      <p className="text-xs font-bold text-green-600">
                        {trainingData.filter(t => t.active).length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Booking Management Tab */}
          {activeTab === 'booking' && (
            <div>
              <div className="flex flex-wrap items-center justify-between mb-3 gap-2">
                <h2 className="text-xs font-bold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-cyan-600" />
                  {t.bookingManagement}
                </h2>
                <a
                  href="/booking"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 bg-green-50 border border-green-200 hover:bg-green-100 px-2 py-1 rounded-none transition-colors text-xs"
                >
                  <Users className="w-3.5 h-3.5" />
                  {t.manageAppointments}
                </a>
              </div>

              <div className="space-y-3">

                {/* Staff Management */}
                <div className="bg-gray-100 rounded-none p-3 border border-gray-200">
                  <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
                    <h3 className="text-xs font-semibold">{t.staff}</h3>
                    <button
                      onClick={() => {
                        setNewStaff({ name: '', email: '', staff_type: '' })
                        setEditingStaff(null)
                        setShowAddStaff(true)
                      }}
                      className="flex items-center gap-1 bg-green-50 border border-green-200 hover:bg-green-100 px-2 py-1 rounded-none transition-colors text-xs"
                    >
                      <Plus className="w-3 h-3" />
                      {t.addStaffMember}
                    </button>
                  </div>
                  <p className="text-gray-500 text-xs mb-4">
                    {t.staffDescription}
                  </p>

                  {/* Staff List */}
                  {staff.length === 0 ? (
                    <div className="text-gray-600 text-center py-3 text-xs bg-white rounded-none">
                      {t.noStaffYet}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {staff.map((member) => (
                        <div key={member.id} className="bg-white rounded-none p-2.5 border border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-xs">{member.name}</h4>
                                <a
                                  href={`/booking?staff=${member.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-0.5 bg-purple-50 border border-purple-200 hover:bg-purple-100 rounded-none transition-colors"
                                  title={t.viewSchedule}
                                >
                                  <Calendar className="w-4 h-4" />
                                </a>
                              </div>
                              <div className="text-gray-500 text-xs space-y-1">
                                {member.email && <p>{t.email}: {member.email}</p>}
                                {member.staff_type && <p>{t.type}: {member.staff_type}</p>}
                                <p>{t.status}: <span className={member.is_active ? 'text-green-600' : 'text-red-600'}>{member.is_active ? t.active : t.inactive}</span></p>
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <button
                                onClick={() => {
                                  setEditingStaff(member)
                                  setNewStaff({ name: member.name, email: member.email || '', staff_type: member.staff_type || '' })
                                  setShowAddStaff(true)
                                }}
                                className="p-1 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-none transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={async () => {
                                  if (confirm(t.confirmDeleteStaff(member.name))) {
                                    try {
                                      await deleteStaff(member.id)
                                      setStaff(staff.filter(s => s.id !== member.id))
                                      alert(t.staffMemberDeleted)
                                    } catch (error: any) {
                                      alert(t.error(error.message))
                                    }
                                  }
                                }}
                                className="p-1 bg-red-50 border border-red-200 hover:bg-red-700 rounded-none transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add/Edit Staff Modal */}
                  {showAddStaff && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white rounded-none p-3 max-w-md w-full mx-4 border border-gray-200">
                        <h3 className="text-xs font-semibold mb-4">
                          {editingStaff ? t.editStaffMember : t.addNewStaffMember}
                        </h3>
                        <div className="space-y-2">
                          <div>
                            <label className="block text-xs font-medium mb-2">{t.nameRequired}</label>
                            <input
                              type="text"
                              value={newStaff.name}
                              onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                              placeholder={t.namePlaceholder}
                              className="w-full px-2 py-1.5 bg-gray-100 border border-gray-200 rounded-none text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-2">{t.emailOptional}</label>
                            <input
                              type="email"
                              value={newStaff.email}
                              onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                              placeholder={t.emailPlaceholder}
                              className="w-full px-2 py-1.5 bg-gray-100 border border-gray-200 rounded-none text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-2">{t.staffTypeOptional}</label>
                            <input
                              type="text"
                              value={newStaff.staff_type}
                              onChange={(e) => setNewStaff({ ...newStaff, staff_type: e.target.value })}
                              placeholder={t.staffTypePlaceholder}
                              className="w-full px-2 py-1.5 bg-gray-100 border border-gray-200 rounded-none text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={async () => {
                              if (!newStaff.name) {
                                alert(t.pleaseEnterName)
                                return
                              }
                              try {
                                const staffData = editingStaff
                                  ? { id: editingStaff.id, ...newStaff }
                                  : newStaff
                                const savedStaff = await saveStaff(staffData, selectedBusinessUnit)
                                if (editingStaff) {
                                  setStaff(staff.map(s => s.id === savedStaff.id ? savedStaff : s))
                                } else {
                                  setStaff([...staff, savedStaff])
                                }
                                setShowAddStaff(false)
                                setNewStaff({ name: '', email: '', staff_type: '' })
                                setEditingStaff(null)
                                alert(t.staffMemberSaved)
                              } catch (error: any) {
                                alert(t.error(error.message))
                              }
                            }}
                            className="flex-1 bg-green-50 border border-green-200 hover:bg-green-100 px-3 py-1.5 rounded-none text-xs transition-colors"
                          >
                            {editingStaff ? t.update : t.create}
                          </button>
                          <button
                            onClick={() => {
                              setShowAddStaff(false)
                              setNewStaff({ name: '', email: '', staff_type: '' })
                              setEditingStaff(null)
                            }}
                            className="flex-1 bg-gray-200 hover:bg-gray-100 px-3 py-1.5 rounded-none text-xs transition-colors"
                          >
                            {t.cancel}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Service-Staff Assignments */}
                <div className="bg-gray-100 rounded-none p-3 border border-gray-200">
                  <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
                    <h3 className="text-xs font-semibold">{t.serviceAssignments}</h3>
                    <button
                      onClick={() => {
                        setSelectedServiceForAssignment('')
                        setSelectedStaffIds([])
                        setShowAddAssignment(true)
                      }}
                      className="flex items-center gap-1 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-2 py-1 rounded-none transition-colors text-xs"
                    >
                      <Plus className="w-3 h-3" />
                      {t.manageStaffAssignments}
                    </button>
                  </div>
                  <p className="text-gray-500 text-xs mb-4">
                    {t.assignmentsDescription}
                  </p>

                  {assignments.length === 0 ? (
                    <div className="text-gray-600 text-center py-3 text-xs bg-white rounded-none">
                      {t.noAssignmentsYet}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Group assignments by service */}
                      {services.map((service) => {
                        const serviceAssignments = assignments.filter(a => a.service_id === service.id)
                        if (serviceAssignments.length === 0) return null

                        return (
                          <div key={service.id} className="bg-white rounded-none p-2.5 border border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-xs text-cyan-600">{service.name}</h4>
                              <button
                                onClick={() => {
                                  setSelectedServiceForAssignment(service.id)
                                  setSelectedStaffIds(serviceAssignments.map(a => a.staff_id))
                                  setShowAddAssignment(true)
                                }}
                                className="text-xs px-3 py-1 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-none transition-colors"
                              >
                                {t.edit}
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {serviceAssignments.map((assignment) => (
                                <span
                                  key={assignment.id}
                                  className="px-3 py-1 bg-gray-100 rounded-full text-xs border border-gray-200"
                                >
                                  {assignment.staff?.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Add Assignment Modal */}
                  {showAddAssignment && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white rounded-none p-3 max-w-md w-full mx-4 border border-gray-200 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xs font-semibold mb-4">{t.assignStaffToService}</h3>
                        <div className="space-y-2">
                          <div>
                            <label className="block text-xs font-medium mb-2">{t.service}</label>
                            <select
                              value={selectedServiceForAssignment}
                              onChange={(e) => {
                                setSelectedServiceForAssignment(e.target.value)
                                // Pre-select staff already assigned to this service
                                const existingAssignments = assignments.filter(a => a.service_id === e.target.value)
                                setSelectedStaffIds(existingAssignments.map(a => a.staff_id))
                              }}
                              className="w-full px-2 py-1.5 bg-gray-100 border border-gray-200 rounded-none text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                              <option value="">{t.selectService}</option>
                              {services.map(service => (
                                <option key={service.id} value={service.id}>{service.name}</option>
                              ))}
                            </select>
                          </div>

                          {selectedServiceForAssignment && (
                            <div>
                              <label className="block text-xs font-medium mb-2">
                                {t.staffMembers(selectedStaffIds.length)}
                              </label>
                              <div className="space-y-2 max-h-64 overflow-y-auto bg-gray-100 rounded-none p-3 border border-gray-200">
                                {staff.map(member => (
                                  <label
                                    key={member.id}
                                    className="flex items-center gap-2 p-1.5 hover:bg-gray-200 rounded-none cursor-pointer text-xs"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selectedStaffIds.includes(member.id)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedStaffIds([...selectedStaffIds, member.id])
                                        } else {
                                          setSelectedStaffIds(selectedStaffIds.filter(id => id !== member.id))
                                        }
                                      }}
                                      className="w-4 h-4 text-cyan-500 bg-white border-gray-300 rounded-none focus:ring-cyan-500 focus:ring-2"
                                    />
                                    <span>{member.name}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={async () => {
                              if (!selectedServiceForAssignment) {
                                alert(t.pleaseSelectService)
                                return
                              }
                              if (selectedStaffIds.length === 0) {
                                alert(t.pleaseSelectStaff)
                                return
                              }
                              try {
                                // Get existing assignments for this service
                                const existingAssignments = assignments.filter(a => a.service_id === selectedServiceForAssignment)
                                const existingStaffIds = existingAssignments.map(a => a.staff_id)

                                // Determine which to add and which to remove
                                const staffToAdd = selectedStaffIds.filter(id => !existingStaffIds.includes(id))
                                const staffToRemove = existingStaffIds.filter(id => !selectedStaffIds.includes(id))

                                console.log('Staff to add:', staffToAdd)
                                console.log('Staff to remove:', staffToRemove)

                                // Remove assignments that are no longer selected
                                for (const staffId of staffToRemove) {
                                  const assignmentToRemove = existingAssignments.find(a => a.staff_id === staffId)
                                  if (assignmentToRemove) {
                                    await deleteAssignment(assignmentToRemove.id)
                                  }
                                }

                                // Add new assignments
                                const newAssignments = []
                                for (const staffId of staffToAdd) {
                                  try {
                                    const savedAssignment = await saveAssignment(
                                      { service_id: selectedServiceForAssignment, staff_id: staffId },
                                      selectedBusinessUnit
                                    )
                                    newAssignments.push(savedAssignment)
                                  } catch (err: any) {
                                    console.error(`Error assigning staff ${staffId}:`, err)
                                    // Continue with other assignments
                                  }
                                }

                                // Update state - keep unchanged assignments and add new ones
                                const unchangedAssignments = assignments.filter(a =>
                                  a.service_id !== selectedServiceForAssignment ||
                                  (a.service_id === selectedServiceForAssignment && selectedStaffIds.includes(a.staff_id))
                                )
                                setAssignments([...unchangedAssignments, ...newAssignments])

                                setShowAddAssignment(false)
                                setSelectedServiceForAssignment('')
                                setSelectedStaffIds([])
                                alert(t.assignmentsSaved)
                              } catch (error: any) {
                                console.error('Assignment error:', error)
                                alert(t.error(error.message))
                              }
                            }}
                            className="flex-1 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-3 py-1.5 rounded-none text-xs transition-colors"
                          >
                            {t.saveAssignments}
                          </button>
                          <button
                            onClick={() => {
                              setShowAddAssignment(false)
                              setSelectedServiceForAssignment('')
                              setSelectedStaffIds([])
                            }}
                            className="flex-1 bg-gray-200 hover:bg-gray-100 px-3 py-1.5 rounded-none text-xs transition-colors"
                          >
                            {t.cancel}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Outlets Management */}
                <div className="bg-gray-100 rounded-none p-3 border border-gray-200">
                  <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
                    <h3 className="text-xs font-semibold">{t.outlets}</h3>
                    <button
                      onClick={() => {
                        setNewOutlet({
                          name: '',
                          address_line1: '',
                          address_line2: '',
                          city: '',
                          state_province: '',
                          postal_code: '',
                          country: 'USA',
                          phone: '',
                          email: '',
                          display_order: 0
                        })
                        setEditingOutlet(null)
                        setShowAddOutlet(true)
                      }}
                      className="flex items-center gap-1 bg-green-50 border border-green-200 hover:bg-green-100 px-2 py-1 rounded-none transition-colors text-xs"
                    >
                      <Plus className="w-3 h-3" />
                      {t.addOutlet}
                    </button>
                  </div>
                  <p className="text-gray-500 text-xs mb-4">
                    {t.outletsDescription}
                  </p>

                  {outlets.length === 0 ? (
                    <div className="text-gray-600 text-center py-3 text-xs bg-white rounded-none">
                      {t.noOutletsYet}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {outlets.map((outlet) => (
                        <div key={outlet.id} className="bg-white rounded-none p-2.5 border border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-xs mb-0.5">{outlet.name}</h4>
                              <p className="text-gray-500 text-xs">{outlet.address_line1}</p>
                              {outlet.address_line2 && <p className="text-gray-500 text-xs">{outlet.address_line2}</p>}
                              <p className="text-gray-500 text-xs">
                                {outlet.city}{outlet.state_province ? `, ${outlet.state_province}` : ''} {outlet.postal_code}
                              </p>
                              {outlet.country && outlet.country !== 'USA' && (
                                <p className="text-gray-500 text-xs">{outlet.country}</p>
                              )}
                              {outlet.phone && <p className="text-gray-500 text-xs mt-1">📞 {outlet.phone}</p>}
                              {outlet.email && <p className="text-gray-500 text-xs">✉️ {outlet.email}</p>}
                              <p className="text-gray-500 text-xs mt-1">{t.status}: <span className={outlet.is_active ? 'text-green-600' : 'text-red-600'}>{outlet.is_active ? t.active : t.inactive}</span></p>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <button
                                onClick={() => {
                                  setEditingOutlet(outlet)
                                  setNewOutlet({
                                    name: outlet.name,
                                    address_line1: outlet.address_line1,
                                    address_line2: outlet.address_line2 || '',
                                    city: outlet.city,
                                    state_province: outlet.state_province || '',
                                    postal_code: outlet.postal_code || '',
                                    country: outlet.country || 'USA',
                                    phone: outlet.phone || '',
                                    email: outlet.email || '',
                                    display_order: outlet.display_order || 0
                                  })
                                  setShowAddOutlet(true)
                                }}
                                className="p-1 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-none transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={async () => {
                                  if (confirm(t.confirmDeleteOutlet(outlet.name))) {
                                    try {
                                      await deleteOutlet(outlet.id)
                                      setOutlets(outlets.filter(o => o.id !== outlet.id))
                                      alert(t.outletDeleted)
                                    } catch (error: any) {
                                      alert(t.error(error.message))
                                    }
                                  }
                                }}
                                className="p-1 bg-red-50 border border-red-200 hover:bg-red-700 rounded-none transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add/Edit Outlet Modal */}
                  {showAddOutlet && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white rounded-none p-3 max-w-2xl w-full mx-4 border border-gray-200 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xs font-semibold mb-4">
                          {editingOutlet ? t.editOutlet : t.addNewOutlet}
                        </h3>
                        <div className="space-y-2">
                          <div>
                            <label className="block text-xs font-medium mb-2">{t.outletNameRequired}</label>
                            <input
                              type="text"
                              value={newOutlet.name}
                              onChange={(e) => setNewOutlet({ ...newOutlet, name: e.target.value })}
                              placeholder={t.outletNamePlaceholder}
                              className="w-full px-2 py-1.5 bg-gray-100 border border-gray-200 rounded-none text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-2">{t.addressLine1Required}</label>
                            <input
                              type="text"
                              value={newOutlet.address_line1}
                              onChange={(e) => setNewOutlet({ ...newOutlet, address_line1: e.target.value })}
                              placeholder={t.addressLine1Placeholder}
                              className="w-full px-2 py-1.5 bg-gray-100 border border-gray-200 rounded-none text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-2">{t.addressLine2}</label>
                            <input
                              type="text"
                              value={newOutlet.address_line2}
                              onChange={(e) => setNewOutlet({ ...newOutlet, address_line2: e.target.value })}
                              placeholder={t.addressLine2Placeholder}
                              className="w-full px-2 py-1.5 bg-gray-100 border border-gray-200 rounded-none text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-medium mb-2">{t.cityRequired}</label>
                              <input
                                type="text"
                                value={newOutlet.city}
                                onChange={(e) => setNewOutlet({ ...newOutlet, city: e.target.value })}
                                placeholder={t.cityPlaceholder}
                                className="w-full px-2 py-1.5 bg-gray-100 border border-gray-200 rounded-none text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-2">{t.stateProvince}</label>
                              <input
                                type="text"
                                value={newOutlet.state_province}
                                onChange={(e) => setNewOutlet({ ...newOutlet, state_province: e.target.value })}
                                placeholder={t.statePlaceholder}
                                className="w-full px-2 py-1.5 bg-gray-100 border border-gray-200 rounded-none text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-medium mb-2">{t.postalCode}</label>
                              <input
                                type="text"
                                value={newOutlet.postal_code}
                                onChange={(e) => setNewOutlet({ ...newOutlet, postal_code: e.target.value })}
                                placeholder={t.postalPlaceholder}
                                className="w-full px-2 py-1.5 bg-gray-100 border border-gray-200 rounded-none text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-2">{t.country}</label>
                              <input
                                type="text"
                                value={newOutlet.country}
                                onChange={(e) => setNewOutlet({ ...newOutlet, country: e.target.value })}
                                placeholder={t.countryPlaceholder}
                                className="w-full px-2 py-1.5 bg-gray-100 border border-gray-200 rounded-none text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-medium mb-2">{t.phone}</label>
                              <input
                                type="tel"
                                value={newOutlet.phone}
                                onChange={(e) => setNewOutlet({ ...newOutlet, phone: e.target.value })}
                                placeholder={t.phonePlaceholder}
                                className="w-full px-2 py-1.5 bg-gray-100 border border-gray-200 rounded-none text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-2">{t.email}</label>
                              <input
                                type="email"
                                value={newOutlet.email}
                                onChange={(e) => setNewOutlet({ ...newOutlet, email: e.target.value })}
                                placeholder={t.emailLocationPlaceholder}
                                className="w-full px-2 py-1.5 bg-gray-100 border border-gray-200 rounded-none text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-2">{t.displayOrder}</label>
                            <input
                              type="number"
                              value={newOutlet.display_order}
                              onChange={(e) => setNewOutlet({ ...newOutlet, display_order: parseInt(e.target.value) || 0 })}
                              placeholder="0"
                              className="w-full px-2 py-1.5 bg-gray-100 border border-gray-200 rounded-none text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            <p className="text-gray-500 text-xs mt-1">{t.displayOrderHelp}</p>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-3">
                          <button
                            onClick={async () => {
                              if (!newOutlet.name || !newOutlet.address_line1 || !newOutlet.city) {
                                alert(t.pleaseProvideRequired)
                                return
                              }
                              try {
                                const savedOutlet = await saveOutlet(
                                  editingOutlet ? { ...newOutlet, id: editingOutlet.id } : newOutlet,
                                  selectedBusinessUnit
                                )
                                if (editingOutlet) {
                                  setOutlets(outlets.map(o => o.id === savedOutlet.id ? savedOutlet : o))
                                } else {
                                  setOutlets([...outlets, savedOutlet])
                                }
                                setShowAddOutlet(false)
                                alert(editingOutlet ? t.outletUpdated : t.outletCreated)
                              } catch (error: any) {
                                alert(t.error(error.message))
                              }
                            }}
                            className="px-3 py-1.5 bg-green-50 border border-green-200 hover:bg-green-100 rounded-none text-xs transition-colors"
                          >
                            {editingOutlet ? t.update : t.create}
                          </button>
                          <button
                            onClick={() => setShowAddOutlet(false)}
                            className="px-3 py-1.5 bg-gray-200 hover:bg-gray-100 rounded-none text-xs transition-colors"
                          >
                            {t.cancel}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Rooms Management */}
                <div className="bg-gray-100 rounded-none p-3 border border-gray-200">
                  <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
                    <h3 className="text-xs font-semibold">{t.treatmentRooms}</h3>
                    <button
                      onClick={() => {
                        setNewRoom({ room_number: '', room_name: '', outlet_id: '' })
                        setEditingRoom(null)
                        setShowAddRoom(true)
                      }}
                      className="flex items-center gap-1 bg-green-50 border border-green-200 hover:bg-green-100 px-2 py-1 rounded-none transition-colors text-xs"
                    >
                      <Plus className="w-3 h-3" />
                      {t.addRoom}
                    </button>
                  </div>
                  <p className="text-gray-500 text-xs mb-4">
                    {t.roomsDescription}
                  </p>

                  {rooms.length === 0 ? (
                    <div className="text-gray-600 text-center py-3 text-xs bg-white rounded-none">
                      {t.noRoomsYet}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {rooms.map((room) => {
                        const outlet = outlets.find(o => o.id === room.outlet_id)
                        const roomServices = allRoomServices.filter(rs => rs.room_id === room.id)
                        const assignedServiceNames = roomServices.map(rs => rs.appointment_services?.name).filter(Boolean)
                        return (
                        <div key={room.id} className="bg-white rounded-none p-2.5 border border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-xs mb-0.5">{t.room(room.room_number)}</h4>
                              {room.room_name && <p className="text-gray-500 text-xs">{room.room_name}</p>}
                              {outlet && (
                                <p className="text-gray-500 text-xs mt-1">
                                  {t.locationDisplay(outlet.name, outlet.city)}
                                </p>
                              )}
                              {assignedServiceNames.length > 0 ? (
                                <p className="text-gray-500 text-xs mt-1">
                                  {t.roomServicesDisplay(assignedServiceNames.join(', '))}
                                </p>
                              ) : (
                                <p className="text-gray-500 text-xs mt-1">
                                  {t.roomServicesDisplay(t.allServicesText)}
                                </p>
                              )}
                              <p className="text-gray-500 text-xs mt-1">{t.status}: <span className={room.is_active ? 'text-green-600' : 'text-red-600'}>{room.is_active ? t.active : t.inactive}</span></p>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <button
                                onClick={async () => {
                                  try {
                                    const existingServices = await loadRoomServices(room.id)
                                    setSelectedRoomForServices(room)
                                    setRoomServiceIds(existingServices?.map((rs: any) => rs.service_id) || [])
                                    setShowRoomServices(true)
                                  } catch (error: any) {
                                    alert(t.error(error.message))
                                  }
                                }}
                                className="p-1 bg-purple-50 border border-purple-200 hover:bg-purple-100 rounded-none transition-colors"
                                title={t.manageServicesBtn}
                              >
                                <Settings className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingRoom(room)
                                  setNewRoom({
                                    room_number: room.room_number,
                                    room_name: room.room_name || '',
                                    outlet_id: room.outlet_id || ''
                                  })
                                  setShowAddRoom(true)
                                }}
                                className="p-1 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-none transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={async () => {
                                  if (confirm(t.confirmDeleteRoom(room.room_number))) {
                                    try {
                                      await deleteRoom(room.id)
                                      setRooms(rooms.filter(r => r.id !== room.id))
                                      alert(t.roomDeleted)
                                    } catch (error: any) {
                                      alert(t.error(error.message))
                                    }
                                  }
                                }}
                                className="p-1 bg-red-50 border border-red-200 hover:bg-red-700 rounded-none transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Add/Edit Room Modal */}
                  {showAddRoom && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white rounded-none p-3 max-w-md w-full mx-4 border border-gray-200">
                        <h3 className="text-xs font-semibold mb-4">
                          {editingRoom ? t.editRoom : t.addNewRoom}
                        </h3>
                        <div className="space-y-2">
                          <div>
                            <label className="block text-xs font-medium mb-2">{t.outletLocation}</label>
                            <select
                              value={newRoom.outlet_id}
                              onChange={(e) => setNewRoom({ ...newRoom, outlet_id: e.target.value })}
                              className="w-full px-2 py-1.5 bg-gray-100 border border-gray-200 rounded-none text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                              <option value="">{t.selectOutletOptional}</option>
                              {outlets.map((outlet) => (
                                <option key={outlet.id} value={outlet.id}>
                                  {outlet.name} - {outlet.city}
                                </option>
                              ))}
                            </select>
                            <p className="text-gray-500 text-xs mt-1">
                              {outlets.length === 0 ? t.noOutletsAvailable : t.selectLocationHelp}
                            </p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-2">{t.roomNumberRequired}</label>
                            <input
                              type="text"
                              value={newRoom.room_number}
                              onChange={(e) => setNewRoom({ ...newRoom, room_number: e.target.value })}
                              placeholder={t.roomNumberPlaceholder}
                              className="w-full px-2 py-1.5 bg-gray-100 border border-gray-200 rounded-none text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-2">{t.roomNameOptional}</label>
                            <input
                              type="text"
                              value={newRoom.room_name}
                              onChange={(e) => setNewRoom({ ...newRoom, room_name: e.target.value })}
                              placeholder={t.roomNamePlaceholder}
                              className="w-full px-2 py-1.5 bg-gray-100 border border-gray-200 rounded-none text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={async () => {
                              if (!newRoom.room_number) {
                                alert(t.pleaseEnterRoomNumber)
                                return
                              }
                              try {
                                const roomData = editingRoom
                                  ? { id: editingRoom.id, ...newRoom }
                                  : newRoom
                                const savedRoom = await saveRoom(roomData, selectedBusinessUnit)
                                if (editingRoom) {
                                  setRooms(rooms.map(r => r.id === savedRoom.id ? savedRoom : r))
                                } else {
                                  setRooms([...rooms, savedRoom])
                                }
                                setShowAddRoom(false)
                                setNewRoom({ room_number: '', room_name: '', outlet_id: '' })
                                setEditingRoom(null)
                                alert(t.roomSaved)
                              } catch (error: any) {
                                alert(t.error(error.message))
                              }
                            }}
                            className="flex-1 bg-green-50 border border-green-200 hover:bg-green-100 px-3 py-1.5 rounded-none text-xs transition-colors"
                          >
                            {editingRoom ? t.update : t.create}
                          </button>
                          <button
                            onClick={() => {
                              setShowAddRoom(false)
                              setNewRoom({ room_number: '', room_name: '', outlet_id: '' })
                              setEditingRoom(null)
                            }}
                            className="flex-1 bg-gray-200 hover:bg-gray-100 px-3 py-1.5 rounded-none text-xs transition-colors"
                          >
                            {t.cancel}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Manage Room Services Modal */}
                  {showRoomServices && selectedRoomForServices && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white rounded-none p-3 max-w-2xl w-full mx-4 border border-gray-200 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xs font-semibold mb-4">
                          {t.manageServicesForRoom(selectedRoomForServices.room_number)}
                        </h3>
                        <p className="text-gray-500 text-xs mb-4">
                          {t.roomServicesDescription}
                        </p>
                        <div className="space-y-2 mb-3">
                          {services.length === 0 ? (
                            <p className="text-gray-500 text-xs">{t.noServicesAvailable}</p>
                          ) : (
                            services.map((service) => (
                              <label
                                key={service.id}
                                className="flex items-start gap-2 p-2 bg-gray-100 rounded-none hover:bg-gray-200 cursor-pointer transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={roomServiceIds.includes(service.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setRoomServiceIds([...roomServiceIds, service.id])
                                    } else {
                                      setRoomServiceIds(roomServiceIds.filter(id => id !== service.id))
                                    }
                                  }}
                                  className="mt-1 w-4 h-4"
                                />
                                <div className="flex-1">
                                  <h4 className="font-medium text-xs text-gray-900">{service.name}</h4>
                                  {service.description && (
                                    <p className="text-xs text-gray-500 mt-1">{service.description}</p>
                                  )}
                                  <p className="text-xs text-gray-400 mt-1">
                                    {service.duration_minutes} {t.min}
                                    {service.price && ` • $${service.price}`}
                                  </p>
                                </div>
                              </label>
                            ))
                          )}
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={async () => {
                              try {
                                await saveRoomServices(selectedRoomForServices.id, roomServiceIds)
                                // Reload room services to update the display
                                const roomServicesData = await loadRoomServices()
                                setAllRoomServices(roomServicesData || [])
                                setShowRoomServices(false)
                                setSelectedRoomForServices(null)
                                setRoomServiceIds([])
                                alert(
                                  roomServiceIds.length === 0
                                    ? t.roomCanHandleAny
                                    : t.roomCanHandle(roomServiceIds.length)
                                )
                              } catch (error: any) {
                                alert(t.error(error.message))
                              }
                            }}
                            className="px-3 py-1.5 bg-green-50 border border-green-200 hover:bg-green-100 rounded-none text-xs transition-colors"
                          >
                            {t.saveServices}
                          </button>
                          <button
                            onClick={() => {
                              setShowRoomServices(false)
                              setSelectedRoomForServices(null)
                              setRoomServiceIds([])
                            }}
                            className="px-3 py-1.5 bg-gray-200 hover:bg-gray-100 rounded-none text-xs transition-colors"
                          >
                            {t.cancel}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* AI Model Settings Tab */}
          {activeTab === 'aimodel' && (
            <div>
              <h2 className="text-xs font-bold mb-3 flex items-center gap-2">
                <Settings className="w-6 h-6 text-cyan-600" />
                {t.aiModelSettings}
              </h2>

              <div className="bg-gray-100 rounded-none p-3 border border-gray-200 max-w-3xl">
                <div className="mb-3">
                  <p className="text-gray-600 mb-4">
                    {t.aiModelDescription}
                  </p>
                  <div className="bg-blue-50 border border-blue-700 rounded-none p-4 mb-3">
                    <p className="text-blue-600 text-xs" dangerouslySetInnerHTML={{ __html: t.securityNote }} />
                  </div>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault()
                  handleSaveLLMSettings()
                }} className="space-y-6">
                  {/* Provider Selection */}
                  <div>
                    <label className="block text-xs font-medium mb-2">
                      {t.llmProvider}
                    </label>
                    <select
                      value={llmSettings.provider}
                      onChange={(e) => setLLMSettings({ ...llmSettings, provider: e.target.value as any })}
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-none focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="anthropic">{t.providerAnthropic}</option>
                      <option value="ollama">{t.providerOllama}</option>
                      <option value="openai">{t.providerOpenAI}</option>
                    </select>
                  </div>

                  {/* Model Name */}
                  <div>
                    <label className="block text-xs font-medium mb-2">
                      {t.modelName}
                    </label>
                    <input
                      type="text"
                      value={llmSettings.model}
                      onChange={(e) => setLLMSettings({ ...llmSettings, model: e.target.value })}
                      placeholder={
                        llmSettings.provider === 'anthropic' ? t.modelPlaceholderAnthropic :
                        llmSettings.provider === 'ollama' ? t.modelPlaceholderOllama :
                        t.modelPlaceholderOpenAI
                      }
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-none focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      required
                    />
                    <p className="text-gray-500 text-xs mt-1">
                      {llmSettings.provider === 'anthropic' && t.modelExamplesAnthropic}
                      {llmSettings.provider === 'ollama' && t.modelExamplesOllama}
                      {llmSettings.provider === 'openai' && t.modelExamplesOpenAI}
                    </p>
                  </div>

                  {/* Ollama Base URL */}
                  {llmSettings.provider === 'ollama' && (
                    <div>
                      <label className="block text-xs font-medium mb-2">
                        {t.ollamaBaseUrl}
                      </label>
                      <input
                        type="url"
                        value={llmSettings.ollamaUrl}
                        onChange={(e) => setLLMSettings({ ...llmSettings, ollamaUrl: e.target.value })}
                        placeholder={t.ollamaUrlPlaceholder}
                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-none focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-xs"
                        required
                      />
                      <p className="text-gray-500 text-xs mt-1" dangerouslySetInnerHTML={{ __html: t.ollamaHelp + ' <a href="https://ollama.com/" target="_blank" rel="noopener noreferrer" class="text-cyan-600 hover:underline">Install Ollama</a>' }} />
                    </div>
                  )}

                  {/* Temperature */}
                  <div>
                    <label className="block text-xs font-medium mb-2">
                      {t.temperature(llmSettings.temperature.toString())}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={llmSettings.temperature}
                      onChange={(e) => setLLMSettings({ ...llmSettings, temperature: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                    <p className="text-gray-500 text-xs mt-1">
                      {t.temperatureHelp}
                    </p>
                  </div>

                  {/* Save Button */}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-cyan-50 border border-cyan-200 hover:from-cyan-600 hover:to-blue-600 text-gray-900 px-6 py-3 rounded-none font-medium transition-all flex items-center justify-center gap-2"
                    >
                      <Save className="w-5 h-5" />
                      {t.saveSettings}
                    </button>
                  </div>

                  {/* Current Status */}
                  {llmSettings.provider && (
                    <div className="mt-6 p-4 bg-white rounded-none border border-gray-200">
                      <h4 className="font-medium mb-2 text-green-600">{t.currentConfiguration}</h4>
                      <div className="space-y-1 text-xs text-gray-600">
                        <p><strong>{t.provider}:</strong> {llmSettings.provider}</p>
                        <p><strong>{t.model}:</strong> {llmSettings.model}</p>
                        <p><strong>Temperature:</strong> {llmSettings.temperature}</p>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          language={selectedLanguage}
        />
      )}

      <AddLocaleModal
        isOpen={showAddLocaleModal}
        onClose={() => setShowAddLocaleModal(false)}
        businessUnitId={selectedBusinessUnit}
        existingLocales={availableLocales}
        onLocaleCreated={(country, language) => {
          setAvailableLocales(prev => [...prev, { country, language_code: language }])
          setSelectedCountry(country)
          setSelectedLangCode(language)
          setSelectedLanguage(langCodeToLanguage(language))
        }}
      />
    </div>
  )
}

export default AITrainingCenter