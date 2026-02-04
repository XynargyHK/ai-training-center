import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

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

// Fields that are NOT content — excluded when copying draft to published_data
const NON_CONTENT_FIELDS = new Set([
  'id', 'business_unit_id', 'country', 'language_code',
  'currency', 'currency_symbol',
  'is_active', 'is_published', 'published_at', 'published_data',
  'slug',
  'created_at', 'updated_at'
])

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

    const resolvedCountry = country || 'US'
    const resolvedLang = language_code || 'en'

    let publishedData: any = null

    if (is_published) {
      // Publishing: read the current draft and copy content into published_data
      const { data: currentRow, error: readError } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('business_unit_id', resolvedBusinessUnitId)
        .eq('country', resolvedCountry)
        .eq('language_code', resolvedLang)
        .single()

      if (readError || !currentRow) {
        return NextResponse.json({ error: 'Landing page not found' }, { status: 404 })
      }

      // Copy all content fields into published_data
      publishedData = {}
      for (const [key, value] of Object.entries(currentRow)) {
        if (!NON_CONTENT_FIELDS.has(key)) {
          publishedData[key] = value
        }
      }
    }
    // Unpublishing: publishedData stays null (clears the published copy)

    const { data, error } = await supabase
      .from('landing_pages')
      .update({
        is_published: is_published,
        published_at: is_published ? new Date().toISOString() : null,
        published_data: publishedData,
        updated_at: new Date().toISOString()
      })
      .eq('business_unit_id', resolvedBusinessUnitId)
      .eq('country', resolvedCountry)
      .eq('language_code', resolvedLang)
      .select()
      .single()

    if (error) {
      console.error('Error updating publish status:', error)
      return NextResponse.json({ error: 'Failed to update publish status', details: error.message }, { status: 500 })
    }

    // Trigger ISR revalidation for the affected country pages
    const countryLower = resolvedCountry.toLowerCase()
    try {
      revalidatePath(`/${countryLower}`)
      revalidatePath(`/${countryLower}/micro-infusion/face`)
    } catch (revalError) {
      console.error('Revalidation error (non-fatal):', revalError)
    }

    return NextResponse.json({ success: true, landingPage: data })

  } catch (err) {
    console.error('Publish API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
