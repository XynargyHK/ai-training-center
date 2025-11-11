// Supabase Storage Utility
// Replaces localStorage + JSON files with direct Supabase database access

import { createClient } from '@supabase/supabase-js'

function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  }
  return url
}

function getSupabaseServiceKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
  }
  return key
}

// Lazy initialization - only creates client when first accessed
let _supabase: ReturnType<typeof createClient> | null = null

// Use SERVICE ROLE KEY for server-side operations (bypasses RLS)
// This file should ONLY be imported by API routes, never by client components
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop) {
    if (!_supabase) {
      _supabase = createClient(getSupabaseUrl(), getSupabaseServiceKey(), {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
    }
    return (_supabase as any)[prop]
  }
})

// Currently hardcoded to skincoach business unit
// TODO: Make this dynamic when multi-tenancy is fully implemented
export const BUSINESS_UNIT_ID = '77313e61-2a19-4f3e-823b-80390dde8bd2' // skincoach

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if a string is a valid UUID
 */
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

/**
 * Handles Supabase query errors
 * Logs errors with context for easier debugging
 */
function handleSupabaseError(error: any, context: string): void {
  if (!error) return

  console.error(`❌ ${context}:`, error.message || error)
}

// ============================================
// KNOWLEDGE BASE
// ============================================

export async function loadKnowledge() {
  const { data, error } = await supabase
    .from('knowledge_base')
    .select('*')
    .eq('business_unit_id', BUSINESS_UNIT_ID)
    .order('created_at', { ascending: false })

  if (error) {
    handleSupabaseError(error, 'Loading knowledge base')
    return []
  }

  // Transform to match existing interface
  return data.map(item => ({
    id: item.id,
    category: item.category,
    topic: item.topic || item.title,
    content: item.content,
    keywords: item.keywords || [],
    confidence: item.confidence || 1.0,
    createdAt: new Date(item.created_at),
    updatedAt: new Date(item.updated_at),
    fileName: item.file_name,
    filePath: item.file_path
  }))
}

export async function saveKnowledge(entry: any) {
  // Generate embedding for the knowledge entry
  const { generateKnowledgeEmbedding } = await import('./embeddings')
  const embedding = await generateKnowledgeEmbedding({
    topic: entry.topic,
    content: entry.content,
    category: entry.category
  })

  const knowledgeEntry = {
    business_unit_id: BUSINESS_UNIT_ID,
    category: entry.category,
    topic: entry.topic,
    title: entry.topic,
    content: entry.content,
    keywords: entry.keywords || [],
    confidence: entry.confidence || 1.0,
    file_name: entry.fileName,
    file_path: entry.filePath,
    source_type: 'manual',
    is_active: true,
    embedding: embedding, // Add embedding
    embedding_model: 'text-embedding-3-small',
    embedded_at: new Date().toISOString()
  }

  if (entry.id && entry.id.startsWith('kb-')) {
    // Update existing
    const { data, error } = await supabase
      .from('knowledge_base')
      .update(knowledgeEntry)
      .eq('id', entry.id)
      .select()

    if (error) throw error
    return data[0]
  } else {
    // Insert new
    const { data, error } = await supabase
      .from('knowledge_base')
      .insert(knowledgeEntry)
      .select()

    if (error) throw error
    return data[0]
  }
}

