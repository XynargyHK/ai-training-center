import { Metadata } from 'next'
import { fetchLandingPageData } from '@/lib/landing-page-service'
import LandingPageSSR from '@/components/landing-page/LandingPageSSR'

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Micro-Infusion System for Face - At-Home Professional Treatment | SkinCoach Hong Kong',
    description: 'Professional micro-infusion system for face. At-home micro-needling device that improves skin texture, reduces fine lines, and boosts collagen production.',
    openGraph: {
      title: 'Micro-Infusion System for Face | SkinCoach Hong Kong',
      description: 'Professional micro-infusion system for face. At-home micro-needling device.',
      type: 'website',
      siteName: 'SkinCoach',
      url: 'https://www.skincoach.ai/hk/micro-infusion/face',
      locale: 'en_HK',
    },
    alternates: {
      canonical: 'https://www.skincoach.ai/hk/micro-infusion/face',
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export default async function HKMicroInfusionFacePage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>
}) {
  const params = await searchParams
  const lang = params.lang || 'tw'
  const { landingPage, businessUnit, availableLocales, aiStaffList } = await fetchLandingPageData('skincoach', 'HK', lang)

  return (
    <LandingPageSSR
      landingPage={landingPage}
      businessUnit={businessUnit}
      country="HK"
      lang={lang}
      availableLocales={availableLocales}
      aiStaffList={aiStaffList}
      pageSlug="micro-infusion-system-face"
    />
  )
}
