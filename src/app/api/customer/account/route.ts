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

    // Build upsert data - only include defined fields
    const upsertData: Record<string, any> = {
      user_id: userId,
      updated_at: new Date().toISOString()
    }
    if (name !== undefined) upsertData.name = name
    if (email !== undefined) upsertData.email = email
    if (phone !== undefined) upsertData.phone = phone
    if (shippingAddress !== undefined) upsertData.shipping_address = shippingAddress
    if (businessUnitId !== undefined) upsertData.business_unit_id = businessUnitId

    console.log('[API] Upserting profile with data:', upsertData)

    // Use upsert to insert or update based on user_id
    const { data, error } = await supabase
      .from('customer_profiles')
      .upsert(upsertData, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (error) {
      console.error('Error upserting profile:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('[API] Upserted profile result:', data)
    console.log('[API] Upserted shipping_address:', data?.shipping_address)

    return NextResponse.json({ success: true, profile: data })
  } catch (error) {
    console.error('Customer account POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save account' },
      { status: 500 }
    )
  }
}
