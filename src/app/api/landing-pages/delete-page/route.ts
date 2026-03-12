import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessUnitId = searchParams.get('businessUnit')
    const country = searchParams.get('country')
    const language = searchParams.get('language')
    let slug = searchParams.get('slug')
    
    if (slug === 'home' || slug === 'null') slug = null

    if (!businessUnitId || !country || !language) {
      return NextResponse.json(
        { error: 'businessUnit, country, and language are required' },
        { status: 400 }
      )
    }

    const resolvedBusinessUnitId = await resolveBusinessUnitId(businessUnitId)
    if (!resolvedBusinessUnitId) {
      return NextResponse.json({ error: 'Business unit not found' }, { status: 404 })
    }

    const query = supabase
      .from('landing_pages')
      .delete()
      .eq('business_unit_id', resolvedBusinessUnitId)
      .eq('country', country)
      .eq('language_code', language)
    
    if (slug !== undefined) {
      query.eq('slug', slug)
    }

    const { error } = await query

    if (error) {
      console.error('Error deleting landing page:', error)
      return NextResponse.json(
        { error: 'Failed to delete landing page', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Landing page deleted`
    })

  } catch (error) {
    console.error('Delete page error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
