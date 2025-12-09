/**
 * AI Content Generation API
 * POST /api/ecommerce/ai-content/generate
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  generateProductDescription,
  generateProductTitle,
  generateImagePrompt,
  generateCompleteProductContent
} from '@/lib/ecommerce/ai-content-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, productId, ...params } = body

    if (!type) {
      return NextResponse.json(
        { error: 'type is required (description, title, image, or complete)' },
        { status: 400 }
      )
    }

    let result: any

    switch (type) {
      case 'description':
        if (!params.productTitle) {
          return NextResponse.json(
            { error: 'productTitle is required for description generation' },
            { status: 400 }
          )
        }
        result = await generateProductDescription(params)
        return NextResponse.json({ description: result })

      case 'title':
        if (!params.basicTitle) {
          return NextResponse.json(
            { error: 'basicTitle is required for title generation' },
            { status: 400 }
          )
        }
        result = await generateProductTitle(params)
        return NextResponse.json({ title: result })

      case 'image':
        if (!params.productTitle) {
          return NextResponse.json(
            { error: 'productTitle is required for image prompt generation' },
            { status: 400 }
          )
        }
        result = await generateImagePrompt(params)
        return NextResponse.json({ imagePrompt: result })

      case 'complete':
        if (!productId || !params.basicTitle) {
          return NextResponse.json(
            { error: 'productId and basicTitle are required for complete generation' },
            { status: 400 }
          )
        }
        result = await generateCompleteProductContent({
          productId,
          ...params
        })
        return NextResponse.json(result)

      default:
        return NextResponse.json(
          { error: 'Invalid type. Must be: description, title, image, or complete' },
          { status: 400 }
        )
    }
  } catch (error: any) {
    console.error('Error generating AI content:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate AI content' },
      { status: 500 }
    )
  }
}
