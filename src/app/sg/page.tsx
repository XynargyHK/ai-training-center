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
  const pageSlug = "micro-infusion-system-face"
  const { landingPage, businessUnit, availableLocales, aiStaffList } = await fetchLandingPageData(bu, 'SG', lang, pageSlug)

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
