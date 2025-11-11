import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const category = formData.get('category') as string || 'Product Information'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Create knowledgebase directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'knowledgebase')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const originalName = file.name
    const ext = path.extname(originalName)
    const baseName = path.basename(originalName, ext)
    const safeFileName = `${baseName}_${timestamp}${ext}`
    const filePath = path.join(uploadDir, safeFileName)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Extract content based on file type
    let content = ''
    const fileType = ext.toLowerCase()

    if (fileType === '.txt') {
      content = buffer.toString('utf-8')
    } else if (fileType === '.json') {
      try {
        const jsonData = JSON.parse(buffer.toString('utf-8'))
        content = JSON.stringify(jsonData, null, 2)
      } catch (e) {
        content = buffer.toString('utf-8')
      }
    } else if (fileType === '.csv') {
      content = buffer.toString('utf-8')
    } else {
      // For Excel, Word, PDF - we'll extract content on the client side
      // and send it back, or we can use server-side libraries
      content = `File uploaded: ${originalName}`
    }

    return NextResponse.json({
      success: true,
      file: {
        id: timestamp.toString(),
        originalName,
        fileName: safeFileName,
        filePath: filePath.replace(/\\/g, '/'),
        category,
        content,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'File upload API is ready',
    uploadDirectory: 'knowledgebase/',
    supportedFormats: ['.txt', '.json', '.csv', '.xlsx', '.docx', '.pdf']
  })
}
