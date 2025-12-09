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

// GET - Fetch policies
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessUnitParam = searchParams.get('businessUnitId')

    let query = supabase
      .from('kb_policies')
      .select('*')
      .order('created_at', { ascending: false })

    if (businessUnitParam) {
      const businessUnitId = await getBusinessUnitId(businessUnitParam)
      if (businessUnitId) {
        query = query.eq('business_unit_id', businessUnitId)
      }
    }

    const { data: policies, error } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      policies: policies || []
    })
  } catch (error) {
    console.error('Error fetching policies:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch policies' },
      { status: 500 }
    )
  }
}

// POST - Create policy
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, type, content, effective_date, business_unit_id, fields_data } = body

    const { data: policy, error } = await supabase
      .from('kb_policies')
      .insert({
        title,
        type,
        content,
        effective_date: effective_date || null,
        business_unit_id,
        fields_data: fields_data || null,
        is_active: true
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      policy
    })
  } catch (error) {
    console.error('Error creating policy:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create policy' },
      { status: 500 }
    )
  }
}

// PUT - Update policy
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, title, type, content, effective_date, is_active, fields_data } = body

    const { data: policy, error } = await supabase
      .from('kb_policies')
      .update({
        title,
        type,
        content,
        effective_date: effective_date || null,
        is_active,
        fields_data: fields_data || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      policy
    })
  } catch (error) {
    console.error('Error updating policy:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update policy' },
      { status: 500 }
    )
  }
}

// DELETE - Delete policy
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Policy ID required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('kb_policies')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Policy deleted'
    })
  } catch (error) {
    console.error('Error deleting policy:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete policy' },
      { status: 500 }
    )
  }
}
