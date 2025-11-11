'use client'

import { useState, useEffect } from 'react'
import {
  Play,
  Users,
  MessageSquare,
  Star,
  Clock,
  Target,
  Plus,
  Send,
  RotateCcw,
  CheckCircle,
  User,
  Bot,
  Timer,
  BarChart3,
  Settings,
  Trash2,
  Edit,
  Pause,
  Loader2
} from 'lucide-react'
import {
  loadAIStaff, saveAIStaff, deleteAIStaff,
  loadTrainingScenarios, saveTrainingScenario, deleteTrainingScenario,
  loadTrainingSessions, saveTrainingSession
} from '@/lib/api-client'

interface CustomerPersona {
  id: string
  name: string
  personality: string
  traits: string[]
  difficulty: 'Easy' | 'Medium' | 'Hard'
  color: string
  description: string
}

interface TrainingScenario {
  id: string
  name: string
  description: string
  customerType: string
  scenario: string
  objectives: string[]
  timeframeMins: number
  isActive: boolean
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
}

interface TrainingSession {
  id: string
  scenarioId: string
  status: 'running' | 'completed' | 'paused'
  startTime: Date
  endTime?: Date
  score?: number
  customerPersona: string
  sessionNotes?: string
  scenario?: TrainingScenario
  conversation: Message[]
  feedback: string[]
  objectives: string[]
  summary: string
}

interface Message {
  id: string
  sessionId: string
  sender: 'user' | 'customer'
  message: string
  timestamp: Date
  metadata?: {
    confidence?: number
    intent?: string
    emotion?: string
  }
}

interface SessionStats {
  totalSessions: number
  completedSessions: number
  averageScore: number
  successRate: number
}

interface RoleplayTrainingProps {
  onTrainingSessionsUpdate?: (sessions: TrainingSession[]) => void
  businessUnit: string
  knowledgeEntries: any[]
  guidelines: any[]
  onAddGuideline?: (guideline: {
    category: 'roleplay' | 'general'
    title: string
    content: string
  }) => void
}

interface AIStaff {
  id: string
  name: string
  role: 'coach' | 'sales' | 'customer-service' | 'scientist'
  createdAt: Date
  trainingMemory: {[key: string]: string[]}
  totalSessions: number
}

// NO HARDCODED PROMPTS - AI will use:
// 1. Scenario descriptions created by user
// 2. Knowledge base content uploaded by user
// 3. Training guidelines created by user

