import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    if (!slug) {
      return NextResponse.json({ error: 'slug parameter required' }, { status: 400 })
    }

    // Look up the landing page by slug
    const { data: landingPage, error } = await supabase
      .from('landing_pages')
      .select('business_unit_id, country, language_code, slug')
      .eq('slug', slug)
      .limit(1)
      .single()

    if (error || !landingPage) {
      return NextResponse.json({ error: 'Landing page not found' }, { status: 404 })
    }

    // Get the business unit slug for the API call
    const { data: businessUnit } = await supabase
      .from('business_units')
      .select('id, name, slug')
      .eq('id', landingPage.business_unit_id)
      .single()

    return NextResponse.json({
      businessUnit: businessUnit?.slug || landingPage.business_unit_id,
      businessUnitId: landingPage.business_unit_id,
      businessUnitName: businessUnit?.name,
      country: landingPage.country,
      language: landingPage.language_code,
      slug: landingPage.slug
    })

  } catch (err) {
    console.error('Slug lookup error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
