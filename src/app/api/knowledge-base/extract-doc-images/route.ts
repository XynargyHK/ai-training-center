import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '')

// Resolve slug or UUID to UUID for storage folder
async function resolveToUUID(slugOrId: string): Promise<string> {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidRegex.test(slugOrId)) return slugOrId
  const { data } = await supabase.from('business_units').select('id').eq('slug', slugOrId).single()
  return data?.id || slugOrId
}

// Extract JPEG images from a buffer using SOI/EOI markers
function extractJpegsFromBuffer(buffer: Buffer): Buffer[] {
  const images: Buffer[] = []
  let i = 0

  while (i < buffer.length - 3) {
    if (buffer[i] === 0xFF && buffer[i + 1] === 0xD8 && buffer[i + 2] === 0xFF) {
      let end = i + 3
      while (end < buffer.length - 1) {
        if (buffer[end] === 0xFF && buffer[end + 1] === 0xD9) {
          end += 2
          break
        }
        end++
      }
      const size = end - i
      if (size > 8000) images.push(buffer.slice(i, end)) // skip thumbnails < 8KB
      i = end
    } else {
      i++
    }
  }

  return images
}

// Extract PNG images from a buffer using PNG header and IEND chunk
function extractPngsFromBuffer(buffer: Buffer): Buffer[] {
  const images: Buffer[] = []
  const PNG_HEADER = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
  const IEND = Buffer.from([0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82])

  let start = buffer.indexOf(PNG_HEADER)
  while (start !== -1) {
    const endPos = buffer.indexOf(IEND, start)
    if (endPos === -1) break
    const end = endPos + 8
    if (end - start > 8000) images.push(buffer.slice(start, end))
    start = buffer.indexOf(PNG_HEADER, end)
  }

  return images
}

// Extract images from DOCX (which is a ZIP archive)
async function extractImagesFromDocx(buffer: Buffer): Promise<{ data: Buffer; mimeType: string; ext: string }[]> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const JSZip = require('jszip')
  const zip = await JSZip.loadAsync(buffer)
  const images: { data: Buffer; mimeType: string; ext: string }[] = []

  for (const [path, file] of Object.entries(zip.files as Record<string, any>)) {
    if (!path.startsWith('word/media/')) continue

    const ext = path.split('.').pop()?.toLowerCase() || ''
    let mimeType = ''

    if (['jpg', 'jpeg'].includes(ext)) mimeType = 'image/jpeg'
    else if (ext === 'png') mimeType = 'image/png'
    else if (ext === 'gif') mimeType = 'image/gif'
    else if (ext === 'webp') mimeType = 'image/webp'
    else continue // skip EMF, WMF, etc.

    const data: Buffer = await file.async('nodebuffer')
    if (data.length > 8000) images.push({ data, mimeType, ext })
  }

  return images
}

// Ask Gemini Vision to generate a descriptive filename for an image
async function generateImageName(imageBuffer: Buffer, mimeType: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: imageBuffer.toString('base64')
        }
      },
      'Generate a descriptive filename (no extension) for this image using 3-5 words with hyphens. ' +
      'Be specific: describe the actual visual content (e.g. "red-rose-face-cream-jar", ' +
      '"woman-applying-facial-serum", "breast-cancer-risk-reduction-chart"). ' +
      'Return only the filename, nothing else.'
    ])

    return result.response.text()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'extracted-image'
  } catch {
    return 'extracted-image'
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    let file = formData.get('file') as File | null
    const knowledgeBaseId = formData.get('knowledgeBaseId') as string | null
    const businessUnitId = (formData.get('businessUnitId') as string) || 'default'

    let buffer: Buffer
    let fileName: string
    let fileType: string

    if (knowledgeBaseId) {
      // Fetch from database
      const { data: kbEntry, error: kbError } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('id', knowledgeBaseId)
        .single()

      if (kbError || !kbEntry) {
        return NextResponse.json({ success: false, error: 'Knowledge base entry not found' }, { status: 404 })
      }

      fileName = kbEntry.file_name || kbEntry.topic || 'document'
      fileType = fileName.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

      // Try to read from local knowledgebase directory
      const fs = require('fs')
      const path = require('path')
      const localPath = path.join(process.cwd(), 'knowledgebase', kbEntry.file_path || fileName)
      
      if (fs.existsSync(localPath)) {
        buffer = fs.readFileSync(localPath)
      } else {
        return NextResponse.json({ success: false, error: `File not found on server at ${localPath}` }, { status: 404 })
      }
    } else if (file) {
      buffer = Buffer.from(await file.arrayBuffer())
      fileName = file.name.toLowerCase()
      fileType = file.type
    } else {
      return NextResponse.json({ success: false, error: 'No file or knowledgeBaseId provided' }, { status: 400 })
    }

    // Extract raw images based on file type
    let rawImages: { data: Buffer; mimeType: string; ext: string }[] = []

    if (fileName.endsWith('.docx') || fileType.includes('wordprocessingml')) {
      rawImages = await extractImagesFromDocx(buffer)
    } else if (fileName.endsWith('.pdf') || fileType === 'application/pdf') {
      const jpegs = extractJpegsFromBuffer(buffer).map(data => ({ data, mimeType: 'image/jpeg', ext: 'jpg' }))
      const pngs = extractPngsFromBuffer(buffer).map(data => ({ data, mimeType: 'image/png', ext: 'png' }))
      rawImages = [...jpegs, ...pngs]
    }

    if (rawImages.length === 0) {
      return NextResponse.json({ success: true, count: 0, images: [], message: 'No images found in document' })
    }

    // Deduplicate by size (avoid saving near-duplicates)
    const seen = new Set<number>()
    rawImages = rawImages.filter(img => {
      if (seen.has(img.data.length)) return false
      seen.add(img.data.length)
      return true
    })

    // Resolve slug to UUID for correct storage folder
    const storageFolder = await resolveToUUID(businessUnitId)

    // Process in batches of 2 to stay within Gemini Vision rate limits
    const { processImageIngestion } = await import('@/lib/ai-engine')
    const savedImages: { name: string; url: string }[] = []
    const batchSize = 2

    // Use a clean source name (no extension)
    const sourceLabel = fileName.replace(/\.[^.]+$/, '').substring(0, 20)

    for (let i = 0; i < rawImages.length; i += batchSize) {
      const batch = rawImages.slice(i, i + batchSize)
      const results = await Promise.allSettled(
        batch.map(async (img) => {
          // Use the unified Librarian engine to analyze and save
          const dbRecord = await processImageIngestion({
            buffer: img.data,
            mimeType: img.mimeType,
            fileName: `ext-${i}`, // Short prefix
            sourceUrl: sourceLabel,
            businessUnitId: businessUnitId
          })

          if (dbRecord) {
            return { name: dbRecord.name, url: dbRecord.url }
          }
          return null
        })
      )

      for (const r of results) {
        if (r.status === 'fulfilled' && r.value) savedImages.push(r.value)
      }

      // Small delay between batches to avoid Gemini rate limits
      if (i + batchSize < rawImages.length) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    return NextResponse.json({
      success: true,
      count: savedImages.length,
      images: savedImages,
      message: `Extracted and saved ${savedImages.length} image${savedImages.length !== 1 ? 's' : ''} to media library`
    })
  } catch (error: any) {
    console.error('extract-doc-images error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to extract images' }, { status: 500 })
  }
}
