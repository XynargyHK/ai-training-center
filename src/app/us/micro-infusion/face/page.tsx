import { Metadata } from 'next'
import { fetchLandingPageData } from '@/lib/landing-page-service'
import LandingPageSSR from '@/components/landing-page/LandingPageSSR'

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Micro-Infusion System for Face - At-Home Professional Treatment | SkinCoach',
    description: 'Professional micro-infusion system for face. At-home micro-needling device that improves skin texture, reduces fine lines, and boosts collagen production.',
    openGraph: {
      title: 'Micro-Infusion System for Face | SkinCoach',
      description: 'Professional micro-infusion system for face. At-home micro-needling device.',
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
  const { landingPage, businessUnit, availableLocales } = await fetchLandingPageData('skincoach', 'US', lang)

  return (
    <LandingPageSSR
      landingPage={landingPage}
      businessUnit={businessUnit}
      country="US"
      lang={lang}
      availableLocales={availableLocales}
      pageSlug="micro-infusion-system-face"
    />
  )
}
