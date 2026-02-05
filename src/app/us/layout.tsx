import { Metadata } from 'next'

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'At-Home Micro-Infusion System for Skin Renewal | SkinCoach',
    description: 'Transform your skin with our at-home Micro-Infusion System. Designed to support smoother texture, fine lines, and skin renewal—no clinic visit required.',
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
      'professional skincare device',
    ],
    openGraph: {
      title: 'At-Home Micro-Infusion System for Skin Renewal | SkinCoach',
      description: 'Transform your skin with our at-home Micro-Infusion System. Designed to support smoother texture, fine lines, and skin renewal—no clinic visit required.',
      type: 'website',
      siteName: 'SkinCoach',
      url: 'https://www.skincoach.ai/us',
      locale: 'en_US',
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
      title: 'At-Home Micro-Infusion System for Skin Renewal | SkinCoach',
      description: 'Transform your skin with our at-home Micro-Infusion System. Designed to support smoother texture, fine lines, and skin renewal—no clinic visit required.',
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
      canonical: 'https://www.skincoach.ai/us',
      languages: {
        'en-US': 'https://www.skincoach.ai/us',
        'en-HK': 'https://www.skincoach.ai/hk',
        'en-SG': 'https://www.skincoach.ai/sg',
      },
    },
  }
}

export default function USLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
