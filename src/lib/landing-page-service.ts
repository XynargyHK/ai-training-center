import { cache } from 'react'
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

export interface LandingPageResult {
  landingPage: any | null
  businessUnit: { id: string; name: string; slug: string } | null
  hasLandingPage: boolean
  availableLocales: { country: string; language_code: string }[]
  currentLocale: { country: string; language: string }
}

export const fetchLandingPageData = cache(async (
  businessUnitSlug: string,
  country: string,
  languageCode: string
): Promise<LandingPageResult> => {
  const businessUnitId = await resolveBusinessUnitId(businessUnitSlug)

  if (!businessUnitId) {
    return {
      landingPage: null,
      businessUnit: null,
      hasLandingPage: false,
      availableLocales: [],
      currentLocale: { country, language: languageCode }
    }
  }

  const [landingPageResult, businessUnitResult, availableLocalesResult] = await Promise.all([
    supabase
      .from('landing_pages')
      .select('*')
      .eq('business_unit_id', businessUnitId)
      .eq('country', country)
      .eq('language_code', languageCode)
      .eq('is_active', true)
      .single(),
    supabase
      .from('business_units')
      .select('id, name, slug')
      .eq('id', businessUnitId)
      .single(),
    supabase
      .from('landing_pages')
      .select('country, language_code')
      .eq('business_unit_id', businessUnitId)
      .eq('is_active', true)
  ])

  const { data: landingPage, error } = landingPageResult
  const { data: businessUnit } = businessUnitResult
  const { data: availableLocales } = availableLocalesResult

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching landing page:', error)
  }

  // Always use published copy for ISR pages (not preview mode)
  let resolvedPage = landingPage
  if (landingPage?.published_data) {
    const { published_data, ...metadata } = landingPage
    resolvedPage = {
      ...metadata,
      ...published_data,
      enable_social_login: metadata.enable_social_login
    }
  }

  return {
    landingPage: resolvedPage || null,
    businessUnit: businessUnit || null,
    hasLandingPage: !!resolvedPage,
    availableLocales: availableLocales || [],
    currentLocale: { country, language: languageCode }
  }
})
