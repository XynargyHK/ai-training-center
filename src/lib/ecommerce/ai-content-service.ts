/**
 * AI Content Generation Service
 * Generate product descriptions, titles, and image prompts using AI
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export interface AIGeneratedContent {
  id: string
  product_id: string
  content_type: 'description' | 'image' | 'title' | 'subtitle' | 'meta_description'
  prompt: string
  model: string
  generated_content: string
  status: 'draft' | 'approved' | 'rejected'
  metadata?: Record<string, any>
  created_at: string
  approved_at?: string
  approved_by?: string
}

/**
 * Generate a product description using AI
 */
export async function generateProductDescription(params: {
  productTitle: string
  category?: string
  keywords?: string[]
  tone?: 'professional' | 'casual' | 'enthusiastic' | 'minimal'
  length?: 'short' | 'medium' | 'long'
}): Promise<string> {
  const { productTitle, category, keywords, tone = 'professional', length = 'medium' } = params

  // Construct the prompt
  let prompt = `Write a compelling product description for: "${productTitle}"`

  if (category) {
    prompt += `\nCategory: ${category}`
  }

  if (keywords && keywords.length > 0) {
    prompt += `\nKey features/keywords: ${keywords.join(', ')}`
  }

  prompt += `\n\nTone: ${tone}`

  const lengthGuide = {
    short: '2-3 sentences, ~50 words',
    medium: '1-2 paragraphs, ~100-150 words',
    long: '3-4 paragraphs, ~200-300 words'
  }

  prompt += `\nLength: ${lengthGuide[length]}`
  prompt += `\n\nWrite an engaging product description that highlights the benefits and features. Focus on what makes this product special and why customers should buy it.`

  try {
    // Use OpenAI API or local LLM
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        max_tokens: length === 'short' ? 150 : length === 'medium' ? 300 : 500,
        temperature: 0.7
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate description')
    }

    return data.text
  } catch (error) {
    console.error('Error generating description:', error)
    throw error
  }
}

/**
 * Generate a catchy product title from a basic title
 */
export async function generateProductTitle(params: {
  basicTitle: string
  category?: string
  style?: 'concise' | 'descriptive' | 'creative'
}): Promise<string> {
  const { basicTitle, category, style = 'concise' } = params

  let prompt = `Create a ${style} product title based on: "${basicTitle}"`

  if (category) {
    prompt += `\nCategory: ${category}`
  }

  prompt += `\n\nGenerate a single product title that is:`
  prompt += style === 'concise' ? '\n- Short and punchy (3-5 words)' : ''
  prompt += style === 'descriptive' ? '\n- Descriptive and informative (5-8 words)' : ''
  prompt += style === 'creative' ? '\n- Creative and attention-grabbing' : ''
  prompt += '\n- SEO-friendly\n- Professional\n- Without quotes or extra formatting'

  try {
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        max_tokens: 50,
        temperature: 0.8
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate title')
    }

    return data.text.trim().replace(/['"]/g, '')
  } catch (error) {
    console.error('Error generating title:', error)
    throw error
  }
}

/**
 * Generate an image prompt for product photography
 */
export async function generateImagePrompt(params: {
  productTitle: string
  productDescription?: string
  style?: 'realistic' | 'artistic' | 'minimal' | 'lifestyle'
}): Promise<string> {
  const { productTitle, productDescription, style = 'realistic' } = params

  let prompt = `Create a detailed image prompt for a product photo of: "${productTitle}"`

  if (productDescription) {
    prompt += `\nProduct details: ${productDescription.substring(0, 200)}`
  }

  const styleGuides = {
    realistic: 'photorealistic, studio lighting, white background, professional product photography',
    artistic: 'artistic composition, creative lighting, colorful background, high-end aesthetic',
    minimal: 'minimalist style, clean background, soft lighting, simple composition',
    lifestyle: 'lifestyle setting, natural lighting, in-use scenario, relatable environment'
  }

  prompt += `\n\nStyle: ${style} (${styleGuides[style]})`
  prompt += `\n\nGenerate a detailed image prompt that describes:`
  prompt += `\n- The product and its key features`
  prompt += `\n- Lighting and composition`
  prompt += `\n- Background and setting`
  prompt += `\n- Camera angle and framing`
  prompt += `\n\nKeep the prompt under 150 words, specific and actionable for AI image generation.`

  try {
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        max_tokens: 300,
        temperature: 0.7
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate image prompt')
    }

    return data.text
  } catch (error) {
    console.error('Error generating image prompt:', error)
    throw error
  }
}

/**
 * Save AI-generated content to database
 */
export async function saveAIContent(data: {
  product_id: string
  content_type: 'description' | 'image' | 'title' | 'subtitle' | 'meta_description'
  prompt: string
  model: string
  generated_content: string
  status?: 'draft' | 'approved' | 'rejected'
  metadata?: Record<string, any>
}): Promise<AIGeneratedContent> {
  const { data: content, error } = await supabase
    .from('ai_generated_content')
    .insert({
      ...data,
      status: data.status || 'draft',
      metadata: data.metadata || {}
    })
    .select()
    .single()

  if (error) throw error
  return content
}

/**
 * Get AI-generated content for a product
 */
export async function getAIContentForProduct(
  productId: string,
  contentType?: 'description' | 'image' | 'title' | 'subtitle' | 'meta_description'
): Promise<AIGeneratedContent[]> {
  let query = supabase
    .from('ai_generated_content')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })

  if (contentType) {
    query = query.eq('content_type', contentType)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

/**
 * Approve AI-generated content
 */
export async function approveAIContent(
  contentId: string,
  approvedBy: string
): Promise<AIGeneratedContent> {
  const { data, error } = await supabase
    .from('ai_generated_content')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: approvedBy
    })
    .eq('id', contentId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Generate complete product content (title, description, image prompt)
 */
export async function generateCompleteProductContent(params: {
  productId: string
  basicTitle: string
  category?: string
  keywords?: string[]
  tone?: 'professional' | 'casual' | 'enthusiastic' | 'minimal'
  imageStyle?: 'realistic' | 'artistic' | 'minimal' | 'lifestyle'
}): Promise<{
  title: string
  description: string
  imagePrompt: string
}> {
  const { productId, basicTitle, category, keywords, tone, imageStyle } = params

  try {
    // Generate title
    const title = await generateProductTitle({
      basicTitle,
      category,
      style: 'descriptive'
    })

    // Generate description
    const description = await generateProductDescription({
      productTitle: title,
      category,
      keywords,
      tone,
      length: 'medium'
    })

    // Generate image prompt
    const imagePrompt = await generateImagePrompt({
      productTitle: title,
      productDescription: description,
      style: imageStyle
    })

    // Save all generated content to database
    await Promise.all([
      saveAIContent({
        product_id: productId,
        content_type: 'title',
        prompt: `Generate title for: ${basicTitle}`,
        model: 'gpt-4',
        generated_content: title,
        status: 'draft'
      }),
      saveAIContent({
        product_id: productId,
        content_type: 'description',
        prompt: `Generate description for: ${title}`,
        model: 'gpt-4',
        generated_content: description,
        status: 'draft'
      }),
      saveAIContent({
        product_id: productId,
        content_type: 'image',
        prompt: imagePrompt,
        model: 'gpt-4',
        generated_content: imagePrompt,
        status: 'draft'
      })
    ])

    return { title, description, imagePrompt }
  } catch (error) {
    console.error('Error generating complete product content:', error)
    throw error
  }
}
