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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessUnitId, country, language_code, is_published } = body

    if (!businessUnitId) {
      return NextResponse.json({ error: 'businessUnitId required' }, { status: 400 })
    }

    const resolvedBusinessUnitId = await resolveBusinessUnitId(businessUnitId)
    if (!resolvedBusinessUnitId) {
      return NextResponse.json({ error: 'Business unit not found' }, { status: 404 })
    }

    // Update publish status for the specific locale
    const { data, error } = await supabase
      .from('landing_pages')
      .update({
        is_published: is_published,
        published_at: is_published ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('business_unit_id', resolvedBusinessUnitId)
      .eq('country', country || 'US')
      .eq('language_code', language_code || 'en')
      .select()
      .single()

    if (error) {
      console.error('Error updating publish status:', error)
      return NextResponse.json({ error: 'Failed to update publish status', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, landingPage: data })

  } catch (err) {
    console.error('Publish API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
