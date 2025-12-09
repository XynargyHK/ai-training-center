import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getLLMConfig } from '@/app/api/llm-config/route'

// Initialize Google Gemini client
function getGoogleClient() {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY || ''
  return new GoogleGenerativeAI(apiKey)
}

interface KnowledgeEntry {
  id: string
  category: string
  topic: string
  content: string
  keywords: string[]
  fileName?: string
}

interface FAQ {
  id: string
  keywords: string[]
  question: string
  answer: string
  category: string
  is_active: boolean
}

export async function POST(request: NextRequest) {
  try {
    const { knowledgeEntries, targetCount = 20, category = 'general', guidelines = [], existingQuestion = null, comments = '' } = await request.json()

    if (!knowledgeEntries || !Array.isArray(knowledgeEntries) || knowledgeEntries.length === 0) {
      return NextResponse.json(
        { error: 'No knowledge entries provided' },
        { status: 400 }
      )
    }

    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GOOGLE_GEMINI_API_KEY is not configured' },
        { status: 500 }
      )
    }

    // Prepare content for AI analysis - USE ALL CONTENT
    const knowledgeContent = knowledgeEntries.map((entry: KnowledgeEntry, index: number) => {
      return `
Entry ${index + 1}:
Title: ${entry.fileName || entry.topic}
Category: ${entry.category}
Content: ${entry.content}
---`
    }).join('\n')

    // Calculate FAQs per entry to reach target
    const faqsPerEntry = Math.ceil(targetCount / knowledgeEntries.length)

    // Prepare training guidelines if provided
    const guidelinesText = guidelines && guidelines.length > 0
      ? `\n\n## TRAINING GUIDELINES - MUST FOLLOW STRICTLY\n\n${guidelines.map((g: any) => `### ${g.title}\n${g.content}`).join('\n\n')}\n\n`
      : ''

    // Create prompt for FAQ generation with customer perspective
    let prompt = ''

    if (existingQuestion) {
      // Regenerate answer for existing question
      const commentsSection = comments ? `\n\n## USER COMMENTS ON HOW TO IMPROVE THIS ANSWER\n${comments}\n\nPlease incorporate these suggestions when generating the answer.\n` : ''

      prompt = `You are an expert at creating customer-focused FAQ answers.

## FUNDAMENTAL RULES - READ THIS FIRST

YOU MUST FOLLOW THESE RULES FROM THE BEGINNING:
1. 🚨 CRITICAL: READ THE ENTIRE KNOWLEDGE BASE CONTENT BELOW THOROUGHLY before answering
2. SEARCH through ALL entries in the knowledge base for relevant information
3. ONLY use information EXPLICITLY stated in the knowledge base content below
4. NEVER make up or invent ANY information - no prices, discounts, percentages, dates, features, or details
5. If you THOROUGHLY search ALL knowledge base entries and truly cannot find specific information, respond professionally without exposing internal gaps: "Let me check on that for you" or "I'll verify that information and get back to you"
6. 🚨 NEVER reveal internal issues like "we don't have this in our knowledge base" or "the knowledge base doesn't contain" - these are internal system issues
7. 🚨 DO NOT be lazy - if the information exists in the knowledge base, you MUST find it and use it

For the following customer question, generate a clear, helpful answer based ONLY on the knowledge base content provided.
YOU MUST READ ALL KNOWLEDGE BASE ENTRIES CAREFULLY BEFORE ANSWERING.

🚨 VOICE AND TONE:
- You ARE the company - speak as "we", "our", "us", not "the company" or "according to the website"
- WRONG: "According to the website..." or "The company offers..."
- RIGHT: "We offer..." or "Our products..."
- Respond as a professional company representative speaking directly to the customer

Category: "${category}"
Question: "${existingQuestion}"

If category is "pricing" - answer about cost, price, payment
If category is "products" - answer about product features, what products are available
If category is "shipping" - answer about delivery, shipping methods, shipping times
If category is "returns" - answer about return policy, refunds, exchanges
If category is "results" - answer about effectiveness, how long to see results, outcomes
If category is "ingredients" - answer about what ingredients are in products
If category is "general" - general company/brand information

Knowledge Base Content:
${knowledgeContent}
${guidelinesText}${commentsSection}
## CRITICAL INSTRUCTIONS - MUST FOLLOW

YOU MUST follow the TRAINING GUIDELINES above when generating your answer. These guidelines OVERRIDE all other instructions and define how answers should be structured, what tone to use, and what information to include or exclude.

Before generating your answer:
1. 🚨 SEARCH THOROUGHLY: Read through EVERY SINGLE knowledge base entry above
2. Read ALL training guidelines carefully
3. Check that your answer follows EACH guideline
4. ONLY use information that is EXPLICITLY stated in the knowledge base content above
5. NEVER make up or invent ANY information - no prices, discounts, percentages, dates, features, or any details
6. 🚨 If you cannot find the answer after THOROUGHLY searching ALL knowledge base entries, respond professionally: "Let me check on that for you" or "I'll verify that information and get back to you"
7. 🚨 NEVER reveal internal issues like "we don't have this in our knowledge base" or "the knowledge base doesn't contain" - these are internal system issues that must NEVER be exposed to customers
8. DO NOT give up too easily - if the information is in the knowledge base, you MUST find it

Return your response as a JSON array with a single FAQ object with this exact structure:
[
  {
    "question": "${existingQuestion}",
    "answer": "Clear, helpful answer following ALL training guidelines above",
    "category": "${category}",
    "keywords": ["relevant", "keywords"]
  }
]

Technical Requirements:
- Keep answers clear, helpful, and friendly (2-4 sentences)
- Speak AS the company using "we", "our", "us" - never refer to the company in third person
- IMPORTANT: Use ONLY straight double quotes (") in the JSON, NOT curly quotes (" or ")

Return ONLY the JSON array, no additional text or explanations.`
    } else {
      // Generate new questions and answers
      prompt = `You are an expert at creating customer-focused FAQs from a customer/client perspective.

## FUNDAMENTAL RULES - READ THIS FIRST

YOU MUST FOLLOW THESE RULES FROM THE BEGINNING:
1. 🚨 CRITICAL: READ THE ENTIRE KNOWLEDGE BASE CONTENT BELOW THOROUGHLY before generating FAQs
2. SEARCH through ALL entries in the knowledge base to find all available information
3. ONLY use information EXPLICITLY stated in the knowledge base content below
4. NEVER make up or invent ANY information - no prices, discounts, percentages, dates, features, or details
5. ONLY generate questions about topics that are covered in the knowledge base
6. If the knowledge base has limited information, generate ONLY what you can - quality over quantity
7. NEVER invent questions or answers just to meet the target count
8. 🚨 DO NOT be lazy - thoroughly search ALL knowledge base entries for relevant information

Generate approximately ${targetCount} questions for the "${category}" category (or fewer if knowledge base has limited content).

🚨 VOICE AND TONE:
- You ARE the company - speak as "we", "our", "us", not "the company" or "according to the website"
- WRONG: "According to the website..." or "The company offers..."
- RIGHT: "We offer..." or "Our products..."
- Respond as a professional company representative speaking directly to the customer

If category is "pricing" - only generate questions about cost, price, payment
If category is "products" - only generate questions about product features, what products are available
If category is "shipping" - only generate questions about delivery, shipping methods, shipping times
If category is "returns" - only generate questions about return policy, refunds, exchanges
If category is "results" - only generate questions about effectiveness, how long to see results, outcomes
If category is "ingredients" - only generate questions about what ingredients are in products
If category is "general" - general company/brand questions

Knowledge Base Content:
${knowledgeContent}
${guidelinesText}
## CRITICAL INSTRUCTIONS - MUST FOLLOW

YOU MUST follow the TRAINING GUIDELINES above when generating your answers. These guidelines OVERRIDE all other instructions and define how answers should be structured, what tone to use, and what information to include or exclude.

Customer Perspective Examples:
- "How much does X cost?" (not "What is the price of X?")
- "Do you ship internationally?" (not "What are the shipping options?")
- "How long will it take to see results?" (not "What is the timeline for results?")
- "Can I return this if I'm not satisfied?" (not "What is the return policy?")

Before generating your FAQs:
1. 🚨 SEARCH THOROUGHLY: Read through EVERY SINGLE knowledge base entry above to understand ALL available information
2. Read ALL training guidelines carefully
3. Read the knowledge base content carefully to understand what topics and information are available
4. ONLY generate questions about topics that are covered in the knowledge base content above
5. If the knowledge base has limited information and you cannot generate the requested number of FAQs, generate ONLY what you can based on available content
6. Generate questions from CUSTOMER'S perspective (use "I", "my", "we", "our")
7. Ensure EVERY answer follows EACH training guideline
8. ONLY use information EXPLICITLY stated in the knowledge base - NEVER make up prices, discounts, percentages, dates, features, or any details
9. NEVER invent questions or answers - quality over quantity
10. 🚨 DO NOT give up too easily - if information is in the knowledge base, you MUST find it and use it

Return your response as a JSON array of FAQ objects with this exact structure:
[
  {
    "question": "Customer's question from their perspective",
    "answer": "Clear, helpful answer following ALL training guidelines above",
    "category": "${category}",
    "keywords": ["relevant", "keywords"]
  }
]

Technical Requirements:
- Generate approximately ${targetCount} customer questions for "${category}" category only
- Keep answers clear, helpful, and friendly (2-4 sentences)
- Speak AS the company using "we", "our", "us" - never refer to the company in third person
- Extract relevant keywords from each question
- All FAQs must have category: "${category}"
- IMPORTANT: Use ONLY straight double quotes (") in the JSON, NOT curly quotes (" or ")

Return ONLY the JSON array, no additional text or explanations.`
    }

    // Call Gemini API
    const genAI = getGoogleClient()
    const llmConfig = getLLMConfig()
    const model = genAI.getGenerativeModel({ model: llmConfig.model || 'gemini-2.5-flash' })

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
      }
    })

    // Extract the response
    const responseText = result.response.text() || ''

    // Parse JSON response
    let generatedFaqsData: any[]
    try {
      // Clean the response text
      let cleanedText = responseText.trim()

      // Remove markdown code blocks if present
      cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*/g, '')

      // Replace ALL types of smart quotes with regular quotes
      cleanedText = cleanedText
        .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')  // Replace all smart double quotes
        .replace(/[\u2018\u2019\u201A\u201B\u2032]/g, "'")        // Replace all smart single quotes

      // Try to extract JSON array from the response
      const jsonMatch = cleanedText.match(/\[\s*\{[\s\S]*\}\s*\]/)
      if (jsonMatch) {
        // Clean up any potential issues with the JSON string
        let jsonString = jsonMatch[0]
        // Remove any trailing commas before closing brackets/braces
        jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1')
        generatedFaqsData = JSON.parse(jsonString)
      } else {
        // Try parsing the whole response
        generatedFaqsData = JSON.parse(cleanedText)
      }

      // Validate that it's an array
      if (!Array.isArray(generatedFaqsData)) {
        throw new Error('Response is not an array')
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      console.error('Response text:', responseText)
      return NextResponse.json(
        { error: 'Failed to parse AI response', details: responseText.substring(0, 500) },
        { status: 500 }
      )
    }

    // Transform to FAQ format with proper IDs
    const faqs: FAQ[] = generatedFaqsData.map((faqData, index) => ({
      id: `faq-gen-${Date.now()}-${index}`,
      question: faqData.question || 'Generated Question',
      answer: faqData.answer || 'Generated Answer',
      category: faqData.category || 'general',
      keywords: Array.isArray(faqData.keywords) ? faqData.keywords : [],
      is_active: true
    }))

    return NextResponse.json({
      success: true,
      faqs,
      count: faqs.length
    })

  } catch (error: any) {
    console.error('FAQ generation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate FAQs',
        details: error.message
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'FAQ Generation API',
    method: 'POST',
    body: {
      knowledgeEntries: 'Array of knowledge base entries to generate FAQs from'
    }
  })
}
