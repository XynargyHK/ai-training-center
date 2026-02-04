import { fetchLandingPageData } from '@/lib/landing-page-service'
import LandingPageSSR from '@/components/landing-page/LandingPageSSR'

export const revalidate = 3600

export default async function HKPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>
}) {
  const params = await searchParams
  const lang = params.lang || 'en'
  const { landingPage, businessUnit, availableLocales } = await fetchLandingPageData('skincoach', 'HK', lang)

  return (
    <LandingPageSSR
      landingPage={landingPage}
      businessUnit={businessUnit}
      country="HK"
      lang={lang}
      availableLocales={availableLocales}
      pageSlug="micro-infusion-system-face"
    />
  )
}
