/**
 * Embeddings Utility
 * Generates vector embeddings using OpenAI API
 */

import OpenAI from 'openai'

// Initialize OpenAI client lazily
let openaiClient: OpenAI | null = null

function getOpenAIClient() {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }
  return openaiClient
}

/**
 * Generate embedding for a text string
 * Uses OpenAI's text-embedding-3-small model (1536 dimensions)
 * Cost: ~$0.00002 per 1K tokens
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Clean and prepare text
    let cleanText = text.trim().replace(/\n+/g, ' ')

    if (!cleanText) {
      throw new Error('Text cannot be empty')
    }

    // Truncate if needed (8192 token limit for text-embedding-3-small)
    cleanText = truncateToTokenLimit(cleanText, 8000)

    // Generate embedding
    const openai = getOpenAIClient()
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: cleanText,
      encoding_format: 'float' // Returns array of floats
    })

    return response.data[0].embedding
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw error
  }
}

/**
 * Generate embeddings for multiple texts in batch
 * More efficient than calling generateEmbedding multiple times
 */
export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  try {
    if (texts.length === 0) {
      return []
    }

    // Clean texts
    const cleanTexts = texts.map(text => text.trim().replace(/\n+/g, ' '))

    // Generate embeddings in batch (OpenAI supports up to 2048 inputs)
    const openai = getOpenAIClient()
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: cleanTexts,
      encoding_format: 'float'
    })

    return response.data.map(item => item.embedding)
  } catch (error) {
    console.error('Error generating embeddings batch:', error)
    throw error
  }
}

/**
 * Generate embedding for knowledge base entry
 * Combines topic and content for better semantic representation
 */
export async function generateKnowledgeEmbedding(entry: {
  topic?: string
  content: string
  category?: string
}): Promise<number[]> {
  // Combine fields for richer semantic representation
  const textParts = [
    entry.category || '',
    entry.topic || '',
    entry.content
  ].filter(Boolean)

  const combinedText = textParts.join(' | ')

  return generateEmbedding(combinedText)
}

/**
 * Generate embedding for guideline
 */
export async function generateGuidelineEmbedding(guideline: {
  title: string
  content: string
  category?: string
}): Promise<number[]> {
  const textParts = [
    guideline.category || '',
    guideline.title,
    guideline.content
  ].filter(Boolean)

  const combinedText = textParts.join(' | ')

  return generateEmbedding(combinedText)
}

/**
 * Generate embedding for training data
 */
export async function generateTrainingEmbedding(training: {
  question: string
  answer: string
  category?: string
}): Promise<number[]> {
  const textParts = [
    training.category || '',
    training.question,
    training.answer
  ].filter(Boolean)

  const combinedText = textParts.join(' | ')

  return generateEmbedding(combinedText)
}

/**
 * Calculate cosine similarity between two embeddings
 * Returns value between -1 and 1 (higher = more similar)
 * Note: Supabase uses <=> operator which returns distance (lower = more similar)
 * So similarity = 1 - distance
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same dimension')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * Estimate token count for text (rough approximation)
 * Actual tokens may vary, but this is close enough for cost estimation
 */
export function estimateTokenCount(text: string): number {
  // Rough estimate: ~4 characters per token
  return Math.ceil(text.length / 4)
}

/**
 * Truncate text to fit within token limit
 * Max token limit for text-embedding-3-small is 8192 tokens
 */
export function truncateToTokenLimit(text: string, maxTokens: number = 8000): string {
  const estimatedTokens = estimateTokenCount(text)

  if (estimatedTokens <= maxTokens) {
    return text
  }

  // Truncate to approximately maxTokens (4 chars per token)
  const maxChars = maxTokens * 4
  const truncated = text.substring(0, maxChars)

  console.warn(`⚠️ Text truncated from ~${estimatedTokens} tokens to ~${maxTokens} tokens`)

  return truncated
}

/**
 * Estimate cost for generating embeddings
 * text-embedding-3-small: $0.02 per 1M tokens
 */
export function estimateEmbeddingCost(text: string): number {
  const tokens = estimateTokenCount(text)
  const costPerToken = 0.02 / 1_000_000 // $0.02 per 1M tokens
  return tokens * costPerToken
}
