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
    const file = formData.get('file') as File
    const businessUnitId = (formData.get('businessUnitId') as string) || 'default'

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = file.name.toLowerCase()

    // Extract raw images based on file type
    let rawImages: { data: Buffer; mimeType: string; ext: string }[] = []

    if (fileName.endsWith('.docx') || file.type.includes('wordprocessingml')) {
      rawImages = await extractImagesFromDocx(buffer)
    } else if (fileName.endsWith('.pdf') || file.type === 'application/pdf') {
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

    // Process in batches of 3 to stay within Gemini rate limits
    const savedImages: { name: string; url: string }[] = []
    const batchSize = 3

    for (let i = 0; i < rawImages.length; i += batchSize) {
      const batch = rawImages.slice(i, i + batchSize)
      const results = await Promise.allSettled(
        batch.map(async (img, idx) => {
          const baseName = await generateImageName(img.data, img.mimeType)
          const suffix = Math.random().toString(36).slice(2, 8)
          const srcPrefix = fileName.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-]/g, '-').slice(0, 25)
          const uniqueName = `${srcPrefix}__${baseName}-${suffix}.${img.ext}`
          const uploadPath = `${storageFolder}/${uniqueName}`

          const { error } = await supabase.storage
            .from('media-library')
            .upload(uploadPath, img.data, { contentType: img.mimeType, upsert: false })

          if (error) throw error

          const { data: urlData } = supabase.storage.from('media-library').getPublicUrl(uploadPath)
          return { name: uniqueName, url: urlData.publicUrl }
        })
      )

      for (const r of results) {
        if (r.status === 'fulfilled') savedImages.push(r.value)
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
