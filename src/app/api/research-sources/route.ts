import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

export async function POST(request: NextRequest) {
  try {
    const { category } = await request.json()

    if (!category) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      )
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY is not configured' },
        { status: 500 }
      )
    }

    // Create prompt for researching expert sources
    const prompt = `You are an expert researcher tasked with finding the top 10 most authoritative and credible sources for the category: "${category}".

Find 10 expert sources that would be valuable for creating high-quality content in this category. These could include:
- Top industry blogs and websites
- Leading experts and thought leaders
- Research institutions
- Authoritative publications
- Industry associations
- Well-known brands in the space

For each source, provide:
1. Name: The name of the source (publication, expert, website, etc.)
2. Description: A brief 1-2 sentence description of what makes this source valuable
3. Credibility: Rate as "High Authority", "Expert", or "Industry Leader"

Return your response as a JSON array with this exact structure:
[
  {
    "name": "Source name here",
    "description": "Why this source is valuable and credible (1-2 sentences)",
    "credibility": "High Authority"
  }
]

Focus on sources that are:
- Widely recognized and respected
- Have proven expertise in the field
- Produce high-quality, research-backed content
- Are trusted by professionals in the industry

Return ONLY the JSON array, no additional text or explanations.`

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    // Extract the response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    // Parse JSON response
    let sourcesData: any[]
    try {
      // Clean the response text
      let cleanedText = responseText.trim()

      // Remove markdown code blocks if present
      cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*/g, '')

      // Replace smart quotes with regular quotes
      cleanedText = cleanedText
        .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
        .replace(/[\u2018\u2019\u201A\u201B\u2032]/g, "'")

      // Try to extract JSON array from the response
      const jsonMatch = cleanedText.match(/\[\s*\{[\s\S]*\}\s*\]/)
      if (jsonMatch) {
        let jsonString = jsonMatch[0]
        // Remove trailing commas
        jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1')
        sourcesData = JSON.parse(jsonString)
      } else {
        sourcesData = JSON.parse(cleanedText)
      }

      // Validate that it's an array
      if (!Array.isArray(sourcesData)) {
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

    // Transform to proper format with IDs
    const sources = sourcesData.map((sourceData, index) => ({
      id: `source-${Date.now()}-${index}`,
      name: sourceData.name || 'Expert Source',
      description: sourceData.description || 'Authoritative source in the industry',
      credibility: sourceData.credibility || 'Expert'
    }))

    return NextResponse.json({
      success: true,
      sources: sources,
      count: sources.length
    })

  } catch (error: any) {
    console.error('Source research error:', error)
    return NextResponse.json(
      {
        error: 'Failed to research sources',
        details: error.message
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Source Research API',
    method: 'POST',
    body: {
      category: 'Category to research sources for (e.g., "beauty tips", "skincare advice")'
    }
  })
}