export async function deleteKnowledge(id: string) {
  const { error } = await supabase
    .from('knowledge_base')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ============================================
// VECTOR SEARCH
// ============================================

/**
 * Search knowledge base using vector similarity
 * This is the semantic search that understands meaning, not just keywords
 */
export async function vectorSearchKnowledge(query: string, limit: number = 10) {
  try {
    // Generate embedding for the query
    const { generateEmbedding } = await import('./embeddings')
    const queryEmbedding = await generateEmbedding(query)

    // Call the vector search function
    const { data, error } = await supabase.rpc('vector_search_knowledge', {
      p_business_unit_id: BUSINESS_UNIT_ID,
      p_query_embedding: queryEmbedding,
      p_match_threshold: 0.5, // Minimum similarity score (0-1)
      p_match_count: limit
    })

    if (error) {
      console.error('Vector search error:', error)
      return []
    }

    // Transform results to match existing interface
    return data.map((item: any) => ({
      id: item.id,
      topic: item.topic,
      content: item.content,
      category: item.category,
      keywords: item.keywords || [],
      similarity: item.similarity // Similarity score (0-1, higher = more similar)
    }))
  } catch (error) {
    handleSupabaseError(error, 'Vector search')
    return []
  }
}

/**
 * Hybrid search: Combines vector search with keyword search
 * Best of both worlds - finds semantically similar AND keyword matches
 */
export async function hybridSearchKnowledge(query: string, limit: number = 10) {
  try {
    // Generate embedding for the query
    const { generateEmbedding } = await import('./embeddings')
    const queryEmbedding = await generateEmbedding(query)

    // Call the hybrid search function
    const { data, error } = await supabase.rpc('hybrid_search_knowledge', {
      p_business_unit_id: BUSINESS_UNIT_ID,
      p_query_embedding: queryEmbedding,
      p_query_text: query,
      p_match_threshold: 0.5,
      p_match_count: limit
    })

    if (error) {
      console.error('Hybrid search error:', error)
      return []
    }

    // Transform results
    return data.map((item: any) => ({
      id: item.id,
      topic: item.topic,
      content: item.content,
      category: item.category,
      keywords: item.keywords || [],
      similarity: item.similarity,
      matchType: item.match_type // 'vector' or 'keyword'
    }))
  } catch (error) {
    handleSupabaseError(error, 'Hybrid search')
    return []
  }
}

// ============================================
// FAQs
// ============================================

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

  // Transform to match existing interface
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

export async function saveFAQ(faq: any) {
  // Generate embedding for the FAQ
  const { generateEmbedding } = await import('./embeddings')
  const embedding = await generateEmbedding(faq.question + ' ' + faq.answer)

  // Get category_id from category name
  let categoryId = null
  if (faq.category) {
    const { data: categoryData } = await supabase
      .from('categories')
      .select('id')
      .eq('business_unit_id', BUSINESS_UNIT_ID)
      .eq('name', faq.category)
      .single()

    categoryId = categoryData?.id
  }

  const faqEntry = {
    business_unit_id: BUSINESS_UNIT_ID,
    category_id: categoryId,
    question: faq.question,
    answer: faq.answer,
    short_answer: faq.shortAnswer,
    keywords: faq.keywords || [],
    is_published: faq.is_active !== false,
    embedding: embedding,
    embedding_model: 'text-embedding-3-small',
    embedded_at: new Date().toISOString()
  }

  if (faq.id && !faq.id.startsWith('faq-gen-')) {
    // Update existing
    const { data, error } = await supabase
      .from('faq_library')
      .update(faqEntry)
      .eq('id', faq.id)
      .select()

    if (error) throw error
    return data[0]
  } else {
    // Insert new
    const { data, error } = await supabase
      .from('faq_library')
      .insert(faqEntry)
      .select()

    if (error) throw error
    return data[0]
  }
}

export async function deleteFAQ(id: string) {
  const { error } = await supabase
    .from('faq_library')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ============================================
// CANNED MESSAGES
// ============================================

export async function loadCannedMessages() {
  const { data, error } = await supabase
    .from('canned_messages')
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
    handleSupabaseError(error, 'Loading canned messages')
    return []
  }

  // Transform to match existing interface
  return data.map(item => ({
    id: item.id,
    title: item.title,
    scenario: item.title, // For backward compatibility
    shortcut: item.shortcut,
    message: item.message,
    template: item.message, // For backward compatibility
    variables: item.variables || [],
    tags: item.tags || [],
    useCase: item.use_case,
    category: item.categories?.name || 'general'
  }))
}

export async function saveCannedMessage(msg: any) {
  // Generate embedding for the canned message
  const { generateEmbedding } = await import('./embeddings')
  const embedding = await generateEmbedding((msg.title || msg.scenario) + ' ' + (msg.message || msg.template))

  // Get category_id from category name
  let categoryId = null
  if (msg.category) {
    const { data: categoryData } = await supabase
      .from('categories')
      .select('id')
      .eq('business_unit_id', BUSINESS_UNIT_ID)
      .eq('name', msg.category)
      .single()

    categoryId = categoryData?.id
  }

  const cannedEntry = {
    business_unit_id: BUSINESS_UNIT_ID,
    category_id: categoryId,
    title: msg.title || msg.scenario,
    shortcut: msg.shortcut,
    message: msg.message || msg.template,
    variables: msg.variables || [],
    tags: msg.tags || [],
    use_case: msg.useCase,
    is_active: true,
    embedding: embedding,
    embedding_model: 'text-embedding-3-small',
    embedded_at: new Date().toISOString()
  }

  if (msg.id && !msg.id.startsWith('canned-gen-')) {
    // Update existing
    const { data, error } = await supabase
      .from('canned_messages')
      .update(cannedEntry)
      .eq('id', msg.id)
      .select()

    if (error) throw error
    return data[0]
  } else {
    // Insert new
    const { data, error } = await supabase
      .from('canned_messages')
      .insert(cannedEntry)
      .select()

    if (error) throw error
    return data[0]
  }
}

export async function deleteCannedMessage(id: string) {
  const { error } = await supabase
    .from('canned_messages')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ============================================
// CATEGORIES
// ============================================

export async function loadFAQCategories() {
  // FAQ categories: pricing, products, shipping, returns, product results, ingredients, general
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

export async function loadCannedCategories() {
  // Canned message categories: beauty tips, product recommendations, skincare advice, general responses
  const cannedCategoryNames = ['beauty tips', 'product recommendations', 'skincare advice', 'general responses']

  const { data, error } = await supabase
    .from('categories')
    .select('name')
    .eq('business_unit_id', BUSINESS_UNIT_ID)
    .in('name', cannedCategoryNames)
    .order('sort_order')

  if (error) {
    handleSupabaseError(error, 'Loading canned categories')
    return []
  }

  return data.map(c => c.name)
}

export async function saveCategory(name: string, type: 'faq' | 'canned') {
  const { data, error } = await supabase
    .from('categories')
    .insert({
      business_unit_id: BUSINESS_UNIT_ID,
      name: name,
      description: `${type} category for ${name}`,
      icon: '📁',
      color: '#9E9E9E'
    })
    .select()

  if (error) throw error
  return data[0]
}

export async function deleteCategory(name: string) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('business_unit_id', BUSINESS_UNIT_ID)
    .eq('name', name)

  if (error) throw error
}

// ============================================
// GUIDELINES (Migrated to Supabase)
// ============================================

export async function loadGuidelines() {
  const { data, error } = await supabase
    .from('guidelines')
    .select('*')
    .eq('business_unit_id', BUSINESS_UNIT_ID)
    .order('created_at', { ascending: false })

  if (error) {
    handleSupabaseError(error, 'Loading guidelines')
    return []
  }

  // Transform to match expected format
  return data.map(g => ({
    id: g.original_id || g.id,
    category: g.category,
    title: g.title,
    content: g.content,
    createdAt: g.created_at,
    updatedAt: g.updated_at
  }))
}

export async function saveGuideline(guideline: any) {
  // Generate embedding for the guideline
  const { generateEmbedding } = await import('./embeddings')
  const embedding = await generateEmbedding(guideline.title + ' ' + guideline.content)

  const { data, error } = await supabase
    .from('guidelines')
    .upsert({
      business_unit_id: BUSINESS_UNIT_ID,
      original_id: guideline.id,
      category: guideline.category,
      title: guideline.title,
      content: guideline.content,
      embedding: embedding,
      embedding_model: 'text-embedding-3-small',
      embedded_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    handleSupabaseError(error, 'Saving guideline')
    throw error
  }

  return data
}

export async function deleteGuideline(id: string) {
  const { error } = await supabase
    .from('guidelines')
    .delete()
    .eq('original_id', id)

  if (error) {
    handleSupabaseError(error, 'Deleting guideline')
    throw error
  }
}

export async function saveGuidelines(guidelines: any[]) {
  // Batch save - delete all and re-insert
  await supabase
    .from('guidelines')
    .delete()
    .eq('business_unit_id', BUSINESS_UNIT_ID)

  const { error } = await supabase
    .from('guidelines')
    .insert(
      guidelines.map(g => ({
        business_unit_id: BUSINESS_UNIT_ID,
        original_id: g.id,
        category: g.category,
        title: g.title,
        content: g.content,
        created_at: g.createdAt,
        updated_at: g.updatedAt
      }))
    )

  if (error) {
    handleSupabaseError(error, 'Batch saving guidelines')
    throw error
  }
}

// ============================================
// TRAINING DATA (Migrated to Supabase)
// ============================================

export async function loadTrainingData() {
  const { data, error } = await supabase
    .from('training_data')
    .select('*')
    .eq('business_unit_id', BUSINESS_UNIT_ID)
    .order('created_at', { ascending: false })

  if (error) {
    handleSupabaseError(error, 'Loading training data')
    return []
  }

  // Transform to match expected format
  return data.map(t => ({
    id: t.original_id || t.id,
    question: t.question,
    answer: t.answer,
    category: t.category,
    keywords: t.keywords || [],
    variations: t.variations || [],
    tone: t.tone || 'professional',
    priority: t.priority || 1,
    active: t.active !== false,
    createdAt: t.created_at
  }))
}

export async function saveTrainingEntry(entry: any) {
  // Generate embedding for the training entry
  const { generateEmbedding } = await import('./embeddings')
  const embedding = await generateEmbedding(entry.question + ' ' + entry.answer)

  const { data, error } = await supabase
    .from('training_data')
    .upsert({
      business_unit_id: BUSINESS_UNIT_ID,
      original_id: entry.id,
      question: entry.question,
      answer: entry.answer,
      category: entry.category,
      keywords: entry.keywords || [],
      variations: entry.variations || [],
      tone: entry.tone || 'professional',
      priority: entry.priority || 1,
      active: entry.active !== false,
      embedding: embedding,
      embedding_model: 'text-embedding-3-small',
      embedded_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    handleSupabaseError(error, 'Saving training entry')
    throw error
  }

  return data
}

export async function deleteTrainingEntry(id: string) {
  const { error } = await supabase
    .from('training_data')
    .delete()
    .eq('original_id', id)

  if (error) {
    handleSupabaseError(error, 'Deleting training entry')
    throw error
  }
}

export async function saveTrainingData(training: any[]) {
  // Batch save - delete all and re-insert
  await supabase
    .from('training_data')
    .delete()
    .eq('business_unit_id', BUSINESS_UNIT_ID)

  const { error } = await supabase
    .from('training_data')
    .insert(
      training.map(t => ({
        business_unit_id: BUSINESS_UNIT_ID,
        original_id: t.id,
        question: t.question,
        answer: t.answer,
        category: t.category,
        keywords: t.keywords || [],
        variations: t.variations || [],
        tone: t.tone || 'professional',
        priority: t.priority || 1,
        active: t.active !== false,
        created_at: t.createdAt
      }))
    )

  if (error) {
    handleSupabaseError(error, 'Batch saving training data')
    throw error
  }
}

// ============================================
// BUSINESS UNITS
// ============================================

export async function loadBusinessUnits() {
  const { data, error } = await supabase
    .from('business_units')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    handleSupabaseError(error, 'Loading business units')
    return []
  }

  // Transform to match existing interface
  return data.map(unit => ({
    id: unit.slug || unit.id,
    name: unit.name,
    industry: unit.industry || 'General',
    createdAt: new Date(unit.created_at)
  }))
}

export async function saveBusinessUnit(unit: any) {
  // Build the data object, only including industry if the column exists
  const data: any = {
    slug: unit.id,
    name: unit.name,
    email: unit.email || null,
    phone: unit.phone || null,
    subscription_tier: 'free',
    api_key: `bu_live_${Math.random().toString(36).substring(2, 15)}`,
    webhook_secret: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  // Only add industry if it's provided (column may not exist in older schemas)
  if (unit.industry) {
    data.industry = unit.industry
  }

  const { error } = await supabase
    .from('business_units')
    .upsert(data, {
      onConflict: 'slug'
    })

  if (error) {
    // Suppress schema errors for optional columns
    if (error.message?.includes('industry') && error.message?.includes('schema cache')) {
      console.log('⚠️ Business unit saved without industry field (run migration 007 to add it)')
      return // Don't throw, just skip the industry field
    }
    handleSupabaseError(error, 'Saving business unit')
    throw error
  }
}

export async function deleteBusinessUnit(slug: string) {
  const { error } = await supabase
    .from('business_units')
    .delete()
    .eq('slug', slug)

  if (error) {
    handleSupabaseError(error, 'Deleting business unit')
    throw error
  }
}

// ============================================
// AI STAFF
// ============================================

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
  // Check if id looks like a UUID
  const isUUID = staff.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(staff.id)

  const dataToSave: any = {
    business_unit_id: BUSINESS_UNIT_ID,
    name: staff.name,
    role: staff.role,
    training_memory: staff.trainingMemory || {},
    total_conversations: staff.totalSessions || 0,
    is_active: true,
    updated_at: new Date().toISOString()
  }

  // Only include id if it's a valid UUID (for updates)
  if (isUUID) {
    dataToSave.id = staff.id
  }

  const { error } = await supabase
    .from('ai_staff')
    .upsert(dataToSave, {
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

// ============================================
// TRAINING SCENARIOS
// ============================================

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
  // Check if id looks like a UUID (has dashes and correct length)
  const isUUID = scenario.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(scenario.id)

  const dataToSave: any = {
    business_unit_id: BUSINESS_UNIT_ID,
    name: scenario.name,
    description: scenario.description,
    customer_type: scenario.customerType,
    scenario_text: scenario.scenario,
    success_criteria: scenario.successCriteria || [],
    difficulty: scenario.difficulty || 'medium',
    is_active: true,
    updated_at: new Date().toISOString()
  }

  // Only include id if it's a valid UUID (for updates)
  if (isUUID) {
    dataToSave.id = scenario.id
  }

  const { data, error } = await supabase
    .from('training_scenarios')
    .upsert(dataToSave, {
      onConflict: 'id'
    })
    .select()
    .single()

  if (error) {
    handleSupabaseError(error, 'Saving training scenario')
    throw error
  }

  return data
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

// ============================================
// TRAINING SESSIONS
// ============================================

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
  // Validate scenario_id is a valid UUID
  const scenarioId = session.scenarioId || session.scenario?.id
  if (!scenarioId) {
    throw new Error('Missing scenario ID in training session')
  }
  if (!isValidUUID(scenarioId)) {
    throw new Error(`Invalid scenario UUID: ${scenarioId}. Please select a scenario from the database.`)
  }

  // ai_staff_id is optional but must be valid UUID if provided
  const aiStaffId = session.aiStaffId
  if (aiStaffId && !isValidUUID(aiStaffId)) {
    throw new Error(`Invalid AI staff UUID: ${aiStaffId}. Please select an AI staff from the database.`)
  }

  const { error } = await supabase
    .from('training_sessions')
    .insert({
      business_unit_id: BUSINESS_UNIT_ID,
      scenario_id: scenarioId,
      ai_staff_id: aiStaffId,
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

// ============================================
// VECTOR SEARCH FUNCTIONS FOR ALL TABLES
// ============================================

/**
 * Vector search for FAQs
 */
export async function vectorSearchFAQs(query: string, limit: number = 10) {
  try {
    const { generateEmbedding } = await import('./embeddings')
    const queryEmbedding = await generateEmbedding(query)

    const { data, error } = await supabase.rpc('vector_search_faqs', {
      p_business_unit_id: BUSINESS_UNIT_ID,
      p_query_embedding: queryEmbedding,
      p_match_threshold: 0.5,
      p_match_count: limit
    })

    if (error) {
      console.error('Vector search FAQs error:', error)
      return []
    }

    return data || []
  } catch (error) {
    handleSupabaseError(error, 'Vector search FAQs')
    return []
  }
}

/**
 * Hybrid search for FAQs (vector + keyword)
 */
export async function hybridSearchFAQs(query: string, limit: number = 10) {
  try {
    const { generateEmbedding } = await import('./embeddings')
    const queryEmbedding = await generateEmbedding(query)

    const { data, error } = await supabase.rpc('hybrid_search_faqs', {
      p_business_unit_id: BUSINESS_UNIT_ID,
      p_query_embedding: queryEmbedding,
      p_query_text: query,
      p_match_threshold: 0.5,
      p_match_count: limit
    })

    if (error) {
      console.error('Hybrid search FAQs error:', error)
      return []
    }

    return data || []
  } catch (error) {
    handleSupabaseError(error, 'Hybrid search FAQs')
    return []
  }
}

/**
 * Vector search for Canned Messages
 */
export async function vectorSearchCannedMessages(query: string, limit: number = 10) {
  try {
    const { generateEmbedding } = await import('./embeddings')
    const queryEmbedding = await generateEmbedding(query)

    const { data, error } = await supabase.rpc('vector_search_canned_messages', {
      p_business_unit_id: BUSINESS_UNIT_ID,
      p_query_embedding: queryEmbedding,
      p_match_threshold: 0.5,
      p_match_count: limit
    })

    if (error) {
      console.error('Vector search canned messages error:', error)
      return []
    }

    return data || []
  } catch (error) {
    handleSupabaseError(error, 'Vector search canned messages')
    return []
  }
}

/**
 * Hybrid search for Canned Messages (vector + keyword)
 */
export async function hybridSearchCannedMessages(query: string, limit: number = 10) {
  try {
    const { generateEmbedding } = await import('./embeddings')
    const queryEmbedding = await generateEmbedding(query)

    const { data, error } = await supabase.rpc('hybrid_search_canned_messages', {
      p_business_unit_id: BUSINESS_UNIT_ID,
      p_query_embedding: queryEmbedding,
      p_query_text: query,
      p_match_threshold: 0.5,
      p_match_count: limit
    })

    if (error) {
      console.error('Hybrid search canned messages error:', error)
      return []
    }

    return data || []
  } catch (error) {
    handleSupabaseError(error, 'Hybrid search canned messages')
    return []
  }
}

/**
 * Vector search for Guidelines
 */
export async function vectorSearchGuidelines(query: string, limit: number = 10) {
  try {
    const { generateEmbedding } = await import('./embeddings')
    const queryEmbedding = await generateEmbedding(query)

    const { data, error } = await supabase.rpc('vector_search_guidelines', {
      p_business_unit_id: BUSINESS_UNIT_ID,
      p_query_embedding: queryEmbedding,
      p_match_threshold: 0.5,
      p_match_count: limit
    })

    if (error) {
      console.error('Vector search guidelines error:', error)
      return []
    }

    return data || []
  } catch (error) {
    handleSupabaseError(error, 'Vector search guidelines')
    return []
  }
}

/**
 * Vector search for Training Data
 */
export async function vectorSearchTrainingData(query: string, limit: number = 10) {
  try {
    const { generateEmbedding } = await import('./embeddings')
    const queryEmbedding = await generateEmbedding(query)

    const { data, error } = await supabase.rpc('vector_search_training_data', {
      p_business_unit_id: BUSINESS_UNIT_ID,
      p_query_embedding: queryEmbedding,
      p_match_threshold: 0.5,
      p_match_count: limit
    })

    if (error) {
      console.error('Vector search training data error:', error)
      return []
    }

    return data || []
  } catch (error) {
    handleSupabaseError(error, 'Vector search training data')
    return []
  }
}
