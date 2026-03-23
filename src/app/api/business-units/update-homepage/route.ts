import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    const { businessUnitId, homepageConfig } = await request.json()

    if (!businessUnitId) {
      return NextResponse.json({ error: 'Business Unit ID is required' }, { status: 400 })
    }

    // Determine if we're searching by UUID or Slug
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(businessUnitId)
    const column = isUuid ? 'id' : 'slug'

    const { error } = await supabase
      .from('business_units')
      .update({ homepage_config: homepageConfig })
      .eq(column, businessUnitId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Update homepage error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
