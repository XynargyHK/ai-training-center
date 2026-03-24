import { fetchLandingPageData } from '@/lib/landing-page-service'
import LandingPageSSR from '@/components/landing-page/LandingPageSSR'

export const revalidate = 3600

export default async function HKPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; _bu?: string; businessUnit?: string }>
}) {
  const params = await searchParams
  const lang = params.lang || 'tw'
  const bu = params.businessUnit || params._bu || 'skincoach'
  const { landingPage, businessUnit, availableLocales, aiStaffList, pageSlug } = await fetchLandingPageData(bu, 'HK', lang)

  return (
    <LandingPageSSR
      landingPage={landingPage}
      businessUnit={businessUnit}
      country="HK"
      lang={lang}
      availableLocales={availableLocales}
      aiStaffList={aiStaffList}
      pageSlug={pageSlug}
    />
  )
}
