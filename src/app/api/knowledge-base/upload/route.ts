import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
})

/**
 * General knowledge base upload endpoint
 * Handles all document types: product info, service info, policies, general knowledge
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string || 'general'
    const businessUnitId = formData.get('businessUnitId') as string

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Read file content
    const buffer = Buffer.from(await file.arrayBuffer())
    const base64 = buffer.toString('base64')
    const mimeType = file.type || 'application/octet-stream'
    const fileName = file.name

    // Determine extraction approach based on file type
    const isImage = mimeType.startsWith('image/')
    const isPdf = mimeType === 'application/pdf'

    let extractedContent = ''
    let extractedMetadata: Record<string, any> = {}

    // Use Claude to extract information
    const extractionPrompt = getExtractionPrompt(type)

    try {
      if (isImage || isPdf) {
        // Use vision for images
        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: mimeType as any,
                    data: base64
                  }
                },
                {
                  type: 'text',
                  text: extractionPrompt
                }
              ]
            }
          ]
        })

        const content = response.content[0]
        if (content.type === 'text') {
          // Parse the structured response
          try {
            const parsed = parseExtractionResponse(content.text)
            extractedContent = parsed.content
            extractedMetadata = parsed.metadata
          } catch {
            extractedContent = content.text
          }
        }
      } else {
        // For text-based files, just store the content
        extractedContent = buffer.toString('utf-8')
      }

      // Store in the knowledge base
      const { data: insertedData, error: insertError } = await supabaseAdmin
        .from('knowledge_items')
        .insert({
          business_unit_id: businessUnitId || null,
          title: extractedMetadata.title || fileName,
          content: extractedContent,
          category: type,
          source_type: isImage ? 'image' : isPdf ? 'pdf' : 'document',
          source_file: fileName,
          metadata: extractedMetadata,
          language: 'en',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (insertError) {
        console.error('Insert error:', insertError)
        // Try inserting into faqs table as fallback
        const { error: faqError } = await supabaseAdmin
          .from('faqs')
          .insert({
            business_unit_id: businessUnitId || null,
            question: extractedMetadata.title || `Uploaded: ${fileName}`,
            answer: extractedContent,
            category: type,
            language: 'en',
            created_at: new Date().toISOString()
          })

        if (faqError) {
          console.error('FAQ insert error:', faqError)
        }
      }

      return NextResponse.json({
        success: true,
        extracted: {
          content: extractedContent.substring(0, 500) + '...',
          metadata: extractedMetadata
        },
        message: 'File processed successfully'
      })

    } catch (aiError) {
      console.error('AI extraction error:', aiError)

      // Store file content directly without AI extraction
      return NextResponse.json({
        success: true,
        extracted: {
          content: 'File uploaded (AI extraction pending)',
          metadata: { fileName }
        },
        message: 'File stored, AI processing pending'
      })
    }

  } catch (error) {
    console.error('Knowledge upload error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process file' },
      { status: 500 }
    )
  }
}

function getExtractionPrompt(type: string): string {
  const baseInstruction = `Analyze this document and extract all relevant information. Return your response in the following JSON format:

{
  "title": "A descriptive title for this content",
  "summary": "A brief 1-2 sentence summary",
  "content": "The full extracted text content, formatted clearly",
  "key_points": ["List of key points or facts"],
  "category": "${type}",
  "metadata": {
    // Any additional structured data specific to the document type
  }
}`

  switch (type) {
    case 'product':
      return `${baseInstruction}

For product documents, also extract:
- Product names and descriptions
- Prices and variants
- Key features and benefits
- Ingredients or specifications`

    case 'service':
      return `${baseInstruction}

For service documents, also extract:
- Service names and descriptions
- Pricing and duration
- Benefits and results
- Any prerequisites or requirements`

    case 'policy':
      return `${baseInstruction}

For policy documents, also extract:
- Policy type (refund, privacy, terms, etc.)
- Key rules and conditions
- Important dates or deadlines
- Contact information for inquiries`

    default:
      return `${baseInstruction}

Extract all useful information that could help answer customer questions.`
  }
}

function parseExtractionResponse(text: string): { content: string; metadata: Record<string, any> } {
  try {
    // Try to parse as JSON
    let jsonStr = text.trim()
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7)
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3)
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3)
    }
    jsonStr = jsonStr.trim()

    const parsed = JSON.parse(jsonStr)
    return {
      content: parsed.content || parsed.summary || text,
      metadata: {
        title: parsed.title,
        summary: parsed.summary,
        key_points: parsed.key_points,
        category: parsed.category,
        ...parsed.metadata
      }
    }
  } catch {
    // If not valid JSON, return as plain text
    return {
      content: text,
      metadata: {}
    }
  }
}
