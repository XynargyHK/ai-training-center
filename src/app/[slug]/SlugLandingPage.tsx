'use client'

import { Suspense } from 'react'
import { LandingPageContent } from '@/app/livechat/page'

interface SlugLandingPageProps {
  businessUnit: string
  country: string
  language: string
  pageSlug: string
}

export default function SlugLandingPage({ businessUnit, country, language, pageSlug }: SlugLandingPageProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>}>
      <LandingPageContent
        businessUnitOverride={businessUnit}
        countryOverride={country}
        languageOverride={language}
        pageSlug={pageSlug}
      />
    </Suspense>
  )
}
