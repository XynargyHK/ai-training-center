import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export const dynamic = 'force-dynamic'

// Helper to resolve business unit ID from slug or ID
async function resolveBusinessUnitId(businessUnitParam: string): Promise<string | null> {
  // Check if it's a UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidRegex.test(businessUnitParam)) {
    return businessUnitParam
  }

  // Look up by slug
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
    const country = searchParams.get('country') || 'US'
    // Accept both 'lang' and 'language' parameters
    const languageCode = searchParams.get('lang') || searchParams.get('language') || 'en'
    const isPreview = searchParams.get('preview') === 'true'

    if (!businessUnitParam) {
      return NextResponse.json({ error: 'businessUnit parameter required' }, { status: 400 })
    }

    const businessUnitId = await resolveBusinessUnitId(businessUnitParam)

    if (!businessUnitId) {
      return NextResponse.json({ error: 'Business unit not found' }, { status: 404 })
    }

    // Run all queries in PARALLEL for faster response
    const [landingPageResult, businessUnitResult, availableLocalesResult] = await Promise.all([
      // Fetch the landing page for this business unit + country + language
      supabase
        .from('landing_pages')
        .select('*')
        .eq('business_unit_id', businessUnitId)
        .eq('country', country)
        .eq('language_code', languageCode)
        .eq('is_active', true)
        .single(),
      // Fetch business unit info
      supabase
        .from('business_units')
        .select('id, name, slug')
        .eq('id', businessUnitId)
        .single(),
      // Fetch all available locales for this business unit
      supabase
        .from('landing_pages')
        .select('country, language_code')
        .eq('business_unit_id', businessUnitId)
        .eq('is_active', true)
    ])

    const { data: landingPage, error } = landingPageResult
    const { data: businessUnit } = businessUnitResult
    const { data: availableLocales } = availableLocalesResult

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching landing page:', error)
      return NextResponse.json({ error: 'Failed to fetch landing page' }, { status: 500 })
    }

    // Preview mode: return draft (row fields as-is)
    // Live mode: return published copy if available, otherwise row fields (backward compatible)
    let resolvedPage = landingPage
    if (!isPreview && landingPage?.published_data) {
      const { published_data, ...metadata } = landingPage
      // Merge published data but preserve important metadata fields like enable_social_login
      resolvedPage = {
        ...metadata,
        ...published_data,
        // Always preserve these fields from metadata (not from published_data)
        enable_social_login: metadata.enable_social_login
      }
    }

    console.log('[LandingPage API GET] isPreview:', isPreview, 'Has footer:', !!resolvedPage?.footer, 'Footer policy_content keys:', resolvedPage?.footer?.policy_content ? Object.keys(resolvedPage.footer.policy_content) : 'none')

    return NextResponse.json({
      landingPage: resolvedPage || null,
      businessUnit,
      hasLandingPage: !!resolvedPage,
      availableLocales: availableLocales || [],
      currentLocale: { country, language: languageCode },
      isPreview
    })

  } catch (err) {
    console.error('Landing page API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Create or update landing page
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('[LandingPage API] Received POST request')

    // Remove id, business_unit_id, and publish fields from the data to prevent conflicts
    const { businessUnitId, id, business_unit_id, created_at, updated_at, published_data, published_at, is_published, ...landingPageData } = body

    // Convert empty string slug to null to avoid unique constraint violations
    if (landingPageData.slug !== undefined && !landingPageData.slug) {
      landingPageData.slug = null
    }

    // Get country and language from the data (required for locale-specific pages)
    const country = landingPageData.country || 'US'
    const languageCode = landingPageData.language_code || 'en'

    console.log('[LandingPage API] businessUnitId:', businessUnitId)
    console.log('[LandingPage API] Locale:', country, languageCode)
    console.log('[LandingPage API] slug:', landingPageData.slug)

    if (!businessUnitId) {
      return NextResponse.json({ error: 'businessUnitId required' }, { status: 400 })
    }

    // Resolve businessUnitId (could be slug or UUID)
    const resolvedBusinessUnitId = await resolveBusinessUnitId(businessUnitId)
    if (!resolvedBusinessUnitId) {
      return NextResponse.json({ error: 'Business unit not found' }, { status: 404 })
    }

    // Check if landing page exists for this business unit + country + language
    // Use maybeSingle() to avoid error when no rows found
    const { data: existing, error: existingError } = await supabase
      .from('landing_pages')
      .select('id')
      .eq('business_unit_id', resolvedBusinessUnitId)
      .eq('country', country)
      .eq('language_code', languageCode)
      .maybeSingle()

    if (existingError) {
      console.error('[LandingPage API] Error checking existing page:', existingError)
    }

    console.log('[LandingPage API] Existing landing page for locale:', existing?.id || 'none')

    let result
    if (existing) {
      // Update existing locale-specific page
      console.log('[LandingPage API] Updating existing landing page:', existing.id)
      result = await supabase
        .from('landing_pages')
        .update({
          ...landingPageData,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()
    } else {
      // Create new locale-specific page
      console.log('[LandingPage API] Creating new landing page for locale:', country, languageCode)
      result = await supabase
        .from('landing_pages')
        .insert({
          business_unit_id: resolvedBusinessUnitId,
          ...landingPageData,
          is_active: true
        })
        .select()
        .single()
    }

    if (result.error) {
      console.error('[LandingPage API] Supabase error:', JSON.stringify(result.error, null, 2))
      return NextResponse.json({
        error: 'Failed to save landing page',
        details: result.error.message,
        code: result.error.code
      }, { status: 500 })
    }

    if (!result.data) {
      console.error('[LandingPage API] No data returned from Supabase')
      return NextResponse.json({
        error: 'No data returned from database',
        details: 'The save operation did not return any data'
      }, { status: 500 })
    }

    console.log('[LandingPage API] Saved successfully for locale:', country, languageCode)
    return NextResponse.json({ landingPage: result.data, success: true })

  } catch (err) {
    console.error('Landing page POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
