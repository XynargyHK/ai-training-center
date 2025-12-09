import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Allowed file types for profile uploads
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const ALLOWED_DOC_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const uploadType = formData.get('type') as string // 'profile_photo', 'company_logo', 'document', 'id_document'
    const userId = formData.get('userId') as string || 'anonymous'

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!uploadType) {
      return NextResponse.json(
        { success: false, error: 'Upload type not specified' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    // Validate file type based on upload type
    const isImageUpload = ['profile_photo', 'company_logo'].includes(uploadType)
    const allowedTypes = isImageUpload ? ALLOWED_IMAGE_TYPES : ALLOWED_DOC_TYPES

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const ext = file.name.split('.').pop()
    const fileName = `${uploadType}_${userId}_${timestamp}.${ext}`

    // Determine storage bucket/path based on upload type
    let storagePath = ''
    switch (uploadType) {
      case 'profile_photo':
        storagePath = `profiles/${userId}/photos/${fileName}`
        break
      case 'company_logo':
        storagePath = `companies/${userId}/logos/${fileName}`
        break
      case 'id_document':
        storagePath = `profiles/${userId}/documents/id/${fileName}`
        break
      case 'document':
      default:
        storagePath = `profiles/${userId}/documents/${fileName}`
        break
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('profile-uploads')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (error) {
      console.error('Supabase storage error:', error)

      // If bucket doesn't exist, create it and retry
      if (error.message?.includes('Bucket not found')) {
        // Create the bucket
        const { error: createError } = await supabase.storage.createBucket('profile-uploads', {
          public: true,
          fileSizeLimit: MAX_FILE_SIZE
        })

        if (createError && !createError.message?.includes('already exists')) {
          return NextResponse.json(
            { success: false, error: 'Failed to create storage bucket' },
            { status: 500 }
          )
        }

        // Retry upload
        const { data: retryData, error: retryError } = await supabase.storage
          .from('profile-uploads')
          .upload(storagePath, buffer, {
            contentType: file.type,
            upsert: true
          })

        if (retryError) {
          return NextResponse.json(
            { success: false, error: 'Failed to upload file' },
            { status: 500 }
          )
        }
      } else {
        return NextResponse.json(
          { success: false, error: error.message || 'Failed to upload file' },
          { status: 500 }
        )
      }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('profile-uploads')
      .getPublicUrl(storagePath)

    return NextResponse.json({
      success: true,
      file: {
        fileName: file.name,
        storagePath,
        url: urlData.publicUrl,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

// DELETE endpoint to remove uploaded files
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storagePath = searchParams.get('path')

    if (!storagePath) {
      return NextResponse.json(
        { success: false, error: 'No file path provided' },
        { status: 400 }
      )
    }

    const { error } = await supabase.storage
      .from('profile-uploads')
      .remove([storagePath])

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to delete file' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    })

  } catch (error) {
    console.error('File delete error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}
