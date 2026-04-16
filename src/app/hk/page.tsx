import { Suspense } from 'react'
import { LandingPageContent } from '@/app/livechat/page'

export const dynamic = 'force-dynamic'

export default async function HKPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; _bu?: string; businessUnit?: string; page?: string }>
}) {
  const params = await searchParams
  const lang = params.lang || 'tw'
  const bu = params.businessUnit || params._bu || 'skincoach'
  const pageSlug = params.page

  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>}>
      <LandingPageContent
        businessUnitOverride={bu}
        countryOverride="HK"
        languageOverride={lang}
        pageSlug={pageSlug}
      />
    </Suspense>
  )
}
