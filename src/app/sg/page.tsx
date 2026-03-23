import { fetchLandingPageData } from '@/lib/landing-page-service'
import LandingPageSSR from '@/components/landing-page/LandingPageSSR'

export const revalidate = 3600

export default async function SGPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; _bu?: string }>
}) {
  const params = await searchParams
  const lang = params.lang || 'en'
  const bu = params._bu || 'skincoach'
  const { landingPage, businessUnit, availableLocales, aiStaffList, pageSlug } = await fetchLandingPageData(bu, 'SG', lang)

  return (
    <LandingPageSSR
      landingPage={landingPage}
      businessUnit={businessUnit}
      country="SG"
      lang={lang}
      availableLocales={availableLocales}
      aiStaffList={aiStaffList}
      pageSlug={pageSlug}
    />
  )
}
