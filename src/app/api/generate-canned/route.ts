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

interface CannedMessage {
  id: string
  scenario: string
  template: string
  variables?: string[]
  category?: string
}

export async function POST(request: NextRequest) {
  try {
    const {
      knowledgeEntries,
      targetCount = 10,
      guidelines = [],
      category = 'beauty tips',
      generationMode = 'knowledge',
      researchSources = [],
      copywritingStyle = 'high-converting'
    } = await request.json()

    // Validate based on generation mode
    if (generationMode === 'knowledge' && (!knowledgeEntries || !Array.isArray(knowledgeEntries) || knowledgeEntries.length === 0)) {
      return NextResponse.json(
        { error: 'No knowledge entries provided for knowledge-based generation' },
        { status: 400 }
      )
    }

    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GOOGLE_GEMINI_API_KEY is not configured' },
        { status: 500 }
      )
    }

    // Prepare content based on generation mode
    let knowledgeContent = ''
    let modeInstructions = ''

    if (generationMode === 'knowledge' && knowledgeEntries && knowledgeEntries.length > 0) {
      knowledgeContent = knowledgeEntries.map((entry: KnowledgeEntry, index: number) => {
        return `
Entry ${index + 1}:
Title: ${entry.fileName || entry.topic}
Category: ${entry.category}
Content: ${entry.content}
---`
      }).join('\n')
      modeInstructions = 'ONLY use information EXPLICITLY stated in the knowledge base content below'
    } else if (generationMode === 'research') {
      // Include research sources if provided
      if (researchSources && researchSources.length > 0) {
        knowledgeContent = `Expert Sources to Reference:\n\n${researchSources.map((source: any, index: number) => `
${index + 1}. ${source.name} (${source.credibility})
   ${source.description}
`).join('\n')}\n\nUse insights and expertise from these authoritative sources to create high-quality, professional content.`
        modeInstructions = `Base your content on the expertise and insights from the provided authoritative sources above. Create professional, well-researched content that reflects the quality and knowledge of these expert sources.`
      } else {
        knowledgeContent = `No knowledge base provided. Use your deep expertise and research to create high-quality, professional content.`
        modeInstructions = 'Use your expertise to create well-researched, professional, and helpful content based on industry best practices and expert knowledge'
      }
    }

    // Prepare training guidelines if provided
    const guidelinesText = guidelines && guidelines.length > 0
      ? `\n\n## TRAINING GUIDELINES - MUST FOLLOW STRICTLY\n\n${guidelines.map((g: any) => `### ${g.title}\n${g.content}`).join('\n\n')}\n\n`
      : ''

    // Create prompt for canned message generation
    const prompt = `You are an expert copywriter and content creator specializing in high-converting, engaging content for ${category}.

${copywritingStyle === 'high-converting' ? `
## 🎯 COPYWRITING MISSION: CREATE HIGH-CONVERTING SALES CONTENT

You are writing persuasive content designed to drive product sales through newsletters, Facebook posts, and Instagram captions. Your goal is to:
- HOOK readers with attention-grabbing headlines that highlight their pain points
- Create DESIRE and URGENCY for our products through compelling storytelling
- Position our products as the SOLUTION to their problems
- Drive traffic to our landing page where they can PURCHASE

## 📝 CONTENT STRUCTURE (200-300 words each):

**1. HOOK (20-30 words):**
- Start with a painful problem, frustration, or desire
- Make readers STOP scrolling by hitting their pain point
- Examples: "Tired of [problem]?" "What if you could [desire]?" "Stop wasting money on [competitor approach]"

**2. AGITATE THE PROBLEM (60-80 words):**
- Describe how this problem affects their daily life
- Make them FEEL the frustration and consequences
- Use "you" language to make it personal
- Paint a vivid "before" picture that makes them desperate for a solution
- Examples: "Every morning you look in the mirror and see...", "You've tried everything but nothing works..."

**3. INTRODUCE THE SOLUTION - OUR PRODUCT (80-100 words):**
- Present OUR product/service as the answer
- Explain WHY our approach is different and better
- Include specific product benefits and ingredients/features
- Build credibility with science, expert endorsement, or social proof
- Create desire by showing the transformation our product delivers
- Examples: "That's why we created [Product Name]...", "Our exclusive formula contains..."

**4. PAINT THE TRANSFORMATION (40-50 words):**
- Show the "after" picture in vivid detail
- Describe specific results they'll experience
- Make it feel attainable and irresistible
- Use sensory language and emotional benefits
- Examples: "Imagine waking up to...", "Within just days you'll notice..."

