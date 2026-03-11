/**
 * AI ENGINE - THE "ONE BRAIN" CORE
 * 
 * This is the central, unified logic for all AI interactions in the platform.
 * It enforces absolute multi-tenant isolation ("The Iron Wall") by requiring 
 * a businessUnitId for every knowledge lookup.
 * 
 * Features:
 * - Server-side RAG (Retrieval Augmented Generation)
 * - Vector search filtered by business_unit_id
 * - Unified prompt building for Training and Production
 * - Direct Gemini 1.5-flash integration
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { 
  vectorSearchKnowledge, 
  loadGuidelines, 
  loadTrainingData,
  vectorSearchTrainingData,
  vectorSearchFAQs
} from './supabase-storage'
import { buildAIPrompt, buildUserReminder } from './ai-prompt-builder'
import { getLLMConfig } from '@/app/api/llm-config/route'

// Initialize Google Gemini
const getGoogleClient = () => {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY
  if (!apiKey) throw new Error('GOOGLE_GEMINI_API_KEY is not configured')
  return new GoogleGenerativeAI(apiKey)
}

export interface AIChatOptions {
  businessUnitId: string
  aiStaffId?: string // Optional: specific staff member
  message: string
  conversationHistory: any[]
  staffName?: string
  staffRole?: string
  language?: string
  country?: string
  image?: string | null
  userName?: string | null
  userProfile?: any
  userOrders?: any[]
  // Roleplay specific
  scenario?: any
  isTraining?: boolean
}

/**
 * THE LIBRARIAN - IMAGE INGESTION
 * Uses Gemini Vision to understand an image and save it to the library.
 */
export async function processImageIngestion(opts: {
  buffer: Buffer,
  mimeType: string,
  fileName: string,
  sourceUrl: string,
  businessUnitId: string
}) {
  const { buffer, mimeType, fileName, sourceUrl, businessUnitId } = opts
  const { supabase, getBusinessUnitId } = await import('./supabase-storage')
  const resolvedBUId = await getBusinessUnitId(businessUnitId)

  try {
    // 1. ANALYZE IMAGE WITH GEMINI VISION
    const genAI = getGoogleClient()
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `Analyze this image for a business knowledge base. 
    1. Is this a meaningful image (product, diagram, infographic, person) or just noise (icon, button, spacer)?
    2. If it is meaningful, provide:
       - A short, SEO-friendly name (e.g., "biorhythm-device-front")
       - A detailed description of what is in the image.
       - A category (product, diagram, lifestyle, testimonial).
    Return your answer in JSON format: { "isMeaningful": boolean, "name": string, "description": string, "category": string }`

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: buffer.toString('base64'), mimeType } }
    ])

    const responseText = result.response.text()
    // Extract JSON from response (handling potential markdown blocks)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null

    if (!analysis || !analysis.isMeaningful) {
      console.log(`⏩ Skipping noise image: ${fileName}`)
      return null
    }

    // 2. UPLOAD TO SUPABASE STORAGE
    const cleanName = analysis.name.toLowerCase().replace(/[^a-z0-9]/g, '-')
    const finalFileName = `${cleanName}-${Date.now()}.${mimeType.split('/')[1]}`
    const storagePath = `${businessUnitId}/library/${finalFileName}`

    const { error: uploadErr } = await supabase.storage
      .from('media-library')
      .upload(storagePath, buffer, { contentType: mimeType })

    if (uploadErr) throw uploadErr

    const { data: urlData } = supabase.storage.from('media-library').getPublicUrl(storagePath)
    const publicUrl = urlData.publicUrl

    // 3. GENERATE EMBEDDING FOR DESCRIPTION
    const { generateEmbedding } = await import('./embeddings')
    const embedding = await generateEmbedding(`${analysis.name}: ${analysis.description}`)

    // 4. SAVE TO IMAGE LIBRARY TABLE
    const { data: dbRecord, error: dbErr } = await supabase
      .from('image_library')
      .insert({
        business_unit_id: resolvedBUId,
        name: analysis.name,
        url: publicUrl,
        source_url: sourceUrl,
        description: analysis.description,
        category: analysis.category,
        embedding: embedding,
        mime_type: mimeType,
        file_size: buffer.length
      })
      .select()
      .single()

    if (dbErr) throw dbErr

    return dbRecord

  } catch (error) {
    console.error(`❌ Image Ingestion Error (${fileName}):`, error)
    return null
  }
}

