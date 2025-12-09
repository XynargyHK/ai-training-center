/**
 * Product Image Upload API
 * Uploads images to Supabase Storage and returns public URLs
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUCKET_NAME = 'product-images'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

// Helper function to resolve business unit ID from slug or UUID
async function resolveBusinessUnitId(idOrSlug: string): Promise<string | null> {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidRegex.test(idOrSlug)) {
    return idOrSlug
  }

  const { data: bu } = await supabase
    .from('business_units')
    .select('id')
    .eq('slug', idOrSlug)
    .single()

  return bu?.id || null
}

// Ensure bucket exists
async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets()
  const exists = buckets?.some(b => b.name === BUCKET_NAME)

  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      fileSizeLimit: MAX_FILE_SIZE
    })
    if (error && !error.message.includes('already exists')) {
      console.error('Failed to create bucket:', error)
      throw error
    }
  }
}

// POST - Upload image file or base64
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''

    let businessUnitId: string | null = null
    let fileBuffer: Buffer
    let fileName: string
    let mimeType: string

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData()
      const file = formData.get('file') as File | null
      const buParam = formData.get('businessUnitId') as string | null

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 })
      }

      if (buParam) {
        businessUnitId = await resolveBusinessUnitId(buParam)
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'File size exceeds 5MB limit' }, { status: 400 })
      }

      const arrayBuffer = await file.arrayBuffer()
      fileBuffer = Buffer.from(arrayBuffer)
      mimeType = file.type

      // Generate unique filename
      const ext = file.name.split('.').pop() || 'jpg'
      fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`

    } else {
      // Handle JSON with base64
      const body = await request.json()
      const { image, businessUnitId: buParam, filename } = body

      if (!image) {
        return NextResponse.json({ error: 'No image data provided' }, { status: 400 })
      }

      if (buParam) {
        businessUnitId = await resolveBusinessUnitId(buParam)
      }

      // Parse base64 data URL
      const base64Match = image.match(/^data:image\/([\w+]+);base64,(.+)$/)
      if (!base64Match) {
        return NextResponse.json({ error: 'Invalid base64 image format' }, { status: 400 })
      }

      const format = base64Match[1].replace('+', '') // handle svg+xml
      const base64Data = base64Match[2]

      fileBuffer = Buffer.from(base64Data, 'base64')
      mimeType = `image/${format}`

      // Validate size
      if (fileBuffer.length > MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'Image size exceeds 5MB limit' }, { status: 400 })
      }

      // Generate filename
      const ext = format === 'jpeg' ? 'jpg' : format
      fileName = filename || `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`
    }

    // Ensure bucket exists
    await ensureBucket()

    // Build storage path: business_unit_id/products/filename
    const storagePath = businessUnitId
      ? `${businessUnitId}/products/${fileName}`
      : `general/products/${fileName}`

    console.log(`📤 Uploading image to: ${storagePath}`)

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath)

    console.log(`✅ Image uploaded: ${publicUrl}`)

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: storagePath,
      fileName
    })

  } catch (error: any) {
    console.error('Image upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload image' },
      { status: 500 }
    )
  }
}

// DELETE - Remove image from storage
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path')

    if (!path) {
      return NextResponse.json({ error: 'path is required' }, { status: 400 })
    }

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path])

    if (error) {
      console.error('Delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Image delete error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete image' },
      { status: 500 }
    )
  }
}
