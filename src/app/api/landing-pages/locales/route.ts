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

    // Get all landing pages for this business unit
    const { data: locales, error } = await supabase
      .from('landing_pages')
      .select('id, country, language_code, slug, is_active, updated_at')
      .eq('business_unit_id', businessUnitId)
      .order('country', { ascending: true })
      .order('language_code', { ascending: true })

    if (error) {
      console.error('Error fetching locales:', error)
      return NextResponse.json({ error: 'Failed to fetch locales' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      locales: locales || []
    })

  } catch (err) {
    console.error('Locales API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