const RoleplayTraining = ({ onTrainingSessionsUpdate, businessUnit, knowledgeEntries, guidelines, onAddGuideline }: RoleplayTrainingProps) => {
  const [selectedScenario, setSelectedScenario] = useState<TrainingScenario | null>(null)
  const [activeSession, setActiveSession] = useState<TrainingSession | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [sessionTimer, setSessionTimer] = useState(0)
  const [showCreateScenario, setShowCreateScenario] = useState(false)
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false)
  const [scenarios, setScenarios] = useState<TrainingScenario[]>([])
  const [stats, setStats] = useState<SessionStats>({
    totalSessions: 0,
    completedSessions: 0,
    averageScore: 0,
    successRate: 0
  })
  const [manualMode, setManualMode] = useState(false)
  const [autoConversationTimeout, setAutoConversationTimeout] = useState<NodeJS.Timeout | null>(null)
  const [showPromptEditor, setShowPromptEditor] = useState(false)
  const [aiCoachPrompt, setAiCoachPrompt] = useState('')
  const [isTrainingActive, setIsTrainingActive] = useState(false)
  const [trainingSpeed, setTrainingSpeed] = useState(3)
  const [selectedCustomerType, setSelectedCustomerType] = useState('random')
  const [showControlPanel, setShowControlPanel] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [completedTrainingSessions, setCompletedTrainingSessions] = useState<TrainingSession[]>([])
  const [sessionFeedback, setSessionFeedback] = useState<string[]>([])
  const [trainingMemory, setTrainingMemory] = useState<{[key: string]: string[]}>({})
  const [generatingWho, setGeneratingWho] = useState<'customer' | 'coach' | null>(null)
  const [selectedRole, setSelectedRole] = useState<'coach' | 'sales' | 'customer-service' | 'scientist'>('coach')
  const [aiStaffList, setAiStaffList] = useState<AIStaff[]>([])
  const [selectedStaff, setSelectedStaff] = useState<AIStaff | null>(null)
  const [showStaffCreator, setShowStaffCreator] = useState(false)
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null)
  const [editingStaffName, setEditingStaffName] = useState('')
  // knowledgeEntries and guidelines are now passed as props (knowledgeEntries and guidelines)

  // Customer personas inspired by brezcode-platform
  const customerPersonas: CustomerPersona[] = [
    {
      id: 'angry',
      name: 'Frustrated Sarah',
      personality: 'Angry Customer',
      traits: ['Impatient', 'Demanding', 'Skeptical'],
      difficulty: 'Hard',
      color: 'bg-red-500',
      description: 'Customer with a bad experience who needs careful handling'
    },
    {
      id: 'confused',
      name: 'Confused Mike',
      personality: 'Confused Customer',
      traits: ['Uncertain', 'Needs guidance', 'Asks many questions'],
      difficulty: 'Medium',
      color: 'bg-yellow-500',
      description: 'Customer who needs clear explanations and step-by-step help'
    },
    {
      id: 'price-sensitive',
      name: 'Budget-conscious Emma',
      personality: 'Price-Sensitive Customer',
      traits: ['Cost-conscious', 'Needs value', 'Compares options'],
      difficulty: 'Medium',
      color: 'bg-orange-500',
      description: 'Customer focused on getting the best value for money'
    },
    {
      id: 'tech-savvy',
      name: 'Tech-savvy Alex',
      personality: 'Tech-Savvy Customer',
      traits: ['Detail-oriented', 'Knowledgeable', 'Wants specifics'],
      difficulty: 'Easy',
      color: 'bg-blue-500',
      description: 'Customer with technical knowledge who asks detailed questions'
    },
    {
      id: 'enthusiastic',
      name: 'Enthusiastic Lisa',
      personality: 'Enthusiastic Customer',
      traits: ['Excited', 'Eager to learn', 'Open to suggestions'],
      difficulty: 'Easy',
      color: 'bg-green-500',
      description: 'Customer who is excited about skincare and eager to try new products'
    }
  ]

  // Role-specific scenarios - Pre-populated with common training scenarios
  const roleSpecificScenarios: Record<string, TrainingScenario[]> = {
    coach: [
      {
        id: 'coach-1',
        name: 'First-Time Customer Guidance',
        description: 'Help a new customer understand product benefits and usage',
        scenario: 'A new customer is confused about which product to choose and how to use it',
        customerType: 'Curious',
        difficulty: 'Beginner',
        timeframeMins: 15,
        successCriteria: ['Explained product benefits clearly', 'Provided usage instructions', 'Made customer feel confident']
      },
      {
        id: 'coach-2',
        name: 'Skeptical Customer Education',
        description: 'Address concerns and build trust with a skeptical customer',
        scenario: 'Customer is unsure if products will work for their specific needs',
        customerType: 'Skeptical',
        difficulty: 'Intermediate',
        timeframeMins: 20,
        successCriteria: ['Addressed specific concerns', 'Provided evidence/testimonials', 'Built credibility']
      },
      {
        id: 'coach-3',
        name: 'Advanced Product Consultation',
        description: 'Guide an experienced customer to optimize their routine',
        customerType: 'Educated',
        difficulty: 'Advanced',
        scenario: 'An informed customer wants to improve their current routine with advanced tips',
        timeframeMins: 25,
        successCriteria: ['Provided expert-level insights', 'Customized recommendations', 'Deepened customer knowledge']
      }
    ],
    sales: [
      {
        id: 'sales-1',
        name: 'Upsell to Premium Products',
        description: 'Convince customer to upgrade to premium product line',
        scenario: 'Customer is interested in basic products but could benefit from premium options',
        customerType: 'Budget-Conscious',
        difficulty: 'Intermediate',
        timeframeMins: 15,
        successCriteria: ['Highlighted premium benefits', 'Addressed price concerns', 'Created desire for upgrade']
      },
      {
        id: 'sales-2',
        name: 'Handle Price Objection',
        description: 'Overcome price resistance and demonstrate value',
        scenario: 'Customer loves the product but says it\'s too expensive',
        customerType: 'Budget-Conscious',
        difficulty: 'Advanced',
        timeframeMins: 20,
        successCriteria: ['Justified pricing with value', 'Offered payment options', 'Closed the sale']
      },
      {
        id: 'sales-3',
        name: 'Bundle Sale Opportunity',
        description: 'Create a compelling bundle offer for maximum value',
        scenario: 'Customer is buying one product - opportunity to create a complete routine bundle',
        customerType: 'Curious',
        difficulty: 'Intermediate',
        timeframeMins: 15,
        successCriteria: ['Identified complementary products', 'Created compelling bundle', 'Increased order value']
      }
    ],
    "customer-service": [
      {
        id: 'cs-1',
        name: 'Product Issue Resolution',
        description: 'Resolve a complaint about product not meeting expectations',
        scenario: 'Customer is unhappy because product didn\'t deliver expected results',
        customerType: 'Frustrated',
        difficulty: 'Intermediate',
        timeframeMins: 20,
        successCriteria: ['Showed empathy', 'Identified root cause', 'Provided solution', 'Restored satisfaction']
      },
      {
        id: 'cs-2',
        name: 'Shipping Delay Management',
        description: 'Calm an upset customer about delayed order',
        scenario: 'Customer\'s order is delayed and they\'re very frustrated',
        customerType: 'Frustrated',
        difficulty: 'Advanced',
        timeframeMins: 15,
        successCriteria: ['Apologized sincerely', 'Explained situation', 'Offered compensation', 'Retained customer']
      },
      {
        id: 'cs-3',
        name: 'Return and Refund Request',
        description: 'Process return while attempting to retain customer',
        scenario: 'Customer wants to return product and get refund',
        customerType: 'Budget-Conscious',
        difficulty: 'Intermediate',
        timeframeMins: 15,
        successCriteria: ['Understood reason for return', 'Offered alternatives', 'Processed smoothly']
      }
    ],
    scientist: [
      {
        id: 'sci-1',
        name: 'Explain Scientific Benefits',
        description: 'Provide evidence-based explanation of product ingredients',
        scenario: 'Customer wants to know the science behind how products work',
        customerType: 'Educated',
        difficulty: 'Advanced',
        timeframeMins: 25,
        successCriteria: ['Explained mechanisms scientifically', 'Cited research', 'Made it understandable']
      },
      {
        id: 'sci-2',
        name: 'Address Safety Concerns',
        description: 'Provide scientific reassurance about product safety',
        scenario: 'Customer is concerned about ingredients and potential side effects',
        customerType: 'Skeptical',
        difficulty: 'Intermediate',
        timeframeMins: 20,
        successCriteria: ['Addressed safety scientifically', 'Explained testing/certifications', 'Built confidence']
      },
      {
        id: 'sci-3',
        name: 'Compare to Competitors',
        description: 'Use scientific evidence to differentiate from competitors',
        scenario: 'Customer is comparing your product to competitor products',
        customerType: 'Educated',
        difficulty: 'Advanced',
        timeframeMins: 20,
        successCriteria: ['Highlighted unique formulation', 'Provided comparative data', 'Established superiority']
      }
    ]
  }

  // Legacy default scenarios for backward compatibility
  const defaultScenarios: TrainingScenario[] = roleSpecificScenarios.coach

  useEffect(() => {
    initializeData()
  }, [])

  // Selected role is session-specific state (no need to persist)

  // Update scenarios when role changes
  useEffect(() => {
    const roleScenarios = roleSpecificScenarios[selectedRole] || defaultScenarios
    setScenarios(roleScenarios)
  }, [selectedRole])

  const createNewStaff = async (name: string, role: 'coach' | 'sales' | 'customer-service' | 'scientist') => {
    const newStaff: AIStaff = {
      id: crypto.randomUUID(),
      name,
      role,
      createdAt: new Date(),
      trainingMemory: {},
      totalSessions: 0
    }
    await saveAIStaff(newStaff)
    const updatedList = [...aiStaffList, newStaff]
    setAiStaffList(updatedList)
    setSelectedStaff(newStaff)
    setSelectedRole(role)
    setShowStaffCreator(false)
  }

  const selectStaff = (staff: AIStaff) => {
    setSelectedStaff(staff)
    setSelectedRole(staff.role)
    setTrainingMemory(staff.trainingMemory || {})
  }

  const handleDoubleClickStaff = (staff: AIStaff) => {
    setEditingStaffId(staff.id)
    setEditingStaffName(staff.name)
  }

  const handleStaffNameChange = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const newName = editingStaffName.trim()

      if (newName === '') {
        // Delete staff if name is blank
        await deleteAIStaff(editingStaffId!)
        const updatedList = aiStaffList.filter(s => s.id !== editingStaffId)
        setAiStaffList(updatedList)

        // If deleted staff was selected, select first available or null
        if (selectedStaff?.id === editingStaffId) {
          if (updatedList.length > 0) {
            setSelectedStaff(updatedList[0])
            setSelectedRole(updatedList[0].role)
          } else {
            setSelectedStaff(null)
          }
        }
      } else {
        // Update staff name
        const updatedStaff = aiStaffList.find(s => s.id === editingStaffId)
        if (updatedStaff) {
          const staffToUpdate = { ...updatedStaff, name: newName }
          await saveAIStaff(staffToUpdate)
          const updatedList = aiStaffList.map(s =>
            s.id === editingStaffId ? staffToUpdate : s
          )
          setAiStaffList(updatedList)

          // Update selected staff if it was the one being edited
          if (selectedStaff?.id === editingStaffId) {
            setSelectedStaff(staffToUpdate)
          }
        }
      }

      setEditingStaffId(null)
      setEditingStaffName('')
    } else if (e.key === 'Escape') {
      setEditingStaffId(null)
      setEditingStaffName('')
    }
  }

  const handleDeleteScenario = async (scenarioId: string) => {
    await deleteTrainingScenario(scenarioId)
    const updatedScenarios = scenarios.filter(s => s.id !== scenarioId)
    setScenarios(updatedScenarios)
  }

  // Scenario templates - defined at module level so we can check availability
  const scenarioTemplates = {
    coach: [
      { name: 'Product Recommendation', desc: 'Help customer choose the right product', scenario: 'Customer is overwhelmed by choices and needs guidance', criteria: ['Understood customer needs', 'Recommended appropriate products', 'Built customer confidence'] },
      { name: 'Ingredient Education', desc: 'Explain product ingredients and benefits', scenario: 'Customer wants to understand what\'s in the product and why', criteria: ['Explained key ingredients clearly', 'Connected benefits to customer needs', 'Addressed safety concerns'] },
      { name: 'Routine Building', desc: 'Create a personalized product routine', scenario: 'Customer wants help building a complete routine', criteria: ['Assessed customer needs', 'Created tailored routine', 'Explained usage order'] },
      { name: 'First-Time User Guidance', desc: 'Onboard a brand new customer', scenario: 'Customer has never used these products before', criteria: ['Made customer comfortable', 'Explained basics clearly', 'Set realistic expectations'] },
      { name: 'Skin Concern Analysis', desc: 'Help identify and address skin concerns', scenario: 'Customer has specific skin issues they want help with', criteria: ['Asked diagnostic questions', 'Identified root causes', 'Recommended solutions'] },
      { name: 'Product Comparison', desc: 'Compare different product options', scenario: 'Customer wants to know differences between similar products', criteria: ['Highlighted key differences', 'Matched to customer needs', 'Helped make decision'] },
    ],
    sales: [
      { name: 'Cross-Sell Opportunity', desc: 'Identify and sell complementary products', scenario: 'Customer is purchasing one item - opportunity to suggest related products', criteria: ['Identified needs', 'Suggested relevant products', 'Increased basket size'] },
      { name: 'Limited Time Offer', desc: 'Create urgency with promotions', scenario: 'Customer is browsing but hasn\'t committed to purchase', criteria: ['Highlighted promotion value', 'Created urgency', 'Closed the sale'] },
      { name: 'Objection Handling', desc: 'Overcome customer hesitation', scenario: 'Customer has concerns preventing purchase', criteria: ['Identified objection', 'Addressed concerns effectively', 'Moved toward close'] },
      { name: 'Value Demonstration', desc: 'Show ROI and long-term value', scenario: 'Customer questions if investment is worth it', criteria: ['Calculated value', 'Showed long-term benefits', 'Justified price'] },
      { name: 'Competitor Comparison', desc: 'Position against competitor products', scenario: 'Customer is comparing us to competitors', criteria: ['Highlighted differentiators', 'Addressed competitor weaknesses', 'Won the comparison'] },
      { name: 'Subscription Upsell', desc: 'Convert one-time buyer to subscriber', scenario: 'Customer making one-time purchase but could benefit from subscription', criteria: ['Explained subscription benefits', 'Overcame commitment concerns', 'Secured recurring revenue'] },
    ],
    'customer-service': [
      { name: 'Wrong Item Received', desc: 'Handle wrong product delivery complaint', scenario: 'Customer received wrong item and is frustrated', criteria: ['Apologized sincerely', 'Arranged replacement', 'Compensated appropriately'] },
      { name: 'Product Not Working', desc: 'Troubleshoot product effectiveness issue', scenario: 'Customer says product isn\'t working as expected', criteria: ['Asked diagnostic questions', 'Identified issue', 'Provided solution'] },
      { name: 'Cancellation Request', desc: 'Handle subscription cancellation professionally', scenario: 'Customer wants to cancel their subscription', criteria: ['Understood reason', 'Offered alternatives', 'Retained or gracefully released'] },
      { name: 'Delayed Shipment', desc: 'Manage delivery delay complaints', scenario: 'Order is late and customer is upset', criteria: ['Acknowledged frustration', 'Investigated status', 'Provided update and solution'] },
      { name: 'Damaged Product', desc: 'Handle damaged delivery complaint', scenario: 'Product arrived broken or damaged', criteria: ['Showed empathy', 'Expedited replacement', 'Prevented future issues'] },
      { name: 'Refund Processing', desc: 'Handle refund request smoothly', scenario: 'Customer wants money back', criteria: ['Processed quickly', 'Explained timeline', 'Maintained relationship'] },
    ],
    scientist: [
      { name: 'Clinical Study Questions', desc: 'Explain research backing products', scenario: 'Customer wants scientific evidence of effectiveness', criteria: ['Cited relevant studies', 'Explained methodology', 'Answered scientifically'] },
      { name: 'Ingredient Interaction', desc: 'Address ingredient compatibility concerns', scenario: 'Customer worried about mixing ingredients', criteria: ['Explained interactions', 'Provided safety guidance', 'Recommended usage'] },
      { name: 'Allergen Inquiry', desc: 'Provide detailed allergen information', scenario: 'Customer has allergies and needs detailed ingredient info', criteria: ['Listed potential allergens', 'Suggested alternatives', 'Ensured safety'] },
      { name: 'Formulation Science', desc: 'Explain how product formulations work', scenario: 'Customer wants to understand the science behind formulation', criteria: ['Explained chemistry', 'Made it accessible', 'Built credibility'] },
      { name: 'Efficacy Timeline', desc: 'Set scientific expectations for results', scenario: 'Customer wants to know when they\'ll see results', criteria: ['Explained biological timeline', 'Referenced research', 'Set realistic expectations'] },
      { name: 'Pregnancy Safety', desc: 'Address safety during pregnancy', scenario: 'Pregnant customer needs safety information', criteria: ['Provided safety data', 'Recommended safe alternatives', 'Consulted guidelines'] },
    ]
  }

  // Check if all templates have been used for current role
  const allTemplatesUsed = () => {
    const allTemplates = scenarioTemplates[selectedRole]
    const existingNames = new Set(scenarios.map(s => s.name))
    const availableTemplates = allTemplates.filter(t => !existingNames.has(t.name))
    return availableTemplates.length === 0
  }

  const handleGenerateScenarios = async () => {
    const customerTypes = ['Curious', 'Skeptical', 'Budget-Conscious', 'Educated', 'Frustrated', 'Enthusiastic']
    const difficulties = ['Beginner', 'Intermediate', 'Advanced']

    // Get templates for current role
    const allTemplates = scenarioTemplates[selectedRole]

    // Find which templates are NOT already used
    const existingNames = new Set(scenarios.map(s => s.name))
    const availableTemplates = allTemplates.filter(t => !existingNames.has(t.name))

    // Only generate if we have unused templates - NO REPEATS
    if (availableTemplates.length === 0) {
      return // All templates used, do nothing
    }

    // Take up to 3 from available templates
    const templatesToUse = availableTemplates.slice(0, 3)

    // Generate scenarios from available templates
    const newScenarios: TrainingScenario[] = []
    for (let i = 0; i < templatesToUse.length; i++) {
      const template = templatesToUse[i]
      const randomCustomer = customerTypes[Math.floor(Math.random() * customerTypes.length)]
      const randomDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)]

      newScenarios.push({
        id: crypto.randomUUID(),
        name: template.name,
        description: template.desc,
        scenario: template.scenario,
        customerType: randomCustomer,
        difficulty: randomDifficulty as 'Beginner' | 'Intermediate' | 'Advanced',
        timeframeMins: 15 + (i * 5),
        successCriteria: template.criteria
      })
    }

    if (newScenarios.length > 0) {
      // Save each scenario to Supabase
      for (const scenario of newScenarios) {
        await saveTrainingScenario(scenario)
      }
      const updatedScenarios = [...scenarios, ...newScenarios]
      setScenarios(updatedScenarios)
    }
  }

  // Timer effect for active sessions
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isSessionActive && activeSession) {
      interval = setInterval(() => {
        setSessionTimer((prev) => prev + 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isSessionActive, activeSession])

  const initializeData = async () => {
    try {
      // Load AI Staff from Supabase
      const staff = await loadAIStaff()
      if (staff && staff.length > 0) {
        setAiStaffList(staff)
        // Select first staff by default
        setSelectedStaff(staff[0])
        setSelectedRole(staff[0].role)
      } else {
        // Create default AI staff member
        const defaultStaff: AIStaff = {
          id: crypto.randomUUID(),
          name: 'Dr. Sakura',
          role: 'coach',
          createdAt: new Date(),
          trainingMemory: {},
          totalSessions: 0
        }
        await saveAIStaff(defaultStaff)
        setAiStaffList([defaultStaff])
        setSelectedStaff(defaultStaff)
      }

      // Load scenarios from Supabase
      const savedScenarios = await loadTrainingScenarios()
      if (savedScenarios && savedScenarios.length > 0) {
        setScenarios(savedScenarios)
      } else {
        // Initialize with role-specific defaults
        const initialScenarios = roleSpecificScenarios[selectedRole] || defaultScenarios
        setScenarios(initialScenarios)
        // Save defaults to Supabase
        for (const scenario of initialScenarios) {
          await saveTrainingScenario(scenario)
        }
      }

      // Note: Session stats, selected role, and AI coach prompt are session-specific
      // and don't need to persist across page loads (kept in React state only)

      console.log('✅ Loaded roleplay training data from Supabase')
    } catch (error) {
      // Suppress RLS policy errors (common when policies aren't set up yet)
      const errorMessage = (error as any)?.message || error
      if (typeof errorMessage === 'string' &&
          (errorMessage.includes('infinite recursion') ||
           errorMessage.includes('policy') ||
           errorMessage.includes('permission denied'))) {
        console.log('⚠️ Roleplay training: RLS policies need configuration (run migration 006)')
        return
      }

      // Only log if it's an actual error with a message
      if (error && (error as any).message) {
        console.error('❌ Error initializing roleplay data:', (error as any).message)
      } else if (error && typeof error === 'string') {
        console.error('❌ Error initializing roleplay data:', error)
      }
      // Suppress empty error objects {}
    }

    // Knowledge base and guidelines are now passed as props from parent component
    // No need to load from localStorage here - parent handles that
  }

  const handleStartSession = async (scenario: TrainingScenario) => {
    // Helper function to check if ID is a valid UUID
    const isValidUUID = (id: string) => {
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    }

    // If scenario doesn't have a valid UUID, save it to the database first
    let scenarioToUse = scenario
    if (!isValidUUID(scenario.id)) {
      console.log('Scenario has template ID, saving to database first...')
      try {
        const savedScenario = await saveTrainingScenario(scenario)
        scenarioToUse = { ...scenario, id: savedScenario.id }
        // Update the scenarios list with the new UUID
        setScenarios(prev => prev.map(s => s.id === scenario.id ? scenarioToUse : s))
      } catch (error) {
        console.error('Failed to save scenario:', error)
        alert('Failed to save scenario to database. Please try again.')
        return
      }
    }

    const newSession: TrainingSession = {
      id: Date.now().toString(),
      scenarioId: scenarioToUse.id,
      status: 'running',
      startTime: new Date(),
      customerPersona: scenarioToUse.customerType
    }

    setSelectedScenario(scenarioToUse)
    setActiveSession(newSession)
    setIsSessionActive(true)
    setMessages([])
    setSessionTimer(0)

    // Start AI vs AI conversation
    startAIConversation(scenarioToUse)
  }

  const startAIConversation = async (scenario: TrainingScenario) => {
    // Generate initial customer message
    await generateInitialCustomerMessage(scenario)

    // Start automated conversation after initial message
    setTimeout(() => {
      if (activeSession && selectedScenario) {
        continueAIConversation(scenario, 1)
      }
    }, 2000)
  }

  const generateInitialCustomerMessage = async (scenario: TrainingScenario) => {
    const persona = customerPersonas.find(p => p.id === scenario.customerType)

    // Generate AI-powered initial customer message based on scenario
    let initialMessage = ''

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Generate a realistic initial customer message for this scenario:

Scenario: ${scenario.name}
Description: ${scenario.scenario}
Customer Personality: ${persona?.personality || 'Customer'}
Customer Traits: ${persona?.traits.join(', ') || 'General customer'}

The customer should naturally bring up their issue or question based on the scenario description. Keep it conversational and realistic (1-3 sentences). Act as if you ARE the customer starting the conversation.`,
          context: 'roleplay-initial-message'
        })
      })

      if (response.ok) {
        const data = await response.json()
        initialMessage = data.response || `Hi, I have a question about ${scenario.name.toLowerCase()}.`
      } else {
        initialMessage = `Hi, I have a question about ${scenario.name.toLowerCase()}.`
      }
    } catch (error) {
      console.error('Error generating initial message:', error)
      initialMessage = `Hi, I have a question about ${scenario.name.toLowerCase()}.`
    }

    const customerMessage: Message = {
      id: Date.now().toString(),
      sessionId: activeSession?.id || '',
      sender: 'customer',
      message: initialMessage,
      timestamp: new Date(),
      metadata: {
        emotion: getPersonalityEmotion(scenario.customerType),
        intent: 'initial_inquiry'
      }
    }

    setMessages([customerMessage])

    // Generate AI coach response immediately after customer message
    setTimeout(async () => {
      setIsGeneratingResponse(true)
      try {
        const coachResponse = await generateAICoachResponseToAll(initialMessage, scenario)

        const coachMessage: Message = {
          id: (Date.now() + 1).toString(),
          sessionId: activeSession?.id || '',
          sender: 'user', // AI Coach
          message: coachResponse,
          timestamp: new Date(),
          metadata: {
            intent: 'coach_response',
            confidence: Math.random() * 0.3 + 0.7
          }
        }

        setMessages(prev => [...prev, coachMessage])
      } catch (error) {
        console.error('Error generating initial coach response:', error)

        // NO FALLBACK IN TRAINING! Show the real error
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          sessionId: activeSession?.id || '',
          sender: 'user',
          message: `❌ TRAINING ERROR: Failed to generate initial coach response - ${error instanceof Error ? error.message : 'Unknown error'}. Training cannot continue with fallback responses!`,
          timestamp: new Date(),
          metadata: {
            intent: 'training_error_initial',
            confidence: 0,
            error: true
          }
        }
        setMessages(prev => [...prev, errorMessage])
      }
      setIsGeneratingResponse(false)
    }, 1500)
  }

  const getPersonalityEmotion = (customerType: string): string => {
    const emotions = {
      angry: '😠',
      confused: '😕',
      'price-sensitive': '💰',
      'tech-savvy': '🤓',
      enthusiastic: '😍'
    }
    return emotions[customerType as keyof typeof emotions] || '😊'
  }

  const continueAIConversation = async (scenario: TrainingScenario, turn: number) => {
    if (!activeSession || !isSessionActive || turn > 8 || manualMode) {
      // Auto-complete session after 8 turns or if manual mode is enabled
      if (turn > 8) {
        const timeout = setTimeout(() => handleCompleteSession(), 2000)
        setAutoConversationTimeout(timeout)
      }
      return
    }

    setIsGeneratingResponse(true)

    // Generate AI Coach response
    const coachTimeout = setTimeout(async () => {
      if (manualMode) {
        setIsGeneratingResponse(false)
        return
      }

      try {
        // Get the last customer message for context
        const lastCustomerMessage = messages.filter(m => m.sender === 'customer').slice(-1)[0]?.message ||
          'Initial customer inquiry based on scenario'

        const coachResponse = await generateAICoachResponseToAll(lastCustomerMessage, scenario)

        const coachMessage: Message = {
          id: Date.now().toString(),
          sessionId: activeSession.id,
          sender: 'user', // AI Coach
          message: coachResponse,
          timestamp: new Date(),
          metadata: {
            intent: 'coach_response',
            confidence: Math.random() * 0.3 + 0.7
          }
        }

        setMessages(prev => [...prev, coachMessage])
      } catch (error) {
        console.error('Error generating auto coach response:', error)

        // NO FALLBACK IN TRAINING! Show the real error to fix the root cause
        const errorMessage: Message = {
          id: Date.now().toString(),
          sessionId: activeSession.id,
          sender: 'user',
          message: `❌ TRAINING ERROR: AI Coach failed - ${error instanceof Error ? error.message : 'Unknown error'}. Check your Anthropic API key and connection.`,
          timestamp: new Date(),
          metadata: {
            intent: 'training_error',
            confidence: 0,
            error: true
          }
        }
        setMessages(prev => [...prev, errorMessage])
      }

      setIsGeneratingResponse(false)

      // Generate customer response after coach (only if still in auto mode)
      const customerTimeout = setTimeout(async () => {
        if (activeSession && isSessionActive && !manualMode) {
          // Customer response will now be generated by AI Customer Brain API
          await generateAICustomerBrain()

          // Continue conversation (only if still in auto mode)
          const nextTimeout = setTimeout(() => {
            if (!manualMode) {
              continueAIConversation(scenario, turn + 1)
            }
          }, 2000 + Math.random() * 1000)
          setAutoConversationTimeout(nextTimeout)
        }
      }, 1500 + Math.random() * 1000)
      setAutoConversationTimeout(customerTimeout)
    }, 1000 + Math.random() * 1000)
    setAutoConversationTimeout(coachTimeout)
  }

  const handleManualMessage = async () => {
    if (!currentMessage.trim() || !activeSession || !selectedScenario) return

    // Add user message as customer
    const customerMessage: Message = {
      id: Date.now().toString(),
      sessionId: activeSession.id,
      sender: 'customer',
      message: currentMessage.trim(),
      timestamp: new Date(),
      metadata: {
        emotion: '👤',
        intent: 'manual_customer'
      }
    }

    setMessages(prev => [...prev, customerMessage])
    setCurrentMessage('')
    setIsGeneratingResponse(true)
    setGeneratingWho('coach')

    try {
      // Generate AI Coach response using real OpenAI API
      const coachResponse = await generateAICoachResponseToAll(customerMessage.message, selectedScenario)

      const coachMessage: Message = {
        id: Date.now().toString(),
        sessionId: activeSession.id,
        sender: 'user', // AI Coach
        message: coachResponse,
        timestamp: new Date(),
        metadata: {
          intent: 'coach_response_to_manual',
          confidence: Math.random() * 0.3 + 0.7
        }
      }

      setMessages(prev => [...prev, coachMessage])
    } catch (error) {
      console.error('Error generating coach response:', error)

      // Add error message if something goes wrong
      const errorMessage: Message = {
        id: Date.now().toString(),
        sessionId: activeSession.id,
        sender: 'user',
        message: "I apologize, but I'm having trouble generating a response right now. Please try again.",
        timestamp: new Date(),
        metadata: {
          intent: 'error_response',
          confidence: 0
        }
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsGeneratingResponse(false)
      setGeneratingWho(null)
    }
  }

  const generateAICoachResponseToAll = async (customerMessage: string, scenario: TrainingScenario): Promise<string> => {
    try {
      // Get relevant training memory for this scenario type
      const scenarioMemory = trainingMemory[scenario.customerType] || []
      const generalMemory = trainingMemory['general'] || []
      const allRelevantMemory = [...scenarioMemory, ...generalMemory]

      // Call the real OpenAI API with custom prompt including memory
      console.log('🧠 AI Coach Training Memory:', {
        scenario: scenario.name,
        customerType: scenario.customerType,
        customerMessage: customerMessage.substring(0, 50),
        messagesCount: messages.length,
        memoryItems: allRelevantMemory.length,
        scenarioMemoryCount: scenarioMemory.length,
        generalMemoryCount: generalMemory.length,
        allMemory: allRelevantMemory
      })

      console.log('📚 Sending Knowledge Base:', {
        knowledgeEntriesCount: knowledgeEntries?.length || 0,
        guidelinesCount: guidelines?.length || 0,
        firstKBEntry: knowledgeEntries?.[0]
      })

      const response = await fetch('/api/ai/coach-training', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: `You are a ${selectedRole} representative helping a customer.

TRAINING SCENARIO: ${scenario.name}
DESCRIPTION: ${scenario.scenario}
CUSTOMER TYPE: ${scenario.customerType}

SUCCESS CRITERIA TO ACHIEVE:
${scenario.successCriteria && scenario.successCriteria.length > 0 ? scenario.successCriteria.map(obj => `- ${obj}`).join('\n') : '- Complete the training scenario successfully'}

${allRelevantMemory.length > 0 ? `
🚨🚨🚨 CRITICAL TRAINING FEEDBACK - YOU MADE THESE MISTAKES BEFORE - DO NOT REPEAT THEM! 🚨🚨🚨

The trainer has provided the following corrections to your PREVIOUS RESPONSES. You MUST fix these issues NOW:

${allRelevantMemory.map((feedback, index) => `${index + 1}. CORRECTION REQUIRED: ${feedback}`).join('\n')}

⚠️ MANDATORY: You will be RE-EVALUATED on whether you fixed these issues. If you repeat the same mistakes, you FAIL.
⚠️ READ each correction above carefully and APPLY IT to your response.
⚠️ If feedback says "don't mention XR5000", then NEVER mention XR5000 or similar made-up products EVER AGAIN.
⚠️ If feedback says you're hallucinating, STOP making things up and use ONLY the knowledge base.

These corrections OVERRIDE everything else. Fix them NOW!
` : ''}

🚨 CRITICAL ANTI-HALLUCINATION RULES - MUST FOLLOW:
1. ONLY use information EXPLICITLY provided in the knowledge base below
2. NEVER invent or make up ANY product names, model numbers, prices, ingredients, or specific details
3. If you don't know something from the knowledge base, say "I don't have that specific information" or "Let me check with my team"
4. DO NOT mention specific products unless they are EXPLICITLY named in the knowledge base
5. DO NOT make up technical specifications, measurements, percentages, or numbers
6. DO NOT invent product features or benefits not stated in the knowledge base
7. Speak in GENERAL terms about benefits and solutions if specific details aren't in the knowledge base

CONVERSATION MANAGEMENT:
- READ THE ENTIRE CONVERSATION HISTORY to understand the context and emotional state
- PAY ATTENTION to how the customer's emotions are evolving (frustration, escalation, etc.)
- ADAPT your response based on the conversation flow - DO NOT repeat previous responses
- If the customer is getting more frustrated, acknowledge their escalating concerns and adjust your approach
- Focus on achieving the scenario success criteria listed above
- Adapt your approach to the customer's personality (${scenario.customerType})
- Be helpful, professional, and solution-oriented
- NEVER give the same or similar response twice - each response must progress the conversation

RESPONSE GUIDELINES:
- Use ONLY information from the knowledge base below
- If asked about specific products not in the knowledge base, offer to connect them with a specialist or check availability
- Focus on understanding customer needs and providing helpful guidance within your knowledge
- Be honest about limitations - it's better to admit you don't know than to make up information

Respond to the customer's CURRENT message while considering the FULL conversation history and emotional trajectory.`,
          customerMessage,
          conversationHistory: messages.map(m => ({
            sender: m.sender,
            message: m.message,
            timestamp: m.timestamp.toISOString()
          })),
          customerPersona: scenario.customerType,
          scenario: scenario.description,
          knowledgeBase: knowledgeEntries,
          guidelines: guidelines.filter(g => g.category === 'roleplay' || g.category === 'general')
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success || !data.response) {
        throw new Error('Invalid API response')
      }

      return data.response

    } catch (error) {
      console.error('OpenAI API Error:', error)
      console.error('Full error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        scenario: scenario?.name,
        customerMessage: customerMessage?.substring(0, 100),
        responseStatus: error instanceof Error && error.message.includes('API error:') ? error.message : 'Network or other error'
      })

      // For training purposes, we want to know when the real AI fails
      // Don't use fallback - let the error bubble up so you can fix the root cause
      throw new Error(`API error: ${error instanceof Error ? error.message : 'Unknown error'}. Check your Anthropic API.`)
    }
  }


  const handleDirectMessage = async () => {
    if (!currentMessage.trim()) return

    // Add user message as customer
    const customerMessage: Message = {
      id: Date.now().toString(),
      sessionId: 'direct-chat',
      sender: 'customer',
      message: currentMessage.trim(),
      timestamp: new Date(),
      metadata: {
        emotion: '👤',
        intent: 'manual_customer'
      }
    }

    setMessages(prev => [...prev, customerMessage])
    setCurrentMessage('')
    setIsGeneratingResponse(true)
    setGeneratingWho('coach')

    try {
      // Create a basic scenario for direct chat
      const directScenario: TrainingScenario = {
        id: 'direct',
        name: 'Direct Consultation',
        description: 'Direct customer consultation with Dr. Sakura',
        customerType: 'general',
        scenario: 'Customer seeking skincare advice from Dr. Sakura',
        objectives: ['Provide helpful skincare advice'],
        timeframeMins: 30,
        isActive: true,
        difficulty: 'Beginner'
      }

      // Generate AI Coach response using real OpenAI API
      const coachResponse = await generateAICoachResponseToAll(customerMessage.message, directScenario)

      const coachMessage: Message = {
        id: Date.now().toString(),
        sessionId: 'direct-chat',
        sender: 'user', // Dr. Sakura
        message: coachResponse,
        timestamp: new Date(),
        metadata: {
          intent: 'coach_response_direct',
          confidence: Math.random() * 0.3 + 0.7
        }
      }

      setMessages(prev => [...prev, coachMessage])
    } catch (error) {
      console.error('Error generating coach response:', error)

      // Add error message if something goes wrong
      const errorMessage: Message = {
        id: Date.now().toString(),
        sessionId: 'direct-chat',
        sender: 'user',
        message: "I apologize, but I'm having trouble generating a response right now. Please try again.",
        timestamp: new Date(),
        metadata: {
          intent: 'error_response',
          confidence: 0
        }
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsGeneratingResponse(false)
      setGeneratingWho(null)
    }
  }

  const startTraining = () => {
    setIsTrainingActive(true)
    setMessages([]) // Clear any existing messages
    setSessionTimer(0)

    // Start the first customer question
    generateCustomerQuestion()
  }

  const stopTraining = () => {
    setIsTrainingActive(false)
    setIsGeneratingResponse(false)

    // Clear any pending timeouts
    if (autoConversationTimeout) {
      clearTimeout(autoConversationTimeout)
      setAutoConversationTimeout(null)
    }
  }

  // Load completed training sessions and training memory on mount
  useEffect(() => {
    const loadSessionsAndMemory = async () => {
      try {
        // Load training sessions from Supabase
        const sessions = await loadTrainingSessions()
        setCompletedTrainingSessions(sessions)

        // Load training memory from AI Staff
        const staff = await loadAIStaff()
        if (staff.length > 0) {
          // Merge all staff training memories
          const mergedMemory = staff.reduce((acc: any, s: any) => {
            return { ...acc, ...s.trainingMemory }
          }, {})
          setTrainingMemory(mergedMemory)
        }
      } catch (error) {
        console.error('Error loading training data:', error)
      }
    }

    loadSessionsAndMemory()
  }, [])

  const clearChat = () => {
    setMessages([])
    setSessionTimer(0)
  }

  const generateAICustomerBrain = async () => {
    if (isGeneratingResponse || !selectedScenario) return

    setIsGeneratingResponse(true)
    setGeneratingWho('customer')

    try {
      // Get conversation history and last AI coach response
      const lastCoachMessage = messages.filter(m => m.sender === 'user').slice(-1)[0]
      const turn = Math.floor(messages.length / 2) + 1

      console.log('🤖 Generating REAL AI Customer response:', {
        scenario: selectedScenario.name,
        customerType: selectedScenario.customerType,
        turn,
        lastCoachMessage: lastCoachMessage?.message?.substring(0, 100)
      })

      // Call the REAL AI Customer Brain API
      const response = await fetch('/api/ai/customer-brain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          scenario: selectedScenario,
          coachMessage: lastCoachMessage?.message || 'Initial greeting',
          conversationHistory: messages.map(m => ({
            sender: m.sender,
            message: m.message,
            timestamp: m.timestamp.toISOString()
          })),
          turn
        })
      })

      if (!response.ok) {
        throw new Error(`AI Customer API error: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success || !data.response) {
        throw new Error('Invalid AI Customer API response')
      }

      const customerQuestion = data.response

      // Add REAL AI Customer message
      const customerMessage: Message = {
        id: Date.now().toString(),
        sessionId: selectedScenario.id,
        sender: 'customer',
        message: customerQuestion,
        timestamp: new Date(),
        metadata: {
          emotion: getPersonalityEmotion(selectedScenario.customerType),
          intent: 'ai_customer_question',
          aiGenerated: true,
          turn,
          model: 'gpt-4o-mini'
        }
      }

      setMessages(prev => [...prev, customerMessage])
      setIsGeneratingResponse(false)
      setGeneratingWho(null)

      // Generate AI Coach response after delay
      setTimeout(async () => {
        setIsGeneratingResponse(true)
        setGeneratingWho('coach')
        try {
          const coachResponse = await generateAICoachResponseToAll(customerQuestion, selectedScenario)

          const coachMessage: Message = {
            id: Date.now().toString(),
            sessionId: selectedScenario.id,
            sender: 'user', // Dr. Sakura (AI Coach)
            message: coachResponse,
            timestamp: new Date(),
            metadata: {
              intent: 'coach_scenario_response',
              confidence: Math.random() * 0.3 + 0.7,
              aiGenerated: true,
              model: 'gpt-4o-mini'
            }
          }

          setMessages(prev => [...prev, coachMessage])
        } catch (error) {
          console.error('Error generating AI Coach response:', error)
          const errorMessage: Message = {
            id: Date.now().toString(),
            sessionId: selectedScenario.id,
            sender: 'user',
            message: `❌ TRAINING ERROR: AI Coach failed - ${error instanceof Error ? error.message : 'Unknown error'}. Check your Anthropic API key and connection.`,
            timestamp: new Date(),
            metadata: {
              intent: 'training_error',
              confidence: 0,
              error: true
            }
          }
          setMessages(prev => [...prev, errorMessage])
        }

        setIsGeneratingResponse(false)
        setGeneratingWho(null)
      }, 1500)

    } catch (error) {
      console.error('Error generating AI Customer response:', error)

      // Show clear error for AI Customer failure
      const errorMessage: Message = {
        id: Date.now().toString(),
        sessionId: selectedScenario?.id || 'error',
        sender: 'customer',
        message: `❌ TRAINING ERROR: AI Customer Brain failed - ${error instanceof Error ? error.message : 'Unknown error'}. Check your Anthropic API key and connection.`,
        timestamp: new Date(),
        metadata: {
          intent: 'ai_customer_error',
          confidence: 0,
          error: true
        }
      }
      setMessages(prev => [...prev, errorMessage])
      setIsGeneratingResponse(false)
      setGeneratingWho(null)
    }
  }

  // ❌ REMOVED: All scripted customer response functions
  // Now using REAL AI Customer Brain via OpenAI API!
  // Old functions like generateAngryCustomerQuestion, generateConfusedCustomerQuestion, etc.
  // have been replaced with actual AI that responds dynamically to the coach's messages.







  const generateCustomerQuestion = generateAICustomerBrain

  const handleCompleteTrainingSession = async () => {
    if (messages.length === 0 || !selectedScenario) {
      alert('No training session to complete.')
      return
    }

    // Create completed training session
    const completedSession: TrainingSession = {
      id: Date.now().toString(),
      scenarioId: selectedScenario.id,
      status: 'completed',
      startTime: activeSession?.startTime || new Date(),
      endTime: new Date(),
      customerPersona: selectedScenario.customerType,
      scenario: selectedScenario,
      conversation: [...messages],
      feedback: [...sessionFeedback],
      objectives: selectedScenario.objectives,
      summary: generateSessionSummary(),
      score: calculateSessionScore()
    }

    // Save to completed sessions
    const updatedSessions = [...completedTrainingSessions, completedSession]
    setCompletedTrainingSessions(updatedSessions)

    // Save to Supabase
    try {
      await saveTrainingSession(completedSession)
      console.log('✅ Saved training session to Supabase')

      // Notify parent component about training sessions update
      onTrainingSessionsUpdate?.(updatedSessions)
    } catch (error) {
      console.error('Error saving training session:', error)
    }

    // Clear current session
    setMessages([])
    setActiveSession(null)
    setIsSessionActive(false)
    setSessionFeedback([])
    setSelectedScenario(null)

    alert(`Training session completed and saved!\n\nScenario: ${selectedScenario.name}\nMessages: ${messages.length}\nFeedback provided: ${sessionFeedback.length}\nScore: ${calculateSessionScore()}%`)
  }

  const generateSessionSummary = (): string => {
    const customerMessages = messages.filter(m => m.sender === 'customer').length
    const coachMessages = messages.filter(m => m.sender === 'user').length
    const revisedMessages = messages.filter(m => m.metadata?.intent === 'coach_revision').length

    return `Training session with ${selectedScenario?.customerType} customer. ${customerMessages} customer questions, ${coachMessages} coach responses, ${revisedMessages} revisions based on feedback. ${sessionFeedback.length} feedback comments provided.`
  }

  const calculateSessionScore = (): number => {
    // Simple scoring based on conversation length and feedback
    const baseScore = Math.min(100, messages.length * 10) // 10 points per message, max 100
    const feedbackPenalty = sessionFeedback.length * 5 // -5 points per feedback (more feedback = more corrections needed)
    return Math.max(0, baseScore - feedbackPenalty)
  }


  const handleSaveAsGuideline = () => {
    if (!feedbackMessage.trim() || !selectedScenario) {
      alert('Please enter feedback first.')
      return
    }

    const guidelineTitle = prompt('Enter a title for this guideline:', `Roleplay Training: ${selectedScenario.name}`)
    if (!guidelineTitle) return

    const guidelineContent = `${feedbackMessage}

**Context:**
- Scenario: ${selectedScenario.name}
- Customer Type: ${selectedScenario.customerType}
- Training Session Feedback

**Instructions:**
Apply this feedback when handling similar situations in the future.`

    if (onAddGuideline) {
      onAddGuideline({
        category: 'roleplay',
        title: guidelineTitle,
        content: guidelineContent
      })

      alert('Guideline created! You can view and edit it in the Training Data tab under "Training Guidelines".')
      setFeedbackMessage('')
    } else {
      alert('Cannot save guideline. Please check your settings.')
    }
  }

  const handleFeedback = async () => {
    if (!feedbackMessage.trim() || isGeneratingResponse || !selectedScenario) return

    // Get the last AI coach response to revise
    const lastCoachMessage = messages.filter(m => m.sender === 'user').slice(-1)[0]
    const lastCustomerMessage = messages.filter(m => m.sender === 'customer').slice(-1)[0]

    if (!lastCoachMessage || !lastCustomerMessage) {
      alert('No AI coach response to provide feedback on.')
      return
    }

    setIsGeneratingResponse(true)
    setGeneratingWho('coach')

    try {
      // Get conversation context
      const conversationHistory = messages.slice(-6).map(msg => ({
        sender: msg.sender === 'user' ? 'coach' : 'customer',
        message: msg.message,
        timestamp: msg.timestamp.toISOString()
      }))

      // Analyze feedback for specific instructions
      const feedbackLower = feedbackMessage.toLowerCase()
      const needsShorter = feedbackLower.includes('less word') || feedbackLower.includes('shorter') || feedbackLower.includes('brief') || feedbackLower.includes('concise')
      const needsLonger = feedbackLower.includes('more detail') || feedbackLower.includes('longer') || feedbackLower.includes('elaborate')

      // Create revision prompt for AI Coach
      const revisionPrompt = `You are Dr. Sakura receiving training feedback. You must REVISE your previous response based on the trainer's specific feedback.

TRAINING CONTEXT:
Scenario: ${selectedScenario.name}
Customer Type: ${selectedScenario.customerType}

CUSTOMER'S QUESTION:
"${lastCustomerMessage.message}"

YOUR PREVIOUS RESPONSE (THAT NEEDS REVISION):
"${lastCoachMessage.message}"

🚨 TRAINER'S FEEDBACK ON YOUR RESPONSE:
"${feedbackMessage}"

${needsShorter ? `
⚠️ CRITICAL: The trainer wants a SHORTER response! Your previous response was ${lastCoachMessage.message.split(' ').length} words.
Make your revised response SIGNIFICANTLY shorter (aim for 30-50 words MAX). Be concise and direct!` : ''}

${needsLonger ? `
⚠️ CRITICAL: The trainer wants MORE DETAIL! Your previous response was too brief.
Expand your revised response with more explanation, examples, and helpful details.` : ''}

REVISION INSTRUCTIONS:
1. Read the trainer's feedback carefully
2. Identify what was wrong or missing in your previous response
3. Write a COMPLETELY NEW response that:
   - Directly addresses the trainer's feedback
   ${needsShorter ? '   - Is MUCH SHORTER than your previous response (cut it by at least 50%)' : ''}
   ${needsLonger ? '   - Is MORE DETAILED than your previous response (at least 2x longer)' : ''}
   - Fixes the specific issues mentioned
   - Maintains your professional, warm tone
   - Provides better, more helpful guidance to the customer
4. DO NOT just repeat your previous response
5. DO NOT ignore the trainer's feedback
6. SHOW that you learned from the feedback by making substantial improvements

Now provide your REVISED response to the customer's question above:`

      const response = await fetch('/api/ai/coach-training', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: revisionPrompt,
          customerMessage: lastCustomerMessage.message,
          conversationHistory,
          customerPersona: selectedScenario.customerType,
          scenario: selectedScenario.description,
          knowledgeBase: knowledgeEntries,
          guidelines: guidelines.filter(g => g.category === 'roleplay' || g.category === 'general')
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      const revisedResponse = data.response

      // Add the revised AI coach response
      const revisedMessage: Message = {
        id: Date.now().toString(),
        sessionId: selectedScenario.id,
        sender: 'user', // Dr. Sakura (AI Coach)
        message: `*[Revised based on feedback]* ${revisedResponse}`,
        timestamp: new Date(),
        metadata: {
          intent: 'coach_revision',
          feedback: feedbackMessage,
          originalMessageId: lastCoachMessage.id,
          confidence: 0.9
        }
      }

      setMessages(prev => [...prev, revisedMessage])

      // Track feedback for session history
      setSessionFeedback(prev => [...prev, feedbackMessage])

      // Save feedback to training memory
      const memoryKey = selectedScenario.customerType
      const newMemory = { ...trainingMemory }
      if (!newMemory[memoryKey]) {
        newMemory[memoryKey] = []
      }

      // Create a structured feedback entry
      const feedbackEntry = `[${selectedScenario.name}] ${feedbackMessage} (Original response: "${lastCoachMessage.message.substring(0, 100)}...")`
      newMemory[memoryKey].push(feedbackEntry)

      // Keep only the most recent 10 feedback items per scenario type
      if (newMemory[memoryKey].length > 10) {
        newMemory[memoryKey] = newMemory[memoryKey].slice(-10)
      }

      setTrainingMemory(newMemory)

      console.log('💾 Saved feedback to training memory:', {
        scenarioType: memoryKey,
        feedbackEntry,
        totalMemoryItems: newMemory[memoryKey].length,
        allMemory: newMemory
      })

      // Persist training memory to Supabase (update current AI staff)
      try {
        if (selectedStaff) {
          await saveAIStaff({ ...selectedStaff, trainingMemory: newMemory })
          console.log('✅ Saved training memory to Supabase')
        }
      } catch (error) {
        console.error('Error saving training memory:', error)
      }

      // Clear feedback input
      setFeedbackMessage('')

    } catch (error) {
      console.error('Error generating revised response:', error)
      alert('Error generating revised response. Please try again.')
    } finally {
      setIsGeneratingResponse(false)
      setGeneratingWho(null)
    }
  }

  const getCustomerEmotion = (customerType: string): string => {
    const emotions = {
      random: '🤖',
      confused: '😕',
      'price-sensitive': '💰',
      'tech-savvy': '🤓',
      angry: '😠',
      enthusiastic: '😍'
    }
    return emotions[customerType as keyof typeof emotions] || '🤖'
  }

  const toggleManualMode = () => {
    setManualMode(!manualMode)

    // Clear any pending timeouts when switching modes
    if (autoConversationTimeout) {
      clearTimeout(autoConversationTimeout)
      setAutoConversationTimeout(null)
    }

    if (!manualMode && selectedScenario && activeSession) {
      // Switching to manual mode - stop auto conversation
      setIsGeneratingResponse(false)
    } else if (manualMode && selectedScenario && activeSession) {
      // Switching back to auto mode - resume conversation
      const currentTurn = Math.floor(messages.length / 2) + 1
      continueAIConversation(selectedScenario, currentTurn)
    }
  }

  // ❌ REMOVED: generateAICoachResponse function
  // This was the old scripted fallback system that we DON'T want in training!
  // All coach responses must come from OpenAI API only during training.
  // NO FALLBACK RESPONSES IN TRAINING MODE!



  const evaluateAIPerformance = (messages: Message[], scenario: TrainingScenario): { score: number, notes: string } => {
    const coachMessages = messages.filter(m => m.sender === 'user') // AI Coach messages
    const customerMessages = messages.filter(m => m.sender === 'customer')

    let score = 50 // Base score
    let feedback: string[] = []

    // Evaluate conversation length (should be complete)
    if (messages.length >= 8) {
      score += 10
      feedback.push('✅ Complete conversation flow')
    } else {
      feedback.push('⚠️ Conversation ended early')
    }

    // Evaluate response quality
    const avgCoachMessageLength = coachMessages.reduce((sum, m) => sum + m.message.length, 0) / coachMessages.length
    if (avgCoachMessageLength > 100) {
      score += 15
      feedback.push('✅ Detailed, helpful responses')
    } else {
      score -= 5
      feedback.push('❌ Responses too brief')
    }

    // Evaluate customer type handling
    const lastCustomerMessage = customerMessages[customerMessages.length - 1]?.message.toLowerCase() || ''

    switch (scenario.customerType) {
      case 'angry':
        if (lastCustomerMessage.includes('willing') || lastCustomerMessage.includes('fair') || lastCustomerMessage.includes('better')) {
          score += 20
          feedback.push('✅ Successfully calmed angry customer')
        } else {
          score -= 10
          feedback.push('❌ Failed to resolve customer anger')
        }
        break

      case 'confused':
        if (lastCustomerMessage.includes('confident') || lastCustomerMessage.includes('helpful') || lastCustomerMessage.includes('remember')) {
          score += 20
          feedback.push('✅ Successfully clarified confusion')
        } else {
          score -= 10
          feedback.push('❌ Customer still seems confused')
        }
        break

      case 'price-sensitive':
        if (lastCustomerMessage.includes('essential plan') || lastCustomerMessage.includes('try') || lastCustomerMessage.includes('afford')) {
          score += 20
          feedback.push('✅ Addressed budget concerns effectively')
        } else {
          score -= 10
          feedback.push('❌ Failed to address price objections')
        }
        break

      case 'tech-savvy':
        if (lastCustomerMessage.includes('premium') || lastCustomerMessage.includes('proceed') || lastCustomerMessage.includes('scientific')) {
          score += 20
          feedback.push('✅ Satisfied technical customer needs')
        } else {
          score -= 10
          feedback.push('❌ Insufficient technical details provided')
        }
        break

      case 'enthusiastic':
        if (lastCustomerMessage.includes('concierge') || lastCustomerMessage.includes('start') || lastCustomerMessage.includes('amazing')) {
          score += 20
          feedback.push('✅ Matched customer enthusiasm and closed sale')
        } else {
          score -= 10
          feedback.push('❌ Failed to capitalize on customer excitement')
        }
        break
    }

    // Check for key skincare coaching elements
    const allCoachText = coachMessages.map(m => m.message.toLowerCase()).join(' ')

    if (allCoachText.includes('skin type') || allCoachText.includes('skin concern')) {
      score += 10
      feedback.push('✅ Assessed skin needs properly')
    }

    if (allCoachText.includes('routine') || allCoachText.includes('cleanser') || allCoachText.includes('moisturizer')) {
      score += 10
      feedback.push('✅ Provided specific product guidance')
    }

    if (allCoachText.includes('plan') || allCoachText.includes('essential') || allCoachText.includes('premium')) {
      score += 10
      feedback.push('✅ Presented appropriate pricing options')
    }

    // Cap score at 100
    score = Math.min(100, Math.max(0, score))

    const notes = `AI Performance Evaluation:\n${feedback.join('\n')}\n\nOverall Score: ${score}/100`

    return { score: Math.round(score / 10), notes } // Convert to 1-10 scale
  }

  const handleCompleteSession = (score?: number, notes?: string) => {
    if (!activeSession) return

    // Auto-evaluate AI performance if no manual score provided
    const evaluation = score ? { score, notes: notes || '' } : evaluateAIPerformance(messages, selectedScenario!)

    const completedSession: TrainingSession = {
      ...activeSession,
      status: 'completed',
      endTime: new Date(),
      score: evaluation.score,
      sessionNotes: evaluation.notes
    }

    // Update stats
    const newStats = {
      totalSessions: stats.totalSessions + 1,
      completedSessions: stats.completedSessions + 1,
      averageScore: ((stats.averageScore * stats.completedSessions) + (completedSession.score || 0)) / (stats.completedSessions + 1),
      successRate: Math.round(((stats.completedSessions + 1) / (stats.totalSessions + 1)) * 100)
    }

    setStats(newStats)
    // Stats are session-specific, no need to persist to Supabase

    // Reset session
    setIsSessionActive(false)
    setActiveSession(null)
    setSelectedScenario(null)
    setMessages([])
    setSessionTimer(0)
  }

  const createCustomScenario = async (scenarioData: Partial<TrainingScenario>) => {
    const newScenario: TrainingScenario = {
      id: crypto.randomUUID(),
      name: scenarioData.name || '',
      description: scenarioData.description || '',
      customerType: scenarioData.customerType || 'confused',
      scenario: scenarioData.scenario || '',
      objectives: scenarioData.objectives || [],
      timeframeMins: scenarioData.timeframeMins || 15,
      isActive: true,
      difficulty: scenarioData.difficulty || 'Intermediate'
    }

    await saveTrainingScenario(newScenario)
    const updatedScenarios = [...scenarios, newScenario]
    setScenarios(updatedScenarios)
    setShowCreateScenario(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
            AI Staff Training Center
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">Train your AI staff members with different roles through automated dialogue with AI customers</p>
        </div>
      </div>

      {/* AI Staff Selection */}
      <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-purple-400" />
            AI Staff Members
          </h3>
          <button
            onClick={() => setShowStaffCreator(true)}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors text-white flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Staff
          </button>
        </div>
        <div className="flex gap-2 flex-wrap">
          {aiStaffList.map((staff) => (
            <div
              key={staff.id}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                selectedStaff?.id === staff.id
                  ? 'bg-blue-600 text-white border-2 border-blue-400'
                  : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
              }`}
            >
              <span>{
                staff.role === 'coach' ? '🎓' :
                staff.role === 'sales' ? '💰' :
                staff.role === 'customer-service' ? '🛡️' :
                '🔬'
              }</span>
              <div className="text-left">
                {editingStaffId === staff.id ? (
                  <input
                    type="text"
                    value={editingStaffName}
                    onChange={(e) => setEditingStaffName(e.target.value)}
                    onKeyDown={handleStaffNameChange}
                    onBlur={() => {
                      setEditingStaffId(null)
                      setEditingStaffName('')
                    }}
                    autoFocus
                    className="font-medium bg-slate-700 text-white px-2 py-1 rounded border border-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 w-32"
                    placeholder="Enter name or blank to delete"
                  />
                ) : (
                  <div
                    className="font-medium cursor-pointer"
                    onClick={() => selectStaff(staff)}
                    onDoubleClick={() => handleDoubleClickStaff(staff)}
                  >
                    {staff.name}
                  </div>
                )}
                <div className="text-xs opacity-70">{
                  staff.role === 'coach' ? 'Coach' :
                  staff.role === 'sales' ? 'Sales' :
                  staff.role === 'customer-service' ? 'Support' :
                  'Scientist'
                }</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Coach Training Conversation */}
      <div className="bg-slate-700 rounded-lg p-6 border border-slate-600 relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Bot className="w-5 h-5 text-green-400" />
            AI Coach Training Session
          </h3>
          <button
            onClick={handleCompleteTrainingSession}
            disabled={messages.length === 0}
            className="bg-green-600 hover:bg-green-700 disabled:bg-slate-600 px-4 py-2 rounded-lg transition-colors text-white text-sm"
          >
            Complete
          </button>
        </div>

        {/* Role Selection */}
        <div className="mb-4 p-4 bg-slate-800 rounded-lg border border-slate-600">
          <div className="flex items-center gap-4">
            <label className="text-white font-medium flex items-center gap-2">
              <User className="w-4 h-4" />
              AI Role:
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedRole('coach')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedRole === 'coach'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                }`}
              >
                🎓 Coach
              </button>
              <button
                onClick={() => setSelectedRole('sales')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedRole === 'sales'
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                }`}
              >
                💰 Sales
              </button>
              <button
                onClick={() => setSelectedRole('customer-service')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedRole === 'customer-service'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                }`}
              >
                🛡️ Customer Service
              </button>
              <button
                onClick={() => setSelectedRole('scientist')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedRole === 'scientist'
                    ? 'bg-orange-600 text-white'
                    : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                }`}
              >
                🔬 Scientist
              </button>
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            {selectedRole === 'coach' && '📚 Educates and guides customers with empathy and expertise'}
            {selectedRole === 'sales' && '💼 Focuses on closing deals, upselling, and maximizing revenue'}
            {selectedRole === 'customer-service' && '🤝 Resolves issues, ensures satisfaction, and builds loyalty'}
            {selectedRole === 'scientist' && '🧪 Provides evidence-based, technical, and research-backed advice'}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="bg-slate-800 rounded-lg p-3 sm:p-4 h-64 sm:h-80 md:h-96 overflow-y-auto">
          <div className="space-y-2 sm:space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-6 sm:py-8 text-slate-400">
                <MessageSquare className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm sm:text-base">AI training conversation will appear here</p>
                <p className="text-xs mt-1">Select a scenario below to begin training</p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'customer' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] sm:max-w-[80%] p-2 sm:p-3 rounded-lg text-sm sm:text-base ${
                  msg.sender === 'customer'
                    ? 'bg-orange-600 text-white mr-2 sm:mr-4'  // AI Customer - Orange
                    : 'bg-blue-600 text-white ml-2 sm:ml-4'    // AI Coach - Blue
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    {msg.sender === 'customer' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                    <span className="text-xs opacity-70">
                      {msg.sender === 'customer' ? 'AI Customer 🤖' :
                        `${selectedStaff?.name || 'AI'} (${
                          selectedRole === 'coach' ? 'Coach' :
                          selectedRole === 'sales' ? 'Sales' :
                          selectedRole === 'customer-service' ? 'Support' :
                          'Scientist'
                        }) ${
                          selectedRole === 'coach' ? '🎓' :
                          selectedRole === 'sales' ? '💰' :
                          selectedRole === 'customer-service' ? '🛡️' :
                          '🔬'
                        }`
                      }
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                </div>
              </div>
            ))}

            {isGeneratingResponse && (
              <div className={`flex ${generatingWho === 'customer' ? 'justify-start' : 'justify-end'}`}>
                <div className={`${generatingWho === 'customer' ? 'bg-orange-600 mr-4' : 'bg-blue-600 ml-4'} text-white px-3 py-2 rounded-lg`}>
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">
                      {generatingWho === 'customer' ? 'Thinking...' : 'Thinking...'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Manual Input Box */}
        <div className="mt-3 sm:mt-4 flex gap-2">
          <input
            type="text"
            placeholder="Type your question as a customer..."
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleDirectMessage()}
            disabled={isGeneratingResponse}
            className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 text-sm sm:text-base"
          />
          <button
            onClick={handleDirectMessage}
            disabled={!currentMessage.trim() || isGeneratingResponse}
            className="bg-green-600 hover:bg-green-700 disabled:bg-slate-600 px-3 sm:px-4 py-2 rounded-lg transition-colors text-white text-sm sm:text-base whitespace-nowrap"
          >
            Send
          </button>
          <button
            onClick={generateCustomerQuestion}
            disabled={isGeneratingResponse}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 px-3 sm:px-4 py-2 rounded-lg transition-colors text-white text-sm sm:text-base whitespace-nowrap"
          >
            Auto
          </button>
        </div>

        {/* Feedback Input Box */}
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            placeholder="Comment on AI coach's response for improvement..."
            value={feedbackMessage}
            onChange={(e) => setFeedbackMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleFeedback()}
            disabled={isGeneratingResponse}
            className="flex-1 bg-slate-800 border border-yellow-500 rounded-lg px-3 py-2 text-white placeholder-slate-400"
          />
          <button
            onClick={handleFeedback}
            disabled={!feedbackMessage.trim() || isGeneratingResponse}
            className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-slate-600 px-4 py-2 rounded-lg transition-colors text-white"
            title="Provide feedback and get revised response"
          >
            Feedback
          </button>
          <button
            onClick={handleSaveAsGuideline}
            disabled={!feedbackMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 px-4 py-2 rounded-lg transition-colors text-white whitespace-nowrap"
            title="Save this feedback as a permanent training guideline"
          >
            💾 Save as Guideline
          </button>
        </div>

        <div className="text-xs text-slate-400 mt-4 text-center">
          🎯 <strong>Training Purpose:</strong> AI Customer asks questions → Dr. Sakura ({
            selectedRole === 'coach' ? 'Coach' :
            selectedRole === 'sales' ? 'Sales' :
            selectedRole === 'customer-service' ? 'Support' :
            'Scientist'
          }) learns to respond properly in their role
        </div>

        {/* Training Memory Indicator */}
        {selectedScenario && trainingMemory[selectedScenario.customerType] && trainingMemory[selectedScenario.customerType].length > 0 && (
          <div className="mt-3 p-2 bg-purple-900/30 rounded-lg border border-purple-600">
            <div className="text-xs text-purple-300 text-center">
              🧠 <strong>Active Training Memory:</strong> {trainingMemory[selectedScenario.customerType].length} feedback items for {selectedScenario.customerType} customers
            </div>
          </div>
        )}
      </div>

      {/* Available Scenarios */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              Training Scenarios for {
                selectedRole === 'coach' ? '🎓 Coach' :
                selectedRole === 'sales' ? '💰 Sales' :
                selectedRole === 'customer-service' ? '🛡️ Customer Service' :
                '🔬 Scientist'
              } Role
            </h3>
            <p className="text-sm text-slate-400">
              {selectedRole === 'coach' && 'Practice educating and guiding customers with empathy'}
              {selectedRole === 'sales' && 'Practice closing deals, handling objections, and upselling'}
              {selectedRole === 'customer-service' && 'Practice resolving issues and ensuring customer satisfaction'}
              {selectedRole === 'scientist' && 'Practice providing evidence-based, technical explanations'}
            </p>
          </div>
          <button
            onClick={handleGenerateScenarios}
            disabled={allTemplatesUsed()}
            className={`${
              allTemplatesUsed()
                ? 'bg-slate-600 cursor-not-allowed text-slate-400'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            } px-4 py-2 rounded-lg flex items-center gap-2 transition-colors`}
            title={allTemplatesUsed() ? 'All scenarios generated for this role' : 'Generate more scenarios'}
          >
            <Plus className="w-5 h-5" />
            {allTemplatesUsed() ? 'All Scenarios Generated' : 'Generate 3 More Scenarios'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {scenarios && scenarios.length > 0 ? scenarios.map((scenario) => (
            <div key={scenario.id} className={`bg-slate-700 rounded-lg p-3 sm:p-4 border border-slate-600 ${
              selectedScenario?.id === scenario.id ? 'border-blue-500' : ''
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-white">{scenario.name}</h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteScenario(scenario.id)}
                    className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-slate-600 transition-colors"
                    title="Delete scenario"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <span className={`px-2 py-1 rounded text-xs ${
                    customerPersonas.find(p => p.id === scenario.customerType)?.color || 'bg-gray-500'
                  } text-white`}>
                    {scenario.customerType}
                  </span>
                  <span className="px-2 py-1 bg-slate-600 text-slate-300 rounded text-xs flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {scenario.timeframeMins}m
                  </span>
                </div>
              </div>

              <p className="text-slate-300 text-sm mb-3">{scenario.description}</p>

              <div className="mb-3">
                <p className="text-xs text-slate-400 mb-1">Scenario:</p>
                <p className="text-xs text-slate-300">{scenario.scenario}</p>
              </div>

              <div className="mb-4">
                <p className="text-xs text-slate-400 mb-1">Success Criteria:</p>
                <ul className="text-xs space-y-1">
                  {scenario.successCriteria && scenario.successCriteria.map((obj, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-300">
                      <Target className="h-3 w-3 mt-0.5 text-slate-400" />
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleStartSession(scenario)}
                disabled={isSessionActive}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-slate-600 disabled:to-slate-600 text-white py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Play className="h-4 w-4" />
                Start Training Session
              </button>
            </div>
          )) : (
            <div className="col-span-full text-center py-12">
              <p className="text-slate-400 mb-4">No training scenarios yet. Create your first scenario to get started!</p>
              <button
                onClick={() => setShowCreateScenario(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Your First Scenario
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Scenario Modal */}
      {showCreateScenario && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">Create Custom Training Scenario</h3>
            <ScenarioCreationForm
              onSubmit={createCustomScenario}
              onCancel={() => setShowCreateScenario(false)}
              customerPersonas={customerPersonas}
            />
          </div>
        </div>
      )}

      {/* AI Coach Prompt Editor Modal */}
      {showPromptEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-400" />
              Configure AI Coach Training Instructions
            </h3>
            <AICoachPromptEditor
              prompt={aiCoachPrompt}
              onSave={(newPrompt) => {
                setAiCoachPrompt(newPrompt)
                // AI coach prompt is session-specific configuration (no persistence needed)
                setShowPromptEditor(false)
              }}
              onCancel={() => setShowPromptEditor(false)}
            />
          </div>
        </div>
      )}

      {/* Staff Creator Modal */}
      {showStaffCreator && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-purple-400" />
              Create New AI Staff Member
            </h3>
            <StaffCreatorForm
              onSubmit={(name, role) => createNewStaff(name, role)}
              onCancel={() => setShowStaffCreator(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Staff Creator Form Component
interface StaffCreatorFormProps {
  onSubmit: (name: string, role: 'coach' | 'sales' | 'customer-service' | 'scientist') => void
  onCancel: () => void
}

function StaffCreatorForm({ onSubmit, onCancel }: StaffCreatorFormProps) {
  const [name, setName] = useState('')
  const [role, setRole] = useState<'coach' | 'sales' | 'customer-service' | 'scientist'>('coach')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onSubmit(name.trim(), role)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-white mb-2">Staff Member Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Sarah Johnson, Mike Chen, Dr. Smith"
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400"
          required
          autoFocus
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">Role</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setRole('coach')}
            className={`p-3 rounded-lg text-left transition-colors ${
              role === 'coach'
                ? 'bg-blue-600 text-white border-2 border-blue-400'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border-2 border-slate-600'
            }`}
          >
            <div className="font-medium">🎓 Coach</div>
            <div className="text-xs opacity-70">Educate & guide</div>
          </button>
          <button
            type="button"
            onClick={() => setRole('sales')}
            className={`p-3 rounded-lg text-left transition-colors ${
              role === 'sales'
                ? 'bg-green-600 text-white border-2 border-green-400'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border-2 border-slate-600'
            }`}
          >
            <div className="font-medium">💰 Sales</div>
            <div className="text-xs opacity-70">Close deals</div>
          </button>
          <button
            type="button"
            onClick={() => setRole('customer-service')}
            className={`p-3 rounded-lg text-left transition-colors ${
              role === 'customer-service'
                ? 'bg-purple-600 text-white border-2 border-purple-400'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border-2 border-slate-600'
            }`}
          >
            <div className="font-medium">🛡️ Support</div>
            <div className="text-xs opacity-70">Resolve issues</div>
          </button>
          <button
            type="button"
            onClick={() => setRole('scientist')}
            className={`p-3 rounded-lg text-left transition-colors ${
              role === 'scientist'
                ? 'bg-orange-600 text-white border-2 border-orange-400'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border-2 border-slate-600'
            }`}
          >
            <div className="font-medium">🔬 Scientist</div>
            <div className="text-xs opacity-70">Evidence-based</div>
          </button>
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          disabled={!name.trim()}
          className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white py-2 rounded-lg font-semibold transition-colors"
        >
          Create Staff Member
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2 rounded-lg font-semibold transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

// AI Coach Prompt Editor Component
interface AICoachPromptEditorProps {
  prompt: string
  onSave: (prompt: string) => void
  onCancel: () => void
}

function AICoachPromptEditor({ prompt, onSave, onCancel }: AICoachPromptEditorProps) {
  const [editedPrompt, setEditedPrompt] = useState(prompt)
  const [selectedTemplate, setSelectedTemplate] = useState('')

  // NO HARDCODED PROMPT TEMPLATES - User must create their own based on their business
  const promptTemplates: any[] = []

  const handleTemplateSelect = (template: any) => {
    setEditedPrompt(template.prompt)
    setSelectedTemplate(template.id)
  }

  const handleSave = () => {
    onSave(editedPrompt)
  }

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <div>
        <h4 className="text-lg font-semibold text-white mb-3">Quick Templates</h4>
        <div className="grid md:grid-cols-3 gap-3">
          {promptTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => handleTemplateSelect(template)}
              className={`p-3 rounded-lg border text-left transition-colors ${
                selectedTemplate === template.id
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-slate-600 bg-slate-700 hover:border-purple-400'
              }`}
            >
              <h5 className="font-medium text-white text-sm">{template.name}</h5>
              <p className="text-xs text-slate-400 mt-1">{template.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Prompt Editor */}
      <div>
        <h4 className="text-lg font-semibold text-white mb-3">AI Coach Instructions</h4>
        <textarea
          value={editedPrompt}
          onChange={(e) => setEditedPrompt(e.target.value)}
          placeholder="Enter detailed instructions for how the AI coach should behave, respond, and interact with customers..."
          rows={20}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 font-mono text-sm"
        />
        <div className="text-xs text-slate-400 mt-2">
          💡 Be specific about tone, expertise areas, response style, business knowledge, and conversation flow.
        </div>
      </div>

      {/* Preview */}
      <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
        <h5 className="text-sm font-medium text-white mb-2">Quick Preview</h5>
        <div className="text-xs text-slate-300 space-y-1">
          <div><strong>Length:</strong> {editedPrompt.length} characters</div>
          <div><strong>Style Keywords:</strong> {
            ['professional', 'friendly', 'scientific', 'warm', 'expert', 'personal'].filter(keyword =>
              editedPrompt.toLowerCase().includes(keyword)
            ).join(', ') || 'None detected'
          }</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={handleSave}
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-semibold"
        >
          Save AI Coach Configuration
        </button>
        <button
          onClick={onCancel}
          className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2 rounded-lg font-semibold"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// Scenario Creation Form Component
interface ScenarioCreationFormProps {
  onSubmit: (data: any) => void
  onCancel: () => void
  customerPersonas: CustomerPersona[]
}

function ScenarioCreationForm({ onSubmit, onCancel, customerPersonas }: ScenarioCreationFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    customerType: '',
    scenario: '',
    objectives: [''],
    timeframeMins: 15,
    difficulty: 'Intermediate' as 'Beginner' | 'Intermediate' | 'Advanced'
  })

  const addObjective = () => {
    setFormData(prev => ({
      ...prev,
      objectives: [...prev.objectives, '']
    }))
  }

  const updateObjective = (index: number, value: string) => {
    const newObjectives = [...formData.objectives]
    newObjectives[index] = value
    setFormData(prev => ({
      ...prev,
      objectives: newObjectives
    }))
  }

  const removeObjective = (index: number) => {
    setFormData(prev => ({
      ...prev,
      objectives: prev.objectives.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      objectives: formData.objectives.filter(obj => obj.trim()),
      isActive: true
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-white mb-1">Scenario Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Frustrated Customer - Product Return"
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white mb-1">Customer Type</label>
          <select
            value={formData.customerType}
            onChange={(e) => setFormData(prev => ({ ...prev, customerType: e.target.value }))}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
            required
          >
            <option value="">Select customer personality</option>
            {customerPersonas.map((persona) => (
              <option key={persona.id} value={persona.id}>{persona.personality}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-1">Description</label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Brief description of the training scenario"
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-1">Scenario Details</label>
        <textarea
          value={formData.scenario}
          onChange={(e) => setFormData(prev => ({ ...prev, scenario: e.target.value }))}
          placeholder="Detailed description of the customer's situation and context..."
          rows={3}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-1">Learning Objectives</label>
        <div className="space-y-2">
          {formData.objectives.map((objective, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={objective}
                onChange={(e) => updateObjective(index, e.target.value)}
                placeholder={`Objective ${index + 1}`}
                className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                required
              />
              {formData.objectives.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeObjective(index)}
                  className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg text-white"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addObjective}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Objective
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-1">Estimated Duration (minutes)</label>
        <select
          value={formData.timeframeMins.toString()}
          onChange={(e) => setFormData(prev => ({ ...prev, timeframeMins: parseInt(e.target.value) }))}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
        >
          <option value="10">10 minutes</option>
          <option value="15">15 minutes</option>
          <option value="20">20 minutes</option>
          <option value="30">30 minutes</option>
          <option value="45">45 minutes</option>
        </select>
      </div>

      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold"
        >
          Create Scenario
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2 rounded-lg font-semibold"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export default RoleplayTraining
