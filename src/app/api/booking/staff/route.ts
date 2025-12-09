import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

// GET - Load all staff
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()
    const { searchParams } = new URL(request.url)
    const businessUnitSlug = searchParams.get('businessUnitId')

    // Get business unit UUID from slug if provided
    let businessUnitId = null
    if (businessUnitSlug) {
      const { data: businessUnit, error: buError } = await supabase
        .from('business_units')
        .select('id')
        .eq('slug', businessUnitSlug)
        .single()

      if (buError || !businessUnit) {
        return NextResponse.json({ error: 'Invalid business unit' }, { status: 400 })
      }
      businessUnitId = businessUnit.id
    }

    let query = supabase
      .from('real_staff')
      .select('*')
      .order('name')

    if (businessUnitId) {
      query = query.eq('business_unit_id', businessUnitId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error loading staff:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('Error in GET /api/booking/staff:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create or update staff
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()
    const body = await request.json()
    const { id, name, email, staff_type, businessUnitId } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    if (!businessUnitId) {
      return NextResponse.json({ error: 'Business unit ID is required' }, { status: 400 })
    }

    // Get business unit UUID from slug
    const { data: businessUnit, error: buError } = await supabase
      .from('business_units')
      .select('id')
      .eq('slug', businessUnitId)
      .single()

    if (buError || !businessUnit) {
      return NextResponse.json({ error: 'Invalid business unit' }, { status: 400 })
    }

    if (id) {
      // Update existing staff
      const { data, error } = await supabase
        .from('real_staff')
        .update({
          name,
          email: email || null,
          staff_type: staff_type || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating staff:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ data })
    } else {
      // Create new staff
      const { data, error } = await supabase
        .from('real_staff')
        .insert({
          name,
          email: email || null,
          staff_type: staff_type || null,
          business_unit_id: businessUnit.id,
          is_active: true
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating staff:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ data })
    }
  } catch (error: any) {
    console.error('Error in POST /api/booking/staff:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Remove staff
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('real_staff')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting staff:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /api/booking/staff:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
