import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    const { imageData, mimeType, fileName } = await request.json()

    if (!imageData) {
      return NextResponse.json(
        { success: false, error: 'No image data provided' },
        { status: 400 }
      )
    }

    // Use Gemini Vision to extract text from image
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `Extract ALL text and information from this image.
If it's a document, presentation slide, or infographic, extract all the text content.
If it's a product image, describe the product and any visible text/labels.
If it's a chart or diagram, describe the data and any labels.

Return the extracted content as plain text, preserving the structure where possible.
If there's no readable text, describe what you see in the image that could be useful as knowledge.`

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType,
          data: imageData
        }
      },
      prompt
    ])

    const response = await result.response
    const text = response.text().trim()

    if (!text) {
      return NextResponse.json(
        { success: false, error: 'Could not extract any text from the image' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      text: text,
      fileName: fileName
    })

  } catch (error: any) {
    console.error('Image extraction error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to extract text from image' },
      { status: 500 }
    )
  }
}
