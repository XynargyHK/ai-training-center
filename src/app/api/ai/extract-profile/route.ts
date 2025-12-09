'use server'

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
})

/**
 * API endpoint for extracting profile information from uploaded documents
 * Supports: GAINS PDF, business cards, LinkedIn exports, company brochures
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const extractType = formData.get('extractType') as 'personal' | 'company'

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      )
    }

    // Process each file
    const extractedData: Record<string, any> = {}

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const base64 = buffer.toString('base64')
      const mimeType = file.type || 'application/pdf'

      // Determine extraction prompt based on type
      const extractionPrompt = extractType === 'personal'
        ? `Analyze this document and extract personal profile information. Return a JSON object with these fields:
{
  "firstName": "first name if found",
  "lastName": "last name if found",
  "email": "email address if found",
  "phone": "phone number if found",
  "bio": "professional summary/bio if found",
  "socialLinks": {
    "linkedin": "linkedin URL if found",
    "facebook": "facebook URL if found",
    "instagram": "instagram URL if found",
    "twitter": "twitter URL if found"
  }
}

Only include fields that you can confidently extract from the document. If a field is not found, omit it from the response.
Look for information from GAINS profiles, business cards, resumes, or LinkedIn exports.
Return ONLY the JSON object, no other text.`
        : `Analyze this document and extract company profile information. Return a JSON object with these fields:
{
  "companyName": "company name if found",
  "companyUrl": "company website URL if found",
  "industry": "industry type if found (skincare, health, fitness, food, retail, technology, consulting, education, other)",
  "address": "street address if found",
  "city": "city if found",
  "country": "country if found",
  "registrationNo": "business registration number if found",
  "billingEmail": "billing/admin email if found"
}

Only include fields that you can confidently extract from the document. If a field is not found, omit it from the response.
Look for information from company brochures, registration documents, or business profiles.
Return ONLY the JSON object, no other text.`

      try {
        // Use Claude's vision to extract information
        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
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

        // Parse the extracted data
        const content = response.content[0]
        if (content.type === 'text') {
          try {
            // Clean the response - remove markdown code blocks if present
            let jsonStr = content.text.trim()
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

            // Merge extracted data (later files override earlier ones)
            Object.keys(parsed).forEach(key => {
              if (parsed[key]) {
                if (key === 'socialLinks' && extractedData.socialLinks) {
                  extractedData.socialLinks = {
                    ...extractedData.socialLinks,
                    ...parsed[key]
                  }
                } else {
                  extractedData[key] = parsed[key]
                }
              }
            })
          } catch (parseError) {
            console.error('Failed to parse AI response:', parseError)
          }
        }
      } catch (aiError) {
        console.error('AI extraction error for file:', file.name, aiError)
        // Continue processing other files
      }
    }

    // Return extracted data
    const hasData = Object.keys(extractedData).length > 0

    return NextResponse.json({
      success: hasData,
      extracted: hasData ? extractedData : null,
      message: hasData
        ? 'Successfully extracted profile information'
        : 'Could not extract information from the uploaded documents'
    })

  } catch (error) {
    console.error('Extract profile error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process documents' },
      { status: 500 }
    )
  }
}
