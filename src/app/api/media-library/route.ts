import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// Helper to resolve business unit ID from slug or ID
async function resolveBusinessUnitId(businessUnitParam: string): Promise<string | null> {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidRegex.test(businessUnitParam)) {
    return businessUnitParam
  }

  const { data } = await supabase
    .from('business_units')
    .select('id')
    .eq('slug', businessUnitParam)
    .single()

  return data?.id || null
}

// GET - List all media files for a business unit
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessUnitParam = searchParams.get('businessUnit')

    if (!businessUnitParam) {
      return NextResponse.json({ error: 'businessUnit parameter required' }, { status: 400 })
    }

    const businessUnitId = await resolveBusinessUnitId(businessUnitParam)
    if (!businessUnitId) {
      return NextResponse.json({ error: 'Business unit not found' }, { status: 404 })
    }

    // 1. Fetch from image_library table first (contains rich metadata)
    const { data: dbFiles, error: dbError } = await supabase
      .from('image_library')
      .select('*')
      .eq('business_unit_id', businessUnitId)
      .order('created_at', { ascending: false })

    if (dbError) {
      console.error('Error fetching image library table:', dbError)
    }

    // 2. Also list files from Storage as fallback/verification
    const bucketName = 'media-library'
    const folderPath = businessUnitId

    const { data: storageFiles } = await supabase.storage
      .from(bucketName)
      .list(folderPath, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    // 3. Merge results
    // Map DB files to unified format
    const dbMedia = (dbFiles || []).map(file => ({
      id: file.id,
      name: file.name,
      size: file.file_size || 0,
      type: file.mime_type || 'image/jpeg',
      url: file.url,
      createdAt: file.created_at,
      updatedAt: file.updated_at,
      description: file.description,
      source: file.source_url || '',
      width: file.width,
      height: file.height,
      category: file.category,
      fromDb: true
    }))

    // Add storage files that aren't in the DB yet
    const storageMedia = (storageFiles || [])
      .filter(sf => sf.name !== '.emptyFolderPlaceholder')
      .filter(sf => !dbMedia.some(dm => dm.name === sf.name || dm.url.includes(sf.name)))
      .map(file => {
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(`${folderPath}/${file.name}`)

        return {
          id: file.id,
          name: file.name,
          size: file.metadata?.size || 0,
          type: file.metadata?.mimetype || 'unknown',
          url: urlData.publicUrl,
          createdAt: file.created_at,
          updatedAt: file.updated_at,
          source: file.name.includes('__') ? file.name.split('__')[0].replace(/-/g, ' ') : (file.metadata?.source || ''),
          fromDb: false
        }
      })

    return NextResponse.json({ files: [...dbMedia, ...storageMedia] })

  } catch (err) {
    console.error('Media library GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Upload a new file
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const businessUnitParam = formData.get('businessUnit') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!businessUnitParam) {
      return NextResponse.json({ error: 'businessUnit required' }, { status: 400 })
    }

    const businessUnitId = await resolveBusinessUnitId(businessUnitParam)
    if (!businessUnitId) {
      return NextResponse.json({ error: 'Business unit not found' }, { status: 404 })
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
      }, { status: 400 })
    }

    // Check file size (50MB max)
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size exceeds 50MB limit' }, { status: 400 })
    }

    const bucketName = 'media-library'
    const folderPath = businessUnitId

    // Ensure bucket exists
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.some(b => b.name === bucketName)

    if (!bucketExists) {
      await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 52428800
      })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${timestamp}_${sanitizedName}`
    const filePath = `${folderPath}/${fileName}`

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath)

    return NextResponse.json({
      success: true,
      file: {
        name: fileName,
        originalName: file.name,
        size: file.size,
        type: file.type,
        url: urlData.publicUrl,
        path: uploadData.path
      }
    })

  } catch (err) {
    console.error('Media library POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Remove a file or all files
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessUnitParam = searchParams.get('businessUnit')
    const fileName = searchParams.get('fileName')
    const deleteAll = searchParams.get('all') === 'true'

    if (!businessUnitParam) {
      return NextResponse.json({ error: 'businessUnit required' }, { status: 400 })
    }

    const businessUnitId = await resolveBusinessUnitId(businessUnitParam)
    if (!businessUnitId) {
      return NextResponse.json({ error: 'Business unit not found' }, { status: 404 })
    }

    const bucketName = 'media-library'

    if (deleteAll) {
      // 1. List all files in the folder
      const { data: files } = await supabase.storage.from(bucketName).list(businessUnitId)
      
      if (files && files.length > 0) {
        // 2. Delete from storage
        const paths = files.map(f => `${businessUnitId}/${f.name}`)
        await supabase.storage.from(bucketName).remove(paths)
      }

      // 3. Delete from image_library table
      await supabase.from('image_library').delete().eq('business_unit_id', businessUnitId)

      return NextResponse.json({ success: true, message: 'All media deleted' })
    }

    if (!fileName) {
      return NextResponse.json({ error: 'fileName required' }, { status: 400 })
    }

    const filePath = `${businessUnitId}/${fileName}`

    // 1. Delete from storage
    const { error: storageErr } = await supabase.storage
      .from(bucketName)
      .remove([filePath])

    if (storageErr) {
      console.error('Storage delete error:', storageErr)
    }

    // 2. Delete from database (try to find by partial URL match if name isn't exact)
    await supabase.from('image_library')
      .delete()
      .eq('business_unit_id', businessUnitId)
      .ilike('url', `%${fileName}%`)

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('Media library DELETE error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
