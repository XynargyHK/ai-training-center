'use client'

import { Suspense } from 'react'
import { LandingPageContent } from '../livechat/page'

export default function SGPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>}>
      <LandingPageContent
        businessUnitOverride="skincoach"
        countryOverride="SG"
        languageOverride="en"
        pageSlug="micro-infusion-system-face"
      />
    </Suspense>
  )
}
