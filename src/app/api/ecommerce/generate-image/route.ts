/**
 * AI Image Generation API for Product Images
 * Uses Google Gemini's Nano Banana Pro model for image generation
 */

import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Model for image generation - Gemini 3 Pro Image (Nano Banana Pro)
const IMAGE_MODEL = 'gemini-3-pro-image-preview'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      prompt,           // Free-form user prompt
      referenceImage,   // Base64 or URL of reference image (optional)
      productName,      // Product name for context
      productInfo       // Additional product info for context
    } = body

    if (!prompt) {
      return NextResponse.json(
        { error: 'prompt is required' },
        { status: 400 }
      )
    }

    const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY

    if (!geminiApiKey) {
      return NextResponse.json(
        { error: 'GOOGLE_GEMINI_API_KEY is not configured' },
        { status: 500 }
      )
    }

    // Initialize Gemini client
    const genAI = new GoogleGenerativeAI(geminiApiKey)

    // Build the full prompt with context if available
    let fullPrompt = prompt
    if (productName) {
      fullPrompt = `Product: ${productName}\n\n${prompt}`
    }
    if (productInfo) {
      fullPrompt = `${fullPrompt}\n\nProduct Info: ${productInfo}`
    }

    console.log('🎨 Generating image with prompt:', fullPrompt.substring(0, 100) + '...')

    // Try image generation model
    try {
      const model = genAI.getGenerativeModel({
        model: IMAGE_MODEL,
        generationConfig: {
          temperature: 1,
          topP: 0.95,
          topK: 40,
        }
      })

      // If we have a reference image, include it in the request
      const parts: any[] = [{ text: fullPrompt }]

      if (referenceImage) {
        // Check if it's a base64 image or URL
        if (referenceImage.startsWith('data:image')) {
          // Extract base64 data
          const base64Match = referenceImage.match(/^data:image\/(\w+);base64,(.+)$/)
          if (base64Match) {
            parts.unshift({
              inlineData: {
                mimeType: `image/${base64Match[1]}`,
                data: base64Match[2]
              }
            })
          }
        } else if (referenceImage.startsWith('http')) {
          // Fetch the image and convert to base64
          try {
            const imageResponse = await fetch(referenceImage)
            const imageBuffer = await imageResponse.arrayBuffer()
            const base64 = Buffer.from(imageBuffer).toString('base64')
            const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'

            parts.unshift({
              inlineData: {
                mimeType: contentType,
                data: base64
              }
            })
          } catch (fetchError) {
            console.warn('Could not fetch reference image:', fetchError)
          }
        }
      }

      const result = await model.generateContent({
        contents: [{ role: 'user', parts }],
        generationConfig: {
          responseModalities: ['Text', 'Image']
        }
      } as any)

      const response = result.response

      // Check if we got an image in the response
      if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            // Convert to data URL
            const imageDataUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`

            console.log('✅ Image generated successfully')

            return NextResponse.json({
              imageUrl: imageDataUrl,
              prompt: fullPrompt,
              model: IMAGE_MODEL,
              success: true
            })
          }
        }
      }

      // If no image was generated, return the text response if any
      const textResponse = response.text()
      console.log('⚠️ No image generated, got text response:', textResponse?.substring(0, 100))

      return NextResponse.json({
        error: 'Image generation did not return an image',
        textResponse: textResponse,
        model: IMAGE_MODEL
      }, { status: 422 })

    } catch (modelError: any) {
      console.error('Image generation model error:', modelError)

      // If the image model fails, return helpful error
      return NextResponse.json({
        error: `Image generation failed: ${modelError.message}`,
        model: IMAGE_MODEL,
        suggestion: 'Try a different prompt or check API quota'
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('Image generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate image' },
      { status: 500 }
    )
  }
}
