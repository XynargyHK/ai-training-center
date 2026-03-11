/**
 * Embeddings Utility
 * Generates vector embeddings using Google Gemini (preferred) or OpenAI
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'

// Initialize clients lazily
let genAI: GoogleGenerativeAI | null = null
let openaiClient: OpenAI | null = null

function getGoogleAI() {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '')
  }
  return genAI
}

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
 * DEFAULT: Google Gemini text-embedding-004 (768 dimensions)
 * FALLBACK/LEGACY: OpenAI text-embedding-3-small (1536 dimensions)
 * 
 * Note: Database dimensions must match the model used.
 */
export async function generateEmbedding(text: string, forceProvider?: 'google' | 'openai'): Promise<number[]> {
  const provider = forceProvider || process.env.EMBEDDING_PROVIDER || 'openai' // Default to OpenAI for database compatibility if not specified
  
  try {
    const cleanText = text.trim().replace(/\n+/g, ' ')
    if (!cleanText) throw new Error('Text cannot be empty')

    if (provider === 'google') {
      const genAI = getGoogleAI()
      const model = genAI.getGenerativeModel({ model: 'text-embedding-004' })
      const result = await model.embedContent(cleanText)
      return Array.from(result.embedding.values)
    } else {
      // OpenAI Legacy Support (1536 dims)
      const openai = getOpenAIClient()
      const truncatedText = truncateToTokenLimit(cleanText, 8000)
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: truncatedText,
        encoding_format: 'float'
      })
      return response.data[0].embedding
    }
  } catch (error) {
    console.error(`Error generating ${provider} embedding:`, error)
    // If google fails, try fallback to openai if keys exist
    if (provider === 'google' && process.env.OPENAI_API_KEY) {
      console.log('🔄 Falling back to OpenAI for embedding...')
      return generateEmbedding(text, 'openai')
    }
    throw error
  }
}

/**
 * Generate embeddings for multiple texts in batch
 */
export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  const provider = process.env.EMBEDDING_PROVIDER || 'openai'
  
  try {
    if (texts.length === 0) return []
    const cleanTexts = texts.map(text => text.trim().replace(/\n+/g, ' '))

    if (provider === 'google') {
      const genAI = getGoogleAI()
      const model = genAI.getGenerativeModel({ model: 'text-embedding-004' })
      // Gemini batch embedding
      const results = await Promise.all(cleanTexts.map(text => model.embedContent(text)))
      return results.map(r => Array.from(r.embedding.values))
    } else {
      const openai = getOpenAIClient()
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: cleanTexts,
        encoding_format: 'float'
      })
      return response.data.map(item => item.embedding)
    }
  } catch (error) {
    console.error('Error generating embeddings batch:', error)
    throw error
  }
}

/**
 * Generate embedding for knowledge base entry
 */
export async function generateKnowledgeEmbedding(entry: {
  topic?: string
  content: string
  category?: string
}): Promise<number[]> {
  const textParts = [entry.category || '', entry.topic || '', entry.content].filter(Boolean)
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
  const textParts = [guideline.category || '', guideline.title, guideline.content].filter(Boolean)
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
  const textParts = [training.category || '', training.question, training.answer].filter(Boolean)
  const combinedText = textParts.join(' | ')
  return generateEmbedding(combinedText)
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`)
  let dotProduct = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4)
}

export function truncateToTokenLimit(text: string, maxTokens: number = 8000): string {
  const estimatedTokens = estimateTokenCount(text)
  if (estimatedTokens <= maxTokens) return text
  const maxChars = maxTokens * 4
  return text.substring(0, maxChars)
}

export function estimateEmbeddingCost(text: string): number {
  const tokens = estimateTokenCount(text)
  const costPerToken = 0.02 / 1_000_000 
  return tokens * costPerToken
}
