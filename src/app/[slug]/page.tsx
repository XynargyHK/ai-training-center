import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import SlugLandingPage from './SlugLandingPage'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params

  // Skip slugs that look like system paths
  if (slug.startsWith('_next') || slug === 'favicon.ico') {
    notFound()
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Look up the landing page by slug (may exist for multiple countries, pick first)
  const { data: landingPages } = await supabase
    .from('landing_pages')
    .select('business_unit_id, country, language_code, slug')
    .eq('slug', slug)
    .limit(1)

  const landingPage = landingPages?.[0] || null

  if (!landingPage) {
    notFound()
  }

  // Get business unit slug for the API call
  const { data: businessUnit } = await supabase
    .from('business_units')
    .select('id, name, slug')
    .eq('id', landingPage.business_unit_id)
    .single()

  return (
    <SlugLandingPage
      businessUnit={businessUnit?.slug || landingPage.business_unit_id}
      country={landingPage.country}
      language={landingPage.language_code}
      pageSlug={slug}
    />
  )
}
