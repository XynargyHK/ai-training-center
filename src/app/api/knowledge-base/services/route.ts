import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Helper to check if string is a valid UUID
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

// Helper to convert slug to UUID
async function getBusinessUnitId(slugOrId: string): Promise<string | null> {
  if (isValidUUID(slugOrId)) {
    return slugOrId
  }

  // Look up by slug
  const { data, error } = await supabase
    .from('business_units')
    .select('id')
    .eq('slug', slugOrId)
    .single()

  if (error || !data) {
    console.log(`Business unit not found for slug: ${slugOrId}`)
    return null
  }

  return data.id
}

// GET - Fetch services
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessUnitParam = searchParams.get('businessUnitId')

    let query = supabase
      .from('kb_services')
      .select('*')
      .order('created_at', { ascending: false })

    if (businessUnitParam) {
      const businessUnitId = await getBusinessUnitId(businessUnitParam)
      if (businessUnitId) {
        query = query.eq('business_unit_id', businessUnitId)
      }
    }

    const { data: services, error } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      services: services || []
    })
  } catch (error) {
    console.error('Error fetching services:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch services' },
      { status: 500 }
    )
  }
}

// POST - Create service
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, category, duration, price, currency, tags, business_unit_id } = body

    const { data: service, error } = await supabase
      .from('kb_services')
      .insert({
        name,
        description,
        category,
        duration: duration ? parseInt(duration) : null,
        price: price ? parseFloat(price) : null,
        currency: currency || 'USD',
        tags: tags || [],
        business_unit_id,
        is_active: true
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      service
    })
  } catch (error) {
    console.error('Error creating service:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create service' },
      { status: 500 }
    )
  }
}

// PUT - Update service
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, description, category, duration, price, currency, tags, is_active } = body

    const { data: service, error } = await supabase
      .from('kb_services')
      .update({
        name,
        description,
        category,
        duration: duration ? parseInt(duration) : null,
        price: price ? parseFloat(price) : null,
        currency: currency || 'USD',
        tags: tags || [],
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      service
    })
  } catch (error) {
    console.error('Error updating service:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update service' },
      { status: 500 }
    )
  }
}

// DELETE - Delete service
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Service ID required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('kb_services')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Service deleted'
    })
  } catch (error) {
    console.error('Error deleting service:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete service' },
      { status: 500 }
    )
  }
}
