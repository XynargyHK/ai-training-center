/**
 * AI Landing Page Generator API
 * Analyzes a reference URL (competitor site) and generates a product landing page
 */

import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { referenceUrl, productName, productDescription, productBenefits } = body

    if (!referenceUrl) {
      return NextResponse.json(
        { error: 'referenceUrl is required' },
        { status: 400 }
      )
    }

    // Fetch and analyze the reference URL
    let referenceContent = ''
    try {
      const response = await fetch(referenceUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })
      const html = await response.text()

      // Extract text content from HTML (simplified extraction)
      referenceContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 5000) // Limit to 5000 chars
    } catch (error) {
      console.error('Failed to fetch reference URL:', error)
      referenceContent = 'Unable to fetch reference content'
    }

    // Use Gemini to generate landing page content
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' })

    const prompt = `You are a professional copywriter and UX designer. Analyze this reference website content and create a compelling product landing page structure.

REFERENCE WEBSITE CONTENT:
${referenceContent}

PRODUCT TO CREATE LANDING PAGE FOR:
- Name: ${productName || 'SkinCoach Product'}
- Description: ${productDescription || 'Premium skincare product'}
- Benefits: ${productBenefits || 'Advanced skincare benefits'}

Create a landing page with the following sections. Return as JSON:

{
  "hero": {
    "headline": "Compelling main headline",
    "subheadline": "Supporting text",
    "ctaText": "Call to action button text"
  },
  "problemSolution": {
    "problemHeadline": "What problem does this solve?",
    "problemPoints": ["Problem 1", "Problem 2", "Problem 3"],
    "solutionHeadline": "How our product solves it",
    "solutionDescription": "Description of the solution"
  },
  "benefits": {
    "headline": "Key Benefits headline",
    "items": [
      {"title": "Benefit 1", "description": "Description", "icon": "sparkles"},
      {"title": "Benefit 2", "description": "Description", "icon": "shield"},
      {"title": "Benefit 3", "description": "Description", "icon": "clock"}
    ]
  },
  "howItWorks": {
    "headline": "How It Works headline",
    "steps": [
      {"step": 1, "title": "Step 1", "description": "Description"},
      {"step": 2, "title": "Step 2", "description": "Description"},
      {"step": 3, "title": "Step 3", "description": "Description"}
    ]
  },
  "ingredients": {
    "headline": "Key Ingredients headline",
    "items": [
      {"name": "Ingredient 1", "benefit": "What it does"},
      {"name": "Ingredient 2", "benefit": "What it does"}
    ]
  },
  "testimonials": {
    "headline": "What Customers Say",
    "items": [
      {"quote": "Testimonial 1", "author": "Name", "title": "Role"},
      {"quote": "Testimonial 2", "author": "Name", "title": "Role"}
    ]
  },
  "faq": {
    "headline": "Frequently Asked Questions",
    "items": [
      {"question": "Question 1?", "answer": "Answer 1"},
      {"question": "Question 2?", "answer": "Answer 2"}
    ]
  },
  "cta": {
    "headline": "Final call to action headline",
    "description": "Urgency text",
    "buttonText": "Buy Now",
    "guarantee": "Money-back guarantee text"
  },
  "seoMeta": {
    "title": "SEO Title for the page",
    "description": "Meta description for SEO",
    "keywords": ["keyword1", "keyword2", "keyword3"]
  }
}

Make the content compelling, benefit-focused, and inspired by the reference site's style but unique for this product.
Return ONLY valid JSON, no markdown code blocks.`

    const result = await model.generateContent(prompt)
    const responseText = result.response.text()

    // Parse the JSON response
    let landingPageContent
    try {
      // Clean up the response if it has markdown code blocks
      const cleanedResponse = responseText
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim()
      landingPageContent = JSON.parse(cleanedResponse)
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      // Return a default structure if parsing fails
      landingPageContent = {
        hero: {
          headline: `Transform Your Skin with ${productName || 'Our Product'}`,
          subheadline: productDescription || 'Premium skincare for radiant results',
          ctaText: 'Shop Now'
        },
        benefits: {
          headline: 'Why Choose Us',
          items: [
            { title: 'Premium Quality', description: 'Made with the finest ingredients', icon: 'sparkles' },
            { title: 'Proven Results', description: 'Backed by clinical studies', icon: 'shield' },
            { title: 'Fast Acting', description: 'See results in weeks', icon: 'clock' }
          ]
        },
        error: 'AI parsing failed, showing default structure'
      }
    }

    return NextResponse.json({
      landingPage: landingPageContent,
      referenceUrl,
      productName,
      generatedAt: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Landing page generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate landing page' },
      { status: 500 }
    )
  }
}
