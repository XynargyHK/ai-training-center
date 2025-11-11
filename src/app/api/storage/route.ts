import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Storage directory - will store data in the project root
const STORAGE_DIR = path.join(process.cwd(), 'data')

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true })
}

// File paths for each data type
const FILES = {
  knowledge: path.join(STORAGE_DIR, 'knowledge.json'),
  training: path.join(STORAGE_DIR, 'training.json'),
  faqs: path.join(STORAGE_DIR, 'faqs.json'),
  faq_categories: path.join(STORAGE_DIR, 'faq_categories.json'),
  canned_messages: path.join(STORAGE_DIR, 'canned_messages.json'),
  guidelines: path.join(STORAGE_DIR, 'guidelines.json'),
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (!type || !(type in FILES)) {
      return NextResponse.json(
        { error: 'Invalid type parameter' },
        { status: 400 }
      )
    }

    const filePath = FILES[type as keyof typeof FILES]

    // If file doesn't exist, return empty data
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({
        success: true,
        data: null
      })
    }

    // Read file
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const data = JSON.parse(fileContent)

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error: any) {
    console.error('Storage GET error:', error)
    return NextResponse.json(
      { error: 'Failed to read data', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { type, data } = await request.json()

    if (!type || !(type in FILES)) {
      return NextResponse.json(
        { error: 'Invalid type parameter' },
        { status: 400 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Data is required' },
        { status: 400 }
      )
    }

    const filePath = FILES[type as keyof typeof FILES]

    // Write data to file
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')

    return NextResponse.json({
      success: true,
      message: `${type} data saved successfully`
    })
  } catch (error: any) {
    console.error('Storage POST error:', error)
    return NextResponse.json(
      { error: 'Failed to save data', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (!type || !(type in FILES)) {
      return NextResponse.json(
        { error: 'Invalid type parameter' },
        { status: 400 }
      )
    }

    const filePath = FILES[type as keyof typeof FILES]

    // Delete file if exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    return NextResponse.json({
      success: true,
      message: `${type} data deleted successfully`
    })
  } catch (error: any) {
    console.error('Storage DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete data', details: error.message },
      { status: 500 }
    )
  }
}