/**
 * THE UNIFIED BRAIN
 * Fetches context server-side and generates a siloed response.
 */
export async function generateSiloedResponse(opts: AIChatOptions) {
  const { 
    businessUnitId, 
    aiStaffId,
    message, 
    conversationHistory,
    language = 'en',
    country = 'HK',
    image = null,
    userName = null,
    userProfile = null,
    userOrders = null,
    scenario = null,
    isTraining = false
  } = opts

  let { staffName = 'AI Assistant', staffRole = 'representative' } = opts
  let trainingMemory = {}
  let businessUnitName = 'this company'

  console.log(`🧠 AI Engine: Processing request for BU: ${businessUnitId}, Staff: ${aiStaffId || 'default'}`)

  try {
    // 1. Fetch Staff and BU Profile
    const { getBusinessUnitId, supabase } = await import('./supabase-storage')
    const resolvedBUId = await getBusinessUnitId(businessUnitId)

    // Fetch BU name for identity
    const { data: buData } = await supabase
      .from('business_units')
      .select('name')
      .eq('id', resolvedBUId)
      .single()
    
    if (buData) {
      businessUnitName = buData.name
    }

    if (aiStaffId && aiStaffId !== 'default') {
      try {
        const { data: staff } = await supabase
          .from('ai_staff')
          .select('name, role, training_memory')
          .eq('id', aiStaffId)
          .single()
        
        if (staff) {
          staffName = staff.name
          staffRole = staff.role
          trainingMemory = staff.training_memory || {}
          console.log(`👤 Staff Profile Loaded: ${staffName} (${staffRole})`)
        }
      } catch (e) {
        console.warn('⚠️ Could not load staff profile, using defaults', e)
      }
    }

    // 2. "OPEN THE DRAWER" - Fetch ONLY relevant data for this Business Unit
    const { hybridSearchKnowledge, vectorSearchTrainingData, loadGuidelines, hybridSearchImages } = await import('./supabase-storage')
    
    const [knowledgeBase, guidelines, trainingExamples, relevantImages] = await Promise.all([
      // Use hybrid search (Vector + Keyword) which is more robust
      hybridSearchKnowledge(message, resolvedBUId, 10), 
      loadGuidelines(resolvedBUId, language),
      vectorSearchTrainingData(message, resolvedBUId, 3),
      hybridSearchImages(message, resolvedBUId, 2) // Fetch top 2 relevant images
    ])

    console.log(`✅ Retrieved context: ${knowledgeBase.length} KB entries, ${guidelines.length} guidelines, ${relevantImages.length} images`)

    // 2. BUILD THE SILOED PROMPT
    // Transform trainingExamples to match the expected format for buildAIPrompt
    const formattedTrainingData = trainingExamples.map((ex: any) => ({
      id: ex.id,
      question: ex.question,
      answer: ex.answer,
      category: ex.category || 'general'
    }))

    const systemPrompt = buildAIPrompt({
      staffName,
      staffRole,
      businessUnitName, // Pass the brand name
      knowledgeBase,
      guidelines,
      trainingMemory, // Pass the actually loaded memory here
      conversationHistory: formatHistoryForPrompt(conversationHistory),
      relevantImages, // Pass images to prompt
      language,
      image,
      userName,
      userProfile,
      userOrders
    })

    // Add training examples as a special block if found
    const finalSystemPrompt = systemPrompt + (formattedTrainingData.length > 0 
      ? `\n\nRELEVANT TRAINING EXAMPLES:\n${formattedTrainingData.map(d => `Q: ${d.question}\nA: ${d.answer}`).join('\n\n')}` 
      : '')

    // 3. GENERATE CONTENT WITH GEMINI
    const llmConfig = getLLMConfig()
    const genAI = getGoogleClient()
    const model = genAI.getGenerativeModel({ 
      model: llmConfig.model || 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.1, // PROOF: A is A. Lower temperature means NO improvisation.
        topP: 0.1,
        topK: 1
      }
    })

    // Build Gemini contents array
    const geminiHistory = formatHistoryForGemini(conversationHistory)
    const hasKnowledge = knowledgeBase.length > 0
    
    const currentMessageParts: any[] = [{ text: `${message}${buildUserReminder(hasKnowledge)}` }]
    if (image) {
      const imageData = image.split(',')[1]
      const mimeType = image.match(/data:([^;]+);/)?.[1] || 'image/jpeg'
      currentMessageParts.push({ inlineData: { data: imageData, mimeType } })
    }

    const result = await model.generateContent({
      contents: [...geminiHistory, { role: 'user', parts: currentMessageParts }],
      systemInstruction: finalSystemPrompt,
      generationConfig: {
        temperature: 0.0, // ABSOLUTE ZERO: No randomness, no variation.
        topP: 0.1,
        topK: 1,
        maxOutputTokens: 2048,
      }
    })

    const aiResponse = result.response.text() || "I'm sorry, I couldn't process that. How else can I help?"
    
    return {
      response: aiResponse,
      contextUsed: {
        knowledgeCount: knowledgeBase.length,
        guidelineCount: guidelines.length,
        hasImage: !!image
      }
    }

  } catch (error) {
    console.error('❌ AI Engine Error:', error)
    throw error
  }
}

