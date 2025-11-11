import { createClient } from '@supabase/supabase-js'

function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
      'Make sure it is set in Railway environment variables.'
    )
  }
  return url
}

function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. ' +
      'Make sure it is set in Railway environment variables.'
    )
  }
  return key
}

// Lazy initialization - only creates client when first accessed
let _supabase: ReturnType<typeof createClient> | null = null
let _supabaseAdmin: ReturnType<typeof createClient> | null = null

// Client-side Supabase client
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop) {
    if (!_supabase) {
      _supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey())
    }
    return (_supabase as any)[prop]
  }
})

// Server-side Supabase client with service role key (for admin operations)
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop) {
    if (!_supabaseAdmin) {
      const url = getSupabaseUrl()
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      const anonKey = getSupabaseAnonKey()

      _supabaseAdmin = createClient(
        url,
        serviceKey || anonKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )
    }
    return (_supabaseAdmin as any)[prop]
  }
})

// Currently hardcoded to skincoach business unit
// TODO: Make this dynamic when multi-tenancy is fully implemented
export const BUSINESS_UNIT_ID = '77313e61-2a19-4f3e-823b-80390dde8bd2' // skincoach

// ============================================
// CLIENT-SAFE DATA LOADING FUNCTIONS
// These use the anon key and respect RLS policies
// ============================================

function handleSupabaseError(error: any, context: string): void {
  if (!error) return
  console.error(`❌ ${context}:`, error.message || error)
}

// FAQ Functions
export async function loadFAQCategories() {
  const faqCategoryNames = ['pricing', 'products', 'shipping', 'returns', 'product results', 'ingredients', 'general']
  const { data, error } = await supabase
    .from('categories')
    .select('name')
    .eq('business_unit_id', BUSINESS_UNIT_ID)
    .in('name', faqCategoryNames)
    .order('sort_order')

  if (error) {
    handleSupabaseError(error, 'Loading FAQ categories')
    return []
  }
  return data.map(c => c.name)
}

export async function loadFAQs() {
  const { data, error } = await supabase
    .from('faq_library')
    .select(`
      *,
      categories (
        id,
        name,
        icon,
        color
      )
    `)
    .eq('business_unit_id', BUSINESS_UNIT_ID)
    .order('created_at', { ascending: false })

  if (error) {
    handleSupabaseError(error, 'Loading FAQs')
    return []
  }

  return data.map(item => ({
    id: item.id,
    question: item.question,
    answer: item.answer,
    shortAnswer: item.short_answer,
    category: item.categories?.name || 'general',
    keywords: item.keywords || [],
    is_active: true
  }))
}

// AI Staff Functions
export async function loadAIStaff() {
  const { data, error } = await supabase
    .from('ai_staff')
    .select('*')
    .eq('business_unit_id', BUSINESS_UNIT_ID)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (error) {
    handleSupabaseError(error, 'Loading AI staff')
    return []
  }

  return data.map(staff => ({
    id: staff.id,
    name: staff.name,
    role: staff.role,
    createdAt: new Date(staff.created_at),
    trainingMemory: staff.training_memory || {},
    totalSessions: staff.total_conversations || 0
  }))
}

export async function saveAIStaff(staff: any) {
  const { error } = await supabase
    .from('ai_staff')
    .upsert({
      id: staff.id,
      business_unit_id: BUSINESS_UNIT_ID,
      name: staff.name,
      role: staff.role,
      training_memory: staff.trainingMemory || {},
      total_conversations: staff.totalSessions || 0,
      is_active: true,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'id'
    })

  if (error) {
    handleSupabaseError(error, 'Saving AI staff')
    throw new Error(error.message || 'Failed to save AI staff')
  }
}

export async function deleteAIStaff(id: string) {
  const { error } = await supabase
    .from('ai_staff')
    .delete()
    .eq('id', id)

  if (error) {
    handleSupabaseError(error, 'Deleting AI staff')
    throw error
  }
}

// Training Scenarios Functions
export async function loadTrainingScenarios() {
  const { data, error } = await supabase
    .from('training_scenarios')
    .select('*')
    .eq('business_unit_id', BUSINESS_UNIT_ID)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (error) {
    handleSupabaseError(error, 'Loading training scenarios')
    return []
  }

  return data.map(scenario => ({
    id: scenario.id,
    name: scenario.name,
    description: scenario.description,
    customerType: scenario.customer_type,
    scenario: scenario.scenario_text,
    successCriteria: scenario.success_criteria || [],
    difficulty: scenario.difficulty
  }))
}

export async function saveTrainingScenario(scenario: any) {
  const { error } = await supabase
    .from('training_scenarios')
    .upsert({
      id: scenario.id,
      business_unit_id: BUSINESS_UNIT_ID,
      name: scenario.name,
      description: scenario.description,
      customer_type: scenario.customerType,
      scenario_text: scenario.scenario,
      success_criteria: scenario.successCriteria || [],
      difficulty: scenario.difficulty || 'medium',
      is_active: true,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'id'
    })

  if (error) {
    handleSupabaseError(error, 'Saving training scenario')
    throw error
  }
}

export async function deleteTrainingScenario(id: string) {
  const { error } = await supabase
    .from('training_scenarios')
    .delete()
    .eq('id', id)

  if (error) {
    handleSupabaseError(error, 'Deleting training scenario')
    throw error
  }
}

// Training Sessions Functions
export async function loadTrainingSessions() {
  const { data, error } = await supabase
    .from('training_sessions')
    .select('*, training_scenarios(name), ai_staff(name)')
    .eq('business_unit_id', BUSINESS_UNIT_ID)
    .order('completed_at', { ascending: false })

  if (error) {
    handleSupabaseError(error, 'Loading training sessions')
    return []
  }

  if (!data || data.length === 0) {
    return []
  }

  return data.map(session => ({
    id: session.id,
    scenarioId: session.scenario_id,
    scenarioName: session.training_scenarios?.name || 'Unknown',
    aiStaffId: session.ai_staff_id,
    aiStaffName: session.ai_staff?.name || 'Unknown',
    conversation: session.conversation,
    feedback: session.feedback || [],
    score: session.score,
    completedAt: new Date(session.completed_at)
  }))
}

export async function saveTrainingSession(session: any) {
  const { error } = await supabase
    .from('training_sessions')
    .insert({
      business_unit_id: BUSINESS_UNIT_ID,
      scenario_id: session.scenarioId,
      ai_staff_id: session.aiStaffId,
      conversation: session.conversation,
      feedback: session.feedback || [],
      score: session.score,
      completed_at: session.completedAt || new Date().toISOString()
    })

  if (error) {
    handleSupabaseError(error, 'Saving training session')
    throw error
  }
}

export async function deleteTrainingSession(id: string) {
  const { error } = await supabase
    .from('training_sessions')
    .delete()
    .eq('id', id)

  if (error) {
    handleSupabaseError(error, 'Deleting training session')
    throw error
  }
}
