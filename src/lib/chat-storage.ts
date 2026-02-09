import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with service role for storage operations
function getSupabaseServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials for chat storage')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export interface ChatSession {
  id: string
  business_unit_id: string
  ai_staff_id?: string
  user_identifier?: string
  user_ip?: string
  user_agent?: string
  language?: string
  started_at: string
  ended_at?: string
  total_messages: number
  has_red_flags: boolean
  flagged_reason?: string
  metadata?: Record<string, any>
}

export interface ChatMessage {
  id: string
  session_id: string
  message_type: 'user' | 'ai'
  content: string
  image_url?: string
  has_image: boolean
  ai_model?: string
  ai_provider?: string
  tokens_used?: number
  is_flagged: boolean
  flag_reason?: string
  sentiment?: string
  metadata?: Record<string, any>
  created_at: string
}

/**
 * Upload an image to Supabase Storage
 * @param imageBase64 - Base64 encoded image data (with data:image/xxx;base64, prefix)
 * @param sessionId - Chat session ID for organizing images
 * @returns Public URL of the uploaded image
 */
export async function uploadChatImage(
  imageBase64: string,
  sessionId: string
): Promise<string> {
  try {
    const supabase = getSupabaseServiceClient()

    // Extract MIME type and base64 data
    const matches = imageBase64.match(/^data:([^;]+);base64,(.+)$/)
    if (!matches) {
      throw new Error('Invalid base64 image format')
    }

    const mimeType = matches[1]
    const base64Data = matches[2]

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64')

    // Generate unique filename
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(7)
    const extension = mimeType.split('/')[1] || 'png'
    const fileName = `${sessionId}/${timestamp}-${random}.${extension}`

    // Upload to Supabase Storage bucket 'chat-images'
    const { data, error } = await supabase.storage
      .from('chat-images')
      .upload(fileName, buffer, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Image upload error:', error)
      throw new Error(`Failed to upload image: ${error.message}`)
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('chat-images')
      .getPublicUrl(fileName)

    console.log('✅ Image uploaded successfully:', urlData.publicUrl)
    return urlData.publicUrl

  } catch (error) {
    console.error('Upload chat image error:', error)
    throw error
  }
}

/**
 * Create a new chat session
 */
export async function createChatSession(params: {
  businessUnitId: string
  aiStaffId?: string
  userIdentifier?: string
  userId?: string
  userIp?: string
  userAgent?: string
  language?: string
}): Promise<string> {
  try {
    const supabase = getSupabaseServiceClient()

    const insertData: Record<string, any> = {
      business_unit_id: params.businessUnitId,
      ai_staff_id: params.aiStaffId,
      user_identifier: params.userIdentifier,
      user_ip: params.userIp,
      user_agent: params.userAgent,
      language: params.language || 'en'
    }
    if (params.userId) {
      insertData.user_id = params.userId
    }

    const { data, error } = await supabase
      .from('chat_sessions')
      .insert(insertData)
      .select('id')
      .single()

    if (error) {
      console.error('Create chat session error:', error)
      throw new Error(`Failed to create chat session: ${error.message}`)
    }

    console.log('✅ Chat session created:', data.id)
    return data.id

  } catch (error) {
    console.error('Create chat session error:', error)
    throw error
  }
}

/**
 * Save a chat message (with optional image)
 */
export async function saveChatMessage(params: {
  sessionId: string
  messageType: 'user' | 'ai'
  content: string
  imageBase64?: string  // Optional image
  aiModel?: string
  aiProvider?: string
  tokensUsed?: number
  isflagged?: boolean
  flagReason?: string
  sentiment?: string
}): Promise<string> {
  try {
    const supabase = getSupabaseServiceClient()

    // Upload image if provided
    let imageUrl: string | undefined
    if (params.imageBase64) {
      imageUrl = await uploadChatImage(params.imageBase64, params.sessionId)
    }

    // Insert message
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        session_id: params.sessionId,
        message_type: params.messageType,
        content: params.content,
        image_url: imageUrl,
        has_image: !!imageUrl,
        ai_model: params.aiModel,
        ai_provider: params.aiProvider,
        tokens_used: params.tokensUsed,
        is_flagged: params.isflagged || false,
        flag_reason: params.flagReason,
        sentiment: params.sentiment
      })
      .select('id')
      .single()

    if (error) {
      console.error('Save chat message error:', error)
      throw new Error(`Failed to save chat message: ${error.message}`)
    }

    console.log('✅ Chat message saved:', data.id)
    return data.id

  } catch (error) {
    console.error('Save chat message error:', error)
    throw error
  }
}

