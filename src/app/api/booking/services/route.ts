import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

// GET - Load all services
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
        // If invalid business unit, just return empty array instead of error
        console.warn('Invalid business unit slug:', businessUnitSlug)
        return NextResponse.json({ data: [] }, { status: 200 })
      }
      businessUnitId = businessUnit.id
    }

    let query = supabase
      .from('appointment_services')
      .select('*')
      .order('name')

    if (businessUnitId) {
      query = query.eq('business_unit_id', businessUnitId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error loading services:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('Error in GET /api/booking/services:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create or update service
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()
    const body = await request.json()
    const { id, name, description, price, businessUnitId, is_active } = body

    if (!name || !description) {
      return NextResponse.json({ error: 'Name and description are required' }, { status: 400 })
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
      // Update existing service
      const updateData: any = {
        name,
        description,
        updated_at: new Date().toISOString()
      }

      if (price !== undefined && price !== '') {
        updateData.price = parseFloat(price)
      }

      if (is_active !== undefined) {
        updateData.is_active = is_active
      }

      const { data, error } = await supabase
        .from('appointment_services')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating service:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ data })
    } else {
      // Create new service
      const insertData: any = {
        name,
        description,
        business_unit_id: businessUnit.id,
        is_active: is_active !== undefined ? is_active : false
      }

      if (price !== undefined && price !== '') {
        insertData.price = parseFloat(price)
      }

      const { data, error } = await supabase
        .from('appointment_services')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('Error creating service:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ data })
    }
  } catch (error: any) {
    console.error('Error in POST /api/booking/services:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH - Toggle is_active status
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()
    const body = await request.json()
    const { id, is_active } = body

    if (!id || is_active === undefined) {
      return NextResponse.json({ error: 'Service ID and is_active are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('appointment_services')
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error toggling service status:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('Error in PATCH /api/booking/services:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Remove service
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('appointment_services')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting service:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /api/booking/services:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
