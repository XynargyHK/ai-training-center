import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials')
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

// GET - Fetch customer profile by user_id
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const supabase = getSupabaseServiceClient()

    const { data: profile, error } = await supabase
      .from('customer_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    console.log('[API] GET profile for userId:', userId)
    console.log('[API] Profile shipping_address:', profile?.shipping_address)

    if (error) {
      console.error('Error fetching profile:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, profile: profile || null })
  } catch (error) {
    console.error('Customer account GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch account' },
      { status: 500 }
    )
  }
}

// POST - Create or update customer profile (used by social login at checkout)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, email, phone, businessUnitId, shippingAddress } = body

    console.log('[API] POST profile - userId:', userId)
    console.log('[API] POST profile - shippingAddress received:', shippingAddress)

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const supabase = getSupabaseServiceClient()

    // Check if profile exists
    const { data: existing } = await supabase
      .from('customer_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (existing) {
      // Update existing profile
      const updateData: Record<string, any> = { updated_at: new Date().toISOString() }
      if (name !== undefined) updateData.name = name
      if (email !== undefined) updateData.email = email
      if (phone !== undefined) updateData.phone = phone
      if (shippingAddress !== undefined) updateData.shipping_address = shippingAddress

      console.log('[API] Updating profile with data:', updateData)

      const { data, error } = await supabase
        .from('customer_profiles')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating profile:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      console.log('[API] Updated profile result:', data)
      console.log('[API] Updated shipping_address:', data?.shipping_address)

      return NextResponse.json({ success: true, profile: data, action: 'updated' })
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from('customer_profiles')
        .insert({
          user_id: userId,
          name: name || null,
          email: email || null,
          phone: phone || null,
          shipping_address: shippingAddress || null,
          business_unit_id: businessUnitId || null,
          source: 'social_login'
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating profile:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, profile: data, action: 'created' })
    }
  } catch (error) {
    console.error('Customer account POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save account' },
      { status: 500 }
    )
  }
}
