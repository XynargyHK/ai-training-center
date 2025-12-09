import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

// GET - Load all assignments
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
      .from('service_staff_assignments')
      .select(`
        *,
        service:appointment_services(id, name),
        staff:real_staff(id, name)
      `)
      .order('created_at', { ascending: false })

    if (businessUnitId) {
      query = query.eq('business_unit_id', businessUnitId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error loading assignments:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('Error in GET /api/booking/assignments:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create assignment
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()
    const body = await request.json()
    const { service_id, staff_id, businessUnitId } = body

    if (!service_id || !staff_id) {
      return NextResponse.json({ error: 'Service ID and Staff ID are required' }, { status: 400 })
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

    // Create assignment
    const { data, error } = await supabase
      .from('service_staff_assignments')
      .insert({
        service_id,
        staff_id,
        business_unit_id: businessUnit.id,
        is_active: true
      })
      .select(`
        *,
        service:appointment_services(id, name),
        staff:real_staff(id, name)
      `)
      .single()

    if (error) {
      // Check for unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json({ error: 'This staff member is already assigned to this service' }, { status: 400 })
      }
      console.error('Error creating assignment:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('Error in POST /api/booking/assignments:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Remove assignment
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('service_staff_assignments')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting assignment:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /api/booking/assignments:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
