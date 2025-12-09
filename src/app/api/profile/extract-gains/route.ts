import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Check file type
    if (!file.type.includes('pdf') && !file.type.includes('image')) {
      return NextResponse.json(
        { success: false, error: 'Please upload a PDF or image file' },
        { status: 400 }
      )
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')

    // Use Gemini Vision to extract data from the PDF/image
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `You are analyzing a GAINS Profile document (BNI networking profile form).
Extract all the information you can find and return it as a JSON object with these exact field names:

{
  "fullName": "person's full name",
  "email": "email address if visible",
  "phone": "phone number if visible",
  "jobTitle": "occupation or job title",
  "department": "department if mentioned",
  "companyName": "company name",
  "yearsExperience": "years in business/experience",
  "previousJobType": "previous job or profession before current",
  "spouseName": "spouse/partner name",
  "childrenInfo": "children information (names, ages, etc)",
  "petsInfo": "pets information",
  "hobbies": "hobbies mentioned",
  "interestsActivities": "interests or activities",
  "residenceLocation": "where they live",
  "residenceDuration": "how long they've lived there",
  "strongDesires": "strong desires or wishes",
  "secretNobodyKnows": "secret or fun fact",
  "keyToSuccess": "key to their success",
  "gainsGoals": "goals (business and personal goals, type of referrals looking for)",
  "gainsAchievements": "achievements (accomplishments, awards, certifications)",
  "gainsInterests": "interests (professional and personal interests)",
  "gainsNetworks": "networks (groups, associations, communities they belong to)",
  "gainsSkills": "skills (special skills, talents, expertise)"
}

Important:
- Only include fields that have actual data in the document
- If a field is empty or not found, omit it from the JSON
- Extract text exactly as written in the document
- Return ONLY valid JSON, no other text or explanation
- If you cannot read the document or it's not a GAINS profile, return {"error": "Could not extract data from this document"}`;

    const mimeType = file.type.includes('pdf') ? 'application/pdf' : file.type

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType,
          data: base64
        }
      },
      prompt
    ])

    const response = await result.response
    const text = response.text()

    // Parse the JSON response
    try {
      // Clean up the response - remove markdown code blocks if present
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

      const extractedData = JSON.parse(jsonStr)

      if (extractedData.error) {
        return NextResponse.json(
          { success: false, error: extractedData.error },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        data: extractedData
      })

    } catch (parseError) {
      console.error('Failed to parse AI response:', text)
      return NextResponse.json(
        { success: false, error: 'Failed to parse extracted data' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('GAINS extraction error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to extract data from document' },
      { status: 500 }
    )
  }
}
