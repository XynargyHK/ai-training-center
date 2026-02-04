import { Metadata } from 'next'

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Micro-Infusion System - Professional At-Home Skin Treatment | SkinCoach Hong Kong',
    description: 'Transform your skin with our Micro-Infusion System. Professional-grade micro-needling treatment for face at home. Improve skin texture, reduce fine lines, boost collagen. Free consultation available.',
    verification: {
      google: 'uk6LcLQTI6W1KKBgePLm46-M155maP8UbomgiylpoNs',
      other: {
        'msvalidate.01': '49785425477910BA8333B7070A3DF5AD',
      },
    },
    keywords: [
      'micro-infusion system',
      'micro-needling at home',
      'microneedling device',
      'skin rejuvenation',
      'collagen boost',
      'anti-aging treatment',
      'face treatment',
      'Hong Kong skincare',
      'professional skincare device',
    ],
    openGraph: {
      title: 'Micro-Infusion System - Professional At-Home Skin Treatment | SkinCoach Hong Kong',
      description: 'Transform your skin with our Micro-Infusion System. Professional-grade micro-needling treatment for face at home.',
      type: 'website',
      siteName: 'SkinCoach',
      url: 'https://www.skincoach.ai/hk',
      locale: 'en_HK',
      images: [
        {
          url: 'https://www.skincoach.ai/og-image.png',
          width: 1200,
          height: 630,
          alt: 'SkinCoach Micro-Infusion System',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Micro-Infusion System | SkinCoach Hong Kong',
      description: 'Transform your skin with our Micro-Infusion System. Professional-grade micro-needling treatment for face at home.',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: 'https://www.skincoach.ai/hk',
      languages: {
        'en-US': 'https://www.skincoach.ai/us',
        'en-HK': 'https://www.skincoach.ai/hk',
        'en-SG': 'https://www.skincoach.ai/sg',
      },
    },
  }
}

export default function HKLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
