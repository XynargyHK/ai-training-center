import { Metadata } from 'next'
import { fetchLandingPageData } from '@/lib/landing-page-service'
import LandingPageSSR from '@/components/landing-page/LandingPageSSR'

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'At-Home Micro-Infusion System for Skin Renewal | SkinCoach',
    description: 'Transform your skin with our at-home Micro-Infusion System. Designed to support smoother texture, fine lines, and skin renewal—no clinic visit required.',
    openGraph: {
      title: 'At-Home Micro-Infusion System for Skin Renewal | SkinCoach',
      description: 'Transform your skin with our at-home Micro-Infusion System. Designed to support smoother texture, fine lines, and skin renewal—no clinic visit required.',
      type: 'website',
      siteName: 'SkinCoach',
      url: 'https://www.skincoach.ai/us/micro-infusion/face',
      locale: 'en_US',
    },
    alternates: {
      canonical: 'https://www.skincoach.ai/us/micro-infusion/face',
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export default async function USMicroInfusionFacePage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>
}) {
  const params = await searchParams
  const lang = params.lang || 'en'
  const { landingPage, businessUnit, availableLocales, aiStaffList } = await fetchLandingPageData('skincoach', 'US', lang)

  return (
    <LandingPageSSR
      landingPage={landingPage}
      businessUnit={businessUnit}
      country="US"
      lang={lang}
      availableLocales={availableLocales}
      aiStaffList={aiStaffList}
      pageSlug="micro-infusion-system-face"
    />
  )
}
