'use client'

import { Suspense } from 'react'
import { LandingPageContent } from '../livechat/page'

export default function HKPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>}>
      <LandingPageContent
        businessUnitOverride="skincoach"
        countryOverride="HK"
        languageOverride="en"
        pageSlug="micro-infusion-system-face"
      />
    </Suspense>
  )
}