**5. COMPELLING CTA (20-30 words):**
- Create URGENCY and DESIRE to click
- Direct them to landing page to learn more AND purchase
- Use action words: "Discover", "Shop", "Get", "Transform"
- Examples: "Ready to transform your skin? Discover our best-selling [Product] on our landing page! ✨", "Don't wait - shop our exclusive [Product Name] now! 💕 Visit our landing page"

**SALES PSYCHOLOGY PRINCIPLES:**
- Problem-Agitate-Solution framework
- FOMO (Fear of Missing Out)
- Social proof when possible
- Transformation promises
- Benefit-focused (not just feature-focused)
- Create emotional connection then logical justification

**TONE & STYLE:**
- Persuasive and compelling
- Conversational but authoritative
- Empathetic to their pain points
- Confident in our solution
- **SALES-DRIVEN** - every word moves them closer to purchase
` : ''}

## GENERATION MODE: ${generationMode === 'knowledge' ? 'Knowledge Base' : 'Deep AI Research'}

## FUNDAMENTAL RULES - READ THIS FIRST

${modeInstructions}

${generationMode === 'knowledge' ? `
KNOWLEDGE BASE MODE RULES:
1. ONLY use information EXPLICITLY stated in the knowledge base content below
2. NEVER make up or invent ANY information - no product names, ingredients, prices, percentages, dates, or details
3. ONLY generate messages based on topics covered in the knowledge base
4. If the knowledge base has limited information, generate ONLY what you can - quality over quantity
5. NEVER invent content just to meet the target count
` : `
DEEP RESEARCH MODE RULES:
1. Use your expertise and industry knowledge to create high-quality content
2. Generate professional, well-researched messages that would be useful for customer service
3. Focus on best practices, helpful tips, and actionable advice
4. Create content that is accurate, professional, and trustworthy
5. Base responses on general industry knowledge and expert understanding of the category
`}

Generate ${copywritingStyle === 'high-converting' ? 'EXACTLY 3' : `approximately ${targetCount}`} canned messages for the category: "${category}".

${copywritingStyle === 'high-converting' ? '⚠️ IMPORTANT: Generate ONLY 3 messages. Do not generate more than 3 messages. Quality over quantity.' : ''}

🚨 VOICE AND TONE:
- You ARE the company - speak as "we", "our", "us", not "the company" or "according to the website"
- WRONG: "According to the website..." or "The company offers..."
- RIGHT: "We recommend..." or "Our products..."
- Respond as a professional company representative speaking directly to the customer

${generationMode === 'knowledge' ? `Knowledge Base Content:\n${knowledgeContent}` : `Research Context:\n${knowledgeContent}`}
${guidelinesText}
## CRITICAL INSTRUCTIONS - MUST FOLLOW

${generationMode === 'knowledge' ? `
YOU MUST follow the TRAINING GUIDELINES above when generating your canned messages. These guidelines OVERRIDE all other instructions and define how messages should be structured, what tone to use, and what information to include or exclude.

Before generating your canned messages:
1. Read ALL training guidelines carefully
2. Read the knowledge base content carefully to understand what topics and information are available
3. ONLY generate content about topics that are covered in the knowledge base
4. Create helpful, actionable messages that customers would find valuable
5. Each canned message should be a complete, standalone response
6. ONLY use information EXPLICITLY stated in the knowledge base - NEVER make up details
7. NEVER invent content - quality over quantity
` : `
Use your expertise to generate high-quality canned messages for the category "${category}".

