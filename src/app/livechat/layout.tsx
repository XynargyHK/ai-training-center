import { Metadata } from 'next'
import { supabase } from '@/lib/supabase'

// Map domains to business units
const DOMAIN_TO_BUSINESS_UNIT: Record<string, { slug: string; defaultTitle: string; defaultDescription: string }> = {
  'skincoach.ai': {
    slug: 'skincoach',
    defaultTitle: 'Micro-Infusion System - Professional At-Home Skin Treatment | SkinCoach',
    defaultDescription: 'Transform your skin with our Micro-Infusion System. Professional-grade micro-needling treatment for face at home. Improve skin texture, reduce fine lines, boost collagen. Free consultation available.'
  },
  'www.skincoach.ai': {
    slug: 'skincoach',
    defaultTitle: 'Micro-Infusion System - Professional At-Home Skin Treatment | SkinCoach',
    defaultDescription: 'Transform your skin with our Micro-Infusion System. Professional-grade micro-needling treatment for face at home. Improve skin texture, reduce fine lines, boost collagen. Free consultation available.'
  },
  // Add more domains as needed
}

async function getBusinessUnitMetadata(businessUnitSlug?: string, domain?: string): Promise<{ title: string; description: string }> {
  try {
    // Try to get business unit from domain mapping first
    if (domain && DOMAIN_TO_BUSINESS_UNIT[domain]) {
      const { slug, defaultTitle, defaultDescription } = DOMAIN_TO_BUSINESS_UNIT[domain]
      businessUnitSlug = businessUnitSlug || slug
    }

    if (!businessUnitSlug) {
      return {
        title: 'AI Business Center',
        description: 'Train and manage AI agents with roleplay scenarios, knowledge management, and real-time testing'
      }
    }

    // Load business unit data
    const { data: businessUnit } = await supabase
      .from('business_units')
      .select('name, description')
      .eq('slug', businessUnitSlug)
      .single()

    if (businessUnit) {
      return {
        title: businessUnit.name || 'AI Business Center',
        description: businessUnit.description || `Welcome to ${businessUnit.name}. AI-powered solutions for your business.`
      }
    }

    // Fallback to domain defaults
    if (domain && DOMAIN_TO_BUSINESS_UNIT[domain]) {
      const { defaultTitle, defaultDescription } = DOMAIN_TO_BUSINESS_UNIT[domain]
      return { title: defaultTitle, description: defaultDescription }
    }

    return {
      title: 'AI Business Center',
      description: 'Train and manage AI agents with roleplay scenarios, knowledge management, and real-time testing'
    }
  } catch (error) {
    console.error('Error loading business unit metadata:', error)
    return {
      title: 'AI Business Center',
      description: 'AI-powered business solutions'
    }
  }
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ businessUnit?: string }>
}): Promise<Metadata> {
  // Get domain from headers (this will be available server-side)
  let domain = ''
  try {
    const { headers } = await import('next/headers')
    const headersList = await headers()
    domain = headersList.get('host') || ''
  } catch (error) {
    console.error('Error getting headers:', error)
  }

  const params = await searchParams
  const businessUnitSlug = params?.businessUnit
  const { title, description } = await getBusinessUnitMetadata(businessUnitSlug, domain)

  const metadata: Metadata = {
    title,
    description,
    keywords: [
      'micro-infusion system',
      'micro-needling at home',
      'microneedling device',
      'skin rejuvenation',
      'collagen boost',
      'anti-aging treatment',
      'face treatment',
      'fine lines reduction',
      'skin texture improvement',
      'professional skincare device',
      'Hong Kong skincare'
    ],
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'SkinCoach',
      url: domain.includes('skincoach.ai') ? 'https://skincoach.ai' : undefined,
      locale: 'en_HK',
      images: [
        {
          url: 'https://skincoach.ai/og-image.png',
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      site: '@skincoach', // Update with your actual Twitter handle
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
      canonical: domain.includes('skincoach.ai') ? 'https://skincoach.ai' : undefined,
      languages: {
        'en-HK': 'https://skincoach.ai/livechat?businessUnit=skincoach&lang=en',
        'zh-TW': 'https://skincoach.ai/livechat?businessUnit=skincoach&lang=tw',
        'zh-CN': 'https://skincoach.ai/livechat?businessUnit=skincoach&lang=cn',
      },
    },
  }

  return metadata
}

export default function LivechatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