/**
 * Format flat history for the text-based prompt builder
 */
function formatHistoryForPrompt(history: any[]): string {
  return history
    .map((msg: any) => `${msg.role === 'user' ? 'Customer' : 'AI'}: ${msg.content}`)
    .join('\n')
}

/**
 * Format history for Gemini's structured chat format
 */
function formatHistoryForGemini(history: any[]): any[] {
  return history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
    // Note: Images in history are omitted for token efficiency unless specifically needed
  }))
}

/**
 * THE LIBRARIAN - TEXT INGESTION
 * Logical RAG approach: 10k character chunks for stability and search accuracy.
 */
export async function processTextIngestion(opts: {
  text: string,
  sourceUrl: string,
  title: string,
  businessUnitId: string
}) {
  const { text, sourceUrl, title, businessUnitId } = opts
  const { saveKnowledge, getBusinessUnitId } = await import('./supabase-storage')
  const resolvedBUId = await getBusinessUnitId(businessUnitId)

  console.log(`📚 LIBRARIAN: Indexing ${title} (${text.length} chars) using 10k-chunk logic.`)

  try {
    // 1. Determine Chunks (Stable 10,000 characters each)
    const CHUNK_SIZE = 10000
    const chunks = []
    for (let i = 0; i < text.length; i += CHUNK_SIZE) {
      chunks.push(text.substring(i, i + CHUNK_SIZE))
    }

    // 2. Process first chunk with Gemini to get a global summary/tags
    const genAI = getGoogleClient()
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const summaryPrompt = `Analyze this document start: "${title}". Provide a short summary and 5 keywords. 
    Return JSON: { "summary": "string", "keywords": ["string"] }
    
    Text: ${chunks[0].substring(0, 5000)}`
    
    let metadata = { summary: 'Document content', keywords: [title] }
    try {
      const res = await model.generateContent(summaryPrompt)
      const jsonMatch = res.response.text().match(/\{[\s\S]*\}/)
      if (jsonMatch) metadata = JSON.parse(jsonMatch[0])
    } catch (e) { console.warn('Summary pass failed, using title as tag') }

    // 3. Save Chunks sequentially (Stable & Fast)
    for (let i = 0; i < chunks.length; i++) {
      await saveKnowledge({
        topic: chunks.length === 1 ? title : `${title} [Segment ${i + 1}/${chunks.length}]`,
        content: `Document: ${title}\nSource: ${sourceUrl}\nSummary: ${metadata.summary}\n\n${chunks[i]}`,
        category: 'Industry Knowledge',
        keywords: metadata.keywords,
        fileName: title,
        filePath: sourceUrl
      }, resolvedBUId)
    }

    console.log(`✅ LIBRARIAN: Successfully indexed ${title} in ${chunks.length} chunks.`)
    return chunks.length

  } catch (error: any) {
    console.error(`❌ Ingestion Error:`, error)
    throw error
  }
}