Before generating your canned messages:
1. Read ALL training guidelines carefully (if provided)
2. Draw upon your expert knowledge of the category topic
3. Create helpful, actionable, and professional messages
4. Each canned message should provide real value to customers
5. Use industry best practices and proven strategies
6. Make content specific and actionable, not generic
7. Focus on quality and usefulness
`}

Message Types to Generate for "${category}":
${generationMode === 'research' ? `
Create diverse, expert-level messages such as:
- Professional tips and best practices
- How-to guidance and instructions
- Expert recommendations and advice
- Common questions and solutions
- Helpful insights and strategies
` : `
Base message types on available knowledge base content:
- Tips and recommendations from knowledge base
- Usage instructions for mentioned products/services
- Answers to common questions based on knowledge base
- Advice related to topics covered in knowledge base
`}

Return your response as a JSON array of canned message objects with this exact structure:
[
  {
    "scenario": "Descriptive title for this message (e.g., 'Why Your Skin Looks Dull by Afternoon', 'The Vitamin C Secret Dermatologists Use')",
    "template": "The full 200-300 word high-converting message following the structure above: Hook → Story/Problem → Education → Solution → Soft CTA",
    "variables": []
  }
]

Technical Requirements:
- Generate ${copywritingStyle === 'high-converting' ? 'EXACTLY 3 messages - NO MORE, NO LESS' : `approximately ${targetCount} canned messages`}
- Each message MUST be ${copywritingStyle === 'high-converting' ? '200-300 words' : '2-4 sentences'}
- ${copywritingStyle === 'high-converting' ? '⚠️ CRITICAL: Stop after generating exactly 3 messages. Do not generate more.' : ''}
- Follow the 5-part structure: Hook, Problem/Agitate, Solution (Our Product), Transformation, Compelling CTA
- ALWAYS end with "Learn more on our landing page" or similar soft invitation
- Speak AS the company using "we", "our", "us" - never refer to the company in third person
- Use engaging, conversational tone
- Include relevant emoji where appropriate (especially in CTA)
- IMPORTANT: Use ONLY straight double quotes (") in the JSON, NOT curly quotes (" or ")

Return ONLY the JSON array, no additional text or explanations.`

    // Call Gemini API
    const genAI = getGoogleClient()
    const llmConfig = getLLMConfig()
    const geminiModel = genAI.getGenerativeModel({ model: llmConfig.model || 'gemini-2.5-flash' })

    const result = await geminiModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
      }
    })

    // Extract the response
    const responseText = result.response.text() || ''

    // Parse JSON response
    let generatedMessagesData: any[]
    try {
      // Clean the response text
      let cleanedText = responseText.trim()

      // Remove markdown code blocks if present
      cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*/g, '')

      // Replace ALL types of smart quotes with regular quotes
      cleanedText = cleanedText
        .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')  // Replace all smart double quotes
        .replace(/[\u2018\u2019\u201A\u201B\u2032]/g, "'")        // Replace all smart single quotes

      // First, extract the JSON array to work with it
      let jsonString = cleanedText
      const jsonMatch = cleanedText.match(/\[\s*\{[\s\S]*\}\s*\]/)
      if (jsonMatch) {
        jsonString = jsonMatch[0]
      }

      // Now properly escape newlines and control characters within JSON strings
      // This regex finds content between quotes and escapes newlines within them
      jsonString = jsonString.replace(/"([^"]*(?:\\"[^"]*)*)"/g, (match, content) => {
        // Escape newlines, tabs, and other control characters within the string
        const escaped = content
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/\t/g, '\\t')
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove other control chars
        return `"${escaped}"`
      })

      // Remove any trailing commas before closing brackets/braces
      jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1')

      // Parse the cleaned JSON
      generatedMessagesData = JSON.parse(jsonString)

      // Validate that it's an array
      if (!Array.isArray(generatedMessagesData)) {
        throw new Error('Response is not an array')
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      console.error('Response text:', responseText)

      // Check if response was truncated (incomplete JSON)
      const isTruncated = !responseText.trim().endsWith(']') || responseText.includes('...') ||
                          (parseError instanceof SyntaxError && parseError.message.includes('Unterminated'))

      const errorMessage = isTruncated
        ? 'AI response was too long and got cut off. The model reached its token limit. Try generating fewer messages or using shorter content.'
        : 'Failed to parse AI response'

      return NextResponse.json(
        {
          error: errorMessage,
          details: responseText.substring(0, 500),
          suggestion: isTruncated ? 'Response was truncated. Reduce the number of messages or word count.' : undefined
        },
        { status: 500 }
      )
    }

    // Transform to CannedMessage format with proper IDs
    const cannedMessages: CannedMessage[] = generatedMessagesData.map((msgData, index) => ({
      id: `canned-gen-${Date.now()}-${index}`,
      scenario: msgData.scenario || 'Canned Message',
      template: msgData.template || 'Generated message',
      variables: Array.isArray(msgData.variables) ? msgData.variables : [],
      category: category
    }))

    return NextResponse.json({
      success: true,
      messages: cannedMessages,
      count: cannedMessages.length
    })

  } catch (error: any) {
    console.error('Canned message generation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate canned messages',
        details: error.message
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Canned Message Generation API',
    method: 'POST',
    body: {
      knowledgeEntries: 'Array of knowledge base entries to generate canned messages from',
      targetCount: 'Number of canned messages to generate (default: 10)',
      guidelines: 'Optional training guidelines array'
    }
  })
}