/**
 * Load chat history for a session
 */
export async function loadChatHistory(sessionId: string): Promise<ChatMessage[]> {
  try {
    const supabase = getSupabaseServiceClient()

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Load chat history error:', error)
      throw new Error(`Failed to load chat history: ${error.message}`)
    }

    return data || []

  } catch (error) {
    console.error('Load chat history error:', error)
    throw error
  }
}

/**
 * Link a chat session to an authenticated user
 */
export async function linkSessionToUser(sessionId: string, userId: string): Promise<void> {
  try {
    const supabase = getSupabaseServiceClient()
    const { error } = await supabase
      .from('chat_sessions')
      .update({ user_id: userId })
      .eq('id', sessionId)

    if (error) {
      console.error('Link session to user error:', error)
      throw new Error(`Failed to link session: ${error.message}`)
    }
    console.log('✅ Chat session linked to user:', sessionId, userId)
  } catch (error) {
    console.error('Link session to user error:', error)
    throw error
  }
}

/**
 * End a chat session
 */
export async function endChatSession(sessionId: string): Promise<void> {
  try {
    const supabase = getSupabaseServiceClient()

    const { error } = await supabase
      .from('chat_sessions')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', sessionId)

    if (error) {
      console.error('End chat session error:', error)
      throw new Error(`Failed to end chat session: ${error.message}`)
    }

    console.log('✅ Chat session ended:', sessionId)

    // Trigger AI analysis of the conversation (async, don't block)
    analyzeConversationAsync(sessionId, supabase)

  } catch (error) {
    console.error('End chat session error:', error)
    throw error
  }
}

/**
 * Analyze conversation asynchronously (non-blocking)
 */
async function analyzeConversationAsync(sessionId: string, supabase: any): Promise<void> {
  try {
    const { analyzeAndUpdateSession } = await import('./conversation-analyzer')

    // Fetch messages
    const { data: messages } = await supabase
      .from('chat_messages')
      .select('message_type, content, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (messages && messages.length > 0) {
      await analyzeAndUpdateSession(sessionId, messages, supabase)
      console.log('✅ Conversation analyzed:', sessionId)
    }
  } catch (error) {
    // Don't throw - this is a background task
    console.error('Conversation analysis failed (non-blocking):', error)
  }
}

/**
 * Flag a message for review
 */
export async function flagMessage(
  messageId: string,
  reason: string
): Promise<void> {
  try {
    const supabase = getSupabaseServiceClient()

    const { error } = await supabase
      .from('chat_messages')
      .update({
        is_flagged: true,
        flag_reason: reason
      })
      .eq('id', messageId)

    if (error) {
      console.error('Flag message error:', error)
      throw new Error(`Failed to flag message: ${error.message}`)
    }

    console.log('🚩 Message flagged:', messageId, reason)

  } catch (error) {
    console.error('Flag message error:', error)
    throw error
  }
}

/**
 * Get flagged sessions (for admin review)
 */
export async function getFlaggedSessions(
  businessUnitId: string,
  limit = 50
): Promise<ChatSession[]> {
  try {
    const supabase = getSupabaseServiceClient()

    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('business_unit_id', businessUnitId)
      .eq('has_red_flags', true)
      .order('started_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Get flagged sessions error:', error)
      throw new Error(`Failed to get flagged sessions: ${error.message}`)
    }

    return data || []

  } catch (error) {
    console.error('Get flagged sessions error:', error)
    throw error
  }
}
